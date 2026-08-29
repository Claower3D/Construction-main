#!/usr/bin/env python3
"""
QazGost AI — Complete Defect Detection Training Pipeline

Downloads multiple public construction defect datasets from Roboflow Universe,
merges them, and trains YOLOv8 for construction defect detection.

Classes:
  0: crack       (трещина)
  1: corrosion   (коррозия/ржавчина)
  2: spalling    (отслоение/сколы)
  3: efflorescence (высолы)
  4: damage      (повреждение)
  5: stain       (пятно/протечка)

Usage:
    python scripts/train_defects.py               # Full pipeline
    python scripts/train_defects.py --skip-download # Skip download, train only
    python scripts/train_defects.py --epochs 100   # Custom epochs
"""

import os
import sys
import shutil
import yaml
import argparse
from pathlib import Path
from datetime import datetime

# Project root
ROOT = Path(__file__).parent.parent
DATASET_DIR = ROOT / "dataset"
RUNS_DIR = ROOT / "runs"

# Roboflow API key
RF_API_KEY = os.getenv("ROBOFLOW_API_KEY", "ZRksh6wcykt4frv8Nhzh")

# Public datasets from Roboflow Universe to merge
# Each: (workspace, project, version, class_mapping)
DATASETS = [
    # Concrete crack detection (popular, well-annotated)
    {
        "workspace": "university-bswxt",
        "project": "crack-bphdr",
        "version": 2,
        "class_map": {"crack": 0, "Crack": 0, "cracks": 0},
    },
    # Concrete surface damage
    {
        "workspace": "sdu-sv8fh",
        "project": "concrete-crack-segmentation-bxzjg",
        "version": 1,
        "class_map": {"crack": 0, "Crack": 0},
    },
]

# Our unified class names
CLASS_NAMES = [
    "crack",          # 0 — трещина
    "corrosion",      # 1 — коррозия
    "spalling",       # 2 — отслоение/сколы
    "efflorescence",  # 3 — высолы
    "damage",         # 4 — повреждение
    "stain",          # 5 — пятно/протечка
]


def download_datasets():
    """Download all datasets from Roboflow Universe."""
    try:
        from roboflow import Roboflow
    except ImportError:
        print("❌ roboflow not installed. Run: pip install roboflow")
        sys.exit(1)
    
    rf = Roboflow(api_key=RF_API_KEY)
    raw_dir = DATASET_DIR / "raw"
    raw_dir.mkdir(parents=True, exist_ok=True)
    
    downloaded = []
    
    for i, ds in enumerate(DATASETS):
        print(f"\n{'='*60}")
        print(f"📥 [{i+1}/{len(DATASETS)}] Downloading: {ds['workspace']}/{ds['project']} v{ds['version']}")
        print(f"{'='*60}")
        
        try:
            project = rf.workspace(ds["workspace"]).project(ds["project"])
            dataset = project.version(ds["version"]).download(
                "yolov8",
                location=str(raw_dir / f"ds_{i}")
            )
            downloaded.append({
                "index": i,
                "path": Path(dataset.location),
                "class_map": ds["class_map"],
            })
            print(f"✅ Downloaded to: {dataset.location}")
        except Exception as e:
            print(f"⚠️ Failed to download {ds['project']}: {e}")
            continue
    
    return downloaded


def merge_datasets(downloaded: list):
    """Merge all downloaded datasets into unified format."""
    merged_dir = DATASET_DIR / "merged"
    
    # Clean previous merge
    if merged_dir.exists():
        shutil.rmtree(merged_dir)
    
    for split in ["train", "val"]:
        (merged_dir / "images" / split).mkdir(parents=True, exist_ok=True)
        (merged_dir / "labels" / split).mkdir(parents=True, exist_ok=True)
    
    total_images = 0
    total_labels = 0
    
    for ds_info in downloaded:
        ds_path = ds_info["path"]
        class_map = ds_info["class_map"]
        idx = ds_info["index"]
        
        for src_split in ["train", "valid", "test"]:
            dst_split = "val" if src_split in ("valid", "test") else "train"
            
            src_imgs = ds_path / src_split / "images"
            src_lbls = ds_path / src_split / "labels"
            
            if not src_imgs.exists():
                continue
            
            # Read dataset's data.yaml to get class names
            data_yaml = ds_path / "data.yaml"
            ds_classes = []
            if data_yaml.exists():
                with open(data_yaml) as f:
                    dy = yaml.safe_load(f)
                    ds_classes = dy.get("names", [])
                    if isinstance(ds_classes, dict):
                        ds_classes = [ds_classes[k] for k in sorted(ds_classes.keys())]
            
            for img_file in src_imgs.iterdir():
                if not img_file.suffix.lower() in ('.jpg', '.jpeg', '.png', '.bmp'):
                    continue
                
                # Copy image with unique prefix
                new_name = f"ds{idx}_{img_file.name}"
                shutil.copy2(img_file, merged_dir / "images" / dst_split / new_name)
                total_images += 1
                
                # Copy and remap labels
                lbl_file = src_lbls / (img_file.stem + ".txt")
                if lbl_file.exists():
                    new_lbl = merged_dir / "labels" / dst_split / (f"ds{idx}_{img_file.stem}.txt")
                    
                    with open(lbl_file) as f:
                        lines = f.readlines()
                    
                    remapped = []
                    for line in lines:
                        parts = line.strip().split()
                        if len(parts) < 5:
                            continue
                        
                        old_class_id = int(parts[0])
                        
                        # Get original class name
                        if old_class_id < len(ds_classes):
                            old_class_name = ds_classes[old_class_id]
                        else:
                            old_class_name = str(old_class_id)
                        
                        # Map to our unified class
                        new_class_id = class_map.get(old_class_name, 0)
                        
                        remapped.append(f"{new_class_id} {' '.join(parts[1:])}\n")
                    
                    if remapped:
                        with open(new_lbl, "w") as f:
                            f.writelines(remapped)
                        total_labels += 1
    
    print(f"\n📊 Merged dataset:")
    print(f"   Images: {total_images}")
    print(f"   Labels: {total_labels}")
    print(f"   Path:   {merged_dir}")
    
    # Create data.yaml
    data_yaml = {
        "path": str(merged_dir.resolve()),
        "train": "images/train",
        "val": "images/val",
        "nc": len(CLASS_NAMES),
        "names": CLASS_NAMES,
    }
    
    yaml_path = merged_dir / "data.yaml"
    with open(yaml_path, "w") as f:
        yaml.dump(data_yaml, f, default_flow_style=False, allow_unicode=True)
    
    print(f"   Config: {yaml_path}")
    
    return yaml_path, total_images


