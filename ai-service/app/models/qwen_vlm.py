"""
QAZGOST AI - Qwen2.5-VL Wrapper

Converts the "scene passport" (RF-DETR detections + SAM measurements)
into a structured estimate JSON using Qwen2.5-VL.

Runs locally via:
  - transformers + bitsandbytes (GPU, recommended)
  - ollama (CPU fallback: `ollama run qwen2.5-vl:7b`)

License: Qwen2.5-VL — Apache 2.0 (Alibaba Cloud)
"""

import json
import threading
import base64
from io import BytesIO
from pathlib import Path
from typing import List, Optional, Dict, Any
import numpy as np
from loguru import logger

try:
    import requests as _requests
    REQUESTS_AVAILABLE = True
except ImportError:
    REQUESTS_AVAILABLE = False

try:
    import torch
    TORCH_AVAILABLE = True
except ImportError:
    TORCH_AVAILABLE = False

# Qwen2.5-VL via transformers (GPU mode)
try:
    from transformers import Qwen2_5_VLForConditionalGeneration, AutoProcessor
    from qwen_vl_utils import process_vision_info
    QWEN_TRANSFORMERS_AVAILABLE = True
except ImportError:
    QWEN_TRANSFORMERS_AVAILABLE = False

from app.config import settings


# ─────────────────────────────────────────────
# Prompts
# ─────────────────────────────────────────────

SCENE_PASSPORT_PROMPT = """Ты — строительный эксперт и сметчик.
Тебе дан "паспорт сцены" (результат компьютерного зрения: обнаруженные объекты, площади, объёмы)
и оригинальное фото строительного объекта.

ПАСПОРТ СЦЕНЫ:
{scene_passport}

Верни ТОЛЬКО валидный JSON (без markdown, без пояснений):
{{
  "objectType": "<foundation_strip|foundation_slab|foundation_pile|wall_brick|wall_block|roof_flat|roof_gable|slab|floor_screed|generic>",
  "confidence": <0-100>,
  "signals": ["<наблюдение 1>", "<наблюдение 2>", "<до 5 наблюдений на русском>"],
  "dimensions_estimate": {{
    "perimeter_m": <число или null>,
    "area_m2": <число или null>,
    "height_m": <число или null>,
    "width_m": <число или null>,
    "depth_m": <число или null>
  }},
  "defects": [
    {{"name": "<название дефекта>", "severity": "<low|medium|high>", "description": "<до 60 символов>"}}
  ],
  "materials_seen": ["<материал 1>", "<материал 2>"],
  "missing_photos": ["<что доснять для уточнения сметы>"],
  "scene_description": "<краткое описание сцены в 1-2 предложениях на русском>"
}}"""

# Прямой анализ фото без паспорта (используется когда RF-DETR в mock-режиме)
DIRECT_VISUAL_PROMPT = """Ты — строительный эксперт и сметчик в Казахстане.
Посмотри внимательно на это фото строительного объекта и определи:
- Что именно изображено (тип объекта)
- Размеры (оцени по видимым пропорциям)
- Используемые материалы
- Дефекты и проблемы

Верни ТОЛЬКО валидный JSON (без markdown, без пояснений):
{{
  "objectType": "<foundation_strip|foundation_slab|foundation_pile|wall_brick|wall_block|roof_flat|roof_gable|slab|floor_screed|trench|pipe|generic>",
  "confidence": <0-100>,
  "signals": ["<что именно видно на фото — до 5 конкретных наблюдений на русском>"],
  "dimensions_estimate": {{
    "perimeter_m": <визуальная оценка или null>,
    "area_m2": <визуальная оценка или null>,
    "height_m": <визуальная оценка или null>,
    "width_m": <визуальная оценка или null>,
    "depth_m": <визуальная оценка или null>
  }},
  "defects": [
    {{"name": "<дефект>", "severity": "<low|medium|high>", "description": "<описание до 60 символов>"}}
  ],
  "materials_seen": ["<материал на фото>"],
  "missing_photos": ["<какие дополнительные фото нужны для точного расчёта>"],
  "scene_description": "<1-2 предложения: что изображено на фото, этап строительства>"
}}"""

