// ========================================
// AI GUARDRAILS MODULE v1.0
// Защитные рамки и валидация для ИИ-модулей
// ========================================
(function () {
    'use strict';

    const CONFIG = {
        estimate: {
            maxTotalKZT: 500000000, minTotalKZT: 1000, maxItems: 200,
            maxSingleItemKZT: 50000000, maxQuantity: 100000, priceDeviationPercent: 40
        },
        order: {
            maxBudgetKZT: 100000000, minBudgetKZT: 5000,
            maxTitleLength: 200, maxDescriptionLength: 5000, minDescriptionLength: 10,
            blockedWords: ['спам', 'мошенник', 'обман', 'развод', 'взлом', 'пароль']
        },
        ai: {
            maxRequestsPerMinute: 30, maxRequestsPerHour: 200,
            maxInputTokens: 4000, maxResponseTokens: 8000, timeoutMs: 30000, maxRetries: 3
        },
        files: {
            maxFileSizeMB: 20, maxFilesPerUpload: 10,
            allowedImageTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/heic'],
            allowedDocTypes: ['application/pdf'], maxImageDimension: 8000
        },
        business: {
            commissionPercent: 3, maxApplicationsPerOrder: 20,
            maxActiveOrders: 50, minRatingForPriority: 4.5
        }
    };

    const _requestLog = [];
    const _auditLog = [];
    function _fmt(v) { return new Intl.NumberFormat('ru-KZ').format(v) + ' ₸'; }

    function _cleanOldRequests() {
        const now = Date.now();
        while (_requestLog.length > 0 && now - _requestLog[0] > 3600000) _requestLog.shift();
    }

    function checkRateLimit() {
        _cleanOldRequests();
        const now = Date.now();
        const lastMinute = _requestLog.filter(t => now - t < 60000).length;
        if (lastMinute >= CONFIG.ai.maxRequestsPerMinute) {
            return { allowed: false, reason: 'Rate limit: ' + CONFIG.ai.maxRequestsPerMinute + ' req/min', retryAfterMs: 60000 };
        }
        if (_requestLog.length >= CONFIG.ai.maxRequestsPerHour) {
            return { allowed: false, reason: 'Rate limit: ' + CONFIG.ai.maxRequestsPerHour + ' req/hour', retryAfterMs: 3600000 };
        }
        _requestLog.push(now);
        return { allowed: true };
    }

    function validateEstimate(estimate) {
        const errors = [], warnings = [], cfg = CONFIG.estimate;
        if (!estimate || typeof estimate !== 'object') return { valid: false, errors: ['Невалидный объект сметы'], warnings: [] };
        const items = estimate.items || [];
        const total = estimate.totalAmount || items.reduce((s, i) => s + (i.total || 0), 0);
        if (total > cfg.maxTotalKZT) errors.push('Сумма сметы (' + _fmt(total) + ') превышает максимум: ' + _fmt(cfg.maxTotalKZT));
        if (total < cfg.minTotalKZT && total > 0) warnings.push('Сумма сметы подозрительно мала: ' + _fmt(total));
        if (items.length > cfg.maxItems) errors.push('Слишком много позиций: ' + items.length);
        if (items.length === 0) errors.push('Смета пуста — нет позиций');
        items.forEach((item, idx) => {
            const label = item.name || 'Позиция #' + (idx + 1);
            if (!item.name || item.name.trim().length < 2) errors.push(label + ': пустое название');
            if ((item.price || 0) <= 0) errors.push(label + ': нулевая цена');
            if ((item.price || 0) > cfg.maxSingleItemKZT) errors.push(label + ': цена превышает лимит');
            if ((item.quantity || 0) > cfg.maxQuantity) errors.push(label + ': количество превышает лимит');
            if (window.AIPriceDatabase && item.code) {
                const ref = window.AIPriceDatabase.getMaterialPrice && window.AIPriceDatabase.getMaterialPrice(item.code);
                if (ref && ref.price) {
                    const deviation = Math.abs(item.price - ref.price) / ref.price * 100;
                    if (deviation > cfg.priceDeviationPercent) warnings.push(label + ': цена отклоняется от эталона на ' + deviation.toFixed(0) + '%');
                }
            }
        });
        const names = items.map(i => (i.name || '').toLowerCase().trim());
        const dupes = names.filter((n, i) => n && names.indexOf(n) !== i);
        if (dupes.length > 0) warnings.push('Дублирующие позиции: ' + [...new Set(dupes)].join(', '));
        return { valid: errors.length === 0, errors, warnings };
    }

    function validateOrder(order) {
        const errors = [], warnings = [], cfg = CONFIG.order;
        if (!order) return { valid: false, errors: ['Объект заказа пуст'], warnings: [] };
        if (!order.title || order.title.trim().length < 5) errors.push('Название заказа слишком короткое');
        if (order.title && order.title.length > cfg.maxTitleLength) errors.push('Название слишком длинное');
        if (!order.description || order.description.trim().length < cfg.minDescriptionLength) errors.push('Описание слишком короткое');
        if (order.description && order.description.length > cfg.maxDescriptionLength) errors.push('Описание слишком длинное');
        const budget = order.budget || order.budgetMax || 0;
        if (budget > cfg.maxBudgetKZT) errors.push('Бюджет превышает максимум');
        if (budget > 0 && budget < cfg.minBudgetKZT) warnings.push('Бюджет подозрительно мал');
        if (!order.category) warnings.push('Не указана категория работ');
        if (!order.city) warnings.push('Не указан город');
        const text = ((order.title || '') + ' ' + (order.description || '')).toLowerCase();
        const found = cfg.blockedWords.filter(w => text.includes(w));
        if (found.length > 0) errors.push('Запрещённые слова: ' + found.join(', '));
        return { valid: errors.length === 0, errors, warnings };
    }

    function validateFile(file) {
        const errors = [], cfg = CONFIG.files;
        if (!file) return { valid: false, errors: ['Файл не выбран'], warnings: [] };
        const sizeMB = file.size / (1024 * 1024);
        if (sizeMB > cfg.maxFileSizeMB) errors.push('Файл слишком большой: ' + sizeMB.toFixed(1) + 'MB');
        const allowed = [...cfg.allowedImageTypes, ...cfg.allowedDocTypes];
        if (!allowed.includes(file.type)) errors.push('Недопустимый формат: ' + file.type);
        return { valid: errors.length === 0, errors, warnings: [] };
    }

    function validateFiles(files) {
        const errors = [], warnings = [], cfg = CONFIG.files;
        if (!files || files.length === 0) return { valid: false, errors: ['Файлы не выбраны'], warnings: [] };
        if (files.length > cfg.maxFilesPerUpload) errors.push('Слишком много файлов: ' + files.length);
        Array.from(files).forEach((f, i) => {
            const r = validateFile(f);
            r.errors.forEach(e => errors.push('Файл ' + (i + 1) + ': ' + e));
        });
        return { valid: errors.length === 0, errors, warnings };
    }

    function sanitizeAIInput(text) {
        if (!text || typeof text !== 'string') return { text: '', injectionDetected: false, truncated: false };
        let clean = text;
        if (clean.length > CONFIG.ai.maxInputTokens * 4) clean = clean.slice(0, CONFIG.ai.maxInputTokens * 4);
        const injectionPatterns = [
            /ignore\s+(all\s+)?previous\s+instructions?/gi,
            /disregard\s+(all\s+)?above/gi,
            /you\s+are\s+now\s+/gi,
            /act\s+as\s+/gi,
            /pretend\s+(you\s+are|to\s+be)\s+/gi,
            /system\s*:\s*/gi, /\[INST\]/gi, /<<SYS>>/gi
        ];
        let injectionDetected = false;
        injectionPatterns.forEach(p => { if (p.test(clean)) { injectionDetected = true; clean = clean.replace(p, '[FILTERED] '); } });
        clean = clean.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
        clean = clean.replace(/<[^>]+>/g, '');
        return { text: clean.trim(), injectionDetected, truncated: text.length > CONFIG.ai.maxInputTokens * 4, originalLength: text.length, cleanLength: clean.trim().length };
    }

    function validateAIResponse(response, context) {
        const warnings = [];
        if (!response) return { valid: false, errors: ['Пустой ответ от AI'], warnings: [] };
        if (context && context.type === 'estimate' && response.items) return validateEstimate(response);
        if (typeof response === 'string') {
            if (response.length < 10) warnings.push('AI ответ подозрительно короткий');
            if (response.length > CONFIG.ai.maxResponseTokens * 4) warnings.push('AI ответ превышает лимит длины');
        }
        return { valid: true, errors: [], warnings };
    }

    function logGuardrailEvent(type, details) {
        const entry = { id: 'gr_' + Date.now(), type, details, timestamp: new Date().toISOString() };
        _auditLog.push(entry);
        if (_auditLog.length > 100) _auditLog.shift();
        if (type === 'blocked' || type === 'injection') console.warn('[AIGuardrails] ⚠️ ' + type + ':', details);
    }

    async function safeAICall(aiFn, input, options) {
        options = options || {};
        const guardrails = {};
        const rateCheck = checkRateLimit();
        guardrails.rateLimit = rateCheck;
        if (!rateCheck.allowed) { logGuardrailEvent('blocked', { reason: rateCheck.reason }); return { success: false, error: rateCheck.reason, guardrails }; }
        if (typeof input === 'string') {
            const sanitized = sanitizeAIInput(input);
            guardrails.inputSanitization = sanitized;
            if (sanitized.injectionDetected) logGuardrailEvent('injection', { original: input.slice(0, 100) });
            input = sanitized.text;
        }
        try {
            const timeout = options.timeout || CONFIG.ai.timeoutMs;
            const result = await Promise.race([
                Promise.resolve(aiFn(input)),
                new Promise((_, reject) => setTimeout(() => reject(new Error('AI timeout')), timeout))
            ]);
            guardrails.outputValidation = validateAIResponse(result, options);
            logGuardrailEvent('success', { type: options.type || 'generic' });
            return { success: true, data: result, guardrails };
        } catch (err) {
            logGuardrailEvent('error', { message: err.message });
            return { success: false, error: err.message, guardrails };
        }
    }

    window.AIGuardrails = {
        CONFIG, validateEstimate, validateOrder, validateFile, validateFiles,
        sanitizeAIInput, validateAIResponse, safeAICall, checkRateLimit,
        logGuardrailEvent, getAuditLog: () => [..._auditLog]
    };
    console.log('[AIGuardrails] ✅ AI Guardrails v1.0 loaded');
})();