def train_model(data_yaml: Path, epochs: int = 50, imgsz: int = 640, batch: int = 8):
    """Train YOLOv8 model on merged dataset."""
    try:
        from ultralytics import YOLO
    except ImportError:
        print("❌ ultralytics not installed. Run: pip install ultralytics")
        sys.exit(1)
    
    print(f"\n{'='*60}")
    print(f"🧠 Starting YOLOv8 Training")
    print(f"{'='*60}")
    print(f"   Data:    {data_yaml}")
    print(f"   Epochs:  {epochs}")
    print(f"   ImgSize: {imgsz}")
    print(f"   Batch:   {batch}")
    
    # Use YOLOv8n (nano) for speed, or YOLOv8s (small) for accuracy
    model = YOLO("yolov8s.pt")  # Pretrained on COCO
    
    # Run directory
    run_name = f"defects_{datetime.now().strftime('%Y%m%d_%H%M')}"
    
    results = model.train(
        data=str(data_yaml),
        epochs=epochs,
        imgsz=imgsz,
        batch=batch,
        name=run_name,
        project=str(RUNS_DIR),
        patience=15,          # Early stopping
        save=True,
        save_period=10,       # Save checkpoint every 10 epochs
        plots=True,
        verbose=True,
        # Augmentations
        hsv_h=0.015,
        hsv_s=0.7,
        hsv_v=0.4,
        degrees=10,
        translate=0.1,
        scale=0.5,
        flipud=0.1,
        fliplr=0.5,
        mosaic=1.0,
        mixup=0.1,
        # Device
        device="cpu",  # Use "0" for GPU if available
    )
    
    # Find best model
    best_pt = RUNS_DIR / run_name / "weights" / "best.pt"
    
    if best_pt.exists():
        # Copy to models directory
        models_dir = ROOT / "models"
        models_dir.mkdir(exist_ok=True)
        final_model = models_dir / "defect_yolov8s_best.pt"
        shutil.copy2(best_pt, final_model)
        
        print(f"\n{'='*60}")
        print(f"✅ Training complete!")
        print(f"{'='*60}")
        print(f"   Best model: {final_model}")
        print(f"   Run dir:    {RUNS_DIR / run_name}")
        print(f"\n🚀 To use: update ai-service config to point to {final_model}")
        
        return final_model
    else:
        print("⚠️ No best.pt found — training may have failed")
        return None


def export_model(model_path: Path):
    """Export trained model to ONNX for faster inference."""
    try:
        from ultralytics import YOLO
    except ImportError:
        return
    
    print(f"\n📦 Exporting model to ONNX...")
    model = YOLO(str(model_path))
    model.export(format="onnx", imgsz=640, simplify=True)
    
    onnx_path = model_path.with_suffix(".onnx")
    if onnx_path.exists():
        print(f"✅ ONNX model: {onnx_path}")


def main():
    parser = argparse.ArgumentParser(description="QazGost AI — Train Defect Detection Model")
    parser.add_argument("--skip-download", action="store_true", help="Skip dataset download")
    parser.add_argument("--epochs", type=int, default=50, help="Training epochs (default: 50)")
    parser.add_argument("--batch", type=int, default=8, help="Batch size (default: 8)")
    parser.add_argument("--imgsz", type=int, default=640, help="Image size (default: 640)")
    parser.add_argument("--export", action="store_true", help="Export to ONNX after training")
    
    args = parser.parse_args()
    
    print("╔══════════════════════════════════════════════════════════╗")
    print("║       QazGost AI — Defect Detection Training Pipeline    ║")
    print("║                    YOLOv8s + Roboflow                    ║")
    print("╚══════════════════════════════════════════════════════════╝")
    print(f"\n🕐 Started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Step 1: Download
    data_yaml = DATASET_DIR / "merged" / "data.yaml"
    
    if not args.skip_download:
        downloaded = download_datasets()
        if not downloaded:
            print("❌ No datasets downloaded!")
            # Try to use existing merged dataset
            if data_yaml.exists():
                print("📂 Using existing merged dataset...")
            else:
                sys.exit(1)
        else:
            data_yaml, total = merge_datasets(downloaded)
            if total == 0:
                print("❌ No images in merged dataset!")
                sys.exit(1)
    else:
        if not data_yaml.exists():
            print(f"❌ No dataset found at {data_yaml}")
            print("   Run without --skip-download first")
            sys.exit(1)
        print(f"📂 Using existing dataset: {data_yaml}")
    
    # Step 2: Train
    model_path = train_model(
        data_yaml=data_yaml,
        epochs=args.epochs,
        batch=args.batch,
        imgsz=args.imgsz,
    )
    
    # Step 3: Export (optional)
    if model_path and args.export:
        export_model(model_path)
    
    print(f"\n🏁 Finished: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")


if __name__ == "__main__":
    main()
