# 🤖 ФАЗА 2: AI-Ядро (Компьютерное зрение)

> **Срок:** Недели 5-10  
> **Статус:** 🔵 Планируется  
> **Приоритет:** P0 (Critical)

---

## 📋 Обзор фазы

Цель второй фазы — создать AI-бекенд для автоматического анализа фотографий:

1. **Object Detection** — распознавание объектов (YOLOv8)
2. **Depth Estimation** — оценка глубины и размеров
3. **Volume Calculation** — расчёт объёмов
4. **Auto-Estimation** — автоматический подбор работ и материалов

---

## 🏗️ Архитектура AI-сервиса

```
┌─────────────────────────────────────────────────────────────────┐
│                     AI BACKEND (FastAPI)                         │
│                                                                   │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐          │
│  │   Upload    │───▶│  Detection  │───▶│  Analysis   │          │
│  │   Handler   │    │   (YOLO)    │    │   Engine    │          │
│  └─────────────┘    └─────────────┘    └─────────────┘          │
│         │                  │                  │                  │
│         ▼                  ▼                  ▼                  │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐          │
│  │   Image     │    │   Depth     │    │   LLM       │          │
│  │ Preprocessing│    │  Estimator  │    │ (GPT-4)    │          │
│  └─────────────┘    └─────────────┘    └─────────────┘          │
│                            │                  │                  │
│                            ▼                  ▼                  │
│                     ┌─────────────┐    ┌─────────────┐          │
│                     │   Volume    │    │  Estimate   │          │
│                     │ Calculator  │    │ Generator   │          │
│                     └─────────────┘    └─────────────┘          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                       ┌─────────────┐
                       │   Redis     │
                       │   Queue     │
                       └─────────────┘
```

---

## 🗓️ Sprint 2.1: Object Detection (Неделя 5-6)

### Задачи

#### 2.1.1 AI Microservice Setup

**Оценка:** 2 дня

**Структура:**

```
ai-service/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI app
│   ├── config.py            # Settings
│   ├── models/
│   │   ├── detector.py      # YOLO wrapper
│   │   ├── depth.py         # Depth estimator
│   │   └── llm.py           # LLM client
│   ├── services/
│   │   ├── analyzer.py      # Main analyzer
│   │   ├── volume.py        # Volume calculator
│   │   └── estimator.py     # Auto-estimator
│   ├── api/
│   │   ├── v1/
│   │   │   ├── analyze.py   # /analyze endpoint
│   │   │   └── health.py    # Health check
│   │   └── deps.py
│   └── utils/
│       ├── image.py         # Image utils
│       └── geometry.py      # Geometry utils
├── models/                   # ML model files
│   ├── yolov8_construction.pt
│   └── midas_depth.pt
├── tests/
├── requirements.txt
└── Dockerfile
```

**Docker:**

```dockerfile
FROM nvidia/cuda:11.8-cudnn8-runtime-ubuntu22.04

WORKDIR /app

# Install Python
RUN apt-get update && apt-get install -y python3.10 python3-pip

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy app
COPY . .

# Download models
RUN python -c "from ultralytics import YOLO; YOLO('yolov8n.pt')"

EXPOSE 8001
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8001"]
```

#### 2.1.2 YOLOv8 Training

**Оценка:** 5 дней

**Классы для детекции:**

```python
CONSTRUCTION_CLASSES = {
    0: "trench",           # Траншея
    1: "pit",              # Котлован
    2: "pipe_pvc",         # Труба ПВХ
    3: "pipe_metal",       # Труба металлическая
    4: "manhole",          # Люк / колодец
    5: "foundation",       # Фундамент
    6: "wall",             # Стена
    7: "pile",             # Свая
    8: "rebar",            # Арматура
    9: "concrete_block",   # Бетонный блок
    10: "gravel_bed",      # Щебёночная подушка
    11: "sand_bed",        # Песчаная подушка
    12: "waterproofing",   # Гидроизоляция
    13: "insulation",      # Утеплитель
    14: "formwork",        # Опалубка
    15: "excavator",       # Экскаватор (для масштаба)
    16: "person",          # Человек (для масштаба)
    17: "measuring_tape",  # Рулетка (калибровка)
}
```

