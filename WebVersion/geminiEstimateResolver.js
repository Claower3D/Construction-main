// ================================================================
// geminiEstimateResolver.js — Матчер AI → WorkRegistry + MAT/EQ
// QazGost AI v3.0 · Модуль «Оценка стоимости с помощью ИИ»
//
// Сопоставляет каждую позицию из Gemini AI с записью
// в справочнике WorkRegistry (12 754+ работ), AI_MAT_* (10 619
// материалов) и AI_EQ_* (~500 техники) через fuzzy-search.
// ================================================================
(function () {
    'use strict';

    // ═══════════════════════════════════════════════════════════
    // НОРМАЛИЗАЦИЯ ТЕКСТА для fuzzy match
    // ═══════════════════════════════════════════════════════════

    const STOP_WORDS = new Set([
        'и', 'в', 'на', 'с', 'по', 'для', 'от', 'из', 'до', 'за', 'под',
        'при', 'без', 'к', 'об', 'о', 'через', 'между', 'после', 'до',
        'работы', 'работа', 'услуги', 'услуга', 'выполнение',
    ]);

    /**
     * Нормализовать строку для сравнения:
     * - lowercase
     * - убрать спецсимволы и размеры (Ø, ×, мм, °)
     * - убрать стоп-слова
     * - стемминг окончаний (-ка, -ки, -ние, -ция, -ный, -ная)
     */
    function normalize(text) {
        if (!text) return '';
        let t = text.toLowerCase()
            .replace(/[«»"'`]/g, '')
            .replace(/[Øø×xх]/g, ' ')
            .replace(/\d+\s*(мм|см|м\b|м²|м³|м\.п\.?|кг|т\b|шт|л\b)/gi, '')
            .replace(/\d+[.,]\d+/g, '')
            .replace(/\d+/g, '')
            .replace(/[^а-яёa-z\s]/gi, ' ')
            .replace(/\s+/g, ' ')
            .trim();

        const words = t.split(' ').filter(w => w.length > 1 && !STOP_WORDS.has(w));

        // Rough stemming: remove common Russian suffixes
        return words.map(w => {
            return w
                .replace(/(ного|ной|ных|ному|ным|ную|нее|ние|ния|нию|ной|ов|ов|ая|ое|ый|ий|ой|ую|ее|ие|ые|ых|ом|ем|ей|ам|ям|ов|ев|ых|их|ут|ют|ат|ят|ит|ет|ёт|ут|ют)$/i, '')
                .replace(/(ка|ки|ке|ку|ко|кой|ков|кам)$/i, 'к')
                .replace(/(ция|ции|цию|цией)$/i, 'ц')
                .replace(/(тель|теля|телю|телем)$/i, 'т');
        }).join(' ');
    }

    // ═══════════════════════════════════════════════════════════
    // СЕМАНТИЧЕСКИЕ СИНОНИМЫ
    // ═══════════════════════════════════════════════════════════

    const SYNONYMS = {
        'штукатурк': ['оштукатурив', 'штукатурн', 'плястер'],
        'шпаклёвк': ['шпатлёвк', 'выравнив', 'финишн'],
        'покраск': ['окраск', 'покрас', 'малярн'],
        'грунтовк': ['праймер', 'грунт'],
        'плитк': ['кафел', 'керамогранит', 'кафельн'],
        'ламинат': ['паркетн доск', 'напольн покрыт'],
        'гипсокартон': ['гкл', 'гклв', 'гипрок', 'сухая штукатурк'],
        'стяжк': ['наливн пол', 'самовыравнив', 'цементн стяжк'],
        'кровл': ['крыш', 'черепиц', 'профнастил кровл'],
        'фундамент': ['основани', 'ленточн', 'плитн фунд', 'свайн'],
        'электрик': ['электромонтаж', 'проводк', 'кабел'],
        'сантехник': ['водопровод', 'канализац', 'трубопровод'],
        'утеплен': ['теплоизоляц', 'термоизоляц', 'ЭППС', 'минват'],
        'демонтаж': ['разборк', 'снос', 'демонт'],
        'кладк': ['кирпичн', 'блочн', 'стен'],
        'вентиляц': ['кондиционир', 'hvac', 'воздуховод'],
        'отоплен': ['радиатор', 'котёл', 'тёплый пол'],
    };

    /**
     * Расширить запрос синонимами
     */
    function expandWithSynonyms(normalizedText) {
        const variants = [normalizedText];
        for (const [root, syns] of Object.entries(SYNONYMS)) {
            if (normalizedText.includes(root)) {
                syns.forEach(s => variants.push(normalizedText.replace(new RegExp(root, 'gi'), s)));
            }
            for (const s of syns) {
                if (normalizedText.includes(s)) {
                    variants.push(normalizedText.replace(new RegExp(s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), root));
                }
            }
        }
        return [...new Set(variants)];
    }

    // ═══════════════════════════════════════════════════════════
    // СКОРИНГ: Jaccard + порядок слов + длина
    // ═══════════════════════════════════════════════════════════

    function jaccardScore(a, b) {
        const setA = new Set(a.split(' ').filter(Boolean));
        const setB = new Set(b.split(' ').filter(Boolean));
        if (setA.size === 0 || setB.size === 0) return 0;
        let intersection = 0;
        for (const w of setA) if (setB.has(w)) intersection++;
        return intersection / (setA.size + setB.size - intersection);
    }

    function substringBonus(a, b) {
        // Bonus if one contains the other (after normalization)
        if (a.includes(b) || b.includes(a)) return 0.2;
        // Check if all words of shorter are in longer
        const shorter = a.length < b.length ? a : b;
        const longer = a.length < b.length ? b : a;
        const words = shorter.split(' ').filter(Boolean);
        if (words.length > 0 && words.every(w => longer.includes(w))) return 0.15;
        return 0;
    }

    function computeScore(queryNorm, candidateNorm) {
        const j = jaccardScore(queryNorm, candidateNorm);
        const sub = substringBonus(queryNorm, candidateNorm);
        // Penalize if lengths differ greatly
        const lenRatio = Math.min(queryNorm.length, candidateNorm.length) / Math.max(queryNorm.length, candidateNorm.length, 1);
        const lenBonus = lenRatio * 0.1;
        return Math.min(1.0, j + sub + lenBonus);
    }

    // ═══════════════════════════════════════════════════════════
    // ОСНОВНОЙ ПОИСК
    // ═══════════════════════════════════════════════════════════

    /**
     * Найти лучший матч в WorkRegistry для названия работы.
     * @param {string} workName — "Штукатурка стен по маякам"
     * @param {string} [groupKey] — ограничить группу ('foundation')
     * @returns {{ work: object, score: number, method: string }|null}
     */
    function findBestMatch(workName, groupKey) {
        const WR = window.WorkRegistry;
        if (!WR) return null;

        const queryNorm = normalize(workName);
        if (!queryNorm || queryNorm.length < 2) return null;

        // Get candidate works
        let candidates;
        if (groupKey) {
            candidates = WR.getWorksByGroup(groupKey) || [];
            // If few results in specific group, also search broader
            if (candidates.length < 10) {
                const allWorks = WR.search(workName.substring(0, 20)) || [];
                candidates = [...candidates, ...allWorks];
            }
        } else {
            // Search by text first (faster than scanning all 12k)
            candidates = WR.search(workName.substring(0, 30)) || [];
            if (candidates.length < 5) {
                // Try shorter query
                const shortQuery = workName.split(' ').slice(0, 2).join(' ');
                const more = WR.search(shortQuery) || [];
                candidates = [...candidates, ...more];
            }
        }

        // Deduplicate
        const seen = new Set();
        candidates = candidates.filter(c => {
            if (seen.has(c.id)) return false;
            seen.add(c.id);
            return true;
        });

        if (candidates.length === 0) return null;

        // Expand query with synonyms
        const queryVariants = expandWithSynonyms(queryNorm);

        let bestWork = null;
        let bestScore = 0;
        let bestMethod = 'none';

        for (const work of candidates) {
            const candidateNorm = normalize(work.name);
            if (!candidateNorm) continue;

            // Try all variants
            for (const variant of queryVariants) {
                const score = computeScore(variant, candidateNorm);

                // Bonus for matching group
                const groupBonus = (groupKey && work.group === groupKey) ? 0.05 : 0;
                const finalScore = Math.min(1.0, score + groupBonus);

                if (finalScore > bestScore) {
                    bestScore = finalScore;
                    bestWork = work;
                    bestMethod = variant === queryNorm ? 'fuzzy' : 'synonym';
                }
            }

            // Also check exact substring (original, not normalized)
            if (work.name.toLowerCase().includes(workName.toLowerCase().substring(0, 15))) {
                const directScore = 0.8;
                if (directScore > bestScore) {
                    bestScore = directScore;
                    bestWork = work;
                    bestMethod = 'substring';
                }
            }
        }

        if (!bestWork || bestScore < 0.25) return null;

        return { work: bestWork, score: bestScore, method: bestMethod };
    }

    // ═══════════════════════════════════════════════════════════
    // RESOLVE ITEMS: обогащение массива от Gemini
    // ═══════════════════════════════════════════════════════════

    /**
     * Принять массив estimate_items от Gemini и обогатить ценами из справочника.
     * @param {Array} geminiItems — [{ name, unit, quantity, price, category }]
     * @param {string} objectType — тип объекта от Gemini (e.g. 'foundation')
     * @returns {Array} — обогащённые items
     */
    function resolveItems(geminiItems, objectType) {
        if (!geminiItems || !Array.isArray(geminiItems)) return [];

        const WR = window.WorkRegistry;
        // Map objectType → WorkRegistry group
        const typeToGroup = {
            foundation_strip: 'foundation', foundation_slab: 'foundation',
            foundation_pile: 'foundation', foundation: 'foundation',
            wall_brick: 'masonry', wall_block: 'masonry', wall_concrete: 'concrete',
            masonry: 'masonry', concrete: 'concrete',
            slab: 'concrete', floor_screed: 'flooring', floor_tile: 'flooring',
            roof_gable: 'roofing', roof_flat: 'roofing', roof_profiled_sheet: 'roofing',
            roofing: 'roofing',
            metal_structure: 'metalwork', profiled_sheet: 'metalwork', steel_frame: 'metalwork',
            metalwork: 'metalwork',
            pipe_pvc: 'plumbing', pipe_metal: 'plumbing', plumbing: 'plumbing',
            electrical: 'electrical', hvac: 'hvac',
            painting: 'finishing_walls', plastering: 'finishing_walls',
            tiling: 'flooring', flooring: 'flooring',
            insulation: 'insulation', waterproofing: 'plumbing',
            facade: 'facade', interior: 'finishing_walls',
            demolition: 'demolition', earthwork: 'earthworks',
            landscape: 'landscape', windows_doors: 'openings',
        };
        const groupKey = typeToGroup[objectType] || null;

        let matchedFromDB = 0;
        let matchedFromPriceKZ = 0;
        let fromGemini = 0;

        const resolved = geminiItems.map(item => {
            const result = { ...item };
            result.added_by = item.added_by || 'gemini';

            // Try to find match in WorkRegistry
            const match = findBestMatch(item.name, groupKey);

            if (match && match.score >= 0.4) {
                result.matched_work_id = match.work.id;
                result.matched_work_name = match.work.name;
                result.match_score = match.score;
                result.match_method = match.method;

                // Use DB price if available and reasonable
                if (match.work.price && match.work.price > 0) {
                    result.db_price = match.work.price;
                    result.unit_price = match.work.price;
                    result.price = match.work.price;
                    result.price_source = 'database';
                    matchedFromDB++;
                } else {
                    result.price_source = 'gemini';
                    fromGemini++;
                }

                // Use DB unit if Gemini's unit doesn't match
                if (match.work.unit && match.work.unit !== item.unit) {
                    result.unit_suggestion = match.work.unit;
                }
            } else {
                // Fallback: ищем в глобальных каталогах AI_MAT_* и AI_EQ_*
                const globalMatch = _searchGlobalCatalogs(item.name);
                if (globalMatch) {
                    result.unit_price = globalMatch.price;
                    result.price = globalMatch.price;
                    result.price_source = globalMatch.source;
                    result.matched_catalog = globalMatch.catalogKey;
                    result.match_score = match ? match.score : 0.5;
                    matchedFromPriceKZ++;
                } else {
                    result.price_source = 'gemini';
                    result.match_score = match ? match.score : 0;
                    fromGemini++;
                }
            }

            // Apply PriceKZ pattern prices (override if higher priority)
            const priceKZ = _matchPriceKZ(item.name, item.unit);
            if (priceKZ !== null) {
                // PriceKZ is authoritative for Kazakhstan market
                if (result.price_source !== 'database' || Math.abs(priceKZ - (result.unit_price || 0)) / priceKZ > 0.3) {
                    result.unit_price = priceKZ;
                    result.price = priceKZ;
                    result.price_source = 'price_kz';
                    if (result.price_source !== 'database') {
                        matchedFromPriceKZ++;
                        fromGemini = Math.max(0, fromGemini - 1);
                    }
                }
            }

            // Recalculate total
            result.total_price = Math.round((result.quantity || 1) * (result.unit_price || result.price || 0));
            result.total = result.total_price;

            return result;
        });

        console.log(
            `[GeminiEstimateResolver] ✅ ${resolved.length} позиций: ` +
            `из БД=${matchedFromDB}, PriceKZ=${matchedFromPriceKZ}, Gemini=${fromGemini}`
        );

        // ── Anti-hallucination: validate prices are in reasonable ranges ──
        const PRICE_RANGES = {
            'м²':   { min: 100,   max: 80000 },
            'м2':   { min: 100,   max: 80000 },
            'м³':   { min: 500,   max: 200000 },
            'м3':   { min: 500,   max: 200000 },
            'п.м.': { min: 100,   max: 30000 },
            'м.п.': { min: 100,   max: 30000 },
            'шт':   { min: 50,    max: 500000 },
            'кг':   { min: 50,    max: 5000 },
            'т':    { min: 20000, max: 800000 },
            'л':    { min: 100,   max: 10000 },
            'смена':{ min: 5000,  max: 200000 },
            'компл':{ min: 1000,  max: 2000000 },
        };
        let priceWarnings = 0;
        for (const item of resolved) {
            const unitPrice = item.unit_price || item.price || 0;
            if (unitPrice <= 0) continue;
            const range = PRICE_RANGES[item.unit] || PRICE_RANGES['шт'];
            if (unitPrice < range.min || unitPrice > range.max) {
                item._price_warning = unitPrice < range.min ? 'too_low' : 'too_high';
                item._price_original = unitPrice;
                priceWarnings++;
                // If we have a DB or PriceKZ price, it's already overridden.
                // If only Gemini price and it's out of range, flag it.
                if (item.price_source === 'gemini') {
                    console.warn(`[GeminiEstimateResolver] ⚠️ Price out of range: "${item.name}" = ${unitPrice} ₸/${item.unit} (expected ${range.min}-${range.max})`);
                }
            }
        }
        if (priceWarnings > 0) {
            console.warn(`[GeminiEstimateResolver] ⚠️ ${priceWarnings} items with questionable prices`);
        }

        return resolved;
    }

    /**
     * Check PriceKZ patterns for a work name.
     * @returns {number|null} — price in tenge or null
     */
    function _matchPriceKZ(workName, unit) {
        if (!window.PriceKZ || !workName) return null;

        // PriceKZ patterns are in PRICE_PATTERNS (not directly exposed)
        // We can check by creating a temp item and running the same logic
        // For now, use the regex patterns approach
        const PRICE_PATTERNS = [
            { match: /штукатурка.*механизир/i, unit: 'м²', price: 1800 },
            { match: /штукатурка.*маяк|оштукатурив/i, unit: 'м²', price: 2200 },
            { match: /декоративная штукатурка/i, unit: 'м²', price: 5000 },
            { match: /штукатурка/i, unit: 'м²', price: 2000 },
            { match: /покраска.*2\s*слой/i, unit: 'м²', price: 1200 },
            { match: /покраска|окраска/i, unit: 'м²', price: 900 },
            { match: /грунтовк/i, unit: 'м²', price: 300 },
            { match: /укладка.*плитк/i, unit: 'м²', price: 3500 },
            { match: /затирка швов/i, unit: 'м²', price: 500 },
            { match: /укладка ламината/i, unit: 'м²', price: 1200 },
            { match: /стяжка пола/i, unit: 'м²', price: 2000 },
            { match: /обшивка.*ГКЛ|гипсокартон/i, unit: 'м²', price: 2500 },
            { match: /натяжной потолок/i, unit: 'м²', price: 2500 },
            { match: /установка розетки/i, unit: 'шт', price: 1500 },
            { match: /штробление/i, unit: 'м.п.', price: 1500 },
            { match: /монтаж металлочерепицы/i, unit: 'м²', price: 1800 },
            { match: /монтаж профнастила/i, unit: 'м²', price: 1400 },
            { match: /установка унитаза/i, unit: 'шт', price: 8000 },
            { match: /установка ванны/i, unit: 'шт', price: 12000 },
            { match: /установка смесителя/i, unit: 'шт', price: 3500 },
            { match: /бетонирование.*фундамент/i, unit: 'м³', price: 15000 },
            { match: /вязка арматур/i, unit: 'т', price: 80000 },
            { match: /монтаж опалубки/i, unit: 'м²', price: 3000 },
            { match: /кладка.*кирпич/i, unit: 'м²', price: 10000 },
            { match: /кладка.*газобетон|газоблок/i, unit: 'м²', price: 6000 },
            { match: /утепление фасада/i, unit: 'м²', price: 2000 },
            { match: /монтаж кондиционера/i, unit: 'шт', price: 25000 },
            { match: /установка.*межкомнатной двери/i, unit: 'шт', price: 8000 },
            { match: /установка ПВХ окна/i, unit: 'шт', price: 8000 },
            { match: /финишн.*шпаклёвк/i, unit: 'м²', price: 1200 },
            { match: /шпаклёвк|шпатлёвк/i, unit: 'м²', price: 1500 },
        ];

        for (const p of PRICE_PATTERNS) {
            if (!p.match.test(workName)) continue;
            // Check unit compatibility
            const unitOk = !unit || !p.unit || unit === p.unit
                || (p.unit === 'м.п.' && (unit === 'м' || unit === 'пм'));
            if (unitOk) return p.price;
        }
        return null;
    }

    // ═══════════════════════════════════════════════════════════
    // ПОИСК В ГЛОБАЛЬНЫХ КАТАЛОГАХ AI_MAT_* и AI_EQ_*
    // ═══════════════════════════════════════════════════════════

    /**
     * Поиск цены в каталогах материалов и техники.
     * @param {string} itemName — название позиции ("Бетон М300", "Экскаватор")
     * @returns {{ price: number, source: string, catalogKey: string, name: string }|null}
     */
    function _searchGlobalCatalogs(itemName) {
        if (!itemName) return null;
        const term = itemName.toLowerCase();
        const prefixes = ['AI_MAT_', 'AI_EQ_'];

        let bestMatch = null;
        let bestLen = 0; // предпочитаем более точное совпадение (длинное имя)

        for (const prefix of prefixes) {
            for (const key of Object.keys(window)) {
                if (!key.startsWith(prefix)) continue;
                const catalog = window[key];
                if (!catalog || typeof catalog !== 'object' || Array.isArray(catalog)) continue;

                for (const item of Object.values(catalog)) {
                    if (!item || !item.name || !item.price || item.price <= 0) continue;
                    const name = item.name.toLowerCase();
                    if (name.includes(term) || term.includes(name)) {
                        if (name.length > bestLen) {
                            bestLen = name.length;
                            bestMatch = {
                                price: item.price,
                                source: prefix === 'AI_EQ_' ? 'equipment_db' : 'material_db',
                                catalogKey: key,
                                name: item.name
                            };
                        }
                    }
                }
            }
        }

        return bestMatch;
    }

    // ═══════════════════════════════════════════════════════════
    // EXPORT
    // ═══════════════════════════════════════════════════════════

    window.GeminiEstimateResolver = {
        resolveItems,
        findBestMatch,
        normalize,
        // Exposed for testing
        _computeScore: computeScore,
        _expandWithSynonyms: expandWithSynonyms,
        _searchGlobalCatalogs: _searchGlobalCatalogs,
    };

    console.log('✅ [GeminiEstimateResolver] Loaded — fuzzy matcher AI → WorkRegistry + MAT/EQ catalogs');
})();

