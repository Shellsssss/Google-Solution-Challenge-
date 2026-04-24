"""
deploy_oral.py — Copy trained oral model to app/assets/models/.

Run after train_oral.py completes.
"""
import shutil
import sys
from pathlib import Path

ML_ROOT    = Path(__file__).parent.parent
MODELS     = ML_ROOT / "models"
ASSETS     = ML_ROOT.parent / "app" / "assets" / "models"

FILES = [
    ("janarogya_oral_v2_int8.tflite", "janarogya_oral_int8.tflite"),
    ("janarogya_oral_v2_f16.tflite",  "janarogya_oral_int8.tflite"),  # fallback name
    ("labels_oral.json",              "labels_oral.json"),
]

def main():
    ASSETS.mkdir(parents=True, exist_ok=True)
    deployed = False
    for src_name, dst_name in FILES:
        src = MODELS / src_name
        if src.exists():
            dst = ASSETS / dst_name
            shutil.copy2(src, dst)
            size_mb = src.stat().st_size // 1024 // 1024
            print(f"  Copied: {src_name} -> app/assets/models/{dst_name} ({size_mb} MB)")
            deployed = True
            if src_name.endswith(".tflite"):
                break  # only deploy one tflite

    if not deployed:
        print("[ERROR] No trained model found. Run train_oral.py first.")
        sys.exit(1)

    print("\n[DONE] Oral model deployed. Rebuild the Flutter app to use it.")

if __name__ == "__main__":
    main()
