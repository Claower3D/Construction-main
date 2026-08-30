"""
QazGost AI — Pure Dynamic Concrete Ring Defect Analyzer CLI & Engine (v7.0)

Usage:
  python detect_ring_defects.py --input path/to/image.jpg --output-dir results --confidence 0.35

Outputs:
  - results/annotated_result.png
  - results/defects.json
  - results/summary.json
"""

import os
import sys
import json
import argparse
from pathlib import Path
from typing import Dict, Any, List, Tuple
import cv2
import numpy as np
from loguru import logger

current_dir = Path(__file__).resolve().parent
if str(current_dir) not in sys.path:
    sys.path.insert(0, str(current_dir))

from app.services.cv_defect_scanner import scan_defects, _draw_annotations


def load_image(image_path: str) -> np.ndarray:
    if not os.path.exists(image_path):
        raise FileNotFoundError(f"Input image not found: {image_path}")
    img_bgr = cv2.imread(image_path)
    if img_bgr is None:
        raise ValueError(f"Could not decode image at: {image_path}")
    return img_bgr


def main():
    parser = argparse.ArgumentParser(description="Automated Concrete Ring Defect Analyzer")
    parser.add_argument("--input", "-i", required=True, help="Path to input photo of concrete ring or pipe")
    parser.add_argument("--output-dir", "-o", default="results", help="Directory to save analysis results")
    parser.add_argument("--confidence", "-c", type=float, default=0.35, help="Confidence threshold")
    args = parser.parse_args()

    os.makedirs(args.output_dir, exist_ok=True)
    logger.info(f"Loading image from: {args.input}")

    img_bgr = load_image(args.input)
    img_rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)

    result = scan_defects(img_rgb, sensitivity=args.confidence)
    defects = result["defects"]

    out_dir = Path(args.output_dir)
    annotated_path = out_dir / "annotated_result.png"
    defects_path = out_dir / "defects.json"
    summary_path = out_dir / "summary.json"

    # Decode base64 annotated image and save
    import base64
    b64_data = result["annotated_image"].split(",")[1] if "," in result["annotated_image"] else result["annotated_image"]
    with open(annotated_path, "wb") as f:
        f.write(base64.b64decode(b64_data))

    with open(defects_path, "w", encoding="utf-8") as f:
        json.dump(defects, f, ensure_ascii=False, indent=2)

    with open(summary_path, "w", encoding="utf-8") as f:
        json.dump(result["severity_summary"], f, ensure_ascii=False, indent=2)

    logger.success(f"Dynamic analysis complete! Saved {len(defects)} defects to {args.output_dir}/")
    print(f"\n[DYNAMIC SUMMARY]: Found {len(defects)} defects")
    for d in defects:
        print(f"  #{d['id']} {d['type']} ({d['severity']}): {d['bbox']}")


if __name__ == "__main__":
    main()
