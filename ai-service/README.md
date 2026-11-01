# 🧠 QAZGOST AI Service — On-Prem Vision Pipeline

> **RF-DETR** → **SAM** → **Qwen2.5-VL** → Estimate JSON

## Быстрый старт (mock-режим, без GPU)

```bash
cd ai-service

# 1. Создать виртуальную среду
python -m venv .venv
.venv\Scripts\activate        # Windows
# source .venv/bin/activate   # Linux/Mac

# 2. Установить зависимости (базовые — без тяжёлых моделей)
pip install fastapi uvicorn[standard] python-multipart pydantic pydantic-settings \
            numpy pillow loguru python-dotenv requests opencv-python

# 3. Запустить сервис (все модели в mock-режиме)
python -m app.main

# Или через uvicorn:
uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
```

Сервис доступен: <http://localhost:8001>  
Swagger UI:      <http://localhost:8001/docs>  

---

## Полная установка (реальные модели)

### RF-DETR (детектор)

```bash
pip install rfdetr
# Скачать веса (или fine-tune на своих данных):
# https://huggingface.co/qazgost/rfdetr-construction
# Положить в: ai-service/models/rfdetr_construction.pth
```

### SAM (сегментатор)

```bash
pip install git+https://github.com/facebookresearch/segment-anything.git
# Скачать веса SAM-ViT-B (~360 MB):
curl -L https://dl.fbaipublicfiles.com/segment_anything/sam_vit_b_01ec64.pth \
     -o models/sam_vit_b.pth
```

### Qwen2.5-VL (LLM)

**Вариант 1: Ollama (CPU, проще всего)**

```bash
# Установить Ollama: https://ollama.com/download
ollama pull qwen2.5-vl:7b
ollama serve
# Сервис автоматически обнаружит Ollama
```

**Вариант 2: Transformers (GPU, 14+ GB VRAM)**

```bash
pip install transformers>=4.49.0 qwen-vl-utils accelerate
# Скачать модель:
huggingface-cli download Qwen/Qwen2.5-VL-7B-Instruct \
    --local-dir models/qwen2.5-vl-7b
```

---

## Полная установка зависимостей

```bash
pip install -r requirements.txt
```

---

## Структура pipeline

```
Фото (JPG/PNG)
   ↓
RF-DETR  →  bbox: [trench, foundation, rebar, ...]
   ↓
SAM      →  точные маски → area_px, контуры
   ↓
Calibrator → area_m2, volume_m3 (если есть эталонный объект)
   ↓
Qwen2.5-VL → objectType, signals, defects, materials_seen,
              missing_photos, scene_description
   ↓
AutoEstimator → estimate_items[], estimate_total (KZT)
   ↓
JSON Response  → aiVisionService.js → EstimateWizard
```

---

## Fallback-цепочка

| Уровень | Условие | Что происходит |
|---------|---------|---------------|
| 1 | Python backend online | RF-DETR + SAM + Qwen2.5-VL |
| 2 | Qwen offline | RF-DETR + SAM + mock LLM |
| 3 | Backend offline | aiMockService (Canvas-анализ) |

---

## Детекция дефектов (`POST /api/v1/defect-scan`)

**Как работает.** Фото (JPEG/PNG/WebP/HEIC, до 15 МБ и 40 Мпикс) уменьшается до 1600 px по длинной стороне,
затем детекторы пробуются по цепочке:

1. **YOLO**: обученная модель Ultralytics, основной детектор. Инференс выполняется в threadpool, модель грузится один раз при старте.
2. **Roboflow**: используется, только если YOLO недоступна и задан `ROBOFLOW_API_KEY` (фото уходит третьей стороне).
3. **CV-эвристика** (`cv_defect_scanner`): последний fallback, в ответе `fallback: true` и предупреждение.

Ответ сохраняет прежний контракт (`success`, `defectType`, `severity`, `snipCode`, `fixMethod`, `estimatedCost`,
`workDays`, `defect_annotated_image`, `defect_severity_summary`, `defects{items,total}`) и дополнительно содержит:

- `detector{name, model_file, classes, conf_threshold, ...}`;
- флаги `is_mock` и `fallback`, список `warnings`;
- `fixMethods` с методом устранения по каждому найденному классу;
- `estimatedCostKzt` — ориентировочная стоимость в тенге.

Каждый элемент `defects.items` содержит:

- `type`: русское название класса;
- `class`: английское название класса;
- `severity`: `critical` / `high` / `medium` / `low`;
- `confidence`;
- `bbox [x1,y1,x2,y2]` в пикселях **исходного** фото;
- `model`: `yolo` / `roboflow` / `cv`.