OBJECT_TYPE_MAP = {
    "foundation": "foundation_strip",
    "trench":     "foundation_strip",
    "pit":        "foundation_slab",
    "wall_brick": "wall_brick",
    "wall_block": "wall_block",
    "pile":       "foundation_pile",
    "concrete_slab": "slab",
    "rebar":      "foundation_strip",  # rebar → likely foundation context
    "formwork":   "foundation_strip",
    "waterproofing": "foundation_strip",
    "insulation": "wall_brick",
    "gravel_bed": "foundation_strip",
    "sand_bed":   "foundation_strip",
    "pipe_pvc":   "generic",
    "pipe_hdpe":  "generic",
    "pipe_metal": "generic",
    "manhole":    "generic",
}


def _build_scene_passport(detections: List[Any], measurements: Dict) -> str:
    """Convert detections + measurements into a human-readable passport string."""
    lines = []
    for det in detections:
        name = getattr(det, "class_name", "unknown")
        conf_pct = round(getattr(det, "confidence", 0) * 100)
        area = getattr(det, "area_m2", None)
        vol  = getattr(det, "volume_m3", None)
        w    = getattr(det, "width_m", None)
        h    = getattr(det, "height_m", None)

        parts = [f"- {name} (уверенность {conf_pct}%)"]
        if area:
            parts.append(f"площадь {area:.1f} м²")
        if vol:
            parts.append(f"объём {vol:.2f} м³")
        if w and h:
            parts.append(f"размер {w:.1f}×{h:.1f} м")
        lines.append(", ".join(parts))

    if not lines:
        lines.append("Объекты не обнаружены — требуется ручная классификация")

    return "\n".join(lines)


def _infer_type_from_detections(detections: List[Any]) -> str:
    """Heuristic fallback when LLM is unavailable."""
    if not detections:
        return "generic"
    # Pick highest-confidence detection that maps to a type
    for det in sorted(detections, key=lambda d: getattr(d, "confidence", 0), reverse=True):
        mapped = OBJECT_TYPE_MAP.get(getattr(det, "class_name", ""), None)
        if mapped:
            return mapped
    return "generic"


# Typical dimension ranges by object type (for mock estimates)
_MOCK_DIMENSIONS = {
    "foundation_strip": {"area_m2": 25.0, "height_m": 0.8, "depth_m": 0.5, "perimeter_m": 32.0},
    "foundation_slab":  {"area_m2": 80.0, "height_m": 0.3, "depth_m": 0.3, "perimeter_m": 36.0},
    "foundation_pile":  {"area_m2": 4.0,  "height_m": 6.0, "depth_m": 0.4, "perimeter_m": 1.3},
    "wall_brick":       {"area_m2": 15.0, "height_m": 3.0, "depth_m": 0.38, "perimeter_m": 20.0},
    "wall_block":       {"area_m2": 20.0, "height_m": 3.0, "depth_m": 0.2, "perimeter_m": 24.0},
    "roof_flat":        {"area_m2": 120.0, "height_m": 0.2, "depth_m": 0.2, "perimeter_m": 44.0},
    "roof_gable":       {"area_m2": 80.0, "height_m": 2.5, "depth_m": 0.15, "perimeter_m": 36.0},
    "slab":             {"area_m2": 60.0, "height_m": 0.2, "depth_m": 0.2, "perimeter_m": 32.0},
    "floor_screed":     {"area_m2": 50.0, "height_m": 0.05, "depth_m": 0.05, "perimeter_m": 28.0},
    "generic":          {"area_m2": 10.0, "height_m": 1.0, "depth_m": 0.3, "perimeter_m": 14.0},
}

# Common materials for each object type
_MOCK_MATERIALS = {
    "foundation_strip": ["бетон М300", "арматура Ø12", "песок", "щебень"],
    "foundation_slab":  ["бетон М350", "арматура Ø16", "гидроизоляция"],
    "wall_brick":       ["кирпич М150", "раствор М100", "сетка кладочная"],
    "wall_block":       ["газобетонные блоки", "клей для блоков", "арматура Ø8"],
    "roof_flat":        ["рулонная кровля", "праймер", "утеплитель"],
    "roof_gable":       ["металлочерепица", "обрешётка", "гидропароизоляция"],
    "slab":             ["бетон М300", "арматура Ø14", "опалубка"],
    "floor_screed":     ["цементно-песчаная смесь", "демпферная лента"],
    "generic":          ["бетон", "арматура"],
}


