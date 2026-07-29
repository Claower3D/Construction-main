// ========================================================
// AI SMART BRAIN — QAZGOST AI
// Умный мозг бота: понимает программу, навигирует,
// вызывает Gemini LLM, знает контекст
// v2.0 — LLM-powered + Self-Aware Architecture
// ========================================================

(function () {
    'use strict';

    // ─── APPLICATION MAP ─────────────────────────────────
    // Полная карта приложения — бот знает ВСЁ о программе
    const APP_MAP = {
        pages: {
            home: {
                id: 'home',
                name: 'Главная',
                icon: '🏠',
                description: 'Стартовая страница с обзором платформы, быстрыми действиями и лендингом',
                keywords: ['глав', 'домой', 'начало', 'старт', 'начать', 'лендинг', 'home'],
                actions: ['Просмотр лендинга', 'Быстрые действия'],
                helpText: 'На главной странице вы видите все возможности QAZGOST AI. Кнопки быстрого доступа ведут к основным модулям.'
            },
            estimates: {
                id: 'estimates',
                name: 'Оценка стоимости',
                icon: '📊',
                description: 'AI-расчёт строительных смет по фотографии или описанию. Загрузите фото — и получите смету за минуту',
                keywords: ['смет', 'оцен', 'стоимост', 'расчёт', 'рассчитат', 'фото анализ', 'estimate', 'калькулятор', 'прайс'],
                actions: ['Загрузить фото', 'Описать работы', 'Скачать PDF-смету', 'Посмотреть историю смет'],
                helpText: 'Загрузите фото строительного объекта или опишите нужные работы. AI распознает материалы, определит объёмы и рассчитает стоимость по ценам Казахстана.',
                functions: {
                    openPhotoEstimate: 'window.showPage("estimates")',
                    startNewEstimate: 'if(window.PhotoEstimateV3) PhotoEstimateV3.startNew()'
                }
            },
            orders: {
                id: 'orders',
                name: 'Мои заказы',
                icon: '📋',
                description: 'Управление заказами: создание, отклики подрядчиков, статусы, чат с исполнителями',
                keywords: ['заказ', 'заявк', 'order', 'откл', 'исполн', 'работ'],
                actions: ['Создать заказ', 'Посмотреть активные', 'Чат с подрядчиком', 'Статус заказа'],
                helpText: 'Здесь вы видите все ваши заказы. Заказчики могут создавать заказы, а исполнители — откликаться.',
                functions: {
                    createOrder: 'window.showPage("orders")',
                    viewOrders: 'window.showPage("orders")'
                }
            },
            equipment: {
                id: 'equipment',
                name: 'Маркетплейс техники',
                icon: '🚜',
                description: 'Аренда строительной техники: экскаваторы, краны, самосвалы, бетономешалки. С рейтингом и отзывами',
                keywords: ['техник', 'аренд', 'экскаватор', 'кран', 'самосвал', 'бетономешалк', 'equipment', 'маркетплейс'],
                actions: ['Найти технику', 'Разместить технику', 'Забронировать'],
                helpText: 'Маркетплейс строительной техники. Найдите и забронируйте технику с рейтингом и отзывами.'
            },
            wallet: {
                id: 'wallet',
                name: 'Кошелёк',
                icon: '💳',
                description: 'Финансовая система: баланс, пополнение через Stripe/Crypto, история транзакций, эскроу-платежи',
                keywords: ['кошел', 'баланс', 'оплат', 'деньг', 'пополн', 'wallet', 'финанс', 'stripe', 'крипт', 'транзакц'],
                actions: ['Проверить баланс', 'Пополнить', 'История', 'Вывести'],
                helpText: 'Кошелёк QAZGOST — безопасные платежи через эскроу. Пополнение через Stripe, криптовалюту.',
                functions: {
                    checkBalance: 'window.showPage("wallet")',
                    topUp: 'window.showPage("wallet")'
                }
            },
            profile: {
                id: 'profile',
                name: 'Профиль',
                icon: '👤',
                description: 'Профиль пользователя: личные данные, верификация eGov, портфолио (для исполнителей), привязка Telegram',
                keywords: ['профил', 'настройк', 'аккаунт', 'личн', 'profile', 'верифик', 'egov', 'telegram привязк'],
                actions: ['Редактировать профиль', 'Привязать Telegram', 'Верификация eGov', 'Портфолио'],
                helpText: 'Управление профилем. Верифицируйте аккаунт через eGov для повышения доверия. Привяжите Telegram для уведомлений.'
            },
            vip: {
                id: 'vip',
                name: 'VIP — Строительство зданий',
                icon: '🏗️',
                description: 'Полный цикл управления строительным проектом: WBS-декомпозиция, лоты, тендеры, контроль, документация',
                keywords: ['vip', 'здан', 'сооружен', 'проект', 'тендер', 'лот', 'стройк', 'коттедж', 'многоэтаж'],
                actions: ['Создать проект', 'Управление лотами', 'Контроль прогресса'],
                helpText: 'Модуль для крупных строительных проектов. WBS-декомпозиция, тендеры, контроль исполнения, фото-отчёты.'
            },
            engineering: {
                id: 'engineering',
                name: 'Инженерные решения',
                icon: '⚙️',
                description: 'Каталог готовых инженерных решений: фундаменты, стены, кровля, инженерные сети',
                keywords: ['инженер', 'решен', 'каталог инженер', 'чертёж', 'engineering'],
                actions: ['Просмотр каталога', 'Выбрать решение'],
                helpText: 'Готовые инженерные решения от проверенных специалистов. Фундаменты, стены, кровля, сети.'
            },
            map: {
                id: 'map',
                name: 'Карта',
                icon: '🗺️',
                description: 'Карта подрядчиков и объектов в вашем городе. Поиск ближайших исполнителей',
                keywords: ['карт', 'map', 'где', 'ближайш', 'рядом', 'геолок'],
                actions: ['Показать карту', 'Найти рядом'],
                helpText: 'Интерактивная карта с подрядчиками, объектами строительства и доступной техникой.'
            },
            calendar: {
                id: 'calendar',
                name: 'Календарь',
                icon: '📅',
                description: 'Планирование строительных работ: сроки, дедлайны, этапы проекта',
                keywords: ['календар', 'план', 'сроки', 'дедлайн', 'график', 'calendar'],
                actions: ['Просмотр календаря', 'Добавить событие'],
                helpText: 'Календарь для планирования строительных работ и отслеживания сроков.'
            },
            analytics: {
                id: 'analytics',
                name: 'Аналитика',
                icon: '📈',
                description: 'Дашборд со статистикой: доходы, расходы, KPI проектов, графики',
                keywords: ['аналитик', 'статист', 'дашборд', 'графік', 'analytics', 'kpi'],
                actions: ['Просмотр статистики', 'Экспорт отчёта'],
                helpText: 'Аналитический дашборд с KPI, графиками доходов/расходов и статистикой проектов.'
            },
            modules: {
                id: 'modules',
                name: 'Модули',
                icon: '🧩',
                description: 'Дополнительные модули: все расширения и плагины платформы',
                keywords: ['модул', 'плагин', 'расширен', 'modules', 'дополнител'],
                actions: ['Просмотр модулей', 'Активировать модуль'],
                helpText: 'Все доступные модули платформы. Активируйте нужные для расширения функциональности.'
            },
            volume: {
                id: 'volume',
                name: 'Фото-объёмы грунта',
                icon: '📐',
                description: 'Расчёт объёмов котлованов, карьеров и земляных работ по фотографиям',
                keywords: ['объём', 'котлован', 'карьер', 'грунт', 'земляны', 'выемк', 'насып', 'volume'],
                actions: ['Рассчитать объём', 'Загрузить фото котлована'],
                helpText: 'Загрузите фото котлована или карьера — AI рассчитает объём выемки/насыпи с точностью до 90%.'
            },
            tracker: {
                id: 'tracker',
                name: 'Трекер задач',
                icon: '✅',
                description: 'Управление задачами строительного проекта: статусы, исполнители, прогресс',
                keywords: ['трекер', 'задач', 'tracker', 'прогресс', 'испол'],
                actions: ['Посмотреть задачи', 'Создать задачу'],
                helpText: 'Трекер задач для управления строительным проектом.'
            },
            disputes: {
                id: 'disputes',
                name: 'Споры',
                icon: '⚖️',
                description: 'Система разрешения споров между заказчиком и подрядчиком',
                keywords: ['спор', 'жалоб', 'конфликт', 'dispute', 'арбитраж'],
                actions: ['Открыть спор', 'Мои споры'],
                helpText: 'Система разрешения споров. Если качество работ не устраивает — откройте спор.'
            }
        },

        // Роли пользователей
        roles: {
            customer: {
                name: 'Заказчик',
                description: 'Заказывает строительные работы, создаёт сметы, принимает работы',
                keyPages: ['estimates', 'orders', 'wallet', 'equipment']
            },
            executor: {
                name: 'Исполнитель',
                description: 'Откликается на заказы, выполняет работы, получает оплату',
                keyPages: ['orders', 'wallet', 'profile', 'tracker']
            },
            engineer: {
                name: 'Инженер',
                description: 'Проверяет сметы, контролирует качество, создаёт инженерные решения',
                keyPages: ['engineering', 'estimates', 'vip']
            },
            admin: {
                name: 'Администратор',
                description: 'Управляет платформой, пользователями, модерация',
                keyPages: ['analytics', 'modules']
            }
        },

        // Основные сценарии
        workflows: {
            create_estimate: {
                name: 'Создать смету',
                steps: [
                    'Откройте «Оценка стоимости» (/estimates)',
                    'Загрузите фото объекта или опишите работы',
                    'AI проанализирует и выдаст смету за 1-3 минуты',
                    'Скачайте PDF или опубликуйте как заказ'
                ],
                triggerPage: 'estimates'
            },
            hire_contractor: {
                name: 'Найти подрядчика',
                steps: [
                    'Создайте смету (или используйте готовую)',
                    'Нажмите «Опубликовать заказ»',
                    'Подрядчики увидят заказ и откликнутся',
                    'Сравните предложения (цена, рейтинг, отзывы)',
                    'Выберите лучшего и начните работу'
                ],
                triggerPage: 'orders'
            },
            top_up_wallet: {
                name: 'Пополнить кошелёк',
                steps: [
                    'Откройте «Кошелёк» (/wallet)',
                    'Нажмите «Пополнить»',
                    'Выберите способ: Stripe или криптовалюта',
                    'Следуйте инструкциям на экране'
                ],
                triggerPage: 'wallet'
            },
            rent_equipment: {
                name: 'Арендовать технику',
                steps: [
                    'Откройте «Маркетплейс техники»',
                    'Найдите нужную технику по фильтрам',
                    'Посмотрите рейтинг и отзывы',
                    'Забронируйте на нужные даты'
                ],
                triggerPage: 'equipment'
            },
            verify_account: {
                name: 'Верифицировать аккаунт',
                steps: [
                    'Откройте «Профиль»',
                    'Нажмите «Верификация eGov»',
                    'Подтвердите личность через ЭЦП или SMS',
                    'Получите значок верификации ✅'
                ],
                triggerPage: 'profile'
            }
        }
    };

    // ─── INTENT DETECTION ────────────────────────────────
    // Определяем что хочет пользователь

    const INTENTS = {
        navigate: {
            patterns: ['открой', 'покажи', 'перейди', 'где ', 'как найти', 'хочу в ', 'открыть', 'перейти в', 'зайди в'],
            handler: '_handleNavigate'
        },
        howto: {
            patterns: ['как ', 'каким образом', 'подскажи как', 'научи', 'объясни как', 'что нужно чтобы', 'как мне'],
            handler: '_handleHowTo'
        },
        whatIs: {
            patterns: ['что такое', 'что это', 'для чего', 'зачем', 'что значит', 'расскажи про', 'расскажи о'],
            handler: '_handleWhatIs'
        },
        doAction: {
            patterns: ['создай', 'сделай', 'запусти', 'рассчитай', 'загрузи', 'скачай', 'пополни', 'подключи'],
            handler: '_handleDoAction'
        },
        status: {
            patterns: ['мой баланс', 'мои заказы', 'моя смета', 'мой профиль', 'мой тариф', 'мой статус', 'сколько у меня'],
            handler: '_handleStatus'
        },
        help: {
            patterns: ['помощь', 'помоги', 'не понимаю', 'что делать', 'не работает', 'ошибка', 'проблема', 'не могу'],
            handler: '_handleHelp'
        },
        contextual: {
            patterns: ['здесь', 'тут', 'на этой странице', 'эта кнопка', 'что тут', 'где я'],
            handler: '_handleContextual'
        }
    };

    // ─── STATE ───────────────────────────────────────────
    let _conversationContext = [];
    let _maxContextLength = 20;

    // ─── CORE: PROCESS USER MESSAGE ──────────────────────
    // ПРИОРИТЕТ: Gemini LLM → Rule-based fallback
    // Gemini понимает человеческую речь, логику, контекст.
    // Правила — только запасной вариант при офлайне.

    async function processMessage(userMessage, opts = {}) {
        const msg = userMessage.toLowerCase().trim();

        // Сохраняем контекст разговора
        _conversationContext.push({ role: 'user', text: userMessage, time: Date.now() });
        if (_conversationContext.length > _maxContextLength) {
            _conversationContext.shift();
        }

        // Определяем контекст (для обогащения промпта Gemini)
        const matchedPage = _findMatchingPage(msg);
        const matchedWorkflow = _findMatchingWorkflow(msg);

        let response = null;

        // ═══ ШАГA 1: ВСЕГДА сначала Gemini LLM ═══
        // Gemini понимает: разговорный язык, логику, контекст,
        // неполные фразы, опечатки, сленг, сарказм, всё.
        try {
            response = await _askGemini(userMessage, matchedPage, opts);
        } catch (e) {
            console.warn('[SmartBrain] Gemini unavailable:', e.message);
        }

        // ═══ ШАГ 2: Если Gemini недоступен → Rule-based fallback ═══
        if (!response) {
            const intent = _detectIntent(msg);
            if (intent) {
                const ruleResponse = await _executeIntent(intent, msg, matchedPage, matchedWorkflow, opts);
                if (ruleResponse && !ruleResponse.useLLM) {
                    response = ruleResponse;
                    response.source = 'rules';
                }
            }
        }

        // ═══ ШАГ 3: Последний fallback — умная подсказка ═══
        if (!response) {
            response = _buildSmartFallback(msg, matchedPage);
            response.source = 'fallback';
        }

        // Сохраняем контекст ответа
        _conversationContext.push({ role: 'bot', text: response.text, time: Date.now() });

        return response;
    }

    // ─── INTENT DETECTION ────────────────────────────────

    function _detectIntent(msg) {
        let bestIntent = null;
        let bestScore = 0;

        for (const [intentName, config] of Object.entries(INTENTS)) {
            for (const pattern of config.patterns) {
                if (msg.includes(pattern)) {
                    const score = pattern.length;
                    if (score > bestScore) {
                        bestScore = score;
                        bestIntent = { name: intentName, pattern, handler: config.handler };
                    }
                }
            }
        }

        return bestIntent;
    }

    // ─── PAGE MATCHING ───────────────────────────────────

    function _findMatchingPage(msg) {
        let bestMatch = null;
        let bestScore = 0;

        for (const [pageId, page] of Object.entries(APP_MAP.pages)) {
            for (const keyword of page.keywords) {
                if (msg.includes(keyword.toLowerCase())) {
                    const score = keyword.length;
                    if (score > bestScore) {
                        bestScore = score;
                        bestMatch = page;
                    }
                }
            }
        }

        return bestMatch;
    }

    // ─── WORKFLOW MATCHING ───────────────────────────────

    function _findMatchingWorkflow(msg) {
        for (const [wfId, wf] of Object.entries(APP_MAP.workflows)) {
            const wfName = wf.name.toLowerCase();
            if (msg.includes(wfName) || wfName.split(' ').every(w => msg.includes(w))) {
                return wf;
            }
        }

        // Ключевые фразы → workflows
        if (msg.includes('смет') && (msg.includes('создать') || msg.includes('сделать') || msg.includes('рассчитать'))) {
            return APP_MAP.workflows.create_estimate;
        }
        if (msg.includes('подрядчик') && (msg.includes('найти') || msg.includes('нанять'))) {
            return APP_MAP.workflows.hire_contractor;
        }
        if (msg.includes('пополн') && (msg.includes('кошелёк') || msg.includes('баланс'))) {
            return APP_MAP.workflows.top_up_wallet;
        }
        if (msg.includes('аренд') && msg.includes('техник')) {
            return APP_MAP.workflows.rent_equipment;
        }
        if (msg.includes('верификац') || msg.includes('верифицир')) {
            return APP_MAP.workflows.verify_account;
        }

        return null;
    }

    // ─── INTENT HANDLERS ─────────────────────────────────

    async function _executeIntent(intent, msg, matchedPage, matchedWorkflow, opts) {
        switch (intent.name) {
            case 'navigate':
                return _handleNavigate(msg, matchedPage);
            case 'howto':
                return _handleHowTo(msg, matchedPage, matchedWorkflow);
            case 'whatIs':
                return _handleWhatIs(msg, matchedPage);
            case 'doAction':
                return _handleDoAction(msg, matchedPage, matchedWorkflow);
            case 'status':
                return _handleStatus(msg);
            case 'help':
                return _handleHelp(msg, matchedPage);
            case 'contextual':
                return _handleContextual(msg);
            default:
                return null;
        }
    }

    function _handleNavigate(msg, matchedPage) {
        if (matchedPage) {
            return {
                text: `${matchedPage.icon} **${matchedPage.name}**\n\n${matchedPage.description}\n\n` +
                    `Нажмите кнопку ниже чтобы перейти:`,
                actions: [
                    { text: `${matchedPage.icon} Открыть ${matchedPage.name}`, page: matchedPage.id }
                ]
            };
        }

        // Не нашли какую страницу открыть — предлагаем основные
        return {
            text: '🧭 **Куда вы хотите перейти?**\n\nВыберите раздел:',
            actions: [
                { text: '📊 Оценка стоимости', page: 'estimates' },
                { text: '📋 Мои заказы', page: 'orders' },
                { text: '💳 Кошелёк', page: 'wallet' },
                { text: '🚜 Техника', page: 'equipment' },
                { text: '👤 Профиль', page: 'profile' },
                { text: '🏗️ VIP Проекты', page: 'vip' }
            ]
        };
    }

    function _handleHowTo(msg, matchedPage, matchedWorkflow) {
        // Если есть совпавший workflow → показываем пошаговую инструкцию
        if (matchedWorkflow) {
            const steps = matchedWorkflow.steps.map((s, i) => `${i + 1}️⃣ ${s}`).join('\n');
            return {
                text: `📖 **${matchedWorkflow.name}**\n\n${steps}`,
                actions: matchedWorkflow.triggerPage
                    ? [{ text: `▶️ Начать`, page: matchedWorkflow.triggerPage }]
                    : null
            };
        }

        // Если нашли страницу — показываем help для страницы
        if (matchedPage) {
            const actionsText = matchedPage.actions.map(a => `• ${a}`).join('\n');
            return {
                text: `${matchedPage.icon} **Как пользоваться: ${matchedPage.name}**\n\n` +
                    `${matchedPage.helpText}\n\n` +
                    `**Доступные действия:**\n${actionsText}`,
                actions: [
                    { text: `${matchedPage.icon} Перейти в ${matchedPage.name}`, page: matchedPage.id }
                ]
            };
        }

        // Общий how-to → отправляем в LLM
        return { useLLM: true };
    }

    function _handleWhatIs(msg, matchedPage) {
        if (matchedPage) {
            return {
                text: `${matchedPage.icon} **${matchedPage.name}**\n\n${matchedPage.description}\n\n` +
                    `💡 ${matchedPage.helpText}`,
                actions: [
                    { text: `${matchedPage.icon} Открыть`, page: matchedPage.id }
                ]
            };
        }

        // Вопрос про платформу
        if (msg.includes('qazgost') || msg.includes('платформ') || msg.includes('приложен')) {
            return {
                text: '🏗️ **QAZGOST AI** — это AI-платформа для строительства в Казахстане.\n\n' +
                    '**Что умеет:**\n' +
                    '• 📸 AI-расчёт смет по фото (RF-DETR + Gemini)\n' +
                    '• 👷 Маркетплейс подрядчиков с рейтингом\n' +
                    '• 🚜 Аренда строительной техники\n' +
                    '• 💳 Безопасные платежи через эскроу\n' +
                    '• 📋 Управление заказами и контрактами\n' +
                    '• 📐 Расчёт объёмов по фото\n' +
                    '• 🏗️ VIP-управление крупными проектами\n\n' +
                    '🇰🇿 Все цены и нормативы — по стандартам Казахстана (СНиП/СП РК)',
                actions: [
                    { text: '📊 Попробовать оценку', page: 'estimates' },
                    { text: '📖 Как начать?', query: 'Как начать пользоваться?' }
                ]
            };
        }

        return { useLLM: true };
    }

    function _handleDoAction(msg, matchedPage, matchedWorkflow) {
        // Создать смету
        if (msg.includes('смет') || msg.includes('расчёт') || msg.includes('рассчит')) {
            return {
                text: '📊 **Создание сметы**\n\nДля расчёта сметы вам нужно:\n\n' +
                    '1️⃣ Загрузить **фото** строительного объекта\n' +
                    '2️⃣ Или **описать** нужные работы текстом\n\n' +
                    'AI проанализирует и выдаст детальную смету с ценами Казахстана.',
                actions: [
                    { text: '📸 Загрузить фото', page: 'estimates' },
                    { text: '📝 Описать работы', page: 'estimates' }
                ]
            };
        }

        // Пополнить кошелёк
        if (msg.includes('пополн')) {
            return {
                text: '💳 **Пополнение кошелька**\n\n' +
                    'Способы пополнения:\n' +
                    '• 💳 Stripe (банковская карта)\n' +
                    '• ₿ Криптовалюта (BTC, ETH, USDT)\n\n' +
                    'Перейдите в Кошелёк и нажмите «Пополнить».',
                actions: [
                    { text: '💳 Открыть кошелёк', page: 'wallet' }
                ]
            };
        }

        if (matchedWorkflow) {
            const steps = matchedWorkflow.steps.map((s, i) => `${i + 1}️⃣ ${s}`).join('\n');
            return {
                text: `▶️ **${matchedWorkflow.name}**\n\n${steps}`,
                actions: matchedWorkflow.triggerPage
                    ? [{ text: '▶️ Начать', page: matchedWorkflow.triggerPage }]
                    : null
            };
        }

        if (matchedPage) {
            return {
                text: `${matchedPage.icon} Для этого перейдите в **${matchedPage.name}**.\n\n${matchedPage.helpText}`,
                actions: [{ text: `${matchedPage.icon} Перейти`, page: matchedPage.id }]
            };
        }

        return { useLLM: true };
    }

    function _handleStatus(msg) {
        // Собираем информацию о пользователе из глобального контекста
        const userInfo = _getUserContext();

        if (msg.includes('баланс') || msg.includes('сколько у меня')) {
            return {
                text: `💰 **Ваш статус:**\n\n` +
                    `👤 Роль: ${userInfo.role}\n` +
                    `💳 Баланс: ${userInfo.balance}\n` +
                    `📋 Активных заказов: ${userInfo.activeOrders}\n` +
                    `📊 Тариф: ${userInfo.tariff}\n\n` +
                    `Для подробностей перейдите в нужный раздел:`,
                actions: [
                    { text: '💳 Кошелёк', page: 'wallet' },
                    { text: '📋 Заказы', page: 'orders' },
                    { text: '👤 Профиль', page: 'profile' }
                ]
            };
        }

        if (msg.includes('заказ')) {
            return {
                text: '📋 Перейдите в раздел **Мои заказы** чтобы просмотреть все заказы, статусы и отклики.',
                actions: [{ text: '📋 Мои заказы', page: 'orders' }]
            };
        }

        return {
            text: `👤 **Ваш аккаунт:**\n\n` +
                `Роль: ${userInfo.role}\n` +
                `Баланс: ${userInfo.balance}\n` +
                `Тариф: ${userInfo.tariff}`,
            actions: [
                { text: '👤 Профиль', page: 'profile' },
                { text: '💳 Кошелёк', page: 'wallet' }
            ]
        };
    }

    function _handleHelp(msg, matchedPage) {
        if (matchedPage) {
            return {
                text: `❓ **Помощь: ${matchedPage.name}**\n\n${matchedPage.helpText}\n\n` +
                    `**Что можно сделать:**\n` +
                    matchedPage.actions.map(a => `• ${a}`).join('\n'),
                actions: [
                    { text: `${matchedPage.icon} Перейти в ${matchedPage.name}`, page: matchedPage.id },
                    { text: '📖 Общая справка', query: 'Как пользоваться приложением?' }
                ]
            };
        }

        // Ошибки и проблемы
        if (msg.includes('не работает') || msg.includes('ошибка') || msg.includes('не могу')) {
            return {
                text: '🔧 **Возникла проблема?**\n\nПопробуйте:\n\n' +
                    '1️⃣ Обновите страницу (F5)\n' +
                    '2️⃣ Проверьте интернет-соединение\n' +
                    '3️⃣ Очистите кэш браузера\n' +
                    '4️⃣ Попробуйте другой браузер\n\n' +
                    'Если проблема сохраняется — опишите её подробнее.',
                actions: [
                    { text: '🔄 Обновить страницу', action: 'reload' },
                    { text: '📧 Написать поддержке', query: 'Как связаться с поддержкой?' }
                ]
            };
        }

        return _buildGeneralHelp();
    }

    function _handleContextual(msg) {
        // Определяем текущую страницу
        const currentPage = _getCurrentPage();
        if (currentPage) {
            const page = APP_MAP.pages[currentPage];
            if (page) {
                return {
                    text: `📍 **Вы на странице: ${page.name}**\n\n${page.helpText}\n\n` +
                        `**Здесь вы можете:**\n` +
                        page.actions.map(a => `• ${a}`).join('\n'),
                    actions: [
                        { text: '📖 Подробная справка', query: `Расскажи подробнее про ${page.name}` },
                        { text: '🏠 На главную', page: 'home' }
                    ]
                };
            }
        }

        return {
            text: '📍 Вы находитесь в приложении QAZGOST AI.\nЧем могу помочь?',
            actions: [
                { text: '📖 Как пользоваться?', query: 'Как пользоваться приложением?' },
                { text: '🏠 На главную', page: 'home' }
            ]
        };
    }

    // ─── GEMINI LLM INTEGRATION ──────────────────────────

    async function _askGemini(userMessage, matchedPage, opts) {
        // Проверяем доступность Gemini
        if (!window.GeminiService || !window.GeminiService.isConfigured()) {
            console.log('[SmartBrain] Gemini not available, using fallback');
            return null;
        }

        try {
            const apiKey = window.GeminiService.getApiKey();
            // Для чата используем flash — быстрее и выше лимиты (pro оставляем для фото-анализа)
            const chatModel = 'gemini-2.5-flash';
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${chatModel}:generateContent?key=${apiKey}`;

            // Собираем контекст для LLM
            const systemContext = _buildLLMContext(matchedPage);

            // Последние сообщения разговора
            const recentMessages = _conversationContext.slice(-12).map(m =>
                `${m.role === 'user' ? 'Пользователь' : 'Бот'}: ${m.text}`
            ).join('\n');

            const fullPrompt =
                `--- ИСТОРИЯ РАЗГОВОРА ---\n${recentMessages}\n\n` +
                `--- ТЕКУЩИЙ ВОПРОС ---\nПользователь: ${userMessage}\n\n` +
                `Ответь кратко, полезно и конкретно на русском языке. ` +
                `Если нужно направить пользователя — укажи конкретный раздел приложения. ` +
                `Формат: используй **жирный** для акцентов и \\n для переносов.`;

            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    system_instruction: { parts: [{ text: systemContext }] },
                    contents: [{ parts: [{ text: fullPrompt }] }],
                    generationConfig: {
                        temperature: 0.7,
                        maxOutputTokens: 1024,
                        topP: 0.9
                    }
                })
            });

            if (!response.ok) {
                throw new Error(`Gemini API error: ${response.status}`);
            }

            const data = await response.json();
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

            if (!text) return null;

            // Извлекаем навигационные подсказки из ответа Gemini
            const suggestedActions = _extractActionsFromLLM(text);

            return {
                text: text.trim(),
                actions: suggestedActions,
                source: 'gemini'
            };

        } catch (e) {
            console.warn('[SmartBrain] Gemini failed:', e.message);
            return null;
        }
    }

    function _buildLLMContext(matchedPage) {
        const pagesList = Object.values(APP_MAP.pages)
            .map(p => `- ${p.icon} ${p.name} (page: "${p.id}"): ${p.description}`)
            .join('\n');

        const workflowsList = Object.values(APP_MAP.workflows)
            .map(w => `- ${w.name}: ${w.steps.join(' → ')}`)
            .join('\n');

        const userInfo = _getUserContext();
        const currentPage = _getCurrentPage();
        const currentPageInfo = currentPage && APP_MAP.pages[currentPage]
            ? `${APP_MAP.pages[currentPage].icon} ${APP_MAP.pages[currentPage].name}`
            : 'Неизвестно';

        return `Ты — QAZGOST AI, умный помощник строительной платформы Казахстана.
Ты общаешься как живой, ПОНИМАЮЩИЙ собеседник — не робот.

## ТВОЯ ЛИЧНОСТЬ:
- Имя: QazGost AI
- Роль: Старший AI-инженер по строительству
- Характер: Дружелюбный, профессиональный, с чувством юмора
- Языки: Русский (основной), Қазақша, English
- На вопрос «Как дела?» → отвечай живо: «Отлично! Анализирую сметы, помогаю строить Казахстан! А у вас как?»
- На вопрос «Кто ты?» → «Я QazGost AI — ваш умный помощник в строительстве!»
- На вопрос «Кто тебя создал?» → «Команда QazGost — казахстанский стартап для прозрачного строительства с AI.»
- Разговорный язык, сленг, сокращения ("чё", "ну", "норм", "покажь", "хз")
- Опечатки и ошибки в словах ("смтеа" → сметка, "кашлёк" → кошелёк)
- Неполные фразы ("а цены?" → пользователь спрашивает о ценах в контексте предыдущего разговора)
- Логику диалога: если пользователь спросил "как создать смету?", а потом напишет "а дальше?" — продолжи объяснение
- Эмоции: если пользователь расстроен ("ничего не работает блин") — будь эмпатичным
- Контекст: если человек пишет "покажи" без уточнения — посмотри предыдущие сообщения
- Вопросы о строительстве: цены, материалы, технологии, нормативы — ты эксперт
- Казахский и английский языки помимо русского

## КОНТЕКСТ ПОЛЬЗОВАТЕЛЯ:
- Текущая страница: ${currentPageInfo}
- Роль: ${userInfo.role}
- Тариф: ${userInfo.tariff}
- Имя: ${userInfo.name}

## РАЗДЕЛЫ ПРИЛОЖЕНИЯ:
${pagesList}

## РАБОЧИЕ ПРОЦЕССЫ:
${workflowsList}

## СТРОИТЕЛЬНАЯ ЭКСПЕРТИЗА (Казахстан 2025):
- Фундамент: 15 000 – 25 000 ₸/м²
- Кладка кирпича: 8 000 – 14 000 ₸/м²
- Штукатурка: 3 500 – 6 000 ₸/м²
- Электрика: 4 000 – 8 000 ₸/точка
- Бетон М-200: 28 000 – 35 000 ₸/м³
- Нормативы: СНиП РК, СП РК, ЕНиР
- Города: Алматы, Астана, Шымкент, Караганда

## ФОРМАТ ОТВЕТА:
1. Отвечай КРАТКО но ПОЛНО (3-8 предложений)
2. Используй **жирный** для ключевых слов
3. Используй \\n для переносов строк
4. Если можешь направить пользователя — упомяни название раздела
5. Цены — в тенге (₸)
6. Будь дружелюбным, живым, конкретным
7. Если не знаешь точный ответ — дай общее направление и предложи раздел
8. НЕ ПРИДУМЫВАЙ функции которых нет в списке разделов выше`;
    }

    function _extractActionsFromLLM(text) {
        const actions = [];
        const lower = text.toLowerCase();

        // Ищем упомянутые страницы
        for (const [pageId, page] of Object.entries(APP_MAP.pages)) {
            const pageName = page.name.toLowerCase();
            if (lower.includes(pageName) || lower.includes(pageId)) {
                actions.push({
                    text: `${page.icon} Открыть ${page.name}`,
                    page: pageId
                });
                if (actions.length >= 3) break; // максимум 3 действия
            }
        }

        // Если ответ Gemini содержит цены/сметы → добавляем кнопку "Рассчитать смету"
        const hasEstimateContext = /(\d[\d\s]*₸|стоимост|смет|расчёт|цен[аы]|за м[²2]|за метр)/i.test(text);
        const userMsg = _conversationContext.filter(m => m.role === 'user').pop();
        const userMsgText = userMsg ? userMsg.text : '';
        const isConstructionQuery = /ремонт|штукатур|плитк|кровл|фундамент|электрик|сантехник|стяжк|покраск|утеплен|фасад|демонтаж|кладк|стен|пол|потол|кухн|ванн|балкон|крыш/i.test(userMsgText);

        if (hasEstimateContext && isConstructionQuery) {
            // Не дублируем если уже есть кнопка Оценки
            const alreadyHasEstimate = actions.some(a => a.page === 'estimates');
            if (!alreadyHasEstimate) {
                actions.push({
                    text: '📊 Рассчитать полную смету',
                    page: 'estimates',
                    prefillDescription: userMsgText
                });
            }
        }

        return actions.length > 0 ? actions : null;
    }

    // ─── CONTEXT HELPERS ─────────────────────────────────

    function _getUserContext() {
        try {
            // Пытаемся получить данные из глобального состояния приложения
            const user = window.currentUser || window.AppState?.user || {};
            const wallet = window.WalletEngine?.getBalance?.() || {};

            return {
                role: user.role === 'executor' ? '👷 Исполнитель' :
                    user.role === 'engineer' ? '👨‍🔬 Инженер' :
                        user.role === 'admin' ? '🔧 Администратор' :
                            '🏠 Заказчик',
                balance: wallet.balance ? `${wallet.balance.toLocaleString()} ₸` : 'Не доступен',
                tariff: user.tariff || 'FREE',
                activeOrders: user.ordersCount || '—',
                isVerified: user.verified || false,
                name: user.name || user.displayName || 'Пользователь'
            };
        } catch (e) {
            return {
                role: '🏠 Заказчик',
                balance: 'Войдите в аккаунт',
                tariff: 'FREE',
                activeOrders: '—',
                isVerified: false,
                name: 'Пользователь'
            };
        }
    }

    function _getCurrentPage() {
        try {
            // Пытаемся определить текущую страницу из URL hash или состояния приложения
            const hash = window.location.hash.replace('#', '').replace('/', '');
            if (hash && APP_MAP.pages[hash]) return hash;

            // Ищем активную страницу  
            const activePage = document.querySelector('.page-section.active, [data-page].active');
            if (activePage) {
                const pageId = activePage.id || activePage.dataset.page;
                if (pageId && APP_MAP.pages[pageId]) return pageId;
            }

            return null;
        } catch (e) {
            return null;
        }
    }

    // ─── FALLBACK RESPONSES ──────────────────────────────

    function _buildSmartFallback(msg, matchedPage) {
        if (matchedPage) {
            return {
                text: `${matchedPage.icon} Похоже, вас интересует **${matchedPage.name}**.\n\n${matchedPage.helpText}`,
                actions: [
                    { text: `${matchedPage.icon} Открыть ${matchedPage.name}`, page: matchedPage.id },
                    { text: '📖 Подробнее', query: `Расскажи про ${matchedPage.name}` }
                ]
            };
        }

        // Строительная тематика
        const constructionKeywords = ['строител', 'ремонт', 'фундамент', 'стен', 'крыш', 'труб', 'электр',
            'бетон', 'кирпич', 'арматур', 'плитк', 'штукатур', 'кровл', 'утепл',
            'цемент', 'песок', 'щебень', 'гипсокартон'];

        const isConstruction = constructionKeywords.some(kw => msg.includes(kw));

        if (isConstruction) {
            return {
                text: '🏗️ Вижу, у вас вопрос по строительству!\n\n' +
                    'Я могу помочь с:\n' +
                    '• 📊 **Расчёт сметы** — по фото или описанию\n' +
                    '• 💰 **Цены** — на материалы и работы в Казахстане\n' +
                    '• 📋 **Нормативы** — СНиП/СП РК\n' +
                    '• 👷 **Подрядчики** — поиск и рейтинг\n\n' +
                    'Что именно вас интересует?',
                actions: [
                    { text: '📊 Рассчитать смету', page: 'estimates' },
                    { text: '💰 Цены материалов', query: 'Какие цены на строительные материалы?' },
                    { text: '📋 Нормативы', query: 'Какие нормативы СНиП?' }
                ]
            };
        }

        return _buildGeneralHelp();
    }

    function _buildGeneralHelp() {
        return {
            text: '👋 Привет! Я — **QazGost AI**, ваш умный помощник в строительстве!\n\n' +
                '🏗️ Знаю всё о ценах, материалах и нормативах Казахстана.\n' +
                'Говорю на **русском**, **қазақша** и **English**.\n\n' +
                '**Попробуйте спросить:**\n' +
                '• «Как создать смету?»\n' +
                '• «Открой кошелёк»\n' +
                '• «Что такое VIP-модуль?»\n' +
                '• «Как найти подрядчика?»\n' +
                '• «Сколько стоит ремонт кухни?»\n' +
                '• «Где я?» — подскажу что делать на текущей странице\n\n' +
                '💡 Пишите как удобно — я пойму и сленг, и опечатки!',
            actions: [
                { text: '📊 Создать смету', page: 'estimates' },
                { text: '📋 Мои заказы', page: 'orders' },
                { text: '💳 Кошелёк', page: 'wallet' },
                { text: '📖 Как начать?', query: 'Как начать пользоваться приложением?' }
            ]
        };
    }

    // ─── PUBLIC API ──────────────────────────────────────

    window.AISmartBrain = {
        processMessage,
        getAppMap: () => APP_MAP,
        getCurrentPage: _getCurrentPage,
        getUserContext: _getUserContext,
        findPage: _findMatchingPage,
        findWorkflow: _findMatchingWorkflow,
        getConversationContext: () => [..._conversationContext],
        clearContext: () => { _conversationContext = []; }
    };

    console.log('[AISmartBrain] ✅ Loaded — knows', Object.keys(APP_MAP.pages).length,
        'pages,', Object.keys(APP_MAP.workflows).length, 'workflows');
})();