**Классы модели:** `crack`, `corrosion`, `spalling`, `efflorescence`, `damage`, `stain`.
⚠️ Разметка `dataset/merged` содержит **только `crack`** (4893 рамки в train, 397 в val): оба набора в
`scripts/train_defects.py` — датасеты трещин. Остальные 5 классов присутствуют в модели, но не обучены. Чтобы модель
их распознавала, нужна размеченная выборка этих классов.

**Метрики на val** (312 фото, 397 трещин, CPU; `python scripts/eval_defects.py --weights <pt> --write-meta`):

| Модель | Файл | Обучение | P | R | mAP50 | mAP50-95 | max F1 (conf) | CPU, мс/фото |
|---|---|---|---|---|---|---|---|---|
| **YOLO26n** (по умолчанию) | `models/defect_yolo26_best.pt` | 2 этапа на CPU: 5 + 4 эпохи (дообучение с cos-LR, без mosaic в конце), imgsz 512; логи в `runs/yolo26_20261101/`, `runs/yolo26_stage2_20261101/` | 0.862 | 0.733 | **0.775** | **0.581** | 0.795 (0.40) | **55** |
| YOLOv8n | `models/defect_yolov8s_best.pt`* | 15 эпох, 30% train, imgsz 640 | 0.788 | 0.672 | 0.705 | 0.458 | 0.732 (0.54) | 119 |

\* Несмотря на имя файла, внутри YOLOv8**n** (`train_args.model = yolov8n.pt`, 3.0M параметров).

**Выбор модели.**

- Кандидаты задаются в `DEFECT_MODEL_CANDIDATES` (по умолчанию YOLO26 первым).
- При `DEFECT_MODEL_SELECT=best_map` (по умолчанию) загружается модель с лучшим mAP50-95 из `<веса>.meta.json`.
- Явный выбор: `DEFECT_MODEL_PATH=models/defect_yolov8s_best.pt` (можно перечислить несколько через запятую).
- Порог `conf` берётся из `meta.json` (максимум F1 на val), переопределяется переменной `DEFECT_CONF_THRESHOLD`.
- Параметр `sensitivity` запроса: значения 0.5–0.65 дают откалиброванный порог; 1.0 снижает порог до 0.15 (больше находок), 0.1 поднимает его до 0.8.
- Текущую модель и её метрики показывает `GET /api/v1/health/detailed` → `components.defect_model`.

**Переобучение (GPU, Windows):** `TRAIN_YOLO26.bat`. Скрипт обновляет ultralytics и запускает
`scripts/train_defects.py --model yolo26s.pt --epochs 120 --imgsz 640 --device 0`; если CUDA нет, обучение идёт на CPU с лимитом 6 часов.
Linux/macOS:

```bash
pip install -U ultralytics
python scripts/train_defects.py --model yolo26s.pt --epochs 120 --imgsz 640 --device 0
```

Скрипт обучает модель и кладёт веса в `models/defect_yolo26_best.pt`, затем оценивает её на val и пишет
`models/defect_yolo26_best.meta.json` (метрики и порог). При следующем старте сервис выберет лучшую модель сам.

---

## Docker

```bash
docker-compose up --build
```

CPU-образ для Railway / серверов без GPU: `Dockerfile.cpu` + `requirements-cpu.txt` (torch CPU, веса
`models/defect_*.pt` запекаются в образ, порт — `$PORT`, процесс запускается не от root). SQLite со сметами — `ESTIMATES_DB_PATH`
(в образе по умолчанию `/app/db/estimates.db`, смонтируйте том на `/app/db`).

Или только AI-сервис:

```bash
docker build -t qazgost-ai .
docker run -p 8001:8001 -v ./models:/app/models qazgost-ai
```

---

## API

| Endpoint | Метод | Описание |
|----------|-------|----------|
| `/api/v1/analyze` | POST | Полный анализ (RF-DETR+SAM+Qwen) |
| `/api/v1/detect` | POST | Только RF-DETR (быстро) |
| `/api/v1/classes` | GET | Список классов |
| `/api/v1/health` | GET | Статус сервиса |
| `/docs` | GET | Swagger UI |

### Пример запроса

```bash
curl -X POST http://localhost:8001/api/v1/analyze \
     -F "file=@photo.jpg" \
     -F "region=almaty" \
     -F "confidence=0.3"
```

### Ответ

```json
{
  "success": true,
  "object_count": 3,
  "qwen_result": {
    "objectType": "foundation_strip",
    "confidence": 88,
    "signals": ["Виден арматурный каркас", "Опалубка по периметру"],
    "scene_description": "Ленточный фундамент в процессе заливки бетона.",
    "missing_photos": ["Вид сверху по периметру фундамента"],
    "materials_seen": ["арматура", "опалубка", "бетон"]
  },
  "estimate_total": 485000,
  "estimate_items": [...]
}
```
