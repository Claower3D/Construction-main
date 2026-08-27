#!/usr/bin/env python3
"""
QazGost AI — Defect Detection Model Training Script

Trains a segmentation model on construction defect dataset.
Requires GPU (RunPod/Vast.ai recommended: RTX 4090, ~$0.44/hr).

Usage:
    # Full training (150 epochs)
    python scripts/train_defects.py

    # Quick test (5 epochs)
    python scripts/train_defects.py --epochs 5 --batch 8

    # Resume from checkpoint
    python scripts/train_defects.py --resume

    # Export to ONNX after training
    python scripts/train_defects.py --export-onnx

Cost estimate: ~$2-3 on RunPod RTX 4090 for 150 epochs.
"""

import argparse
import shutil
import sys
from pathlib import Path
from datetime import datetime

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))


def train(args):
    """Train QazGost AI defect detection model."""
    from ultralytics import YOLO

    print("=" * 60)
    print("🏗️  QazGost AI — Defect Detection Training")
    print(f"📅  {datetime.now().strftime('%Y-%m-%d %H:%M')}")
    print("=" * 60)

    # Paths
    dataset_yaml = Path(args.data)
    output_dir = Path(args.project)
    model_dir = Path("./models")
    model_dir.mkdir(exist_ok=True)

    # Validate dataset
    if not dataset_yaml.exists():
        print(f"❌ Dataset config not found: {dataset_yaml}")
        print("   Run dataset preparation first. See dataset/README.md")
        sys.exit(1)

    # Check dataset has images
    dataset_root = dataset_yaml.parent
    train_imgs = dataset_root / "images" / "train"
    val_imgs = dataset_root / "images" / "val"

    if train_imgs.exists():
        n_train = len(list(train_imgs.glob("*.*")))
        n_val = len(list(val_imgs.glob("*.*"))) if val_imgs.exists() else 0
        print(f"📊 Dataset: {n_train} train / {n_val} val images")

        if n_train < 50:
            print("⚠️  WARNING: Less than 50 training images. Results may be poor.")
            print("   Recommended: 1500+ images for production quality.")
    else:
        print(f"⚠️  Train images dir not found: {train_imgs}")
        print("   Will attempt to use paths from YAML.")

    # Base model
    base_model = args.model
    print(f"\n🤖 Base model: {base_model}")
    print(f"⚙️  Epochs: {args.epochs}")
    print(f"⚙️  Batch: {args.batch}")
    print(f"⚙️  Image size: {args.imgsz}")
    print(f"⚙️  Device: {args.device or 'auto'}")

    # Load model
    model = YOLO(base_model)

    # Training arguments
    train_args = dict(
        data=str(dataset_yaml),
        epochs=args.epochs,
        imgsz=args.imgsz,
        batch=args.batch,
        project=str(output_dir),
        name=args.name,
        patience=args.patience,
        save=True,
        save_period=10,
        plots=True,
        # Augmentation
        hsv_h=0.015,
        hsv_s=0.5,
        hsv_v=0.3,
        degrees=10.0,
        translate=0.1,
        scale=0.3,
        flipud=0.1,
        fliplr=0.5,
        mosaic=0.8,
        mixup=0.1,
    )

    if args.device:
        train_args["device"] = args.device

    if args.resume:
        train_args["resume"] = True
        print("🔄 Resuming from last checkpoint...")

    # Train
    print("\n" + "=" * 60)
    print("🚀 Starting training...")
    print("=" * 60 + "\n")

    results = model.train(**train_args)

    # Results
    print("\n" + "=" * 60)
    print("📊 Training Results:")
    print("=" * 60)

    best_weights = output_dir / args.name / "weights" / "best.pt"
    if best_weights.exists():
        # Copy to models directory
        target = model_dir / "qazgost_defects_v1.pt"
        shutil.copy2(best_weights, target)
        print(f"✅ Best weights copied to: {target}")
        print(f"   File size: {target.stat().st_size / 1024 / 1024:.1f} MB")
    else:
        print(f"⚠️  Best weights not found at {best_weights}")

    # Validate
    print("\n🧪 Running validation...")
    metrics = model.val(data=str(dataset_yaml))
    print(f"\n📈 mAP50:    {metrics.seg.map50:.4f}")
    print(f"📈 mAP50-95: {metrics.seg.map:.4f}")
    print(f"📈 Precision: {metrics.seg.mp:.4f}")
    print(f"📈 Recall:    {metrics.seg.mr:.4f}")

    # Quality check
    if metrics.seg.map50 >= 0.70:
        print("\n✅ Model quality: GOOD (mAP50 >= 0.70)")
        print("   Ready for production deployment!")
    elif metrics.seg.map50 >= 0.50:
        print("\n⚠️  Model quality: ACCEPTABLE (mAP50 >= 0.50)")
        print("   Consider adding more training data for better results.")
    else:
        print("\n❌ Model quality: POOR (mAP50 < 0.50)")
        print("   Need more data, better annotations, or more epochs.")

    # Export to ONNX
    if args.export_onnx:
        print("\n📦 Exporting to ONNX...")
        model.export(format="onnx", opset=17, simplify=True)
        print("✅ ONNX export complete!")

    print("\n🏁 Training complete!")
    print(f"   Results: {output_dir / args.name}")
    print(f"   Weights: models/qazgost_defects_v1.pt")


def main():
    parser = argparse.ArgumentParser(description="QazGost AI — Train Defect Detection Model")
    parser.add_argument("--data", type=str, default="dataset/defects.yaml",
                        help="Path to dataset YAML config")
    parser.add_argument("--model", type=str, default="yolov8x-seg.pt",
                        help="Base model (yolov8n-seg.pt for quick test, yolov8x-seg.pt for production)")
    parser.add_argument("--epochs", type=int, default=150,
                        help="Number of training epochs")
    parser.add_argument("--batch", type=int, default=16,
                        help="Batch size (reduce if OOM)")
    parser.add_argument("--imgsz", type=int, default=640,
                        help="Input image size")
    parser.add_argument("--device", type=str, default=None,
                        help="Device: 'cuda', 'cpu', '0', '0,1'")
    parser.add_argument("--project", type=str, default="runs/defects",
                        help="Output project directory")
    parser.add_argument("--name", type=str, default="qazgost_v1",
                        help="Run name")
    parser.add_argument("--patience", type=int, default=30,
                        help="Early stopping patience")
    parser.add_argument("--resume", action="store_true",
                        help="Resume from last checkpoint")
    parser.add_argument("--export-onnx", action="store_true",
                        help="Export to ONNX after training")

    args = parser.parse_args()
    train(args)


if __name__ == "__main__":
    main()
