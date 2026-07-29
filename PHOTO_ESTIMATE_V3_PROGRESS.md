# Photo Estimate V3 — Implementation Progress

## 📅 Дата начала: 2026-02-18

## 📅 Последнее обновление: 2026-02-19

---

## ✅ Phase 1: Enhanced Detection & Segmentation — DONE

| # | Компонент | Файл | Статус |
|---|-----------|------|--------|
| 1 | Grounding DINO (open-vocabulary) | `ai-service/app/models/grounding_dino.py` | ✅ |
| 2 | Defect Detector (cracks, stains, rust) | `ai-service/app/models/defect_detector.py` | ✅ |
| 3 | RF-DETR (existing, unchanged) | `ai-service/app/models/rfdetr.py` | ✅ |
| 4 | SAM Segmentor (existing, unchanged) | `ai-service/app/models/sam_segmentor.py` | ✅ |

### Что сделано

- `grounding_dino.py` — open-vocabulary текстовые промпты для строительных элементов
- `defect_detector.py` — CV-based детекция: CrackDetector, StainDetector, RustDetector, DefectAnalyzer
- Поддержка тайлинга для мелких объектов
- Mock-режимы для всех моделей

---

## ✅ Phase 2: Scale Detection (ArUco, A4, EXIF) — DONE

| # | Компонент | Файл | Статус |
|---|-----------|------|--------|
| 1 | ScaleCalibrator V2 | `ai-service/app/services/calibrator.py` | ✅ |

### Что сделано

- 6 методов масштабирования в порядке приоритета:
  1. **ArUco маркеры** (conf=0.95)
  2. **A4 лист** (conf=0.80)
  3. **Банковская карта** (conf=0.80)
  4. **EXIF focal length** (conf=0.35-0.55)
  5. **Reference objects** (person, door, brick) (conf=0.50-0.90)
  6. **User manual input** (conf=0.75)
- Fallback при отсутствии масштаба (conf=0.15)
- Utility функции: convert_to_meters, convert_area_to_m2, validate_scale

---

## ✅ Phase 3: Improved Photogrammetry (RANSAC) — DONE

| # | Компонент | Файл | Статус |
|---|-----------|------|--------|
| 1 | photo3d.py V2 | `WebVersion/backend/photo3d.py` | ✅ |

### Что сделано

- Заменён ConvexHull на **RANSAC Plane Fitting**
- Добавлен **ArUco маркер** для определения масштаба на фото
- Переход с ORB на **AKAZE** (лучше для строительных фото)
- Skip-2 пары (кроме последовательных) для лучшей базы
- Определение высоты через расстояние между параллельными плоскостями
- До 10 фото (было 5)
- Детальная информация о плоскостях в выходном JSON

---

## ✅ Phase 4: QTO Engine (Quantity Take-Off) — DONE

| # | Компонент | Файл | Статус |
|---|-----------|------|--------|
| 1 | QTO Engine | `WebVersion/qtoEngine.js` | ✅ |

### Что сделано

- **16 формул** для строительных работ: штукатурка, кладка, стяжка, утепление, гидроизоляция, опалубка, арматура, трубы, демонтаж, фундаменты (ленточный, плитный, свайный)
- **Валидация диапазонов** (высота стены 2.2–6.0м, толщина стяжки 30–150мм, и т.д.)
- **Агрегация патчей** (несколько зон → единый расчёт)
- **3 сценария**: эконом (×0.70), стандарт (×1.00), премиум (×1.60) с разными waste factors
- **Скрытые/сопутствующие работы** (демонтаж, подготовка, засыпка)
- **Генератор вопросов** при неполных данных (толщина стены, стяжки, гидроизоляция)

---

## ✅ Phase 5: Pipeline V2 + PhotoEstimateEngine V3 — DONE

