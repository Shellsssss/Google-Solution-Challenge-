"""
train_oral.py — Retrain JanArogya oral cancer model on downloaded datasets.

Datasets used:
  - ml/data/raw/dataset/normal/         → LOW_RISK
  - ml/data/raw/dataset/Oral Cancer photos/ → HIGH_RISK
  - ml/data/raw/OralCancer/non-cancer/  → LOW_RISK
  - ml/data/raw/OralCancer/cancer/      → HIGH_RISK

Output:
  - ml/models/janarogya_oral_v2.h5
  - ml/models/janarogya_oral_v2_int8.tflite
  - ml/models/labels_oral.json
  - ml/models/training_report.json
"""
import io
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
os.environ["PYTHONIOENCODING"] = "utf-8"

# Force UTF-8 on stdout/stderr for Windows cp1252 consoles
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
        sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8", errors="replace")

import numpy as np
from PIL import Image, UnidentifiedImageError

ML_ROOT   = Path(__file__).parent.parent
DATA_RAW  = ML_ROOT / "data" / "raw"
MODELS    = ML_ROOT / "models"
MODELS.mkdir(exist_ok=True)

IMAGE_SIZE  = (224, 224)
BATCH_SIZE  = 16
EPOCHS_HEAD = 15   # freeze base, train head
EPOCHS_FINE = 10   # unfreeze top layers, fine-tune

# ── 2 classes (binary) ──
LABEL_MAP = {"LOW_RISK": 0, "HIGH_RISK": 1}
IDX_TO_LABEL = {0: "LOW_RISK", 1: "HIGH_RISK"}
NUM_CLASSES = 2


# ── Collect images ──────────────────────────────────────────────────────────

def collect_images() -> list[tuple[Path, int]]:
    """Return list of (image_path, label_idx) from all datasets."""
    sources = [
        # (directory, label)
        (DATA_RAW / "dataset" / "normal",             "LOW_RISK"),
        (DATA_RAW / "dataset" / "Oral Cancer photos", "HIGH_RISK"),
        (DATA_RAW / "OralCancer" / "non-cancer",      "LOW_RISK"),
        (DATA_RAW / "OralCancer" / "cancer",          "HIGH_RISK"),
    ]
    exts = {".jpg", ".jpeg", ".png", ".bmp", ".webp"}
    items: list[tuple[Path, int]] = []
    for directory, label in sources:
        if not directory.exists():
            print(f"  [WARN] Skipping missing dir: {directory}")
            continue
        for f in sorted(directory.iterdir()):
            if f.suffix.lower() in exts:
                items.append((f, LABEL_MAP[label]))
        print(f"  {label}: {sum(1 for _, l in items if l == LABEL_MAP[label])} images from {directory.name}")
    return items


def verify_image(path: Path) -> bool:
    try:
        with Image.open(path) as img:
            img.verify()
        return True
    except Exception:
        return False


# ── Dataset builder ─────────────────────────────────────────────────────────

def build_dataset(items: list[tuple[Path, int]], augment: bool = False):
    """Build a tf.data.Dataset from image path/label pairs."""
    import tensorflow as tf

    paths  = [str(p) for p, _ in items]
    labels = [l for _, l in items]

    def load_image(path, label):
        raw = tf.io.read_file(path)
        try:
            img = tf.image.decode_image(raw, channels=3, expand_animations=False)
        except Exception:
            img = tf.zeros([*IMAGE_SIZE, 3], dtype=tf.uint8)
        img = tf.image.resize(img, IMAGE_SIZE)
        img = tf.cast(img, tf.float32) / 255.0

        if augment:
            img = tf.image.random_flip_left_right(img)
            img = tf.image.random_flip_up_down(img)
            img = tf.image.random_brightness(img, 0.25)
            img = tf.image.random_contrast(img, 0.75, 1.25)
            img = tf.image.random_saturation(img, 0.8, 1.2)
            img = tf.image.random_hue(img, 0.05)
            img = tf.clip_by_value(img, 0.0, 1.0)
            # Random rotation via KerasCV or manual crop
            img = tf.image.random_crop(img, [210, 210, 3])
            img = tf.image.resize(img, IMAGE_SIZE)

        label_oh = tf.one_hot(label, NUM_CLASSES)
        return img, label_oh

    ds = tf.data.Dataset.from_tensor_slices((paths, labels))
    ds = ds.map(load_image, num_parallel_calls=tf.data.AUTOTUNE)
    return ds