**Датасет:**

- Roboflow: construction dataset
- Custom annotations (500+ images)
- Augmentations: rotate, flip, brightness, blur

**Training:**

```python
from ultralytics import YOLO

# Load base model
model = YOLO('yolov8m.pt')

# Train
results = model.train(
    data='construction.yaml',
    epochs=100,
    imgsz=640,
    batch=16,
    device=0,
    workers=8,
    project='qazgost',
    name='yolov8_construction'
)
```

#### 2.1.3 Detection API

**Оценка:** 2 дня

**Endpoint:**

```python
@router.post("/analyze")
async def analyze_image(
    file: UploadFile = File(...),
    reference_object: Optional[str] = Query(None),  # "person", "tape_1m"
    reference_size: Optional[float] = Query(None),  # size in meters
):
    """
    Analyze construction photo and detect objects.
    
    Returns:
    - detected_objects: list of objects with bounding boxes
    - measurements: estimated dimensions
    - confidence: detection confidence
    """
    
    # Save uploaded file
    image_path = await save_upload(file)
    
    # Run detection
    detections = detector.predict(image_path)
    
    # Calculate scale from reference
    scale = calculate_scale(detections, reference_object, reference_size)
    
    # Estimate dimensions
    measurements = estimate_dimensions(detections, scale)
    
    return AnalysisResult(
        image_id=str(uuid4()),
        detected_objects=detections,
        measurements=measurements,
        scale_factor=scale,
        processing_time_ms=elapsed_ms
    )
```

**Response Schema:**

```python
class DetectedObject(BaseModel):
    class_name: str           # "trench"
    confidence: float         # 0.92
    bbox: List[int]           # [x1, y1, x2, y2]
    segmentation: Optional[List[List[int]]]  # polygon points
    
class Measurement(BaseModel):
    object_id: str
    width_m: Optional[float]
    height_m: Optional[float]
    depth_m: Optional[float]
    area_m2: Optional[float]
    volume_m3: Optional[float]

class AnalysisResult(BaseModel):
    image_id: str
    detected_objects: List[DetectedObject]
    measurements: List[Measurement]
    scale_factor: float
    processing_time_ms: int
```

---

## 🗓️ Sprint 2.2: Depth & Volume (Неделя 7-8)

### Задачи

#### 2.2.1 Depth Estimation Model

**Оценка:** 3 дня

**Модели:**

- **MiDaS** — универсальная, хорошая точность
- **ZoeDepth** — лучше для outdoor
- **Depth Anything** — новая, очень точная

**Implementation:**

```python
import torch
from transformers import DPTForDepthEstimation, DPTImageProcessor

class DepthEstimator:
    def __init__(self, model_name="Intel/dpt-large"):
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.processor = DPTImageProcessor.from_pretrained(model_name)
        self.model = DPTForDepthEstimation.from_pretrained(model_name).to(self.device)
    
    def estimate(self, image: np.ndarray) -> np.ndarray:
        """
        Returns depth map (H x W) with relative depth values.
        """
        inputs = self.processor(images=image, return_tensors="pt").to(self.device)
        
        with torch.no_grad():
            outputs = self.model(**inputs)
            predicted_depth = outputs.predicted_depth
        
        # Interpolate to original size
        depth_map = torch.nn.functional.interpolate(
            predicted_depth.unsqueeze(1),
            size=image.shape[:2],
            mode="bicubic",
            align_corners=False,
        ).squeeze()
        
        return depth_map.cpu().numpy()
```

#### 2.2.2 Calibration System

**Оценка:** 2 дня

**Reference Objects:**

