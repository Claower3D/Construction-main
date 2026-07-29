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

## Docker

```bash
docker-compose up --build
```

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