def _mock_result(detections: List[Any]) -> Dict[str, Any]:
    """Mock LLM result when Qwen is unavailable — enriched with typical dimensions."""
    obj_type = _infer_type_from_detections(detections)
    names = [getattr(d, "class_name", "") for d in detections[:3]]

    dims = _MOCK_DIMENSIONS.get(obj_type, _MOCK_DIMENSIONS["generic"])
    mats = _MOCK_MATERIALS.get(obj_type, _MOCK_MATERIALS["generic"])

    return {
        "objectType":  obj_type,
        "confidence":  72,
        "signals": [
            f"Обнаружен объект: {n}" for n in names if n
        ] or ["Автоматическая классификация по пикселям"],
        "dimensions_estimate": {
            "perimeter_m": dims.get("perimeter_m"),
            "area_m2":     dims.get("area_m2"),
            "height_m":    dims.get("height_m"),
            "width_m":     None,
            "depth_m":     dims.get("depth_m"),
        },
        "defects": [],
        "materials_seen": mats,
        "missing_photos": [
            "Общий вид объекта с угла",
            "Боковая грань для определения высоты",
        ],
        "scene_description": (
            f"Строительный объект: {obj_type.replace('_', ' ')} "
            f"(автоматическая классификация, mock). "
            "Для точного анализа установите Qwen2.5-VL: "
            "ollama pull qwen2.5-vl:7b"
        ),
        "_mock": True,
    }


# ─────────────────────────────────────────────
# Qwen2.5-VL Client
# ─────────────────────────────────────────────

