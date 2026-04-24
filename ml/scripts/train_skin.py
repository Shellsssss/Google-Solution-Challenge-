"""
train_skin.py - Retrain JanArogya skin cancer model on HAM10000.

Uses HAM10000 dataset (10,015 dermatoscopic images, 7 classes).

Class mapping for binary LOW_RISK / HIGH_RISK:
  LOW_RISK  (0): nv, bkl, df, vasc          (benign)
  HIGH_RISK (1): mel, bcc, akiec            (malignant / pre-malignant)

Output:
  - ml/models/janarogya_skin_v2.h5
  - ml/models/janarogya_skin_v2_int8.tflite
  - ml/models/labels_skin.json
  - ml/models/training_report_skin.json
"""
import io
import json
import os
import sys
import time
from pathlib import Path

os.environ["TF_CPP_MIN_LOG_LEVEL"] = "2"
os.environ["TF_ENABLE_ONEDNN_OPTS"] = "0"
os.environ["PYTHONIOENCODING"] = "utf-8"

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
        sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8", errors="replace")

import csv
import numpy as np
from PIL import Image

ML_ROOT   = Path(__file__).parent.parent
DATA_RAW  = ML_ROOT / "data" / "raw" / "skin"
MODELS    = ML_ROOT / "models"
MODELS.mkdir(exist_ok=True)

IMAGE_SIZE  = (224, 224)
BATCH_SIZE  = 32
EPOCHS_HEAD = 12
EPOCHS_FINE = 8

LABEL_MAP    = {"LOW_RISK": 0, "HIGH_RISK": 1}
IDX_TO_LABEL = {0: "LOW_RISK", 1: "HIGH_RISK"}
NUM_CLASSES  = 2

# HAM10000 dx codes -> binary label
DX_TO_RISK = {
    "nv":    "LOW_RISK",   # Melanocytic nevi (benign moles) - 6705
    "bkl":   "LOW_RISK",   # Benign keratosis-like lesions  - 1099
    "df":    "LOW_RISK",   # Dermatofibroma                 - 115
    "vasc":  "LOW_RISK",   # Vascular lesions               - 142
    "mel":   "HIGH_RISK",  # Melanoma                       - 1113
    "bcc":   "HIGH_RISK",  # Basal cell carcinoma           - 514
    "akiec": "HIGH_RISK",  # Actinic keratoses              - 327
}


