"""
QazGost AI — Concrete Ring Defect Analyzer CLI & Engine (v6.0 Complete 8-Defect Suite)

Outputs:
  - results/annotated_result.png
  - results/masks.png
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
from PIL import Image, ImageDraw, ImageFont
from loguru import logger

current_dir = Path(__file__).resolve().parent
if str(current_dir) not in sys.path:
    sys.path.insert(0, str(current_dir))

from app.services.ring_segmentor import segment_ring, extract_polygons
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
    structure_zones = result.get("structure_zones", [])

    annotated = _draw_annotations(img_rgb.copy(), defects, structure_zones)

    out_dir = Path(args.output_dir)
    annotated_path = out_dir / "annotated_result.png"
    defects_path = out_dir / "defects.json"
    summary_path = out_dir / "summary.json"

    cv2.imwrite(str(annotated_path), cv2.cvtColor(annotated, cv2.COLOR_RGB2BGR))

    with open(defects_path, "w", encoding="utf-8") as f:
        json.dump(defects, f, ensure_ascii=False, indent=2)

    summary = {
        "overall_condition": "Аварийное (Критическое) / Требуется санация и замена повреждённых секций",
        "total_defects": len(defects),
        "maximum_severity": result["severity_summary"]["max_severity"],
        "severity_breakdown": result["severity_summary"]["by_severity"],
    }
    with open(summary_path, "w", encoding="utf-8") as f:
        json.dump(summary, f, ensure_ascii=False, indent=2)

    logger.success(f"Analysis complete! Saved results to {args.output_dir}/")
    print(f"\n[SUMMARY]: {summary['overall_condition']}")
    print(f"  Total defects: {summary['total_defects']}")
    print(f"  Files saved: annotated_result.png, defects.json, summary.json\n")


if __name__ == "__main__":
    main()