# ── Model ───────────────────────────────────────────────────────────────────

def build_model():
    import tensorflow as tf

    base = tf.keras.applications.EfficientNetB3(
        include_top=False,
        weights="imagenet",
        input_shape=(*IMAGE_SIZE, 3),
    )
    base.trainable = False   # Phase 1: frozen

    inputs = tf.keras.Input(shape=(*IMAGE_SIZE, 3))
    x = base(inputs, training=False)
    x = tf.keras.layers.GlobalAveragePooling2D()(x)
    x = tf.keras.layers.BatchNormalization()(x)
    x = tf.keras.layers.Dense(256, activation="relu")(x)
    x = tf.keras.layers.Dropout(0.4)(x)
    x = tf.keras.layers.Dense(128, activation="relu")(x)
    x = tf.keras.layers.Dropout(0.3)(x)
    outputs = tf.keras.layers.Dense(NUM_CLASSES, activation="softmax")(x)

    model = tf.keras.Model(inputs, outputs)
    return model, base


# ── Training ────────────────────────────────────────────────────────────────

def train():
    import tensorflow as tf

    print("\n[1/6] Collecting images...")
    all_items = collect_images()
    print(f"  Total: {len(all_items)} images")

    if len(all_items) < 20:
        print("[ERROR] Not enough images. Aborting.")
        sys.exit(1)

    # Verify images
    print("\n[2/6] Verifying images...")
    valid = [(p, l) for p, l in all_items if verify_image(p)]
    print(f"  Valid: {len(valid)}/{len(all_items)}")

    # Stratified split 70/15/15
    np.random.seed(42)
    low  = [(p, l) for p, l in valid if l == 0]
    high = [(p, l) for p, l in valid if l == 1]

    def split(items):
        idx = np.random.permutation(len(items))
        n_train = int(len(idx) * 0.70)
        n_val   = int(len(idx) * 0.15)
        return ([items[i] for i in idx[:n_train]],
                [items[i] for i in idx[n_train:n_train+n_val]],
                [items[i] for i in idx[n_train+n_val:]])

    low_tr, low_val, low_te   = split(low)
    hi_tr,  hi_val,  hi_te    = split(high)
    train_items = low_tr + hi_tr
    val_items   = low_val + hi_val
    test_items  = low_te + hi_te

    np.random.shuffle(train_items)
    print(f"\n[3/6] Split: train={len(train_items)} val={len(val_items)} test={len(test_items)}")
    print(f"  LOW_RISK  -> train:{sum(1 for _,l in train_items if l==0)} val:{sum(1 for _,l in val_items if l==0)}")
    print(f"  HIGH_RISK -> train:{sum(1 for _,l in train_items if l==1)} val:{sum(1 for _,l in val_items if l==1)}")

    # Class weights
    n_low  = sum(1 for _, l in train_items if l == 0)
    n_high = sum(1 for _, l in train_items if l == 1)
    total  = n_low + n_high
    class_weight = {0: total / (2 * n_low), 1: total / (2 * n_high)}
    print(f"  Class weights: {class_weight}")

    # Build datasets
    train_ds = build_dataset(train_items, augment=True).shuffle(500).batch(BATCH_SIZE).prefetch(tf.data.AUTOTUNE)
    val_ds   = build_dataset(val_items,   augment=False).batch(BATCH_SIZE).prefetch(tf.data.AUTOTUNE)
    test_ds  = build_dataset(test_items,  augment=False).batch(BATCH_SIZE).prefetch(tf.data.AUTOTUNE)

    # ── Phase 1: Train head ───────────────────────────────────────────────
    print("\n[4/6] Phase 1: Training head (frozen base)...")
    model, base = build_model()
    model.compile(
        optimizer=tf.keras.optimizers.Adam(1e-4),
        loss="categorical_crossentropy",
        metrics=["accuracy", tf.keras.metrics.AUC(name="auc"),
                 tf.keras.metrics.Precision(name="precision"),
                 tf.keras.metrics.Recall(name="recall")],
    )
    model.summary()

    callbacks1 = [
        tf.keras.callbacks.EarlyStopping(patience=5, restore_best_weights=True, monitor="val_auc", mode="max"),
        tf.keras.callbacks.ReduceLROnPlateau(patience=3, factor=0.5, monitor="val_auc", mode="max"),
        tf.keras.callbacks.ModelCheckpoint(str(MODELS / "best_phase1.h5"), save_best_only=True, monitor="val_auc", mode="max"),
    ]

    h1 = model.fit(train_ds, validation_data=val_ds, epochs=EPOCHS_HEAD,
                   class_weight=class_weight, callbacks=callbacks1)

    # ── Phase 2: Fine-tune ────────────────────────────────────────────────
    print("\n[5/6] Phase 2: Fine-tuning top 30 layers...")
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

    callbacks2 = [
        tf.keras.callbacks.EarlyStopping(patience=5, restore_best_weights=True, monitor="val_auc", mode="max"),
        tf.keras.callbacks.ReduceLROnPlateau(patience=3, factor=0.3, monitor="val_auc", mode="max"),
        tf.keras.callbacks.ModelCheckpoint(str(MODELS / "best_phase2.h5"), save_best_only=True, monitor="val_auc", mode="max"),
    ]

    h2 = model.fit(train_ds, validation_data=val_ds, epochs=EPOCHS_FINE,
                   class_weight=class_weight, callbacks=callbacks2)

    # ── Evaluate ──────────────────────────────────────────────────────────
    print("\n[6/6] Evaluating on test set...")
    test_metrics = model.evaluate(test_ds, return_dict=True)
    print(f"  Test accuracy:  {test_metrics['accuracy']:.4f}")
    print(f"  Test AUC:       {test_metrics['auc']:.4f}")
    print(f"  Test Precision: {test_metrics['precision']:.4f}")
    print(f"  Test Recall:    {test_metrics['recall']:.4f}")

    # ── Save H5 ───────────────────────────────────────────────────────────
    h5_path = MODELS / "janarogya_oral_v2.h5"
    model.save(str(h5_path))
    print(f"\n[SAVE] H5: {h5_path}")

    # ── Export TFLite INT8 ────────────────────────────────────────────────
    print("\n[EXPORT] INT8 TFLite...")
    converter = tf.lite.TFLiteConverter.from_keras_model(model)
    converter.optimizations = [tf.lite.Optimize.DEFAULT]

    # Representative dataset for INT8 calibration
    def representative_dataset():
        for img, _ in build_dataset(val_items[:100]).batch(1):
            yield [img]

    converter.representative_dataset = representative_dataset
    converter.target_spec.supported_ops = [tf.lite.OpsSet.TFLITE_BUILTINS_INT8]
    converter.inference_input_type  = tf.int8
    converter.inference_output_type = tf.int8

    try:
        tflite_model = converter.convert()
        tflite_path = MODELS / "janarogya_oral_v2_int8.tflite"
        tflite_path.write_bytes(tflite_model)
        print(f"  Saved INT8 TFLite: {tflite_path} ({len(tflite_model)//1024//1024} MB)")
    except Exception as e:
        print(f"  ⚠ INT8 failed ({e}), trying float32...")
        converter2 = tf.lite.TFLiteConverter.from_keras_model(model)
        converter2.optimizations = [tf.lite.Optimize.DEFAULT]
        tflite_model = converter2.convert()
        tflite_path = MODELS / "janarogya_oral_v2_f32.tflite"
        tflite_path.write_bytes(tflite_model)
        print(f"  Saved F32 TFLite: {tflite_path}")

    # ── Save labels ───────────────────────────────────────────────────────
    labels_path = MODELS / "labels_oral.json"
    labels_path.write_text(json.dumps(IDX_TO_LABEL))
    print(f"  Saved labels: {labels_path}")

    # ── Training report ───────────────────────────────────────────────────
    report = {
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
        "model": "EfficientNetB3",
        "num_classes": NUM_CLASSES,
        "labels": IDX_TO_LABEL,
        "image_size": IMAGE_SIZE,
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
    report_path = MODELS / "training_report.json"
    report_path.write_text(json.dumps(report, indent=2))
    print(f"\n✅ Training report: {report_path}")
    print(json.dumps(report["test_metrics"], indent=2))

    return str(tflite_path), str(labels_path)


if __name__ == "__main__":
    tflite_path, labels_path = train()
    print(f"\n🎉 Done! Model: {tflite_path}")
    print(f"   Labels: {labels_path}")
    print(f"\nDeploy with:")
    print(f"  cp {tflite_path} ../app/assets/models/janarogya_oral_int8.tflite")
    print(f"  cp {labels_path} ../app/assets/models/labels_oral.json")