```python
REFERENCE_OBJECTS = {
    "person": {"height_m": 1.75, "width_m": 0.45},
    "excavator_bucket": {"width_m": 1.2},
    "tape_1m": {"length_m": 1.0},
    "pipe_pvc_100": {"diameter_m": 0.1},
    "concrete_block": {"length_m": 0.4, "width_m": 0.2, "height_m": 0.2},
}

def calculate_scale(
    detections: List[Detection],
    reference_type: str,
    known_size: Optional[float] = None
) -> float:
    """
    Calculate pixels-to-meters scale using reference object.
    
    Returns: meters per pixel
    """
    # Find reference object in detections
    ref_detection = find_reference(detections, reference_type)
    if not ref_detection:
        raise ValueError(f"Reference object '{reference_type}' not found")
    
    # Get known size
    if known_size:
        ref_size_m = known_size
    else:
        ref_info = REFERENCE_OBJECTS.get(reference_type)
        ref_size_m = ref_info.get("height_m") or ref_info.get("width_m")
    
    # Calculate scale
    bbox = ref_detection.bbox
    ref_size_px = max(bbox[2] - bbox[0], bbox[3] - bbox[1])
    
    return ref_size_m / ref_size_px
```

#### 2.2.3 Volume Calculator

**Оценка:** 3 дня

**Algorithms:**

```python
class VolumeCalculator:
    
    def calculate_trench_volume(
        self,
        length_m: float,
        width_m: float,
        depth_m: float,
        slope_angle: float = 0  # degrees
    ) -> dict:
        """
        Calculate trench volume with sloped walls.
        
        V = L × (W_top × D + (W_bottom - W_top) × D / 2)
        """
        if slope_angle > 0:
            slope_offset = depth_m * math.tan(math.radians(slope_angle))
            width_bottom = width_m - 2 * slope_offset
        else:
            width_bottom = width_m
        
        # Cross-section area (trapezoid)
        area = (width_m + width_bottom) / 2 * depth_m
        volume = length_m * area
        
        return {
            "length_m": length_m,
            "width_top_m": width_m,
            "width_bottom_m": width_bottom,
            "depth_m": depth_m,
            "cross_section_m2": area,
            "volume_m3": round(volume, 2)
        }
    
    def calculate_pit_volume(
        self,
        shape: str,  # "rectangle", "circle"
        dimensions: dict,
        depth_m: float
    ) -> dict:
        """
        Calculate pit/foundation pit volume.
        """
        if shape == "rectangle":
            length = dimensions["length_m"]
            width = dimensions["width_m"]
            area = length * width
        elif shape == "circle":
            radius = dimensions["diameter_m"] / 2
            area = math.pi * radius ** 2
        else:
            raise ValueError(f"Unknown shape: {shape}")
        
        volume = area * depth_m
        
        return {
            "shape": shape,
            "area_m2": round(area, 2),
            "depth_m": depth_m,
            "volume_m3": round(volume, 2)
        }
    
    def calculate_pipe_volume(
        self,
        length_m: float,
        outer_diameter_m: float,
        wall_thickness_m: float = 0.005
    ) -> dict:
        """
        Calculate pipe material volume.
        """
        outer_radius = outer_diameter_m / 2
        inner_radius = outer_radius - wall_thickness_m
        
        volume = length_m * math.pi * (outer_radius**2 - inner_radius**2)
        
        return {
            "length_m": length_m,
            "outer_diameter_m": outer_diameter_m,
            "inner_diameter_m": inner_radius * 2,
            "volume_m3": round(volume, 4)
        }
```

#### 2.2.4 Volume Module Integration

**Оценка:** 2 дня

Интеграция с существующим модулем `volumeService.js`:

```javascript
// Frontend integration
window.VolumeService.analyzePhoto = async function(imageFile, options) {
    const formData = new FormData();
    formData.append('file', imageFile);
    formData.append('reference_object', options.reference || 'person');
    
    const response = await fetch(`${AI_API_URL}/analyze`, {
        method: 'POST',
        body: formData
    });
    
    const result = await response.json();
    
    // Map AI results to volume calculation
    return this.calculateFromAnalysis(result);
};
```

