"""
QazGost AI — Roboflow Direct Cloud & Local Inference Client

Supports:
  - Prompt-guided & Object Detection via Roboflow Hosted API
  - Direct Image Upload + Model Prediction Parsing (Bounding Boxes, Polygons, Defect Classes)
  - Automatic fallback if Roboflow API key is not configured
"""

import os
import io
import cv2
import requests
import numpy as np
from typing import List, Dict, Any, Optional
from loguru import logger
from PIL import Image

from app.config import settings

# Default public construction defect model or custom user model
DEFAULT_ROBOFLOW_MODEL = os.getenv("ROBOFLOW_MODEL_ID", "concrete-crack-detection-bwt96/1")
ROBOFLOW_API_KEY = os.getenv("ROBOFLOW_API_KEY", "")


class RoboflowDefectDetector:
    """Direct Roboflow Inference API Connector."""

    def __init__(self, api_key: Optional[str] = None, model_id: Optional[str] = None):
        self.api_key = api_key or ROBOFLOW_API_KEY or getattr(settings, "ROBOFLOW_API_KEY", "")
        self.model_id = model_id or DEFAULT_ROBOFLOW_MODEL
        self.endpoint = f"https://detect.roboflow.com/{self.model_id}"

    def is_configured(self) -> bool:
        return bool(self.api_key)

    def infer(self, image_np: np.ndarray, confidence: float = 0.35, prompt: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Send image to Roboflow Inference API.
        """
        if not self.is_configured():
            logger.warning("[Roboflow] ROBOFLOW_API_KEY not set. Falling back to dynamic CV.")
            return []

        try:
            h, w = image_np.shape[:2]
            # Encode image to JPEG
            is_success, buffer = cv2.imencode(".jpg", cv2.cvtColor(image_np, cv2.COLOR_RGB2BGR))
            if not is_success:
                return []

            params = {
                "api_key": self.api_key,
                "confidence": confidence,
            }
            if prompt:
                params["prompt"] = prompt

            logger.info(f"[Roboflow] Sending inference request to model: {self.model_id} (prompt='{prompt}')")
            response = requests.post(
                self.endpoint,
                params=params,
                files={"file": ("image.jpg", io.BytesIO(buffer), "image/jpeg")},
                timeout=15,
            )

            if response.status_code != 200:
                logger.error(f"[Roboflow] API error {response.status_code}: {response.text}")
                return []

            data = response.json()
            predictions = data.get("predictions", [])
            logger.info(f"[Roboflow] Received {len(predictions)} predictions from model")

            parsed_defects = []
            for idx, p in enumerate(predictions):
                # Roboflow returns x, y (center) and width, height
                cx, cy = p.get("x", 0), p.get("y", 0)
                bw, bh = p.get("width", 0), p.get("height", 0)
                cls_name = p.get("class", "defect")
                conf = float(p.get("confidence", 0.8))

                x1 = max(0, int(cx - bw / 2))
                y1 = max(0, int(cy - bh / 2))
                x2 = min(w, int(cx + bw / 2))
                y2 = min(h, int(cy + bh / 2))

                # Points / Polygon if segmentation model
                points = p.get("points", [])
                if points:
                    poly = [[int(pt["x"]), int(pt["y"])] for pt in points]
                else:
                    poly = [[x1, y1], [x2, y1], [x2, y2], [x1, y2]]

                # Map class to Russian defect label
                cls_lower = cls_name.lower()
                if "crack" in cls_lower or "fracture" in cls_lower:
                    dtype = "Крупный разлом / сквозная трещина" if max(bw, bh) > 100 else "Тонкая трещина"
                    sev = "critical" if "Крупный" in dtype else "high"
                elif "spall" in cls_lower or "chip" in cls_lower:
                    dtype = "Скол кромки"
                    sev = "high"
                elif "cavity" in cls_lower or "pitting" in cls_lower or "hole" in cls_lower:
                    dtype = "Раковина / каверна"
                    sev = "medium"
                else:
                    dtype = "Дефект строительной конструкции"
                    sev = "medium"

                parsed_defects.append({
                    "id": idx + 1,
                    "bbox": [x1, y1, x2, y2],
                    "polygon": poly,
                    "type": dtype,
                    "defect_type": "major_crack" if "Крупный" in dtype else "spalling",
                    "severity": sev,
                    "confidence": round(conf, 2),
                    "area": int(bw * bh * 0.7),
                    "area_percent": round(((bw * bh * 0.7) / (w * h)) * 100, 2),
                    "description": f"Roboflow: {cls_name} ({dtype}) — {int(bw)}×{int(bh)}px, уверенность {int(conf*100)}%",
                })

            return parsed_defects

        except Exception as exc:
            logger.error(f"[Roboflow] Inference failed: {exc}")
            return []


# Global singleton
_roboflow_client: Optional[RoboflowDefectDetector] = None

def get_roboflow_detector() -> RoboflowDefectDetector:
    global _roboflow_client
    if _roboflow_client is None:
        _roboflow_client = RoboflowDefectDetector()
    return _roboflow_client