| # | Компонент | Файл | Статус |
|---|-----------|------|--------|
| 1 | Analysis Pipeline V2 | `ai-service/app/services/pipeline.py` | ✅ |
| 2 | PhotoEstimateEngine V3 | `WebVersion/photoEstimateEngine.js` | ✅ |

### Pipeline V2

- 8-шаговый пайплайн: RF-DETR → GroundingDINO → SAM → DefectAnalyzer → Calibrator → Volume → Qwen → Estimator
- Merge detections by IoU (дедупликация RF-DETR + GroundingDINO)
- Новые параметры: detect_defects, use_grounding_dino, custom_text_prompt, user_scale_hint

### PhotoEstimateEngine V3

- **3 режима**:
  1. Быстрый (1 фото)
  2. Полный 3D (5-10 фото с маркером)
  3. Контурный (полигон на фото)
- Интеграция QTO Engine для строгих формул
- 3 сценария (эконом/стандарт/премиум)
- Contour mode: Shoelace formula для площади
- Скрытые работы и умные вопросы

---

## ✅ Phase 6: Frontend/UI Updates — DONE

| # | Компонент | Файл | Статус |
|---|-----------|------|--------|
| 1 | photoEstimateV3UI.js — 3 режима анализа | `WebVersion/photoEstimateV3UI.js` | ✅ |
| 2 | Отображение сценариев (3 варианта) | `WebVersion/photoEstimateV3UI.js` | ✅ |
| 3 | Отображение дефектов (severity, mask) | `WebVersion/photoEstimateV3UI.js` | ✅ |
| 4 | Контурный режим (canvas overlay) | `WebVersion/photoEstimateV3UI.js` | ✅ |
| 5 | Вопросы-ответы (QTO clarification UI) | `WebVersion/photoEstimateV3UI.js` | ✅ |
| 6 | Масштабирование UI (ArUco/A4 prompt) | `WebVersion/photoEstimateV3UI.js` | ✅ |

### Что сделано

- Все 6 компонентов реализованы в `photoEstimateV3UI.js` (1128 строк)
- Режимы: Quick (1 фото), Full 3D (5-10 фото), Contour (полигон)
- Карточки сценариев: Economy / Standard / Premium с breakdown
- Панель дефектов с фильтрацией по severity (all/high/medium/low)
- Canvas overlay для контурного рисования с Shoelace formula
- QTO Smart Questions: slider, select, boolean, number inputs
- Scale calibration prompt с ручным вводом (метры → пиксели)

---

## 📋 Phase 7: FUTURE → Testing & Optimization

| # | Компонент | Статус |
|---|-----------|--------|
| 1 | Unit tests для QTO Engine | ⏳ TODO |
| 2 | Integration tests для Pipeline V2 | ⏳ TODO |
| 3 | Benchmark: AKAZE vs ORB vs SIFT | ⏳ TODO |
| 4 | Grounding DINO model weights download | ⏳ TODO |
| 5 | Performance profiling (pipeline latency) | ⏳ TODO |

---

## 📊 Architecture Summary

```
Photo Input
    │
    ├── Mode 1: Quick (1 photo)
    │   ├── Canvas AI (browser, color analysis)
    │   ├── AI Service (RF-DETR + GroundingDINO + SAM + Defects)
    │   ├── ScaleCalibrator V2 (ArUco/A4/EXIF/reference)
    │   ├── QTO Engine (formulas + validation)
    │   └── SmartEstimateEngine (catalog matching)
    │
    ├── Mode 2: Full 3D (5-10 photos)
    │   ├── all Mode 1 steps
    │   └── photo3d.py V2 (AKAZE + RANSAC planes + ArUco scale)
    │
    └── Mode 3: Contour (polygon on photo)
        ├── User draws polygon → Shoelace area
        ├── Scale hint (manual or auto)
        └── QTO Engine + SmartEstimateEngine
    │
    ▼
3 Scenarios: Economy / Standard / Premium
    │
    ▼
Estimate Output (PDF, UI, JSON)
```

---

**Статус документа:** 🔄 Активно обновляется