---

## 🗓️ Sprint 2.3: Auto-Estimation (Неделя 9-10)

### Задачи

#### 2.3.1 Work Selection Algorithm

**Оценка:** 4 дня

**Логика подбора:**

```python
class WorkSelector:
    """
    Automatically selects required work types and materials
    based on detected objects.
    """
    
    # Object → Work mappings
    WORK_MAPPINGS = {
        "trench": [
            {"code": "WORK-TRENCH", "unit": "m3", "multiplier": 1.0},
            {"code": "WORK-BACKFILL", "unit": "m3", "multiplier": 0.8},
        ],
        "pipe_pvc": [
            {"code": "WORK-PIPE-LAY", "unit": "m", "multiplier": 1.0},
            {"code": "MAT-SAND", "unit": "m3", "multiplier": 0.1},  # подсыпка
        ],
        "foundation": [
            {"code": "WORK-EXCAVATION", "unit": "m3", "multiplier": 1.0},
            {"code": "WORK-CONCRETE", "unit": "m3", "multiplier": 1.0},
            {"code": "MAT-REBAR", "unit": "kg", "multiplier": 100},  # 100 kg/m3
        ],
        "pit": [
            {"code": "WORK-EXCAVATION", "unit": "m3", "multiplier": 1.0},
            {"code": "WORK-SLOPE-REINFORCE", "unit": "m2", "multiplier": 0.5},
        ],
    }
    
    def select_works(
        self,
        detected_objects: List[DetectedObject],
        measurements: List[Measurement]
    ) -> List[EstimateItem]:
        """
        Generate estimate items from detected objects.
        """
        items = []
        
        for obj, measure in zip(detected_objects, measurements):
            mappings = self.WORK_MAPPINGS.get(obj.class_name, [])
            
            for mapping in mappings:
                quantity = self._calculate_quantity(measure, mapping)
                
                item = EstimateItem(
                    work_code=mapping["code"],
                    unit=mapping["unit"],
                    quantity=quantity,
                    source="ai_detected",
                    confidence=obj.confidence
                )
                items.append(item)
        
        return self._merge_duplicates(items)
    
    def _calculate_quantity(self, measure: Measurement, mapping: dict) -> float:
        unit = mapping["unit"]
        multiplier = mapping["multiplier"]
        
        if unit == "m3":
            return measure.volume_m3 * multiplier
        elif unit == "m2":
            return measure.area_m2 * multiplier
        elif unit == "m":
            return measure.width_m * multiplier  # assuming length
        elif unit == "kg":
            return measure.volume_m3 * multiplier
        else:
            return 1.0 * multiplier
```

#### 2.3.2 Regional Coefficients

**Оценка:** 2 дня

**Coefficient Engine:**

```python
class CoefficientEngine:
    """
    Apply regional and seasonal coefficients to prices.
    """
    
    # Regional coefficients
    REGIONAL_COEF = {
        "almaty": 1.0,
        "astana": 1.15,
        "shymkent": 0.95,
        "aktau": 1.25,  # remote location
        "ust-kamenogorsk": 1.10,
    }
    
    # Seasonal coefficients
    SEASONAL_COEF = {
        "winter": 1.20,   # Dec-Feb
        "spring": 1.05,   # Mar-May
        "summer": 1.00,   # Jun-Aug
        "autumn": 1.05,   # Sep-Nov
    }
    
    # Complexity coefficients
    COMPLEXITY_COEF = {
        "simple": 1.0,
        "moderate": 1.15,
        "complex": 1.35,
        "very_complex": 1.50,
    }
    
    def calculate_total_coefficient(
        self,
        region: str,
        season: str = None,
        complexity: str = "moderate"
    ) -> float:
        """
        Calculate combined coefficient.
        """
        region_coef = self.REGIONAL_COEF.get(region, 1.0)
        season_coef = self.SEASONAL_COEF.get(season or self._current_season(), 1.0)
        complexity_coef = self.COMPLEXITY_COEF.get(complexity, 1.0)
        
        return region_coef * season_coef * complexity_coef
```

