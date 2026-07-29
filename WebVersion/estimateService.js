// ========== ESTIMATE SERVICE v2.0 ==========
// Автоматический пайплайн распознавания объёмов по фото
// Минимум ручного ввода, максимум AI-автоматизации

(function () {
    'use strict';

    if (!window.EstimateModels) {
        console.error('[EstimateService] window.EstimateModels is not loaded. Ensure estimateModels.js is included before estimateService.js.');
        return;
    }
    const {
        Estimate, EstimatePhoto, EstimateStatus, ObjectType,
        ObjectTypeLabels, ScaleSource, AccuracyLevel
    } = window.EstimateModels;

    // ========== КОНФИГУРАЦИЯ ==========
    const CONFIG = {
        MIN_PHOTOS: 1,
        MAX_PHOTOS: 10,
        MIN_PHOTO_WIDTH: 640,
        MIN_PHOTO_HEIGHT: 480,
        AUTO_DETECT_CONFIDENCE_THRESHOLD: 70, // % для автоопределения типа
        PROCESSING_DELAY: 1500 // Симуляция задержки AI
    };

    // ========== СНиП КОЭФФИЦИЕНТЫ ПОТЕРЬ ==========
    const SNIP_COEFFICIENTS = {
        concrete: { waste: 1.05, label: 'Бетон — 5% на потери (СНиП 82-02-95)' },
        rebar: { waste: 1.03, label: 'Арматура — 3% на отходы' },
        brick: { waste: 1.07, label: 'Кирпич — 7% на бой (СНиП IV-2-82)' },
        block: { waste: 1.05, label: 'Блоки — 5% на бой' },
        sand: { waste: 1.10, label: 'Песок — 10% на потери при транспортировке' },
        gravel: { waste: 1.08, label: 'Щебень — 8% на потери' },
        wood: { waste: 1.10, label: 'Пиломатериал — 10% на обрезки' },
        roofing: { waste: 1.12, label: 'Кровельный материал — 12% на подрезку' },
        insulation: { waste: 1.08, label: 'Утеплитель — 8% на подрезку' },
        waterproofing: { waste: 1.15, label: 'Гидроизоляция — 15% на нахлёсты' },
        plaster: { waste: 1.05, label: 'Штукатурка — 5% на потери' },
        paint: { waste: 1.10, label: 'Краска — 10% запас' },
        tile: { waste: 1.10, label: 'Плитка — 10% на подрезку' },
        formwork: { waste: 1.0, label: 'Опалубка — без потерь (многоразовая)' },
        geotextile: { waste: 1.10, label: 'Геотекстиль — 10% на нахлёсты' },
        film: { waste: 1.10, label: 'Плёнка ПЭ — 10% на нахлёсты' }
    };

    // Региональные коэффициенты цен
    const REGIONAL_COEFFICIENTS = {
        'almaty': 1.15, 'алматы': 1.15,
        'astana': 1.12, 'астана': 1.12,
        'shymkent': 1.0, 'шымкент': 1.0,
        'karaganda': 0.95, 'караганда': 0.95,
        'aktau': 1.20, 'актау': 1.20,
        'atyrau': 1.18, 'атырау': 1.18,
        'aktobe': 1.05, 'актобе': 1.05,
        'taraz': 0.92, 'тараз': 0.92,
        'pavlodar': 0.95, 'павлодар': 0.95,
        'default': 1.0
    };

    // Принимает city из wizard (state.region) или localStorage
    function getRegionalCoefficient(city) {
        const c = (city || localStorage.getItem('userCity') || 'default').toLowerCase();
        return REGIONAL_COEFFICIENTS[c] || REGIONAL_COEFFICIENTS['default'];
    }

    // Поиск актуальной цены из базы КЗ (price_kz.js → AI_MAT_* / AI_WRK_* / AI_EQ_*)
    function getKZPrice(searchTerm, fallback) {
        const term = searchTerm.toLowerCase();
        const prefixes = ['AI_MAT_', 'AI_WRK_', 'AI_EQ_'];
        for (const prefix of prefixes) {
            for (const key of Object.keys(window)) {
                if (!key.startsWith(prefix)) continue;
                const catalog = window[key];
                if (!catalog || typeof catalog !== 'object') continue;
                for (const item of Object.values(catalog)) {
                    if (item && item.name && item.price > 0 &&
                        item.name.toLowerCase().includes(term)) {
                        return item.price;
                    }
                }
            }
        }
        return fallback;
    }

    function applySNiP(quantity, materialType) {
        const coeff = SNIP_COEFFICIENTS[materialType];
        return coeff ? quantity * coeff.waste : quantity;
    }

    // ========== ТЕКУЩИЙ ПОЛЬЗОВАТЕЛЬ ==========
    function getCurrentUserId() {
        const user = window.Models?.User?.current?.();
        return user?.id || localStorage.getItem('currentUserId') || 'guest';
    }

    // ========== CANVAS IMAGE ANALYSIS ==========

    /**
     * Реальный анализ пикселей через Canvas API
     * Принимает File объект ИЛИ dataURL строку
     * Возвращает { hue, saturation, brightness, edgeDensity, dominantColor }
     */
    async function analyzePixels(photoSource) {
        return new Promise((resolve) => {
            const img = new Image();

            // Поддержка и File, и dataURL
            let url;
            let needRevoke = false;
            if (photoSource instanceof File || photoSource instanceof Blob) {
                url = URL.createObjectURL(photoSource);
                needRevoke = true;
            } else if (typeof photoSource === 'string') {
                // dataURL или обычный URL
                url = photoSource;
                needRevoke = false;
            } else {
                resolve(null);
                return;
            }

            img.onload = () => {
                try {
                    // Сэмплируем уменьшенную копию (быстро)
                    const SAMPLE = 64;
                    const canvas = document.createElement('canvas');
                    canvas.width = SAMPLE; canvas.height = SAMPLE;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, SAMPLE, SAMPLE);
                    const data = ctx.getImageData(0, 0, SAMPLE, SAMPLE).data;
                    if (needRevoke) URL.revokeObjectURL(url);

                    // Считаем статистику по пикселям
                    let rSum = 0, gSum = 0, bSum = 0;
                    let greyCount = 0, redCount = 0, brownCount = 0, blueCount = 0, greenCount = 0, darkCount = 0;
                    const total = SAMPLE * SAMPLE;

                    for (let i = 0; i < data.length; i += 4) {
                        const r = data[i], g = data[i + 1], b = data[i + 2];
                        rSum += r; gSum += g; bSum += b;
                        const maxC = Math.max(r, g, b), minC = Math.min(r, g, b);
                        const lum = (maxC + minC) / 2 / 255;
                        const sat = maxC === minC ? 0 : (maxC - minC) / (255 * (1 - Math.abs(2 * lum - 1)));
                        // Классификация пикселя
                        if (lum < 0.2) { darkCount++; continue; }
                        if (sat < 0.15) { greyCount++; continue; }
                        const hue = maxC === r ? ((g - b) / (maxC - minC) * 60 + 360) % 360
                            : maxC === g ? (b - r) / (maxC - minC) * 60 + 120
                                : (r - g) / (maxC - minC) * 60 + 240;
                        if (hue < 20 || hue > 340) redCount++;
                        else if (hue < 45) brownCount++;
                        else if (hue < 80) greenCount++;
                        else if (hue < 260) blueCount++;
                    }

                    // Нормализуем
                    const grey = greyCount / total;
                    const red = redCount / total;
                    const brown = brownCount / total;
                    const blue = blueCount / total;
                    const green = greenCount / total;
                    const dark = darkCount / total;
                    const avgR = rSum / total, avgG = gSum / total, avgB = bSum / total;
                    const bright = (avgR + avgG + avgB) / 3 / 255;

                    // Плотность краёв (упрощённо Sobel): перепады яркость между соседними пикселями
                    let edgeSum = 0;
                    const gray2d = [];
                    for (let y = 0; y < SAMPLE; y++) {
                        gray2d[y] = [];
                        for (let x = 0; x < SAMPLE; x++) {
                            const i = (y * SAMPLE + x) * 4;
                            gray2d[y][x] = (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114) / 255;
                        }
                    }
                    for (let y = 1; y < SAMPLE - 1; y++) {
                        for (let x = 1; x < SAMPLE - 1; x++) {
                            const gx = gray2d[y][x + 1] - gray2d[y][x - 1];
                            const gy = gray2d[y + 1][x] - gray2d[y - 1][x];
                            edgeSum += Math.sqrt(gx * gx + gy * gy);
                        }
                    }
                    const edgeDensity = edgeSum / ((SAMPLE - 2) * (SAMPLE - 2));

                    resolve({
                        grey, red, brown, blue, green, dark, bright, edgeDensity,
                        w: img.naturalWidth, h: img.naturalHeight
                    });
                } catch (e) {
                    if (needRevoke) URL.revokeObjectURL(url);
                    resolve(null); // fallback при ошибке Canvas
                }
            };
            img.onerror = () => { if (needRevoke) URL.revokeObjectURL(url); resolve(null); };
            img.src = url;
        });
    }


    /**
     * Классифицирует тип строительного объекта по пикселям фото
     * Возвращает { type, confidence, signals[] }
     */
    function classifyByPixels(px, aspectRatio) {
        if (!px) return { type: ObjectType.FOUNDATION_STRIP, confidence: 62, signals: ['Анализ пикселей недоступен'] };

        const signals = [];
        const scores = {};

        const add = (type, pts, reason) => { scores[type] = (scores[type] || 0) + pts; signals.push(reason); };

        // ── Признаки ФУНДАМЕНТА: серый + тёмный, мало краёв, горизонтальное фото
        if (px.grey > 0.35 && px.bright < 0.45) {
            add('foundation_strip', 30, `Серый бетонный тон (${(px.grey * 100).toFixed(0)}%)`);
        }
        if (aspectRatio > 1.4 && px.dark > 0.1) {
            add('foundation_strip', 20, 'Горизонтальный кадр с тёмными зонами');
        }
        if (px.grey > 0.30 && px.edgeDensity < 0.08) {
            add('foundation_slab', 25, 'Ровная серая поверхность — вероятно плита');
        }

        // ── Признаки КИРПИЧНОЙ СТЕНЫ: красно-коричневый, высокая плотность краёв (швы)
        if (px.red + px.brown > 0.25) {
            add('wall_brick', 35, `Красно-кирпичный тон (${((px.red + px.brown) * 100).toFixed(0)}%)`);
            if (px.edgeDensity > 0.10) add('wall_brick', 20, 'Регулярный сетчатый рисунок (швы кладки)');
        }

        // ── Признаки БЛОЧНОЙ СТЕНЫ: светло-серый, чёткие горизонтальные линии
        if (px.grey > 0.28 && px.edgeDensity > 0.09 && px.bright > 0.4) {
            add('wall_block', 28, 'Светлые блоки с рёбрами');
        }
        if (aspectRatio < 0.9) add('wall_block', 15, 'Вертикальный кадр — характерен для стен');

        // ── Признаки КРОВЛИ: тёмный + маленький dark, коричневый/серый, широкое фото
        if (aspectRatio > 1.5 && (px.brown > 0.15 || px.grey > 0.25) && px.bright > 0.3) {
            add('roof_gable', 25, 'Широкий кадр, тёплые тона — скатная кровля');
            if (px.dark > 0.2) add('roof_gable', 10, 'Тень от уклона');
        }
        if (px.grey > 0.30 && aspectRatio > 1.3 && px.edgeDensity < 0.06) {
            add('roof_flat', 22, 'Плоская светлая поверхность');
        }

        // ── Признаки ПЕРЕКРЫТИЯ / СТЯЖКИ: серый + много краёв снизу
        if (px.grey > 0.40 && px.edgeDensity > 0.12) {
            add('slab', 20, 'Равномерный серый с выраженной текстурой');
        }

        // ── Признаки РЕМОНТА: тёплый интерьерный свет, зелень/синь обоев
        if (px.bright > 0.55 && (px.blue > 0.15 || px.green > 0.15)) {
            add('ROOM_RENOVATION', 22, 'Светлое интерьерное фото');
        }
        if (px.blue > 0.20 && px.bright > 0.45) {
            add('BATHROOM_RENOVATION', 25, 'Синяя кафельная плитка — ванная/санузел');
        }
        if (px.bright > 0.5 && px.brown > 0.12 && px.blue > 0.10) {
            add('KITCHEN_RENOVATION', 20, 'Тёплый интерьер с синими элементами — кухня');
        }

        // Выбираем победителя
        let best = 'foundation_strip', bestScore = 0;
        for (const [t, s] of Object.entries(scores)) {
            if (s > bestScore) { bestScore = s; best = t; }
        }

        // Confidence: чем больше очков у победителя и чем больше отрыв — тем выше
        const totalScore = Object.values(scores).reduce((a, b) => a + b, 0) || 1;
        const rawConf = Math.min(95, 55 + Math.round(bestScore / totalScore * 45));

        // Корректировка по качеству изображения
        const qualMult = (px.w * px.h) > 4000000 ? 1.0 : (px.w * px.h) > 1000000 ? 0.93 : 0.82;
        const confidence = Math.round(rawConf * qualMult);

        return { type: best, confidence, signals: signals.slice(0, 4) };
    }

    // ========== AI PIPELINE ==========

    /**
     * Шаг 1: Анализ фото и определение типа объекта
     * Гибридный pipeline: реальный Canvas анализ + реалистичные контуры
     */
    async function analyzePhoto(photo) {
        await delay(400);

        const w = photo.width || photo.file?.naturalWidth || 1920;
        const h = photo.height || photo.file?.naturalHeight || 1080;
        const aspectRatio = w / h;

        // Реальный анализ пикселей: пробуем File → originalSrc (dataURL) → fallback
        let classification;
        const pixelSource = (photo.file instanceof File || photo.file instanceof Blob)
            ? photo.file
            : (typeof photo.originalSrc === 'string' ? photo.originalSrc
                : (typeof photo.dataUrl === 'string' ? photo.dataUrl : null));

        if (pixelSource) {
            const px = await analyzePixels(pixelSource);
            classification = classifyByPixels(px, w / Math.max(h, 1));
            // Обновим размеры из реального изображения
            if (px && px.w && px.h) { photo.width = px.w; photo.height = px.h; }
        } else {
            // Fallback: детерминированная эвристика по размерам
            const seed = (w * 7 + h * 13) % 100;
            let type, confidence;
            if (aspectRatio > 1.5) {
                type = seed < 35 ? ObjectType.FOUNDATION_STRIP
                    : seed < 55 ? ObjectType.FOUNDATION_SLAB
                        : seed < 75 ? ObjectType.ROOF_GABLE
                            : ObjectType.FLOOR_CONCRETE;
                confidence = 68 + (seed % 12);
            } else if (aspectRatio < 0.8) {
                type = seed < 50 ? ObjectType.WALL_BRICK : ObjectType.WALL_BLOCK;
                confidence = 72 + (seed % 10);
            } else {
                type = seed < 40 ? ObjectType.FOUNDATION_SLAB
                    : seed < 70 ? ObjectType.WALL_BLOCK
                        : ObjectType.ROOF_FLAT;
                confidence = 65 + (seed % 12);
            }
            classification = { type, confidence, signals: ['Анализ по метаданным (файл недоступен)'] };
        }


        const { type: detectedType, confidence, signals } = classification;

        // Качество фото влияет на confidence финально
        const totalPixels = w * h;
        const qualityFactor = totalPixels > 4000000 ? 1.0 : totalPixels > 2000000 ? 0.97 : totalPixels > 1000000 ? 0.91 : 0.80;
        const finalConf = Math.min(96, Math.round(confidence * qualityFactor));

        const contours = generateRealisticContours(w, h, detectedType);
        const defects = detectDefects((w + h) % 100, detectedType);

        photo.analysisResult = {
            objectType: detectedType,
            confidence: finalConf,
            contours,
            defects,
            signals,                               // ← причины классификации
            sceneType: 'construction',
            lighting: totalPixels > 2000000 ? 'good' : 'moderate',
            perspective: aspectRatio > 1.3 ? 'wide' : aspectRatio < 0.9 ? 'vertical' : 'normal',
            estimatedDimensions: estimateDimensionsFromPhoto(w, h, detectedType)
        };
        photo.contours = contours;
        photo.status = 'ready';

        return photo.analysisResult;
    }
    /**
     * Генерация реалистичных контуров по типу объекта
     */

    function generateRealisticContours(photoW, photoH, objectType) {
        // Основной контур занимает 40-70% кадра
        const coverageRatio = 0.4 + (photoW % 30) / 100;
        const mainArea = photoW * photoH * coverageRatio;

        const contours = [{
            id: 'contour_main',
            type: 'polygon',
            area: mainArea,
            label: 'Основной объект',
            objectType: objectType
        }];

        // Для стен добавляем контуры проёмов
        if (objectType === ObjectType.WALL_BRICK || objectType === ObjectType.WALL_BLOCK) {
            const openingCount = 1 + (photoW % 3);
            for (let i = 0; i < openingCount; i++) {
                contours.push({
                    id: `contour_opening_${i}`,
                    type: 'polygon',
                    area: mainArea * (0.03 + (i * 0.01)),
                    label: i === 0 ? 'Дверной проём' : 'Оконный проём',
                    objectType: i === 0 ? ObjectType.OPENING_DOOR : ObjectType.OPENING_WINDOW,
                    isDeduction: true
                });
            }
        }

        return contours;
    }

    /**
     * Оценка реальных размеров из фото
     */
    function estimateDimensionsFromPhoto(photoW, photoH, objectType) {
        // Базовая эвристика: для стен стандартная высота 3м
        const dims = {};
        switch (objectType) {
            case ObjectType.FOUNDATION_STRIP:
                dims.perimeter = 28 + (photoW % 20); // 28-48м (дома 7x7 - 12x12)
                dims.width = 0.3 + (photoH % 3) * 0.1; // 0.3-0.6м
                dims.depth = 0.8 + (photoW % 4) * 0.2; // 0.8-1.6м
                break;
            case ObjectType.FOUNDATION_SLAB:
                dims.area = 60 + (photoW % 80); // 60-140 м²
                dims.thickness = 0.25 + (photoH % 3) * 0.05; // 0.25-0.40м
                break;
            case ObjectType.WALL_BRICK:
            case ObjectType.WALL_BLOCK:
                dims.length = 5 + (photoW % 15); // 5-20м
                dims.height = 2.7 + (photoH % 3) * 0.3; // 2.7-3.3м
                dims.thickness = objectType === ObjectType.WALL_BRICK ? 0.25 : 0.30;
                break;
            case ObjectType.ROOF_GABLE:
                dims.area = 80 + (photoW % 60); // 80-140 м² ската
                dims.length = 8 + (photoW % 8); // 8-16м
                dims.angle = 25 + (photoH % 20); // 25-45°
                break;
            case ObjectType.ROOF_FLAT:
                dims.area = 60 + (photoW % 80);
                dims.slope = 2 + (photoH % 4); // 2-6%
                break;
            case ObjectType.FLOOR_CONCRETE:
                dims.area = 40 + (photoW % 100);
                dims.thickness = 0.08 + (photoH % 3) * 0.02;
                break;
            default:
                dims.area = 50 + (photoW % 50);
        }
        return dims;
    }

    /**
     * Обнаружение дефектов (симуляция)
     */
    function detectDefects(seed, objectType) {
        const defects = [];
        const defectDB = [
            { type: 'crack', name: 'Трещина', severity: 'medium', description: 'Обнаружена трещина в конструкции' },
            { type: 'dampness', name: 'Влажность', severity: 'low', description: 'Следы увлажнения на поверхности' },
            { type: 'spalling', name: 'Отслоение', severity: 'high', description: 'Отслоение защитного слоя бетона' },
            { type: 'corrosion', name: 'Коррозия', severity: 'medium', description: 'Следы коррозии арматуры' },
            { type: 'deformation', name: 'Деформация', severity: 'high', description: 'Видимое отклонение от проектного положения' }
        ];

        // 30% шанс обнаружения дефекта
        if (seed % 10 < 3) {
            const defect = defectDB[seed % defectDB.length];
            defects.push({
                ...defect,
                confidence: 60 + (seed % 30),
                location: { x: 0.3 + (seed % 40) / 100, y: 0.2 + (seed % 50) / 100 }
            });
        }

        return defects;
    }

    /**
     * Шаг 2: Поиск масштаба на фото
     */
    async function detectScale(photos) {
        await delay(300);

        // Симулируем поиск масштаба
        const scaleDetectors = [
            { source: ScaleSource.AUTO_RULER, probability: 0.15, scale: 285 },  // рулетка
            { source: ScaleSource.AUTO_A4, probability: 0.10, scale: 142 },      // лист A4
            { source: ScaleSource.AUTO_REFERENCE, probability: 0.30, scale: 95 }, // дверь/кирпич
            { source: ScaleSource.ESTIMATED, probability: 0.35, scale: 100 },    // оценка
            { source: ScaleSource.UNKNOWN, probability: 0.10, scale: null }      // не найден
        ];

        // Выбираем случайно для демо
        const rand = Math.random();
        let cumulative = 0;
        for (const detector of scaleDetectors) {
            cumulative += detector.probability;
            if (rand <= cumulative) {
                return {
                    source: detector.source,
                    scale: detector.scale,
                    reference: detector.source === ScaleSource.AUTO_REFERENCE ? 'Стандартная дверь (2.1м)' : null
                };
            }
        }

        return { source: ScaleSource.UNKNOWN, scale: null };
    }

    /**
     * Шаг 3: Расчёт объёмов
     */
    function calculateVolumes(estimate) {
        const { objectType, scale, objectParams, photos } = estimate;

        // Получаем общую площадь из контуров
        let totalPixelArea = 0;
        photos.forEach(photo => {
            if (photo.contours) {
                photo.contours.forEach(c => {
                    totalPixelArea += c.area || 0;
                });
            }
        });

        // Если нет масштаба, используем оценочный
        const effectiveScale = scale || 100; // pixels per meter
        const areaM2 = totalPixelArea / (effectiveScale * effectiveScale);

        // Расчёт в зависимости от типа объекта
        let results = {
            area: 0,
            volume: 0,
            perimeter: 0,
            items: [],
            materials: [],
            works: []
        };

        switch (objectType) {
            case ObjectType.FOUNDATION_STRIP:
            case 'foundation_strip':
                results = calculateFoundationStrip(areaM2, objectParams, estimate.region);
                break;
            case ObjectType.FOUNDATION_SLAB:
            case 'foundation_slab':
                results = calculateFoundationSlab(areaM2, objectParams, estimate.region);
                break;
            case ObjectType.FOUNDATION_PILES:
            case 'foundation_pile':
                results = calculateFoundationPiles(areaM2, objectParams, estimate.region);
                break;
            case ObjectType.WALL_BRICK:
            case ObjectType.WALL_BLOCK:
            case ObjectType.WALL_CONCRETE:
            case 'wall_brick': case 'wall_block':
                results = calculateWall(areaM2, objectParams, objectType, estimate.region);
                break;
            case ObjectType.FLOOR_CONCRETE:
            case ObjectType.FLOOR_SCREED:
                results = calculateFloor(areaM2, objectParams, objectType, estimate.region);
                break;
            case ObjectType.ROOF_FLAT:
            case 'roof_flat':
                results = calculateRoofFlat(areaM2, objectParams, estimate.region);
                break;
            case ObjectType.ROOF_GABLE:
            case 'ROOF_GABLE': case 'roof_gable': case 'ROOF_PITCHED':
                results = calculateRoofGable(areaM2, objectParams, estimate.region);
                break;
            case ObjectType.OPENING_DOOR:
            case ObjectType.OPENING_WINDOW:
            case 'opening_door': case 'opening_window':
                results = calculateOpening(areaM2, objectParams, objectType, estimate.region);
                break;
            case 'ROOM_RENOVATION': case 'room_renovation':
                results = calculateRoomRenovation(areaM2, objectParams, estimate.region);
                break;
            case 'BATHROOM_RENOVATION': case 'bathroom_renovation':
                results = calculateBathroomRenovation(areaM2, objectParams, estimate.region);
                break;
            case 'KITCHEN_RENOVATION': case 'kitchen_renovation':
                results = calculateKitchenRenovation(areaM2, objectParams, estimate.region);
                break;
            default:
                results = calculateGeneric(areaM2, objectParams);
        }

        return results;
    }

    // === Расчёты по типам ===

    function calculateFoundationStrip(baseArea, params, region) {
        const width = params.width || 0.4;  // м
        const height = params.height || 0.8; // м
        const depth = params.depth || 0.5;   // м
        const rc = getRegionalCoefficient(region);

        const estimatedPerimeter = Math.sqrt(baseArea) * 4;
        const perimeter = params.perimeter || estimatedPerimeter;

        const volumeConcrete = perimeter * width * (height + depth);
        const areaFormwork = perimeter * (height + depth) * 2;
        const armatureLength = perimeter * 8;

        // helper: материал с СНиП-бейджем
        const mat = (name, qty, unit, price) => ({ name, quantity: qty, unit, price, snipLabel: true });

        return {
            area: perimeter * width,
            volume: volumeConcrete,
            perimeter: perimeter,
            items: [
                { name: 'Длина ленты', value: perimeter.toFixed(1), unit: 'п.м.' },
                { name: 'Ширина ленты', value: (width * 100).toFixed(0), unit: 'см' },
                { name: 'Высота + глубина', value: ((height + depth) * 100).toFixed(0), unit: 'см' },
                { name: 'Объём бетона', value: volumeConcrete.toFixed(2), unit: 'м³' },
                { name: 'Норматив', value: 'СНиП 3.03.01-87', unit: '' }
            ],
            materials: [
                mat('Бетон М300', applySNiP(volumeConcrete, 'concrete'), 'м³', Math.round(getKZPrice('бетон м300', 32000) * rc)),
                mat('Арматура d12 A500C', applySNiP(armatureLength * 0.888, 'rebar'), 'кг', Math.round(getKZPrice('арматура', 650) * rc)),
                mat('Опалубка', applySNiP(areaFormwork, 'formwork'), 'м²', Math.round(getKZPrice('опалубка', 1800) * rc)),
                mat('Песок (подушка)', applySNiP(perimeter * width * 0.2, 'sand'), 'м³', Math.round(getKZPrice('песок', 4500) * rc)),
                mat('Щебень фр. 20-40', applySNiP(perimeter * width * 0.15, 'gravel'), 'м³', Math.round(getKZPrice('щебень', 6500) * rc)),
                mat('Гидроизоляция', applySNiP(perimeter * width * 2, 'waterproofing'), 'м²', Math.round(getKZPrice('гидроизоляция', 380) * rc))
            ],
            works: [
                { name: 'Разметка и земляные работы', quantity: perimeter * width * 1.5, unit: 'м³', price: Math.round(3500 * rc) },
                { name: 'Устройство опалубки', quantity: areaFormwork, unit: 'м²', price: Math.round(1200 * rc) },
                { name: 'Армирование', quantity: armatureLength * 0.888, unit: 'кг', price: Math.round(55 * rc) },
                { name: 'Бетонирование', quantity: volumeConcrete, unit: 'м³', price: Math.round(4500 * rc) },
                { name: 'Обратная засыпка', quantity: perimeter * width * depth * 0.3, unit: 'м³', price: Math.round(1200 * rc) }
            ]
        };
    }


    function calculateFoundationSlab(baseArea, params, region) {
        const thickness = params.thickness || 0.3; // м
        const area = baseArea || 100;
        const rc = getRegionalCoefficient(region);
        const volume = area * thickness;
        const armatureArea = area * 2;

        return {
            area: area, volume: volume, perimeter: Math.sqrt(area) * 4,
            items: [
                { name: 'Площадь плиты', value: area.toFixed(1), unit: 'м²' },
                { name: 'Толщина плиты', value: (thickness * 100).toFixed(0), unit: 'см' },
                { name: 'Объём бетона', value: volume.toFixed(2), unit: 'м³' }
            ],
            materials: [
                { name: 'Бетон М350', quantity: volume * 1.05, unit: 'м³', price: Math.round(getKZPrice('бетон м350', 35000) * rc) },
                { name: 'Арматура d14', quantity: armatureArea * 8, unit: 'кг', price: Math.round(getKZPrice('арматура', 680) * rc) },
                { name: 'Геотекстиль', quantity: area * 1.1, unit: 'м²', price: Math.round(getKZPrice('геотекстиль', 120) * rc) },
                { name: 'Песок', quantity: area * 0.2, unit: 'м³', price: Math.round(getKZPrice('песок', 4500) * rc) },
                { name: 'Щебень', quantity: area * 0.15, unit: 'м³', price: Math.round(getKZPrice('щебень', 6500) * rc) }
            ],
            works: [
                { name: 'Подготовка основания', quantity: area, unit: 'м²', price: Math.round(650 * rc) },
                { name: 'Устройство подушки', quantity: area, unit: 'м²', price: Math.round(500 * rc) },
                { name: 'Армирование', quantity: armatureArea * 8, unit: 'кг', price: Math.round(55 * rc) },
                { name: 'Бетонирование', quantity: volume, unit: 'м³', price: Math.round(5500 * rc) }
            ]
        };
    }

    function calculateFoundationPiles(baseArea, params) {
        const pileCount = params.pileCount || Math.ceil(Math.sqrt(baseArea) * 1.5);
        const pileDiameter = params.pileDiameter || 0.3;
        const pileDepth = params.pileDepth || 3;

        const pileVolume = Math.PI * Math.pow(pileDiameter / 2, 2) * pileDepth * pileCount;

        return {
            area: baseArea,
            volume: pileVolume,
            perimeter: Math.sqrt(baseArea) * 4,
            items: [
                { name: 'Количество свай', value: pileCount, unit: 'шт' },
                { name: 'Диаметр сваи', value: (pileDiameter * 100).toFixed(0), unit: 'см' },
                { name: 'Глубина сваи', value: pileDepth.toFixed(1), unit: 'м' },
                { name: 'Общий объём бетона', value: pileVolume.toFixed(2), unit: 'м³' }
            ],
            materials: [
                { name: 'Бетон М350', quantity: pileVolume * 1.1, unit: 'м³', price: 32000 },
                { name: 'Арматура d16', quantity: pileCount * pileDepth * 4 * 1.58, unit: 'кг', price: 520 },
                { name: 'Обсадные трубы', quantity: pileCount, unit: 'шт', price: 3500 }
            ],
            works: [
                { name: 'Бурение скважин', quantity: pileCount * pileDepth, unit: 'п.м.', price: 2800 },
                { name: 'Армирование свай', quantity: pileCount, unit: 'шт', price: 2500 },
                { name: 'Бетонирование свай', quantity: pileVolume, unit: 'м³', price: 5000 }
            ]
        };
    }

    function calculateWall(area, params, type, region) {
        const thickness = params.thickness || 0.25;
        const height = params.height || 3;
        const length = area / height;
        const volume = area * thickness;
        const rc = getRegionalCoefficient(region);

        let materials = [], works = [];
        const isBrick = type === ObjectType.WALL_BRICK || type === 'wall_brick' || type === 'WALL_BRICK';
        const isBlock = type === ObjectType.WALL_BLOCK || type === 'wall_block' || type === 'WALL_BLOCK';
        if (isBrick) {
            materials = [
                { name: 'Кирпич рядовой М150', quantity: applySNiP(area * 52, 'brick'), unit: 'шт', price: Math.round(getKZPrice('кирпич', 75) * rc) },
                { name: 'Раствор цементный', quantity: area * 0.23, unit: 'м³', price: Math.round(getKZPrice('раствор', 8500) * rc) }
            ];
            works = [{ name: 'Кладка кирпичная', quantity: area, unit: 'м²', price: Math.round(getKZPrice('кладка кирпич', 3500) * rc) }];
        } else if (isBlock) {
            materials = [
                { name: 'Газобетонный блок D500', quantity: applySNiP(area * thickness / 0.025, 'block'), unit: 'шт', price: Math.round(getKZPrice('газобетон', 600) * rc) },
                { name: 'Клей для блоков', quantity: area * 1.5, unit: 'кг', price: Math.round(getKZPrice('клей блок', 220) * rc) }
            ];
            works = [{ name: 'Кладка блочная', quantity: area, unit: 'м²', price: Math.round(getKZPrice('кладка блок', 2800) * rc) }];
        } else {
            materials = [
                { name: 'Бетон М200', quantity: volume, unit: 'м³', price: Math.round(getKZPrice('бетон м200', 28000) * rc) },
                { name: 'Арматура', quantity: volume * 80, unit: 'кг', price: Math.round(getKZPrice('арматура', 650) * rc) }
            ];
            works = [{ name: 'Монолитные работы', quantity: volume, unit: 'м³', price: Math.round(6000 * rc) }];
        }

        return {
            area, volume, perimeter: length,
            items: [
                { name: 'Площадь стены', value: area.toFixed(1), unit: 'м²' },
                { name: 'Толщина', value: (thickness * 100).toFixed(0), unit: 'см' },
                { name: 'Длина', value: length.toFixed(1), unit: 'п.м.' }
            ],
            materials, works
        };
    }

    function calculateFloor(area, params, type) {
        const thickness = params.thickness || (type === ObjectType.FLOOR_SCREED ? 0.05 : 0.1);
        const volume = area * thickness;

        return {
            area: area,
            volume: volume,
            perimeter: Math.sqrt(area) * 4,
            items: [
                { name: 'Площадь пола', value: area.toFixed(1), unit: 'м²' },
                { name: 'Толщина', value: (thickness * 100).toFixed(0), unit: 'см' },
                { name: 'Объём', value: volume.toFixed(2), unit: 'м³' }
            ],
            materials: [
                {
                    name: type === ObjectType.FLOOR_SCREED ? 'Пескобетон М300' : 'Бетон М200',
                    quantity: volume * 1.05, unit: 'м³', price: type === ObjectType.FLOOR_SCREED ? 4500 : 24000
                },
                { name: 'Сетка армирующая', quantity: area, unit: 'м²', price: 120 },
                { name: 'Пленка ПЭ', quantity: area * 1.1, unit: 'м²', price: 35 }
            ],
            works: [
                { name: 'Подготовка основания', quantity: area, unit: 'м²', price: 250 },
                { name: 'Устройство стяжки', quantity: area, unit: 'м²', price: 550 }
            ]
        };
    }

    function calculateGeneric(area, params) {
        return {
            area: area,
            volume: area * 0.2,
            perimeter: Math.sqrt(area) * 4,
            items: [
                { name: 'Площадь', value: area.toFixed(1), unit: 'м²' },
                { name: 'Объём (оценка)', value: (area * 0.2).toFixed(2), unit: 'м³' }
            ],
            materials: [],
            works: []
        };
    }

    // ========== КРЫША ПЛОСКАЯ ==========
    function calculateRoofFlat(area, params) {
        const roofArea = area || 100;
        const slopePercent = params.slope || 3; // 3% уклон
        const insulationThickness = params.insulation || 0.15; // 15 см
        const rc = getRegionalCoefficient();

        return {
            area: roofArea,
            volume: roofArea * insulationThickness,
            perimeter: Math.sqrt(roofArea) * 4,
            items: [
                { name: 'Площадь кровли', value: roofArea.toFixed(1), unit: 'м²' },
                { name: 'Уклон', value: slopePercent, unit: '%' },
                { name: 'Утепление', value: (insulationThickness * 100).toFixed(0), unit: 'см' },
                { name: 'Норматив', value: 'СП 17.13330.2017', unit: '' }
            ],
            materials: [
                { name: 'ПВХ мембрана Технониколь', quantity: applySNiP(roofArea, 'roofing'), unit: 'м²', price: Math.round(650 * rc) },
                { name: 'Утеплитель XPS', quantity: applySNiP(roofArea * insulationThickness, 'insulation'), unit: 'м³', price: Math.round(6500 * rc) },
                { name: 'Пароизоляция', quantity: applySNiP(roofArea, 'waterproofing'), unit: 'м²', price: Math.round(120 * rc) },
                { name: 'Стяжка разуклонки', quantity: applySNiP(roofArea * 0.05, 'concrete'), unit: 'м³', price: Math.round(5500 * rc) },
                { name: 'Праймер битумный', quantity: roofArea * 0.3, unit: 'кг', price: Math.round(180 * rc) },
                { name: 'Воронка водосточная', quantity: Math.ceil(roofArea / 150), unit: 'шт', price: Math.round(4500 * rc) }
            ],
            works: [
                { name: 'Устройство пароизоляции', quantity: roofArea, unit: 'м²', price: Math.round(180 * rc) },
                { name: 'Утепление', quantity: roofArea, unit: 'м²', price: Math.round(350 * rc) },
                { name: 'Стяжка разуклонки', quantity: roofArea, unit: 'м²', price: Math.round(550 * rc) },
                { name: 'Монтаж мембраны', quantity: roofArea, unit: 'м²', price: Math.round(450 * rc) },
                { name: 'Установка воронок', quantity: Math.ceil(roofArea / 150), unit: 'шт', price: Math.round(2500 * rc) }
            ]
        };
    }

    // ========== КРЫША ДВУСКАТНАЯ ==========
    function calculateRoofGable(area, params) {
        const roofArea = area || 120; // м² обоих скатов
        const length = params.length || Math.sqrt(roofArea / 2) * 1.5; // длина ската
        const angle = params.angle || 35; // градусов
        const rc = getRegionalCoefficient();

        const rafterSpacing = 0.6; // шаг стропил 600 мм
        const rafterCount = Math.ceil(length / rafterSpacing) * 2 + 2;
        const rafterLength = (roofArea / 2) / length / Math.cos(angle * Math.PI / 180);
        const ridgeLength = length;

        return {
            area: roofArea,
            volume: 0,
            perimeter: Math.sqrt(roofArea) * 4,
            items: [
                { name: 'Площадь кровли', value: roofArea.toFixed(1), unit: 'м²' },
                { name: 'Длина конька', value: ridgeLength.toFixed(1), unit: 'м' },
                { name: 'Угол наклона', value: angle, unit: '°' },
                { name: 'Количество стропил', value: rafterCount, unit: 'шт' },
                { name: 'Норматив', value: 'СП 17.13330.2017', unit: '' }
            ],
            materials: [
                { name: 'Металлочерепица', quantity: applySNiP(roofArea, 'roofing'), unit: 'м²', price: Math.round(850 * rc) },
                { name: 'Стропила 50×200', quantity: applySNiP(rafterCount * rafterLength, 'wood'), unit: 'п.м.', price: Math.round(380 * rc) },
                { name: 'Обрешётка 25×100', quantity: applySNiP(roofArea * 3.5, 'wood'), unit: 'п.м.', price: Math.round(65 * rc) },
                { name: 'Контробрешётка 50×50', quantity: applySNiP(roofArea * 2, 'wood'), unit: 'п.м.', price: Math.round(55 * rc) },
                { name: 'Мембрана гидро-ветрозащитная', quantity: applySNiP(roofArea, 'waterproofing'), unit: 'м²', price: Math.round(85 * rc) },
                { name: 'Утеплитель мин. вата 200мм', quantity: applySNiP(roofArea * 0.2, 'insulation'), unit: 'м³', price: Math.round(4200 * rc) },
                { name: 'Пароизоляция', quantity: applySNiP(roofArea, 'waterproofing'), unit: 'м²', price: Math.round(65 * rc) },
                { name: 'Конёк', quantity: ridgeLength * 1.1, unit: 'п.м.', price: Math.round(450 * rc) },
                { name: 'Саморезы кровельные', quantity: roofArea * 7, unit: 'шт', price: Math.round(5 * rc) },
                { name: 'Водосточная система', quantity: Math.sqrt(roofArea) * 2, unit: 'п.м.', price: Math.round(1200 * rc) }
            ],
            works: [
                { name: 'Монтаж стропильной системы', quantity: roofArea, unit: 'м²', price: Math.round(650 * rc) },
                { name: 'Монтаж обрешётки', quantity: roofArea, unit: 'м²', price: Math.round(250 * rc) },
                { name: 'Утепление кровли', quantity: roofArea, unit: 'м²', price: Math.round(350 * rc) },
                { name: 'Монтаж металлочерепицы', quantity: roofArea, unit: 'м²', price: Math.round(500 * rc) },
                { name: 'Установка конька и доборных', quantity: ridgeLength, unit: 'п.м.', price: Math.round(350 * rc) },
                { name: 'Монтаж водостоков', quantity: Math.sqrt(roofArea) * 2, unit: 'п.м.', price: Math.round(450 * rc) }
            ]
        };
    }

    // ========== ПРОЁМЫ (вычеты) ==========
    function calculateOpening(area, params, type, region) {
        const isWindow = type === ObjectType.OPENING_WINDOW || type === 'opening_window';
        const width = params.width || (isWindow ? 1.2 : 0.9); // м
        const height = params.height || (isWindow ? 1.5 : 2.1); // м
        const count = params.count || 1;
        const rc = getRegionalCoefficient();

        const openingArea = width * height * count;
        const perimeter = (width + height) * 2 * count;

        return {
            area: openingArea,
            volume: 0,
            perimeter: perimeter,
            isDeduction: true, // Это вычет из стены
            items: [
                { name: isWindow ? 'Оконный проём' : 'Дверной проём', value: `${width}×${height}`, unit: 'м' },
                { name: 'Количество', value: count, unit: 'шт' },
                { name: 'Площадь вычета', value: openingArea.toFixed(2), unit: 'м²' },
                { name: 'Периметр откосов', value: perimeter.toFixed(1), unit: 'п.м.' }
            ],
            materials: isWindow ? [
                { name: 'Окно ПВХ двухкамерное', quantity: count, unit: 'шт', price: Math.round(45000 * rc) },
                { name: 'Подоконник ПВХ', quantity: width * count, unit: 'п.м.', price: Math.round(2500 * rc) },
                { name: 'Отлив оцинк.', quantity: width * count, unit: 'п.м.', price: Math.round(650 * rc) },
                { name: 'Монтажная пена', quantity: Math.ceil(perimeter / 3), unit: 'бал.', price: Math.round(480 * rc) },
                { name: 'Штукатурка откосов', quantity: applySNiP(perimeter * 0.25, 'plaster'), unit: 'м²', price: Math.round(350 * rc) }
            ] : [
                { name: 'Дверь входная металлическая', quantity: count, unit: 'шт', price: Math.round(65000 * rc) },
                { name: 'Монтажная пена', quantity: Math.ceil(perimeter / 3), unit: 'бал.', price: Math.round(480 * rc) },
                { name: 'Анкерные пластины', quantity: count * 6, unit: 'шт', price: Math.round(85 * rc) },
                { name: 'Штукатурка откосов', quantity: applySNiP(perimeter * 0.25, 'plaster'), unit: 'м²', price: Math.round(350 * rc) }
            ],
            works: [
                { name: isWindow ? 'Установка окна' : 'Установка двери', quantity: count, unit: 'шт', price: Math.round((isWindow ? 5000 : 8000) * rc) },
                { name: 'Отделка откосов', quantity: perimeter * 0.25, unit: 'м²', price: Math.round(1200 * rc) },
                { name: 'Устройство перемычки', quantity: width * count, unit: 'п.м.', price: Math.round(1800 * rc) }
            ]
        };
    }

    // ========== РЕМОНТНЫЕ РАБОТЫ ==========

    function calculateRoomRenovation(area, params, region) {
        const rc = getRegionalCoefficient(region);
        const height = params.height || 2.7;
        const wallArea = (Math.sqrt(area) * 4) * height;
        const ceilArea = area;
        return {
            area, volume: 0, perimeter: Math.sqrt(area) * 4,
            items: [
                { name: 'Площадь пола', value: area.toFixed(1), unit: 'м²' },
                { name: 'Площадь стен', value: wallArea.toFixed(1), unit: 'м²' },
                { name: 'Высота', value: height, unit: 'м' }
            ],
            materials: [
                { name: 'Штукатурка гипсовая', quantity: applySNiP(wallArea * 10, 'plaster'), unit: 'кг', price: Math.round(getKZPrice('штукатурка', 220) * rc) },
                { name: 'Шпатлёвка финишная', quantity: wallArea * 1.5, unit: 'кг', price: Math.round(getKZPrice('шпатлёвка', 180) * rc) },
                { name: 'Краска для стен', quantity: applySNiP(wallArea * 0.3, 'paint'), unit: 'кг', price: Math.round(getKZPrice('краска', 1200) * rc) },
                { name: 'Плинтус напольный', quantity: Math.sqrt(area) * 4 * 1.05, unit: 'п.м.', price: Math.round(800 * rc) },
                { name: 'Ламинат / ПВХ плитка', quantity: applySNiP(area, 'tile'), unit: 'м²', price: Math.round(getKZPrice('ламинат', 3200) * rc) },
                { name: 'Подложка под ламинат', quantity: area * 1.05, unit: 'м²', price: Math.round(350 * rc) }
            ],
            works: [
                { name: 'Штукатурка стен', quantity: wallArea, unit: 'м²', price: Math.round(getKZPrice('штукатурка стен', 1800) * rc) },
                { name: 'Шпатлёвка + грунтовка', quantity: wallArea + ceilArea, unit: 'м²', price: Math.round(1200 * rc) },
                { name: 'Покраска стен 2 слоя', quantity: wallArea + ceilArea, unit: 'м²', price: Math.round(800 * rc) },
                { name: 'Укладка ламината', quantity: area, unit: 'м²', price: Math.round(getKZPrice('укладка ламинат', 900) * rc) }
            ]
        };
    }

    function calculateBathroomRenovation(area, params, region) {
        const rc = getRegionalCoefficient(region);
        const height = params.height || 2.5;
        const wallArea = (Math.sqrt(area) * 4) * height;
        return {
            area, volume: 0, perimeter: Math.sqrt(area) * 4,
            items: [
                { name: 'Площадь', value: area.toFixed(1), unit: 'м²' },
                { name: 'Площадь стен под плитку', value: wallArea.toFixed(1), unit: 'м²' }
            ],
            materials: [
                { name: 'Плитка настенная', quantity: applySNiP(wallArea, 'tile'), unit: 'м²', price: Math.round(getKZPrice('плитка настен', 4500) * rc) },
                { name: 'Плитка напольная', quantity: applySNiP(area, 'tile'), unit: 'м²', price: Math.round(getKZPrice('плитка напол', 3800) * rc) },
                { name: 'Клей плиточный', quantity: (wallArea + area) * 5, unit: 'кг', price: Math.round(getKZPrice('клей плит', 280) * rc) },
                { name: 'Затирка швов', quantity: (wallArea + area) * 0.3, unit: 'кг', price: Math.round(getKZPrice('затирка', 480) * rc) },
                { name: 'Гидроизоляция обмазочная', quantity: applySNiP(area + wallArea * 0.3, 'waterproofing'), unit: 'м²', price: Math.round(getKZPrice('гидроизоляция обмаз', 650) * rc) },
                { name: 'Унитаз напольный', quantity: 1, unit: 'шт', price: Math.round(35000 * rc) },
                { name: 'Раковина', quantity: 1, unit: 'шт', price: Math.round(18000 * rc) },
                { name: 'Смеситель для ванны', quantity: 1, unit: 'шт', price: Math.round(22000 * rc) }
            ],
            works: [
                { name: 'Гидроизоляция пола и стен', quantity: area + wallArea * 0.3, unit: 'м²', price: Math.round(1200 * rc) },
                { name: 'Укладка напольной плитки', quantity: area, unit: 'м²', price: Math.round(getKZPrice('укладка плитки', 2500) * rc) },
                { name: 'Укладка настенной плитки', quantity: wallArea, unit: 'м²', price: Math.round(2800 * rc) },
                { name: 'Установка сантехники', quantity: 1, unit: 'компл.', price: Math.round(25000 * rc) }
            ]
        };
    }

    function calculateKitchenRenovation(area, params, region) {
        const rc = getRegionalCoefficient(region);
        const height = params.height || 2.7;
        const wallArea = (Math.sqrt(area) * 4) * height;
        const apronArea = Math.sqrt(area) * 0.6; // Фартук
        return {
            area, volume: 0, perimeter: Math.sqrt(area) * 4,
            items: [
                { name: 'Площадь кухни', value: area.toFixed(1), unit: 'м²' },
                { name: 'Площадь фартука', value: apronArea.toFixed(1), unit: 'м²' }
            ],
            materials: [
                { name: 'Плитка / панели для фартука', quantity: applySNiP(apronArea, 'tile'), unit: 'м²', price: Math.round(5500 * rc) },
                { name: 'Ламинат / линолеум', quantity: applySNiP(area, 'tile'), unit: 'м²', price: Math.round(getKZPrice('ламинат', 3200) * rc) },
                { name: 'Обои / краска стены', quantity: applySNiP(wallArea - apronArea, 'paint'), unit: 'м²', price: Math.round(1800 * rc) },
                { name: 'Смеситель для кухни', quantity: 1, unit: 'шт', price: Math.round(15000 * rc) },
                { name: 'Вытяжка кухонная', quantity: 1, unit: 'шт', price: Math.round(35000 * rc) }
            ],
            works: [
                { name: 'Штукатурка и шпатлёвка', quantity: wallArea, unit: 'м²', price: Math.round(1500 * rc) },
                { name: 'Укладка фартука', quantity: apronArea, unit: 'м²', price: Math.round(2800 * rc) },
                { name: 'Укладка пола', quantity: area, unit: 'м²', price: Math.round(getKZPrice('укладка ламинат', 900) * rc) },
                { name: 'Установка смесителя', quantity: 1, unit: 'шт', price: Math.round(5000 * rc) },
                { name: 'Монтаж вытяжки', quantity: 1, unit: 'шт', price: Math.round(4000 * rc) }
            ]
        };
    }

    // Генерация моковых контуров (legacy)
    function generateMockContours() {
        const count = Math.floor(Math.random() * 3) + 1;
        const contours = [];
        for (let i = 0; i < count; i++) {
            contours.push({
                id: `contour_${i}`,
                type: 'polygon',
                area: 50000 + Math.random() * 150000, // pixels
                points: [], // Точки контура
                label: `Область ${i + 1}`
            });
        }
        return contours;
    }

    function delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // ========== PUBLIC API ==========

    const EstimateAPI = {
        /**
         * Создать новый расчёт (минимально)
         */
        create(title = '') {
            const userId = getCurrentUserId();
            const estimate = new Estimate({
                userId,
                title: title || '',
                status: EstimateStatus.DRAFT,
                city: localStorage.getItem('userCity') || ''
            });
            estimate.save();

            window.Models?.AuditLog?.log?.('estimate', estimate.id, 'created', {});

            return { success: true, data: estimate };
        },

        /**
         * Загрузить фото в расчёт
         */
        async addPhoto(estimateId, photoDataUrl) {
            const estimate = Estimate.find(estimateId);
            if (!estimate) {
                return { success: false, error: 'Расчёт не найден' };
            }

            if (estimate.photos.length >= CONFIG.MAX_PHOTOS) {
                return { success: false, error: `Максимум ${CONFIG.MAX_PHOTOS} фото` };
            }

            // Создаём объект Image для получения размеров
            const img = new Image();
            await new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = reject;
                img.src = photoDataUrl;
            });

            const photo = estimate.addPhoto({
                originalSrc: photoDataUrl,
                thumbnailSrc: photoDataUrl, // В реальности - уменьшенная версия
                width: img.width,
                height: img.height,
                status: 'pending'
            });

            photo.checkQuality();
            estimate.status = EstimateStatus.UPLOADING;
            estimate.save();

            return { success: true, data: { estimate, photo } };
        },

        /**
         * Запустить автоматическую обработку
         */
        async process(estimateId) {
            const estimate = Estimate.find(estimateId);
            if (!estimate) {
                return { success: false, error: 'Расчёт не найден' };
            }

            if (!estimate.canProcess()) {
                return { success: false, error: 'Добавьте хотя бы одно фото' };
            }

            estimate.status = EstimateStatus.PROCESSING;
            estimate.save();

            try {
                // Шаг 1: Анализ всех фото
                const analysisResults = [];
                for (const photo of estimate.photos) {
                    if (photo.status !== 'error') {
                        const result = await analyzePhoto(photo);
                        analysisResults.push(result);
                    }
                }

                // Определяем тип объекта (голосование)
                const typeCounts = {};
                let maxType = ObjectType.UNKNOWN;
                let maxCount = 0;
                let avgConfidence = 0;

                analysisResults.forEach(r => {
                    typeCounts[r.objectType] = (typeCounts[r.objectType] || 0) + 1;
                    avgConfidence += r.confidence;
                    if (typeCounts[r.objectType] > maxCount) {
                        maxCount = typeCounts[r.objectType];
                        maxType = r.objectType;
                    }
                });

                avgConfidence = avgConfidence / analysisResults.length;
                estimate.objectType = maxType;
                estimate.objectTypeConfidence = avgConfidence;
                estimate.objectTypeSource = 'auto';

                // Шаг 2: Поиск масштаба
                const scaleResult = await detectScale(estimate.photos);
                estimate.scale = scaleResult.scale;
                estimate.scaleSource = scaleResult.source;
                estimate.scaleReference = scaleResult.reference;

                // Проверяем, нужен ли ввод от пользователя
                if (estimate.needsScaleInput() && estimate.scaleSource === ScaleSource.UNKNOWN) {
                    estimate.status = EstimateStatus.NEEDS_SCALE;
                    estimate.save();
                    return {
                        success: true,
                        needsInput: true,
                        inputType: 'scale',
                        data: estimate
                    };
                }

                if (estimate.needsTypeInput()) {
                    estimate.status = EstimateStatus.NEEDS_TYPE;
                    estimate.save();
                    return {
                        success: true,
                        needsInput: true,
                        inputType: 'type',
                        suggestedType: maxType,
                        confidence: avgConfidence,
                        data: estimate
                    };
                }

                // Шаг 3: Расчёт объёмов
                estimate.results = calculateVolumes(estimate);

                // Шаг 4: Расчёт точности
                estimate.calculateAccuracy();

                // Автогенерация названия
                estimate.generateTitle();

                estimate.status = EstimateStatus.READY;
                estimate.processedAt = new Date().toISOString();
                estimate.save();

                window.Models?.AuditLog?.log?.('estimate', estimate.id, 'processed', {
                    objectType: estimate.objectType,
                    accuracy: estimate.accuracy
                });

                return { success: true, data: estimate };

            } catch (error) {
                console.error('Estimate processing error:', error);
                estimate.status = EstimateStatus.ERROR;
                estimate.save();
                return { success: false, error: error.message };
            }
        },

        /**
         * Установить масштаб вручную
         */
        setScale(estimateId, realSize, unit = 'm') {
            const estimate = Estimate.find(estimateId);
            if (!estimate) {
                return { success: false, error: 'Расчёт не найден' };
            }

            // Конвертируем в метры
            let sizeInMeters = realSize;
            if (unit === 'cm') sizeInMeters = realSize / 100;
            if (unit === 'mm') sizeInMeters = realSize / 1000;

            // Примерный расчёт масштаба (pixels per meter)
            // Используем первое фото и предполагаем, что указанный размер - ширина первого контура
            const photo = estimate.photos[0];
            if (photo && photo.contours.length > 0) {
                const contourWidthPixels = Math.sqrt(photo.contours[0].area); // Приблизительно
                estimate.scale = contourWidthPixels / sizeInMeters;
            } else {
                estimate.scale = 100; // Дефолт
            }

            estimate.scaleSource = ScaleSource.USER_INPUT;
            estimate.scaleReference = `${realSize} ${unit}`;
            estimate.save();

            return { success: true, data: estimate };
        },

        /**
         * Установить тип объекта вручную
         */
        setObjectType(estimateId, objectType) {
            const estimate = Estimate.find(estimateId);
            if (!estimate) {
                return { success: false, error: 'Расчёт не найден' };
            }

            estimate.objectType = objectType;
            estimate.objectTypeConfidence = 100;
            estimate.objectTypeSource = 'user';
            estimate.save();

            return { success: true, data: estimate };
        },

        /**
         * Установить параметры объекта (ширина/глубина фундамента и т.д.)
         */
        setObjectParams(estimateId, params) {
            const estimate = Estimate.find(estimateId);
            if (!estimate) {
                return { success: false, error: 'Расчёт не найден' };
            }

            estimate.objectParams = { ...estimate.objectParams, ...params };
            estimate.save();

            return { success: true, data: estimate };
        },

        /**
         * Сохранить ручные позиции (вывоз мусора, охрана т.д.)
         */
        setManualItems(estimateId, items) {
            const estimate = Estimate.find(estimateId);
            if (!estimate) return { success: false, error: 'Расчёт не найден' };
            estimate.manualItems = Array.isArray(items) ? items : [];
            estimate.save();
            return { success: true };
        },

        /**
         * Пересчитать объёмы
         */
        recalculate(estimateId) {
            const estimate = Estimate.find(estimateId);
            if (!estimate) {
                return { success: false, error: 'Расчёт не найден' };
            }

            // Сохраняем версию
            if (estimate.results) {
                estimate.saveVersion();
            }

            // Пересчёт
            estimate.results = calculateVolumes(estimate);
            estimate.calculateAccuracy();
            estimate.generateTitle();
            estimate.status = EstimateStatus.READY;
            estimate.save();

            return { success: true, data: estimate };
        },


        /**
         * Получить расчёт
         */
        get(estimateId) {
            const estimate = Estimate.find(estimateId);
            if (!estimate) {
                return { success: false, error: 'Расчёт не найден' };
            }
            return { success: true, data: estimate };
        },

        /**
         * Список расчётов пользователя
         */
        list() {
            const userId = getCurrentUserId();
            const estimates = Estimate.findByUser(userId);
            return { success: true, data: estimates };
        },

        /**
         * Удалить расчёт
         */
        delete(estimateId) {
            const estimate = Estimate.find(estimateId);
            if (!estimate) {
                return { success: false, error: 'Расчёт не найден' };
            }
            estimate.delete();
            return { success: true };
        },

        /**
         * Удалить фото из расчёта
         */
        removePhoto(estimateId, photoId) {
            const estimate = Estimate.find(estimateId);
            if (!estimate) {
                return { success: false, error: 'Расчёт не найден' };
            }

            estimate.photos = estimate.photos.filter(p => p.id !== photoId);
            estimate.save();

            return { success: true, data: estimate };
        },

        /**
         * Генерация PDF — реальный файл через jsPDF + autoTable
         */
        generatePDF(estimateId, options = {}) {
            const estimate = Estimate.find(estimateId);
            if (!estimate || !estimate.results) {
                return { success: false, error: 'Результаты не готовы' };
            }

            // ── Определяем jsPDF (CDN грузит в window.jspdf или window.jsPDF)
            const jsPDFClass = (window.jspdf && window.jspdf.jsPDF) ||
                window.jsPDF ||
                (window.jsPDFAPI && window.jsPDFAPI.jsPDF);

            if (!jsPDFClass) {
                // Fallback: print-версия
                return EstimateAPI._generatePrintPDF(estimate);
            }

            const r = estimate.results;
            const materials = r.materials || [];
            const works = r.works || [];
            const manualItems = estimate.manualItems || [];
            const totalMat = materials.reduce((s, m) => s + (m.quantity || 0) * (m.price || 0), 0);
            const totalWork = works.reduce((s, w) => s + (w.quantity || 0) * (w.price || 0), 0);
            const totalMan = manualItems.reduce((s, it) => s + (it.qty || 0) * (it.price || 0), 0);
            const grandTotal = totalMat + totalWork + totalMan;

            const acc = estimate.accuracy || 70;
            const accRange = acc >= 85 ? '±5%' : acc >= 65 ? '±15%' : '±30%';

            const doc = new jsPDFClass({ unit: 'mm', format: 'a4', orientation: 'portrait' });
            const W = doc.internal.pageSize.getWidth();
            const BLUE = [30, 64, 175];
            const GRAY = [100, 100, 100];
            const LIGHT = [248, 250, 252];

            // ── ШАПКА
            doc.setFillColor(...BLUE);
            doc.rect(0, 0, W, 28, 'F');

            doc.setTextColor(255, 255, 255);
            doc.setFontSize(16);
            doc.setFont('helvetica', 'bold');
            doc.text('QazGost AI', 14, 12);

            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            doc.text('Автоматизированный расчёт строительных работ', 14, 19);

            doc.setFontSize(8);
            doc.text(`Дата: ${new Date().toLocaleDateString('ru-RU')}   |   ID: ${estimateId}`, W - 14, 19, { align: 'right' });

            // ── ЗАГОЛОВОК СМЕТЫ
            let y = 36;
            doc.setTextColor(30, 30, 30);
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text(estimate.title || 'Расчёт стоимости', 14, y);

            y += 7;
            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(...GRAY);

            const region = estimate.region || '';
            const address = estimate.address || '';
            const infoLine = [region, address].filter(Boolean).join(' · ');
            if (infoLine) { doc.text(infoLine, 14, y); y += 5; }

            // Точность
            const accColor = acc >= 85 ? [22, 163, 74] : acc >= 65 ? [180, 90, 0] : [185, 28, 28];
            doc.setTextColor(...accColor);
            doc.setFontSize(9);
            doc.text(`Точность расчёта: ${acc}% (${accRange})`, 14, y);
            y += 7;

            // ── ПАРАМЕТРЫ ОБЪЕКТА
            if (r.items && r.items.length > 0) {
                doc.setTextColor(30, 30, 30);
                doc.setFontSize(10);
                doc.setFont('helvetica', 'bold');
                doc.text('Параметры объекта', 14, y);
                y += 4;

                doc.autoTable({
                    startY: y,
                    head: [['Параметр', 'Значение', 'Ед. изм.']],
                    body: r.items.map(it => [it.name, String(it.value ?? ''), it.unit || '']),
                    styles: { fontSize: 8, cellPadding: 2.5 },
                    headStyles: { fillColor: BLUE, textColor: 255, fontStyle: 'bold' },
                    alternateRowStyles: { fillColor: LIGHT },
                    columnStyles: { 0: { cellWidth: 80 }, 1: { cellWidth: 50 }, 2: { cellWidth: 30 } },
                    margin: { left: 14, right: 14 }
                });
                y = doc.lastAutoTable.finalY + 6;
            }

            // ── МАТЕРИАЛЫ
            if (materials.length > 0) {
                doc.setTextColor(30, 30, 30);
                doc.setFontSize(10);
                doc.setFont('helvetica', 'bold');
                doc.text('Материалы', 14, y);
                y += 4;

                doc.autoTable({
                    startY: y,
                    head: [['Наименование', 'Кол-во', 'Ед.', 'Цена, ₸', 'Сумма, ₸']],
                    body: materials.map(m => {
                        const sum = (m.quantity || 0) * (m.price || 0);
                        return [m.name, (m.quantity || 0).toFixed(2), m.unit || '', (m.price || 0).toLocaleString('ru-RU'), sum.toLocaleString('ru-RU')];
                    }),
                    foot: [['', '', '', 'Итого материалы:', totalMat.toLocaleString('ru-RU') + ' ₸']],
                    styles: { fontSize: 8, cellPadding: 2.5 },
                    headStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: 'bold' },
                    footStyles: { fillColor: [220, 240, 255], textColor: [10, 40, 120], fontStyle: 'bold', fontSize: 9 },
                    alternateRowStyles: { fillColor: LIGHT },
                    columnStyles: { 0: { cellWidth: 75 }, 3: { halign: 'right' }, 4: { halign: 'right', fontStyle: 'bold' } },
                    margin: { left: 14, right: 14 }
                });
                y = doc.lastAutoTable.finalY + 6;
            }

            // ── РАБОТЫ
            if (works.length > 0) {
                // Новая страница если мало места
                if (y > 220) { doc.addPage(); y = 14; }

                doc.setTextColor(30, 30, 30);
                doc.setFontSize(10);
                doc.setFont('helvetica', 'bold');
                doc.text('Работы', 14, y);
                y += 4;

                doc.autoTable({
                    startY: y,
                    head: [['Наименование работы', 'Объём', 'Ед.', 'Расценка, ₸', 'Сумма, ₸']],
                    body: works.map(w => {
                        const sum = (w.quantity || 0) * (w.price || 0);
                        return [w.name, (w.quantity || 0).toFixed(2), w.unit || '', (w.price || 0).toLocaleString('ru-RU'), sum.toLocaleString('ru-RU')];
                    }),
                    foot: [['', '', '', 'Итого работы:', totalWork.toLocaleString('ru-RU') + ' ₸']],
                    styles: { fontSize: 8, cellPadding: 2.5 },
                    headStyles: { fillColor: [79, 70, 229], textColor: 255, fontStyle: 'bold' },
                    footStyles: { fillColor: [230, 228, 255], textColor: [40, 20, 140], fontStyle: 'bold', fontSize: 9 },
                    alternateRowStyles: { fillColor: LIGHT },
                    columnStyles: { 0: { cellWidth: 75 }, 3: { halign: 'right' }, 4: { halign: 'right', fontStyle: 'bold' } },
                    margin: { left: 14, right: 14 }
                });
                y = doc.lastAutoTable.finalY + 6;
            }

            // ── ДОП. ПОЗИЦИИ
            if (manualItems.length > 0) {
                if (y > 220) { doc.addPage(); y = 14; }
                doc.setTextColor(30, 30, 30);
                doc.setFontSize(10);
                doc.setFont('helvetica', 'bold');
                doc.text('Дополнительные позиции', 14, y);
                y += 4;

                doc.autoTable({
                    startY: y,
                    head: [['Наименование', 'Кол-во', 'Ед.', 'Цена, ₸', 'Сумма, ₸']],
                    body: manualItems.map(it => {
                        const sum = (it.qty || 0) * (it.price || 0);
                        return [it.name, it.qty || 1, it.unit || 'шт', (it.price || 0).toLocaleString('ru-RU'), sum.toLocaleString('ru-RU')];
                    }),
                    styles: { fontSize: 8, cellPadding: 2.5 },
                    headStyles: { fillColor: [100, 100, 100], textColor: 255 },
                    alternateRowStyles: { fillColor: LIGHT },
                    margin: { left: 14, right: 14 }
                });
                y = doc.lastAutoTable.finalY + 6;
            }

            // ── ИТОГОВАЯ СТРОКА
            if (y > 240) { doc.addPage(); y = 14; }
            doc.setFillColor(22, 163, 74);
            doc.rect(14, y, W - 28, 12, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text('ИТОГО:', 18, y + 8);
            doc.text(grandTotal.toLocaleString('ru-RU') + ' ₸', W - 18, y + 8, { align: 'right' });
            y += 18;

            // ── ПРЕДУПРЕЖДЕНИЯ
            if (acc < 80 && estimate.accuracyReasons?.length > 0) {
                doc.setTextColor(180, 90, 0);
                doc.setFontSize(8);
                doc.setFont('helvetica', 'italic');
                const warn = '⚠ ' + estimate.accuracyReasons.slice(0, 3).join(' | ');
                doc.text(warn, 14, y, { maxWidth: W - 28 });
                y += 8;
            }

            // ── НИЖНИЙ КОЛОНТИТУЛ
            const pageCount = doc.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.setFontSize(7);
                doc.setTextColor(...GRAY);
                doc.text(
                    `QazGost AI • Документ сформирован автоматически • ${new Date().toLocaleString('ru-RU')} • Стр. ${i}/${pageCount}`,
                    W / 2, doc.internal.pageSize.getHeight() - 6, { align: 'center' }
                );
            }

            // ── СКАЧАТЬ
            const fileName = (estimate.title || 'Смета')
                .replace(/[^а-яёА-ЯЁa-zA-Z0-9\s]/g, '')
                .trim()
                .replace(/\s+/g, '_') + '_' + new Date().toISOString().slice(0, 10) + '.pdf';
            doc.save(fileName);
            return { success: true, fileName };
        },

        /** Fallback: открыть печатную версию в новом окне */
        _generatePrintPDF(estimate) {
            const r = estimate.results || {};
            const materials = r.materials || [];
            const works = r.works || [];
            const totalMat = materials.reduce((s, m) => s + (m.quantity || 0) * (m.price || 0), 0);
            const totalWork = works.reduce((s, w) => s + (w.quantity || 0) * (w.price || 0), 0);

            const html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
<title>${estimate.title || 'Смета'}</title>
<style>
body{font-family:Arial,sans-serif;padding:32px;color:#222}
h1{color:#1e40af}table{width:100%;border-collapse:collapse;margin:16px 0}
th,td{border:1px solid #ccc;padding:8px;text-align:left}
th{background:#f1f5f9}.total{font-size:1.2em;font-weight:bold;text-align:right;margin-top:12px}
</style></head><body>
<h1>QazGost AI — ${estimate.title || 'Расчёт'}</h1>
<p>Точность: ${estimate.accuracy || 70}%  |  Регион: ${estimate.region || '—'}</p>
${materials.length > 0 ? `<h2>Материалы</h2><table><tr><th>Наименование</th><th>Кол-во</th><th>Ед.</th><th>Цена ₸</th><th>Сумма ₸</th></tr>
${materials.map(m => `<tr><td>${m.name}</td><td>${(m.quantity || 0).toFixed(2)}</td><td>${m.unit || ''}</td><td>${(m.price || 0).toLocaleString()}</td><td>${((m.quantity || 0) * (m.price || 0)).toLocaleString()}</td></tr>`).join('')}
</table><div class="total">Материалы: ${totalMat.toLocaleString()} ₸</div>` : ''}
${works.length > 0 ? `<h2>Работы</h2><table><tr><th>Работа</th><th>Объём</th><th>Ед.</th><th>Расценка ₸</th><th>Сумма ₸</th></tr>
${works.map(w => `<tr><td>${w.name}</td><td>${(w.quantity || 0).toFixed(2)}</td><td>${w.unit || ''}</td><td>${(w.price || 0).toLocaleString()}</td><td>${((w.quantity || 0) * (w.price || 0)).toLocaleString()}</td></tr>`).join('')}
</table><div class="total">Работы: ${totalWork.toLocaleString()} ₸</div>` : ''}
<div class="total" style="font-size:1.4em;border-top:2px solid #1e40af;padding-top:8px">ИТОГО: ${(totalMat + totalWork).toLocaleString()} ₸</div>
</body></html>`;

            const w = window.open('', '_blank');
            if (w) { w.document.write(html); w.document.close(); w.print(); }
            return { success: true };
        },




        /**
         * Экспорт в CSV (открывается в Excel, LibreOffice Calc)
         */
        exportCSV(estimateId) {
            const estimate = Estimate.find(estimateId);
            if (!estimate || !estimate.results) {
                return { success: false, error: 'Результаты не готовы' };
            }
            const r = estimate.results;
            const materials = r.materials || [];
            const works = r.works || [];
            const manualItems = estimate.manualItems || [];

            // Колонки: Тип | Наименование | Кол-во | Ед. | Цена | Сумма
            const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;

            const rows = [
                [esc('QazGost AI — Смета'), esc(estimate.title || ''), '', '', '', ''],
                [esc('Регион'), esc(estimate.region || ''), '', '', '', ''],
                [esc('Адрес'), esc(estimate.address || ''), '', '', '', ''],
                [esc('Точность'), esc((estimate.accuracy || 70) + '%'), '', '', '', ''],
                ['', '', '', '', '', ''],
                [esc('Тип'), esc('Наименование'), esc('Кол-во'), esc('Ед.'), esc('Цена ₸'), esc('Сумма ₸')]
            ];

            let totalMat = 0, totalWork = 0, totalMan = 0;
            materials.forEach(m => {
                const sum = (m.quantity || 0) * (m.price || 0);
                totalMat += sum;
                rows.push([esc('Материал'), esc(m.name), m.quantity?.toFixed(2) || '0', esc(m.unit || ''), m.price || 0, sum]);
            });
            if (materials.length > 0) rows.push(['', esc('ИТОГО материалы'), '', '', '', totalMat]);

            rows.push(['', '', '', '', '', '']);
            works.forEach(w => {
                const sum = (w.quantity || 0) * (w.price || 0);
                totalWork += sum;
                rows.push([esc('Работа'), esc(w.name), w.quantity?.toFixed(2) || '0', esc(w.unit || ''), w.price || 0, sum]);
            });
            if (works.length > 0) rows.push(['', esc('ИТОГО работы'), '', '', '', totalWork]);

            if (manualItems.length > 0) {
                rows.push(['', '', '', '', '', '']);
                manualItems.forEach(it => {
                    const sum = (it.qty || 0) * (it.price || 0);
                    totalMan += sum;
                    rows.push([esc('Доп.'), esc(it.name), it.qty || 1, esc(it.unit || 'шт'), it.price || 0, sum]);
                });
            }

            rows.push(['', '', '', '', '', '']);
            rows.push(['', esc('ИТОГО'), '', '', '', totalMat + totalWork + totalMan]);

            const csv = '\uFEFF' + rows.map(r => r.join(';')).join('\r\n');
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = (estimate.title || 'Смета').replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '_')
                + '_' + new Date().toISOString().slice(0, 10) + '.csv';
            document.body.appendChild(a);
            a.click();
            setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 1000);
            return { success: true };
        },

        /**
         * Сравнение двух версий сметы
         */

        /**
         * Анализ фото + полный pipeline (для EstimateWizard)
         * Создаёт смету, добавляет фото, считает объёмы
         */
        async analyzePhoto(photoFile, photoName, options = {}) {
            const region = options.region || '';
            // Создаём смету
            const createResult = EstimateAPI.create(photoName || 'Новая смета');
            if (!createResult.success) return createResult;
            const estimate = createResult.data;
            estimate.region = region;
            estimate.save();

            // Конвертируем файл в dataURL
            const dataUrl = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = e => resolve(e.target.result);
                reader.onerror = reject;
                reader.readAsDataURL(photoFile);
            });

            // Добавляем фото
            const addResult = await EstimateAPI.addPhoto(estimate.id, dataUrl);
            if (!addResult.success) return addResult;

            // Запускаем AI pipeline
            const processResult = await EstimateAPI.process(estimate.id);
            if (!processResult.success) return processResult;

            const processed = processResult.data;
            // Формируем ответ совместимый с estimateWizardUI
            return {
                success: true,
                data: {
                    id: processed.id,
                    objectType: processed.objectType,
                    objectTypeConfidence: processed.objectTypeConfidence,
                    objectParams: processed.objectParams || {},
                    dimensions: processed.results ? {
                        widthM: Math.sqrt(processed.results.area || 0),
                        heightM: Math.sqrt(processed.results.area || 0),
                        areaM2: processed.results.area || 0
                    } : null,
                    scale: processed.scale,
                    accuracy: processed.objectTypeConfidence || 70,
                    accuracyReasons: processed.accuracyReasons || [],
                    defects: processed.photos?.[0]?.analysisResult?.defects || [],
                    signals: processed.photos?.[0]?.analysisResult?.signals || [],
                    lighting: processed.photos?.[0]?.analysisResult?.lighting || null,
                    results: processed.results,
                    versions: processed.versions || []
                }
            };

        },

        compareVersions(estimateId, versionA, versionB) {
            const estimate = Estimate.find(estimateId);
            if (!estimate) {
                return { success: false, error: 'Расчёт не найден' };
            }

            const versions = estimate.versions || [];
            const getVer = (v) => {
                if (v === 'current') return estimate.results;
                const found = versions.find(ver => ver.version === v);
                return found ? found.results : null;
            };

            const a = getVer(versionA);
            const b = getVer(versionB);
            if (!a || !b) {
                return { success: false, error: 'Версия не найдена' };
            }

            // Сравнение материалов
            function diffItems(listA, listB) {
                const changes = [];
                const mapA = new Map(listA.map(m => [m.name, m]));
                const mapB = new Map(listB.map(m => [m.name, m]));

                for (const [name, itemB] of mapB) {
                    const itemA = mapA.get(name);
                    if (!itemA) {
                        changes.push({ name, status: 'added', newQty: itemB.quantity, newPrice: itemB.price });
                    } else {
                        const qtyDelta = itemB.quantity - itemA.quantity;
                        const priceDelta = itemB.price - itemA.price;
                        if (Math.abs(qtyDelta) > 0.01 || Math.abs(priceDelta) > 0.01) {
                            changes.push({
                                name, status: 'changed',
                                oldQty: itemA.quantity, newQty: itemB.quantity, qtyDelta,
                                oldPrice: itemA.price, newPrice: itemB.price, priceDelta,
                                oldSum: itemA.quantity * itemA.price,
                                newSum: itemB.quantity * itemB.price
                            });
                        }
                    }
                }

                for (const [name] of mapA) {
                    if (!mapB.has(name)) {
                        const itemA = mapA.get(name);
                        changes.push({ name, status: 'removed', oldQty: itemA.quantity, oldPrice: itemA.price });
                    }
                }

                return changes;
            }

            const totalA = (a.materials || []).reduce((s, m) => s + m.quantity * m.price, 0)
                + (a.works || []).reduce((s, w) => s + w.quantity * w.price, 0);
            const totalB = (b.materials || []).reduce((s, m) => s + m.quantity * m.price, 0)
                + (b.works || []).reduce((s, w) => s + w.quantity * w.price, 0);

            return {
                success: true,
                data: {
                    versionA, versionB,
                    materialChanges: diffItems(a.materials || [], b.materials || []),
                    workChanges: diffItems(a.works || [], b.works || []),
                    totalA, totalB,
                    totalDelta: totalB - totalA,
                    totalDeltaPercent: totalA ? ((totalB - totalA) / totalA * 100).toFixed(1) : '0'
                }
            };
        }
    };

    // ========== EXPORT ==========
    window.EstimateService = {
        API: EstimateAPI,
        CONFIG,
        SNIP_COEFFICIENTS,
        REGIONAL_COEFFICIENTS,
        // PDF API для совместимости с modulesUI.js
        PDF: {
            generate: (estimateId, versionNo) => EstimateAPI.generatePDF(estimateId)
        }
    };

    console.log('✅ EstimateService v3.0 loaded (SNiP + Extended)');

})();
