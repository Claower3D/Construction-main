#!/usr/bin/env python3
"""
QAZGOST AI - YOLOv8 Training Script

Train custom YOLOv8 model for construction object detection.

Usage:
    python scripts/train.py --epochs 100 --batch 16 --device 0
    python scripts/train.py --resume runs/train/exp/weights/last.pt
"""

import argparse
import sys
from pathlib import Path
from datetime import datetime

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent.parent))


def parse_args():
    parser = argparse.ArgumentParser(
        description="Train YOLOv8 for construction detection"
    )
    
    # Model
    parser.add_argument(
        "--model", "-m",
        type=str,
        default="yolov8m.pt",
        help="Base model: yolov8n/s/m/l/x.pt (default: yolov8m.pt)"
    )
    parser.add_argument(
        "--resume",
        type=str,
        default=None,
        help="Resume training from checkpoint"
    )
    
    # Dataset
    parser.add_argument(
        "--data",
        type=str,
        default="data/dataset.yaml",
        help="Path to dataset YAML"
    )
    
    # Training
    parser.add_argument(
        "--epochs", "-e",
        type=int,
        default=100,
        help="Number of epochs (default: 100)"
    )
    parser.add_argument(
        "--batch", "-b",
        type=int,
        default=16,
        help="Batch size (default: 16)"
    )
    parser.add_argument(
        "--imgsz",
        type=int,
        default=640,
        help="Image size (default: 640)"
    )
    parser.add_argument(
        "--device",
        type=str,
        default="0",
        help="Device: 0, 0,1, cpu (default: 0)"
    )
    
    # Optimization
    parser.add_argument(
        "--lr0",
        type=float,
        default=0.01,
        help="Initial learning rate (default: 0.01)"
    )
    parser.add_argument(
        "--patience",
        type=int,
        default=50,
        help="Early stopping patience (default: 50)"
    )
    
    # Augmentation
    parser.add_argument(
        "--augment",
        action="store_true",
        default=True,
        help="Enable augmentation"
    )
    parser.add_argument(
        "--mosaic",
        type=float,
        default=1.0,
        help="Mosaic probability (default: 1.0)"
    )
    
    # Output
    parser.add_argument(
        "--project",
        type=str,
        default="runs/train",
        help="Project directory"
    )
    parser.add_argument(
        "--name",
        type=str,
        default=None,
        help="Experiment name"
    )
    
    # Other
    parser.add_argument(
        "--workers",
        type=int,
        default=8,
        help="Number of dataloader workers"
    )
    parser.add_argument(
        "--cache",
        action="store_true",
        help="Cache images in RAM"
    )
    parser.add_argument(
        "--pretrained",
        action="store_true",
        default=True,
        help="Use pretrained weights"
    )
    
    return parser.parse_args()


def main():
    args = parse_args()
    
    try:
        from ultralytics import YOLO
    except ImportError:
        print("Error: ultralytics not installed.")
        print("Run: pip install ultralytics")
        sys.exit(1)
    
    print("=" * 60)
    print("QAZGOST AI - YOLOv8 Training")
    print("=" * 60)
    
    # Generate experiment name
    if args.name is None:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        args.name = f"construction_{timestamp}"
    
    print(f"\nExperiment: {args.name}")
    print(f"Model: {args.model}")
    print(f"Dataset: {args.data}")
    print(f"Epochs: {args.epochs}")
    print(f"Batch size: {args.batch}")
    print(f"Image size: {args.imgsz}")
    print(f"Device: {args.device}")
    print()
    
    # Load model
    if args.resume:
        print(f"Resuming from: {args.resume}")
        model = YOLO(args.resume)
    else:
        print(f"Loading base model: {args.model}")
        model = YOLO(args.model)
    
    # Verify dataset
    data_path = Path(args.data)
    if not data_path.exists():
        print(f"Error: Dataset not found: {data_path}")
        print("\nPlease create dataset structure:")
        print("  data/")
        print("  ├── dataset.yaml")
        print("  ├── train/")
        print("  │   ├── images/")
        print("  │   └── labels/")
        print("  ├── valid/")
        print("  │   ├── images/")
        print("  │   └── labels/")
        print("  └── test/")
        print("      ├── images/")
        print("      └── labels/")
        sys.exit(1)
    
    # Train
    print("\nStarting training...")
    print("-" * 60)
    
    results = model.train(
        data=str(data_path),
        epochs=args.epochs,
        batch=args.batch,
        imgsz=args.imgsz,
        device=args.device,
        
        # Learning rate
        lr0=args.lr0,
        lrf=0.01,  # Final learning rate ratio
        
        # Early stopping
        patience=args.patience,
        
        # Augmentation
        augment=args.augment,
        mosaic=args.mosaic,
        mixup=0.0,
        copy_paste=0.0,
        
        # Other
        workers=args.workers,
        cache=args.cache,
        pretrained=args.pretrained,
        
        # Output
        project=args.project,
        name=args.name,
        exist_ok=True,
        
        # Metrics
        save=True,
        save_period=10,
        val=True,
        plots=True,
        
        # Hardware
        amp=True,  # Automatic Mixed Precision
    )
    
    print("-" * 60)
    print("\nTraining complete!")
    
    # Print results
    print(f"\nBest model: {args.project}/{args.name}/weights/best.pt")
    print(f"Last model: {args.project}/{args.name}/weights/last.pt")
    
    # Validate
    print("\nRunning validation on best model...")
    best_model = YOLO(f"{args.project}/{args.name}/weights/best.pt")
    metrics = best_model.val()
    
    print(f"\nValidation Results:")
    print(f"  mAP50: {metrics.box.map50:.4f}")
    print(f"  mAP50-95: {metrics.box.map:.4f}")
    print(f"  Precision: {metrics.box.mp:.4f}")
    print(f"  Recall: {metrics.box.mr:.4f}")
    
    # Export to production
    print("\nExporting model to models/ directory...")
    export_path = Path("models/yolov8_construction.pt")
    export_path.parent.mkdir(exist_ok=True)
    
    import shutil
    shutil.copy(
        f"{args.project}/{args.name}/weights/best.pt",
        export_path
    )
    print(f"Exported: {export_path}")
    
    print("\n" + "=" * 60)
    print("Training pipeline complete!")
    print("=" * 60)


if __name__ == "__main__":
    main()