#### 2.3.3 LLM Description Generator

**Оценка:** 3 дня

**Prompt Engineering:**

```python
class DescriptionGenerator:
    """
    Generate human-readable project descriptions using LLM.
    """
    
    SYSTEM_PROMPT = """
    Вы — эксперт по строительным сметам. Ваша задача — генерировать 
    понятные описания проектов и коммерческие предложения на русском языке.
    
    Стиль: профессиональный, но доступный. Избегайте сложных технических терминов,
    объясняйте простым языком.
    """
    
    def generate_project_description(
        self,
        detected_objects: List[dict],
        estimate_items: List[dict],
        total_cost: float
    ) -> str:
        prompt = f"""
        На основе анализа фотографии объекта определены следующие элементы:
        {json.dumps(detected_objects, ensure_ascii=False, indent=2)}
        
        Сформирована смета:
        {json.dumps(estimate_items, ensure_ascii=False, indent=2)}
        
        Общая стоимость: {total_cost:,.0f} ₸
        
        Сгенерируйте:
        1. Краткое описание проекта (2-3 предложения)
        2. Перечень основных работ (списком)
        3. Рекомендации заказчику
        4. Примерные сроки выполнения
        """
        
        response = openai.ChatCompletion.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": self.SYSTEM_PROMPT},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=1000
        )
        
        return response.choices[0].message.content
```

#### 2.3.4 PDF/Excel Generation

**Оценка:** 2 дня

**PDF Template:**

```python
from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Table, Paragraph

class EstimatePDFGenerator:
    
    def generate(self, estimate: Estimate) -> bytes:
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4)
        
        elements = []
        
        # Header
        elements.append(self._create_header(estimate))
        
        # Object info
        elements.append(self._create_object_info(estimate))
        
        # Photo with annotations
        if estimate.photo_url:
            elements.append(self._create_annotated_photo(estimate))
        
        # Items table
        elements.append(self._create_items_table(estimate.items))
        
        # Totals
        elements.append(self._create_totals(estimate))
        
        # AI confidence note
        if estimate.source == "ai":
            elements.append(self._create_ai_note(estimate.confidence))
        
        # Footer
        elements.append(self._create_footer())
        
        doc.build(elements)
        return buffer.getvalue()
```

---

## ✅ Definition of Done

### Sprint 2.1 (Object Detection)

- [ ] AI service running in Docker with GPU
- [ ] YOLOv8 trained on construction images (mAP > 0.7)
- [ ] /analyze endpoint working < 3 sec
- [ ] 15+ object classes detected

### Sprint 2.2 (Depth & Volume)

- [ ] Depth estimation with < 15% error
- [ ] Calibration with reference objects
- [ ] Volume calculations for trenches, pits, pipes
- [ ] Integration with Volume module

### Sprint 2.3 (Auto-Estimation)

- [ ] Automatic work selection from objects
- [ ] Regional coefficients applied
- [ ] LLM descriptions generated
- [ ] PDF export with annotations

---

## 📊 Метрики качества

| Метрика | Цель | Измерение |
|---------|------|-----------|
| Detection mAP | > 0.70 | COCO metrics |
| Depth error | < 15% | Comparison with ground truth |
| Volume error | < 20% | Manual measurement comparison |
| Processing time | < 5 sec | API latency |
| Estimate accuracy | > 70% | Expert review |

---

## 🔧 Инфраструктура

### GPU Requirements

- **Development:** NVIDIA GTX 1080 / RTX 3060
- **Production:** NVIDIA T4 / A10G (AWS/GCP)

### Docker Compose

```yaml
version: '3.8'

services:
  ai-service:
    build: ./ai-service
    runtime: nvidia
    environment:
      - NVIDIA_VISIBLE_DEVICES=all
    ports:
      - "8001:8001"
    volumes:
      - ./models:/app/models
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]
```

---

*Последнее обновление: 2026-01-30*
