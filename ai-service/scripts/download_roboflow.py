#!/usr/bin/env python3
"""
QazGost AI — Download Dataset from Roboflow

Downloads annotated defect dataset from Roboflow workspace
and prepares it for training.

Usage:
    # Set your API key first:
    set ROBOFLOW_API_KEY=your_key_here

    # Download latest version
    python scripts/download_roboflow.py

    # Download specific version
    python scripts/download_roboflow.py --version 2

    # Then train:
    python scripts/train_defects.py
"""

import argparse
import os
import sys
import shutil
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))


def download_dataset(api_key: str, workspace: str, project: str, version: int):
    """Download dataset from Roboflow."""
    try:
        from roboflow import Roboflow
    except ImportError:
        print("❌ roboflow not installed. Run:")
        print("   pip install roboflow")
        sys.exit(1)

    print("=" * 60)
    print("📥 QazGost AI — Downloading Defect Dataset from Roboflow")
    print("=" * 60)

    # Connect to Roboflow
    rf = Roboflow(api_key=api_key)
    proj = rf.workspace(workspace).project(project)

    print(f"📦 Project: {proj.name}")
    print(f"📊 Type: {proj.type}")

    # Download specific version
    dataset = proj.version(version).download("yolov8")

    print(f"\n✅ Downloaded to: {dataset.location}")

    # Copy to our dataset directory
    target_dir = Path("dataset")
    source_dir = Path(dataset.location)

    # Copy images
    for split in ["train", "valid", "test"]:
        src_images = source_dir / split / "images"
        src_labels = source_dir / split / "labels"

        # Map 'valid' -> 'val' for our naming
        dst_split = "val" if split == "valid" else split

        dst_images = target_dir / "images" / dst_split
        dst_labels = target_dir / "labels" / dst_split

        dst_images.mkdir(parents=True, exist_ok=True)
        dst_labels.mkdir(parents=True, exist_ok=True)

        if src_images.exists():
            n_imgs = 0
            for f in src_images.iterdir():
                shutil.copy2(f, dst_images / f.name)
                n_imgs += 1
            print(f"  📁 {dst_split}/images: {n_imgs} files")

        if src_labels.exists():
            n_lbls = 0
            for f in src_labels.iterdir():
                shutil.copy2(f, dst_labels / f.name)
                n_lbls += 1
            print(f"  📁 {dst_split}/labels: {n_lbls} files")

    # Count totals
    total_train = len(list((target_dir / "images" / "train").glob("*.*"))) if (target_dir / "images" / "train").exists() else 0
    total_val = len(list((target_dir / "images" / "val").glob("*.*"))) if (target_dir / "images" / "val").exists() else 0

    print(f"\n📊 Dataset ready:")
    print(f"   Train: {total_train} images")
    print(f"   Val:   {total_val} images")
    print(f"   Path:  {target_dir.resolve()}")
    print(f"\n🚀 Now run: python scripts/train_defects.py")


def main():
    parser = argparse.ArgumentParser(description="Download QazGost AI dataset from Roboflow")
    parser.add_argument("--api-key", type=str, default=os.getenv("ROBOFLOW_API_KEY"),
                        help="Roboflow API key (or set ROBOFLOW_API_KEY env var)")
    parser.add_argument("--workspace", type=str, default="iclaowerl",
                        help="Roboflow workspace name")
    parser.add_argument("--project", type=str, default="qazgost-defects",
                        help="Roboflow project name")
    parser.add_argument("--version", type=int, default=1,
                        help="Dataset version number")

    args = parser.parse_args()

    if not args.api_key:
        print("❌ No API key! Set it:")
        print("   set ROBOFLOW_API_KEY=your_key_here")
        print("   or: python scripts/download_roboflow.py --api-key YOUR_KEY")
        print("\n📍 Get your key at: https://app.roboflow.com → Settings → API Key")
        sys.exit(1)

    download_dataset(
        api_key=args.api_key,
        workspace=args.workspace,
        project=args.project,
        version=args.version,
    )


if __name__ == "__main__":
    main()
