"""
download_oral.py — Download oral cancer datasets from Kaggle.

Datasets pulled (combined ~5 000+ images):
  1. saidakbarp/oral-cancer-dataset          (~1 856 images)
  2. rishabhkumar14/oral-cancer-lips-and-tongue (~2 000+ images)
  3. zaidpy/oral-cancer-images               (~1 500 images)

Usage:
  1. Put your Kaggle API key at  ~/.kaggle/kaggle.json
     {"username": "YOUR_USER", "key": "YOUR_KEY"}
  2. pip install kaggle
  3. python ml/scripts/download_oral.py

All images are normalised into:
  ml/data/raw/oral_kaggle/cancer/   → HIGH_RISK
  ml/data/raw/oral_kaggle/normal/   → LOW_RISK
"""
import io
import os
import shutil
import sys
import zipfile
from pathlib import Path

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

ML_ROOT  = Path(__file__).parent.parent
DATA_DIR = ML_ROOT / "data" / "raw" / "oral_kaggle"
TMP_DIR  = ML_ROOT / "data" / "tmp_oral"

CANCER_OUT = DATA_DIR / "cancer"
NORMAL_OUT = DATA_DIR / "normal"

# ── Kaggle dataset specs ───────────────────────────────────────────────────────
# Each entry: (kaggle_slug, [(src_glob_pattern, dest_label), ...])
# dest_label: "cancer" | "normal"
DATASETS = [
    (
        "saidakbarp/oral-cancer-dataset",
        [
            ("**/cancer/**/*",     "cancer"),
            ("**/Cancer/**/*",     "cancer"),
            ("**/normal/**/*",     "normal"),
            ("**/Normal/**/*",     "normal"),
            ("**/non-cancer/**/*", "normal"),
        ],
    ),
    (
        "rishabhkumar14/oral-cancer-lips-and-tongue",
        [
            ("**/cancer/**/*",  "cancer"),
            ("**/Cancer/**/*",  "cancer"),
            ("**/normal/**/*",  "normal"),
            ("**/Normal/**/*",  "normal"),
            ("**/healthy/**/*", "normal"),
            ("**/Healthy/**/*", "normal"),
        ],
    ),
    (
        "zaidpy/oral-cancer-images",
        [
            ("**/cancer/**/*",     "cancer"),
            ("**/Cancer/**/*",     "cancer"),
            ("**/oral_cancer/**/*","cancer"),
            ("**/normal/**/*",     "normal"),
            ("**/Normal/**/*",     "normal"),
            ("**/non_cancer/**/*", "normal"),
        ],
    ),
]

IMG_EXTS = {".jpg", ".jpeg", ".png", ".bmp", ".webp", ".tif", ".tiff"}


def check_kaggle():
    try:
        import kaggle  # noqa: F401
        return True
    except ImportError:
        print("[ERROR] kaggle package not installed. Run: pip install kaggle")
        sys.exit(1)
    except Exception as e:
        print(f"[ERROR] Kaggle API not configured: {e}")
        print("  Create ~/.kaggle/kaggle.json with your Kaggle credentials.")
        sys.exit(1)


def download_dataset(slug: str, dest: Path):
    """Download and unzip a Kaggle dataset."""
    import kaggle
    dest.mkdir(parents=True, exist_ok=True)
    print(f"  Downloading {slug} ...")
    kaggle.api.dataset_download_files(slug, path=str(dest), unzip=True, quiet=False)


def collect_images(src_dir: Path, patterns: list[tuple[str, str]], out_dirs: dict):
    """Copy images matching glob patterns into cancer/normal output dirs."""
    moved = {"cancer": 0, "normal": 0}
    for pattern, label in patterns:
        for f in src_dir.glob(pattern):
            if f.suffix.lower() in IMG_EXTS and f.is_file():
                dst = out_dirs[label] / f.name
                # Avoid name collisions
                if dst.exists():
                    stem = f.stem
                    suffix = f.suffix
                    idx = 1
                    while dst.exists():
                        dst = out_dirs[label] / f"{stem}_{idx}{suffix}"
                        idx += 1
                shutil.copy2(f, dst)
                moved[label] += 1
    return moved


def main():
    check_kaggle()

    CANCER_OUT.mkdir(parents=True, exist_ok=True)
    NORMAL_OUT.mkdir(parents=True, exist_ok=True)
    TMP_DIR.mkdir(parents=True, exist_ok=True)

    out_dirs = {"cancer": CANCER_OUT, "normal": NORMAL_OUT}
    total = {"cancer": 0, "normal": 0}

    for slug, patterns in DATASETS:
        dataset_name = slug.split("/")[-1]
        dl_dir = TMP_DIR / dataset_name
        print(f"\n[DATASET] {slug}")
        try:
            download_dataset(slug, dl_dir)
            moved = collect_images(dl_dir, patterns, out_dirs)
            print(f"  Copied: cancer={moved['cancer']} normal={moved['normal']}")
            total["cancer"] += moved["cancer"]
            total["normal"] += moved["normal"]
        except Exception as e:
            print(f"  [WARN] Failed: {e} — skipping")

    # Count existing images (from previous downloads)
    existing_cancer = len(list(CANCER_OUT.glob("*")))
    existing_normal = len(list(NORMAL_OUT.glob("*")))

    print(f"\n{'='*50}")
    print(f"ORAL DATASET READY")
    print(f"  cancer/ : {existing_cancer} images  → HIGH_RISK")
    print(f"  normal/ : {existing_normal} images  → LOW_RISK")
    print(f"  Total   : {existing_cancer + existing_normal} images")
    print(f"\nNext step: python ml/scripts/train_oral.py")

    # Clean up tmp
    try:
        shutil.rmtree(TMP_DIR)
    except Exception:
        pass


if __name__ == "__main__":
    main()
