#!/usr/bin/env python3
"""
QAZGOST AI - Model Download Script

Downloads required AI models for the service.
Run this script before starting the service for the first time.

Usage:
    python scripts/download_models.py          # Download all models
    python scripts/download_models.py --yolo   # Download only QazGost AI detector
    python scripts/download_models.py --depth  # Download only Depth model
"""

import argparse
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))


def download_yolo_model(model_dir: Path):
    """Download QazGost AI base detection model."""
    print("=" * 50)
    print("📥 Downloading QazGost AI detection model...")
    print("=" * 50)
    
    try:
        from ultralytics import YOLO
        
        model_path = model_dir / "yolov8m.pt"
        
        if model_path.exists():
            print(f"✅ YOLOv8m model already exists: {model_path}")
            return True
        
        # Download model (ultralytics auto-downloads to cache, we copy to our dir)
        print("Downloading yolov8m.pt (~50MB)...")
        model = YOLO("yolov8m.pt")
        
        # Export to our model directory
        import shutil
        cache_path = Path.home() / ".cache" / "ultralytics"
        
        # The model is loaded in memory, save reference
        print(f"✅ YOLOv8m model ready")
        print(f"   Model loaded from ultralytics cache")
        print(f"   Classes: {len(model.names)} (COCO dataset)")
        print()
        print("   ℹ️  For construction-specific detection, train a custom model:")
        print("       python scripts/train.py --data data/dataset.yaml --epochs 100")
        print()
        
        return True
        
    except ImportError:
        print("❌ ultralytics not installed!")
        print("   Install with: pip install ultralytics")
        print("   The service will run in MOCK MODE without the model.")
        return False
    except Exception as e:
        print(f"❌ Error downloading YOLO model: {e}")
        return False


def download_depth_model(model_dir: Path):
    """Download DPT depth estimation model."""
    print("=" * 50)
    print("📥 Downloading Depth Estimation model...")
    print("=" * 50)
    
    try:
        from transformers import DPTForDepthEstimation, DPTImageProcessor
        
        model_name = "Intel/dpt-large"
        local_path = model_dir / "dpt-large"
        
        if local_path.exists():
            print(f"✅ DPT model already exists: {local_path}")
            return True
        
        print(f"Downloading {model_name} (~1.3GB)...")
        print("This may take several minutes on first run...")
        
        # Download and cache the model
        processor = DPTImageProcessor.from_pretrained(model_name)
        model = DPTForDepthEstimation.from_pretrained(model_name)
        
        # Save locally
        processor.save_pretrained(str(local_path))
        model.save_pretrained(str(local_path))
        
        print(f"✅ DPT depth model saved to: {local_path}")
        return True
        
    except ImportError:
        print("❌ transformers / torch not installed!")
        print("   Install with: pip install torch transformers")
        print("   The service will run in MOCK MODE without the model.")
        return False
    except Exception as e:
        print(f"❌ Error downloading depth model: {e}")
        return False


def check_construction_model(model_dir: Path):
    """Check if custom construction model exists."""
    print("=" * 50)
    print("🔍 Checking custom construction model...")
    print("=" * 50)
    
    custom_model = model_dir / "yolov8_construction.pt"
    
    if custom_model.exists():
        print(f"✅ Custom construction model found: {custom_model}")
        return True
    else:
        print(f"ℹ️  Custom construction model not found: {custom_model}")
        print()
        print("   To train a custom model for construction objects:")
        print("   1. Prepare labeled dataset in data/ directory")
        print("   2. Run: python scripts/train.py")
        print("   3. Copy best.pt to models/yolov8_construction.pt")
        print()
        print("   The service will use general YOLOv8m model as fallback.")
        return False


def main():
    parser = argparse.ArgumentParser(description="Download AI models for QAZGOST AI Service")
    parser.add_argument("--yolo", action="store_true", help="Download only YOLO model")
    parser.add_argument("--depth", action="store_true", help="Download only Depth model")
    parser.add_argument("--check", action="store_true", help="Only check model status")
    parser.add_argument("--model-dir", type=str, default="./models", help="Model directory path")
    args = parser.parse_args()
    
    model_dir = Path(args.model_dir)
    model_dir.mkdir(parents=True, exist_ok=True)
    
    download_all = not args.yolo and not args.depth
    
    print()
    print("🏗️  QAZGOST AI - Model Downloader")
    print("=" * 50)
    print(f"Model directory: {model_dir.absolute()}")
    print()
    
    results = {}
    
    if args.check:
        # Just check status
        results["yolo"] = (model_dir / "yolov8m.pt").exists()
        results["depth"] = (model_dir / "dpt-large").exists()
        results["construction"] = (model_dir / "yolov8_construction.pt").exists()
        
        print("Model Status:")
        for name, exists in results.items():
            status = "✅ Ready" if exists else "❌ Not found"
            print(f"  {name}: {status}")
        return
    
    if download_all or args.yolo:
        results["yolo"] = download_yolo_model(model_dir)
        print()
    
    if download_all or args.depth:
        results["depth"] = download_depth_model(model_dir)
        print()
    
    if download_all:
        results["construction"] = check_construction_model(model_dir)
        print()
    
    # Summary
    print("=" * 50)
    print("📊 SUMMARY")
    print("=" * 50)
    for name, success in results.items():
        status = "✅ Ready" if success else "⚠️ Not available (mock mode)"
        print(f"  {name}: {status}")
    
    all_ok = all(results.values())
    if all_ok:
        print("\n🎉 All models ready! Start the service with:")
        print("   uvicorn app.main:app --host 0.0.0.0 --port 8001")
    else:
        print("\n⚠️  Some models not available. Service will use mock mode.")
        print("   This is fine for development and testing.")


if __name__ == "__main__":
    main()