class QwenVLM:
    """
    Qwen2.5-VL inference client.

    Priority:
      1. Local transformers (GPU) — highest quality
      2. Ollama HTTP API (CPU, ollama run qwen2.5vl:7b)
      3. Mock result (no model available)
    """

    OLLAMA_URL = "http://localhost:11434/api/generate"
    OLLAMA_MODEL = "qwen2.5vl:7b"
    HF_MODEL_ID  = "Qwen/Qwen2.5-VL-7B-Instruct"

    def __init__(self, device: Optional[str] = None):
        self.device = device or settings.get_device()
        self._mode = "mock"
        self._model = None
        self._processor = None
        self._lock = threading.Lock()
        self._init()

    def _init(self):
        # Try transformers first
        if QWEN_TRANSFORMERS_AVAILABLE and TORCH_AVAILABLE:
            weights = settings.get_model_path("qwen2.5-vl-7b")
            if weights.exists():
                self._load_transformers(weights)
                return

        # Try ollama
        if REQUESTS_AVAILABLE and self._ollama_alive():
            logger.info("[Qwen] Using Ollama backend")
            self._mode = "ollama"
            return

        logger.warning("[Qwen] No backend available — using mock LLM analysis")
        self._mode = "mock"

    def _ollama_alive(self) -> bool:
        """Check if Ollama is running AND has a Qwen VLM model."""
        try:
            import requests
            r = requests.get("http://localhost:11434/api/tags", timeout=2)
            if r.status_code != 200:
                return False
            # Check if qwen model is available
            models = r.json().get("models", [])
            model_names = [m.get("name", "") for m in models]
            has_qwen = any("qwen" in n.lower() and "vl" in n.lower() for n in model_names)
            if not has_qwen:
                logger.info(
                    "[Qwen] Ollama is running but no VLM model found. "
                    "Install with: ollama pull qwen2.5vl:7b"
                )
                return False
            logger.info(f"[Qwen] Ollama VLM model found: {[n for n in model_names if 'qwen' in n.lower()]}")
            return True
        except Exception:
            return False

    def _load_transformers(self, weights_path: Path):
        try:
            logger.info(f"[Qwen] Loading transformers model from {weights_path}")
            self._model = Qwen2_5_VLForConditionalGeneration.from_pretrained(
                str(weights_path),
                torch_dtype="auto",
                device_map="auto",
            )
            self._processor = AutoProcessor.from_pretrained(str(weights_path))
            self._mode = "transformers"
            logger.info("[Qwen] ✅ Transformers model loaded")
        except Exception as exc:
            logger.error(f"[Qwen] Transformers load failed: {exc}")

    # ── Public API ────────────────────────────────────────────────────────────

    def analyze(
        self,
        image: np.ndarray,
        detections: List[Any],
        measurements: Dict,
        use_direct_prompt: bool = False,
    ) -> Dict[str, Any]:
        """
        Analyze construction photo.

        Args:
            image:             RGB numpy array
            detections:        RF-DETR detections (empty or mock)
            measurements:      aggregated measurements dict
            use_direct_prompt: if True — ask Qwen to analyze photo visually
                               (used when RF-DETR is in mock mode)

        Returns:
            Dict with objectType, confidence, signals, etc.
        """
        if use_direct_prompt or not detections:
            # Direct visual analysis — Qwen sees only the photo
            prompt = DIRECT_VISUAL_PROMPT
        else:
            passport = _build_scene_passport(detections, measurements)
            prompt = SCENE_PASSPORT_PROMPT.format(scene_passport=passport)

        if self._mode == "transformers":
            return self._infer_transformers(image, prompt)
        elif self._mode == "ollama":
            return self._infer_ollama(image, prompt)
        else:
            return _mock_result(detections)

    # ── backends ──────────────────────────────────────────────────────────────

    def _infer_transformers(self, image: np.ndarray, prompt: str) -> Dict[str, Any]:
        try:
            from PIL import Image as PILImage
            pil_img = PILImage.fromarray(image.astype(np.uint8))

            messages = [{
                "role": "user",
                "content": [
                    {"type": "image", "image": pil_img},
                    {"type": "text",  "text": prompt},
                ],
            }]

            text = self._processor.apply_chat_template(
                messages, tokenize=False, add_generation_prompt=True
            )
            image_inputs, video_inputs = process_vision_info(messages)
            inputs = self._processor(
                text=[text],
                images=image_inputs,
                videos=video_inputs,
                padding=True,
                return_tensors="pt",
            ).to(self._model.device)

            with threading.Lock():
                generated_ids = self._model.generate(**inputs, max_new_tokens=512)
            trimmed = [
                out[len(inp):]
                for inp, out in zip(inputs.input_ids, generated_ids)
            ]
            response = self._processor.batch_decode(
                trimmed, skip_special_tokens=True, clean_up_tokenization_spaces=False
            )[0]

            return self._parse_json(response)

        except Exception as exc:
            logger.error(f"[Qwen/transformers] Inference error: {exc}")
            return _mock_result([])

    def _infer_ollama(self, image: np.ndarray, prompt: str) -> Dict[str, Any]:
        try:
            import requests
            from PIL import Image as PILImage

            pil_img = PILImage.fromarray(image.astype(np.uint8))

            # Resize large images to speed up VLM inference
            max_dim = 1024
            if max(pil_img.size) > max_dim:
                pil_img.thumbnail((max_dim, max_dim), PILImage.LANCZOS)

            buf = BytesIO()
            pil_img.save(buf, format="JPEG", quality=80)
            img_b64 = base64.b64encode(buf.getvalue()).decode()

            payload = {
                "model":  self.OLLAMA_MODEL,
                "prompt": prompt,
                "images": [img_b64],
                "stream": False,
                "options": {"temperature": 0.1, "num_predict": 512},
            }
            # VLM 7B needs 90-120s for first inference (model loading)
            r = requests.post(self.OLLAMA_URL, json=payload, timeout=180)
            r.raise_for_status()
            text = r.json().get("response", "")
            logger.info(f"[Qwen/ollama] Inference OK, response length: {len(text)}")
            return self._parse_json(text)

        except Exception as exc:
            logger.error(f"[Qwen/ollama] Inference error: {exc}")
            return _mock_result([])

    def _parse_json(self, text: str) -> Dict[str, Any]:
        """Extract and parse JSON from LLM response."""
        # Handle ```json ... ``` blocks
        if "```" in text:
            parts = text.split("```")
            for part in parts:
                part = part.strip()
                if part.startswith("json"):
                    part = part[4:].strip()
                if part.startswith("{"):
                    text = part
                    break

        # Find first {...} block
        start = text.find("{")
        end   = text.rfind("}") + 1
        if start == -1 or end == 0:
            logger.warning("[Qwen] No JSON found in response")
            return _mock_result([])

        try:
            result = json.loads(text[start:end])
            # Validate required fields
            if "objectType" not in result:
                result["objectType"] = "generic"
            if "confidence" not in result:
                result["confidence"] = 60
            return result
        except json.JSONDecodeError as exc:
            logger.warning(f"[Qwen] JSON parse error: {exc}")
            return _mock_result([])


# ─────────────────────────────────────────────
# Thread-safe singleton
# ─────────────────────────────────────────────

_qwen_instance: Optional[QwenVLM] = None
_qwen_lock = threading.Lock()


def get_qwen() -> QwenVLM:
    global _qwen_instance
    if _qwen_instance is None:
        with _qwen_lock:
            if _qwen_instance is None:
                logger.info("Creating QwenVLM singleton...")
                _qwen_instance = QwenVLM()
    return _qwen_instance
