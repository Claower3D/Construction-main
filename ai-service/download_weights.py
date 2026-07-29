"""
QAZGOST AI — ML Model Weights Downloader

Downloads all required model weights for:
  1. RF-DETR (via rfdetr package — auto-downloads on first use)
  2. Grounding DINO 1.5 (SwinT-OGC)
  3. SAM (ViT-B)
  4. Qwen2.5-VL (auto-downloads via transformers)

Usage:
    python download_weights.py          # Download all
    python download_weights.py --gdino  # Download only Grounding DINO
    python download_weights.py --sam    # Download only SAM
"""

import os
import sys
import argparse
import hashlib
from pathlib import Path

# ─── Config ──────────────────────────────────────────────────────────────────

WEIGHTS_DIR = Path(__file__).parent / "models"

MODELS = {
    "gdino": {
        "name": "Grounding DINO (SwinT-OGC)",
        "url": "https://github.com/IDEA-Research/GroundingDINO/releases/download/v0.1.0-alpha/groundingdino_swint_ogc.pth",
        "filename": "groundingdino_swint_ogc.pth",
        "size_mb": 694,
        "md5": None,  # Optional checksum
    },
    "gdino_config": {
        "name": "Grounding DINO Config",
        "url": "https://raw.githubusercontent.com/IDEA-Research/GroundingDINO/main/groundingdino/config/GroundingDINO_SwinT_OGC.py",
        "filename": "GroundingDINO_SwinT_OGC.py",
        "size_mb": 0.003,
        "md5": None,
    },
    "sam_vit_b": {
        "name": "SAM ViT-B (Base)",
        "url": "https://dl.fbaipublicfiles.com/segment_anything/sam_vit_b_01ec64.pth",
        "filename": "sam_vit_b_01ec64.pth",
        "size_mb": 375,
        "md5": "01ec64",
    },
}


def download_file(url: str, dest: Path, expected_size_mb: float = 0):
    """Download a file with progress bar."""
    import urllib.request

    print(f"\n📥 Downloading: {dest.name}")
    print(f"   URL: {url}")
    print(f"   Expected size: ~{expected_size_mb:.0f} MB")

    if dest.exists():
        actual_mb = dest.stat().st_size / (1024 * 1024)
        if actual_mb > expected_size_mb * 0.9:
            print(f"   ✅ Already exists ({actual_mb:.1f} MB) — skipping")
            return True
        else:
            print(f"   ⚠️  Exists but too small ({actual_mb:.1f} MB) — re-downloading")

    dest.parent.mkdir(parents=True, exist_ok=True)

    try:
        def reporthook(block_num, block_size, total_size):
            downloaded = block_num * block_size
            if total_size > 0:
                pct = min(downloaded / total_size * 100, 100)
                mb_done = downloaded / (1024 * 1024)
                mb_total = total_size / (1024 * 1024)
                bar_len = 30
                filled = int(bar_len * pct / 100)
                bar = "█" * filled + "░" * (bar_len - filled)
                print(f"\r   [{bar}] {pct:.1f}% ({mb_done:.1f}/{mb_total:.1f} MB)", end="", flush=True)

        urllib.request.urlretrieve(url, str(dest), reporthook=reporthook)
        print()  # newline after progress bar

        actual_mb = dest.stat().st_size / (1024 * 1024)
        print(f"   ✅ Downloaded: {actual_mb:.1f} MB")
        return True

    except Exception as e:
        print(f"\n   ❌ Download failed: {e}")
        return False


def main():
    parser = argparse.ArgumentParser(description="Download ML model weights for QAZGOST AI")
    parser.add_argument("--gdino", action="store_true", help="Download Grounding DINO weights")
    parser.add_argument("--sam", action="store_true", help="Download SAM weights")
    parser.add_argument("--all", action="store_true", help="Download all weights (default)")
    args = parser.parse_args()

    # Default to --all if nothing specified
    download_all = args.all or (not args.gdino and not args.sam)

    print("=" * 60)
    print("  QAZGOST AI — ML Model Weights Downloader")
    print("=" * 60)
    print(f"  Weights directory: {WEIGHTS_DIR}")

    WEIGHTS_DIR.mkdir(parents=True, exist_ok=True)

    success = True

    if download_all or args.gdino:
        for key in ["gdino", "gdino_config"]:
            model = MODELS[key]
            dest = WEIGHTS_DIR / model["filename"]
            ok = download_file(model["url"], dest, model["size_mb"])
            if not ok:
                success = False

    if download_all or args.sam:
        model = MODELS["sam_vit_b"]
        dest = WEIGHTS_DIR / model["filename"]
        ok = download_file(model["url"], dest, model["size_mb"])
        if not ok:
            success = False

    print("\n" + "=" * 60)
    if success:
        print("  ✅ All weights downloaded successfully!")
        print(f"  📂 Location: {WEIGHTS_DIR}")
        print()
        print("  Next steps:")
        print("    1. Activate venv: .venv\\Scripts\\activate")
        print("    2. Install deps: pip install -r requirements.txt")
        print("    3. Run server:   python -m app.main")
    else:
        print("  ⚠️  Some downloads failed. Check errors above.")

    print("=" * 60)
    return 0 if success else 1


if __name__ == "__main__":
    sys.exit(main())
