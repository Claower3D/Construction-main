# 🏗️ QazGost AI — Платформа для строительной отрасли Казахстана

> Интеллектуальная система для детекции дефектов, LiDAR обмеров и автоматических смет по нормативам РК.

---

## 🏛️ Архитектура

```
┌──────────────┐     ┌──────────────┐     ┌──────────────────┐
│  React UI    │────▶│  Go Backend  │────▶│  Python AI       │
│  :5173       │     │  :8080       │     │  :8001 (FastAPI)  │
│              │     │              │     │                  │
│ • Калькулятор│     │ • REST API   │     │ • RF-DETR        │
│ • LiDAR      │     │ • JWT Auth   │     │ • SAM            │
│ • Дефекты    │     │ • SQLite     │     │ • Qwen2.5-VL     │
│ • PDF/Excel  │     │ • Proxy→AI   │     │ • QazGost DefNN  │
└──────────────┘     └──────────────┘     └──────────────────┘
                            │
                     ┌──────┴──────┐
                     │   NGINX     │
                     │  SSL + Rate │
                     │  Limiting   │
                     └─────────────┘
```

## 🚀 Быстрый старт

### Требования
- Docker >= 24.0, Docker Compose >= 2.0
- Node.js >= 18 (для локальной разработки)
- Go >= 1.21
- Python >= 3.10

### Локальный запуск (без GPU)

```bash
# 1. Клонировать
git clone https://github.com/Claower3D/Construction-main.git
cd Construction-main

# 2. Настроить переменные
cp .env.example .env
# Отредактировать .env: JWT_SECRET, OPENAI_API_KEY

# 3. Запустить
docker compose up -d

# 4. Открыть
# Frontend:  http://localhost:5173
# API Docs:  http://localhost:8001/docs
# Backend:   http://localhost:8080/health
```

### Production (GPU)

```bash
# Требует: NVIDIA GPU + nvidia-container-toolkit
docker compose -f docker-compose.gpu.yml up -d

# Включает: NGINX SSL, Prometheus, GPU acceleration
```

---

## 📁 Структура проекта

```
Construction-main/
├── frontend/                    # React (Vite)
│   └── src/
│       ├── components/
│       │   ├── EngineeringCalcPage.jsx   # 🧮 Калькулятор коммуникаций
│       │   ├── LiDARScanPage.jsx         # 📡 LiDAR сканер
│       │   ├── DefectInspectorPage.jsx   # 🔍 Дефекты
│       │   └── SmartPhotoEstimatePage.jsx # 📷 Фото-смета
│       └── services/
│
├── go-backend/                  # Go API Server
│   ├── cmd/server/main.go       # Entry point, routes
│   └── pkg/
│       ├── handlers/
│       │   ├── ai.go            # AI proxy + vision handlers
│       │   └── ...
│       ├── services/
│       └── config/
│
├── ai-service/                  # Python AI (FastAPI)
│   ├── app/
│   │   ├── models/
│   │   │   ├── defect_nn.py     # 🧬 10-class defect detector
│   │   │   ├── rfdetr.py        # RF-DETR object detection
│   │   │   ├── sam_segmentor.py # SAM segmentation
│   │   │   ├── qwen_vlm.py     # Qwen2.5-VL vision LLM
│   │   │   └── grounding_dino.py
│   │   ├── services/
│   │   │   ├── pipeline.py      # Full analysis pipeline
│   │   │   ├── lidar.py         # 📡 LiDAR point cloud processor
│   │   │   ├── engineering_calc.py # 🧮 Engineering calculator
│   │   │   ├── report_generator.py # 📄 PDF/Excel reports
│   │   │   ├── estimator.py     # Auto-estimator (24k prices)
│   │   │   └── volume.py        # Volume calculator
│   │   └── api/v1/
│   │       ├── engineering.py   # LiDAR + calc + reports API
│   │       ├── analyze.py       # Photo analysis API
│   │       └── health.py
│   ├── scripts/
│   │   ├── train_defects.py     # 🏋️ Model training script
│   │   └── download_roboflow.py # 📦 Dataset downloader
│   └── dataset/                 # Training data
│
├── deploy/
│   ├── nginx.conf               # NGINX production config
│   └── prometheus.yml           # Monitoring config
│
├── docker-compose.yml           # Dev (CPU)
├── docker-compose.gpu.yml       # Production (GPU + NGINX)
└── README.md
```

