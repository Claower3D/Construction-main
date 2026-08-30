#!/usr/bin/env python3
"""
QazGost AI — Concrete Defect Segmentation Training Pipeline (YOLOv8-Seg)

Trains instance segmentation models (YOLOv8n-seg / YOLOv8s-seg) on concrete
fracture, spall, and crack polygons to output pixel-accurate masks instead of simple boxes.

Usage:
    python scripts/train_defects_seg.py --epochs 25 --model yolov8n-seg.pt
"""

import os
import sys
import yaml
import argparse
from pathlib import Path
from datetime import datetime

ROOT = Path(__file__).parent.parent
DATASET_DIR = ROOT / "dataset"
RUNS_DIR = ROOT / "runs"

CLASS_NAMES = [
    "crack",          # 0 — трещина
    "corrosion",      # 1 — коррозия
    "spalling",       # 2 — скол / отслоение
    "damage",         # 3 — повреждение бетона
]


def train_seg_model(data_yaml: Path, epochs: int = 25, imgsz: int = 640, batch: int = 8, model_name: str = "yolov8n-seg.pt"):
    """Train YOLOv8-Seg instance segmentation model."""
    try:
        from ultralytics import YOLO
    except ImportError:
        print("❌ ultralytics not installed. Run: pip install ultralytics")
        sys.exit(1)

    print(f"\n{'='*60}")
    print(f"🧠 Starting YOLOv8 Instance Segmentation Training")
    print(f"{'='*60}")
    print(f"   Model:   {model_name}")
    print(f"   Data:    {data_yaml}")
    print(f"   Epochs:  {epochs}")
    print(f"   ImgSize: {imgsz}")
    print(f"   Batch:   {batch}")

    model = YOLO(model_name)
    run_name = f"defects_seg_{datetime.now().strftime('%Y%m%d_%H%M')}"

    results = model.train(
        data=str(data_yaml),
        epochs=epochs,
        imgsz=imgsz,
        batch=batch,
        name=run_name,
        project=str(RUNS_DIR),
        patience=12,
        save=True,
        plots=True,
        verbose=True,
        hsv_h=0.015,
        hsv_s=0.6,
        hsv_v=0.4,
        degrees=15,
        translate=0.1,
        scale=0.5,
        fliplr=0.5,
        flipud=0.5,
    )

    print(f"\n✅ Training complete! Best weights saved in runs/{run_name}/weights/best.pt")
    return results


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Train YOLOv8 Segmentation on Concrete Defects")
    parser.add_argument("--epochs", type=int, default=20, help="Training epochs")
    parser.add_argument("--batch", type=int, default=8, help="Batch size")
    parser.add_argument("--imgsz", type=int, default=640, help="Image size")
    parser.add_argument("--model", type=str, default="yolov8n-seg.pt", help="Pretrained YOLO-Seg model")
    args = parser.parse_args()

    default_yaml = DATASET_DIR / "merged" / "data.yaml"
    if default_yaml.exists():
        train_seg_model(default_yaml, epochs=args.epochs, imgsz=args.imgsz, batch=args.batch, model_name=args.model)
    else:
        print(f"⚠️ Dataset yaml not found at {default_yaml}. Please run dataset download/merge first.")