def collect_images() -> list[tuple[Path, int]]:
    metadata = DATA_RAW / "HAM10000_metadata.csv"
    if not metadata.exists():
        print(f"[ERROR] {metadata} missing. Run kaggle download first.")
        sys.exit(1)

    img_dirs = [DATA_RAW / "HAM10000_images_part_1", DATA_RAW / "HAM10000_images_part_2"]
    img_index: dict[str, Path] = {}
    for d in img_dirs:
        if d.exists():
            for p in d.iterdir():
                if p.suffix.lower() in {".jpg", ".jpeg", ".png"}:
                    img_index[p.stem] = p

    items: list[tuple[Path, int]] = []
    with open(metadata, encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            dx = row["dx"]
            risk = DX_TO_RISK.get(dx)
            if not risk:
                continue
            img_path = img_index.get(row["image_id"])
            if img_path:
                items.append((img_path, LABEL_MAP[risk]))

    n_low  = sum(1 for _, l in items if l == 0)
    n_high = sum(1 for _, l in items if l == 1)
    print(f"  LOW_RISK:  {n_low}")
    print(f"  HIGH_RISK: {n_high}")
    print(f"  Total:     {len(items)}")
    return items


def verify_image(path: Path) -> bool:
    try:
        with Image.open(path) as img:
            img.verify()
        return True
    except Exception:
        return False


def build_dataset(items, augment=False):
    import tensorflow as tf

    paths  = [str(p) for p, _ in items]
    labels = [l for _, l in items]

    def load_image(path, label):
        raw = tf.io.read_file(path)
        img = tf.image.decode_image(raw, channels=3, expand_animations=False)
        img = tf.image.resize(img, IMAGE_SIZE)
        img = tf.cast(img, tf.float32) / 255.0

        if augment:
            img = tf.image.random_flip_left_right(img)
            img = tf.image.random_flip_up_down(img)
            img = tf.image.random_brightness(img, 0.2)
            img = tf.image.random_contrast(img, 0.8, 1.2)
            img = tf.image.random_saturation(img, 0.8, 1.2)
            img = tf.image.random_hue(img, 0.03)
            img = tf.clip_by_value(img, 0.0, 1.0)
            img = tf.image.random_crop(img, [210, 210, 3])
            img = tf.image.resize(img, IMAGE_SIZE)

        label_oh = tf.one_hot(label, NUM_CLASSES)
        return img, label_oh

    ds = tf.data.Dataset.from_tensor_slices((paths, labels))
    ds = ds.map(load_image, num_parallel_calls=tf.data.AUTOTUNE)
    return ds


def build_model():
    import tensorflow as tf

    base = tf.keras.applications.EfficientNetB3(
        include_top=False, weights="imagenet",
        input_shape=(*IMAGE_SIZE, 3),
    )
    base.trainable = False

    inputs = tf.keras.Input(shape=(*IMAGE_SIZE, 3))
    x = base(inputs, training=False)
    x = tf.keras.layers.GlobalAveragePooling2D()(x)
    x = tf.keras.layers.BatchNormalization()(x)
    x = tf.keras.layers.Dense(256, activation="relu")(x)
    x = tf.keras.layers.Dropout(0.4)(x)
    x = tf.keras.layers.Dense(128, activation="relu")(x)
    x = tf.keras.layers.Dropout(0.3)(x)
    outputs = tf.keras.layers.Dense(NUM_CLASSES, activation="softmax")(x)

    return tf.keras.Model(inputs, outputs), base


def train():
    import tensorflow as tf

    print("\n[1/6] Collecting images...")
    all_items = collect_images()
    if len(all_items) < 100:
        print("[ERROR] Not enough images. Aborting.")
        sys.exit(1)

    print("\n[2/6] Verifying images (quick)...")
    # HAM10000 is curated — only spot-check 200
    sample = np.random.choice(len(all_items), size=min(200, len(all_items)), replace=False)
    bad = [i for i in sample if not verify_image(all_items[i][0])]
    if bad:
        print(f"  [WARN] {len(bad)} bad sample found — excluding all_items at those indices")
        all_items = [it for i, it in enumerate(all_items) if i not in set(bad)]
    print(f"  Usable: {len(all_items)}")

    np.random.seed(42)
    low  = [(p, l) for p, l in all_items if l == 0]
    high = [(p, l) for p, l in all_items if l == 1]

    def split(items):
        idx = np.random.permutation(len(items))
        n_train = int(len(idx) * 0.70)
        n_val   = int(len(idx) * 0.15)
        return ([items[i] for i in idx[:n_train]],
                [items[i] for i in idx[n_train:n_train+n_val]],
                [items[i] for i in idx[n_train+n_val:]])

    low_tr, low_val, low_te = split(low)
    hi_tr,  hi_val,  hi_te  = split(high)
    train_items = low_tr + hi_tr
    val_items   = low_val + hi_val
    test_items  = low_te + hi_te
    np.random.shuffle(train_items)

    print(f"\n[3/6] Split: train={len(train_items)} val={len(val_items)} test={len(test_items)}")
    n_low  = sum(1 for _, l in train_items if l == 0)
    n_high = sum(1 for _, l in train_items if l == 1)
    class_weight = {0: (n_low + n_high) / (2 * n_low),
                    1: (n_low + n_high) / (2 * n_high)}
    print(f"  Class weights: {class_weight}")

    train_ds = build_dataset(train_items, augment=True).shuffle(1000).batch(BATCH_SIZE).prefetch(tf.data.AUTOTUNE)
    val_ds   = build_dataset(val_items,   augment=False).batch(BATCH_SIZE).prefetch(tf.data.AUTOTUNE)
    test_ds  = build_dataset(test_items,  augment=False).batch(BATCH_SIZE).prefetch(tf.data.AUTOTUNE)

    print("\n[4/6] Phase 1: frozen base, training head...")
    model, base = build_model()
    model.compile(
        optimizer=tf.keras.optimizers.Adam(1e-4),
        loss="categorical_crossentropy",
        metrics=["accuracy", tf.keras.metrics.AUC(name="auc"),
                 tf.keras.metrics.Precision(name="precision"),
                 tf.keras.metrics.Recall(name="recall")],
    )

    cb1 = [
        tf.keras.callbacks.EarlyStopping(patience=4, restore_best_weights=True, monitor="val_auc", mode="max"),
        tf.keras.callbacks.ReduceLROnPlateau(patience=2, factor=0.5, monitor="val_auc", mode="max"),
    ]
    h1 = model.fit(train_ds, validation_data=val_ds, epochs=EPOCHS_HEAD,
                   class_weight=class_weight, callbacks=cb1)

    print("\n[5/6] Phase 2: fine-tuning top 30 layers...")
    base.trainable = True
    for layer in base.layers[:-30]:
        layer.trainable = False

    model.compile(
        optimizer=tf.keras.optimizers.Adam(1e-5),
        loss="categorical_crossentropy",
        metrics=["accuracy", tf.keras.metrics.AUC(name="auc"),
                 tf.keras.metrics.Precision(name="precision"),
                 tf.keras.metrics.Recall(name="recall")],
    )

    cb2 = [
        tf.keras.callbacks.EarlyStopping(patience=4, restore_best_weights=True, monitor="val_auc", mode="max"),
        tf.keras.callbacks.ReduceLROnPlateau(patience=2, factor=0.3, monitor="val_auc", mode="max"),
    ]
    h2 = model.fit(train_ds, validation_data=val_ds, epochs=EPOCHS_FINE,
                   class_weight=class_weight, callbacks=cb2)

    print("\n[6/6] Evaluating on test set...")
    test_metrics = model.evaluate(test_ds, return_dict=True)
    for k, v in test_metrics.items():
        print(f"  Test {k}: {v:.4f}")

    h5_path = MODELS / "janarogya_skin_v2.h5"
    model.save(str(h5_path))
    print(f"\n[SAVE] H5: {h5_path}")

    print("\n[EXPORT] INT8 TFLite...")
    converter = tf.lite.TFLiteConverter.from_keras_model(model)
    converter.optimizations = [tf.lite.Optimize.DEFAULT]

    def representative_dataset():
        for img, _ in build_dataset(val_items[:100]).batch(1):
            yield [img]

    converter.representative_dataset = representative_dataset
    converter.target_spec.supported_ops = [tf.lite.OpsSet.TFLITE_BUILTINS_INT8]
    converter.inference_input_type  = tf.int8
    converter.inference_output_type = tf.int8

    try:
        tflite_model = converter.convert()
        tflite_path = MODELS / "janarogya_skin_v2_int8.tflite"
        tflite_path.write_bytes(tflite_model)
        print(f"  Saved INT8 TFLite: {tflite_path} ({len(tflite_model)//1024//1024} MB)")
    except Exception as e:
        print(f"  [WARN] INT8 failed ({e}), falling back to float32...")
        c2 = tf.lite.TFLiteConverter.from_keras_model(model)
        c2.optimizations = [tf.lite.Optimize.DEFAULT]
        tflite_model = c2.convert()
        tflite_path = MODELS / "janarogya_skin_v2_f32.tflite"
        tflite_path.write_bytes(tflite_model)
        print(f"  Saved F32 TFLite: {tflite_path}")

    labels_path = MODELS / "labels_skin.json"
    labels_path.write_text(json.dumps(IDX_TO_LABEL))

    report = {
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
        "model": "EfficientNetB3",
        "num_classes": NUM_CLASSES,
        "labels": IDX_TO_LABEL,
        "image_size": list(IMAGE_SIZE),
        "dataset": {
            "train": len(train_items),
            "val":   len(val_items),
            "test":  len(test_items),
            "low_risk_train":  n_low,
            "high_risk_train": n_high,
        },
        "phase1_epochs": len(h1.history["accuracy"]),
        "phase2_epochs": len(h2.history["accuracy"]),
        "test_metrics": {k: round(float(v), 4) for k, v in test_metrics.items()},
        "best_val_auc": round(float(max(h1.history["val_auc"] + h2.history["val_auc"])), 4),
    }
    (MODELS / "training_report_skin.json").write_text(json.dumps(report, indent=2))
    print(f"\n[DONE] test metrics: {json.dumps(report['test_metrics'], indent=2)}")
    return str(tflite_path), str(labels_path)


if __name__ == "__main__":
    tflite_path, labels_path = train()
    print(f"\n[SUCCESS] Skin model: {tflite_path}")
    print(f"          Labels:     {labels_path}")