---

## 🧬 AI Модели

| Модель | Назначение | Лицензия | Fallback |
|--------|-----------|----------|----------|
| **RF-DETR** | Детекция объектов | Apache 2.0 | Mock |
| **SAM** | Сегментация масок | Apache 2.0 | Mock |
| **Qwen2.5-VL** | Vision LLM анализ | Apache 2.0 | Ollama → Mock |
| **QazGost DefNN** | Детекция дефектов (10 классов) | Custom | OpenCV fallback |
| **Grounding DINO** | Open-vocab detection | Apache 2.0 | Mock |

### 10 классов дефектов:

| # | Класс | Описание | СНиП |
|---|-------|----------|------|
| 0 | `crack_hairline` | Волосяная трещина | 3.04.01-87 |
| 1 | `crack_structural` | Структурная трещина | 3.03.01-87 |
| 2 | `crack_shrinkage` | Усадочная трещина | 3.04.01-87 |
| 3 | `spalling` | Отслоение бетона | 3.03.01-87 |
| 4 | `water_stain` | Водяные пятна | 3.04.01-87 |
| 5 | `mold` | Плесень/грибок | 3.04.01-87 |
| 6 | `efflorescence` | Высолы | 3.03.01-87 |
| 7 | `rust_surface` | Поверхностная коррозия | 2.03.11-85 |
| 8 | `rust_deep` | Глубокая коррозия | 2.03.11-85 |
| 9 | `rebar_exposed` | Оголённая арматура | 3.03.01-87 |

---

## 🧮 Калькулятор коммуникаций

**Эндпоинты:**
```
POST /api/v1/engineering/sewage      # Канализация
POST /api/v1/engineering/water       # Водоснабжение
POST /api/v1/engineering/electrical  # Электрика
POST /api/v1/engineering/full        # Полная смета
POST /api/v1/engineering/report/pdf  # Скачать PDF
POST /api/v1/engineering/report/excel # Скачать Excel
```

**15 городов Казахстана** с региональными коэффициентами:
Алматы (1.0), Астана (1.15), Атырау (1.35), Актау (1.30) и др.

**Пример запроса:**
```bash
curl -X POST http://localhost:8080/api/v1/engineering/full \
  -H "Content-Type: application/json" \
  -d '{"area_m2": 120, "city": "алматы", "systems": ["sewage", "water_supply", "electrical"]}'
```

---

## 📡 LiDAR

**Форматы:** .las, .laz, .ply, .pcd, .xyz

**Эндпоинты:**
```
POST /api/v1/lidar/analyze      # Анализ облака точек
POST /api/v1/lidar/deviations   # Проверка отклонений по СНиП
```

**Возможности:**
- Обмеры помещений (длина, ширина, высота, площади)
- Объём котлована
- Проверка отклонений по СНиП 3.04.01-87

---

## 🏋️ Обучение модели дефектов

```bash
# 1. Скачать датасет из Roboflow
cd ai-service
export ROBOFLOW_API_KEY=your_key
python scripts/download_roboflow.py --project qazgost-defects --version 1

# 2. Обучить (нужен GPU, ~$2-3 на RunPod)
python scripts/train_defects.py --epochs 150 --batch 16 --imgsz 640

# 3. Модель автоматически → models/qazgost_defects_v1.pt
```

---

## 🔒 Безопасность

- ✅ Все API ключи только на бэкенде (Go/Python `.env`)
- ✅ Фронтенд не имеет доступа к API ключам
- ✅ Go проксирует все AI запросы
- ✅ JWT авторизация для защищённых эндпоинтов
- ✅ Rate limiting через NGINX
- ✅ CORS настроен

---

## 📊 Мониторинг

- **Prometheus:** `http://localhost:9090`
- **Health:** `http://localhost:8080/health`
- **AI Metrics:** `http://localhost:8001/api/v1/metrics`
- **API Docs:** `http://localhost:8001/docs`

---

## 🛠️ Разработка

```bash
# Frontend
cd frontend && npm install && npm run dev

# Go Backend
cd go-backend && go run cmd/server/main.go

# AI Service
cd ai-service && pip install -r requirements.txt && uvicorn app.main:app --reload --port 8001
```

---

## 📝 Лицензия

Proprietary © 2026 QazGost AI. Все права защищены.