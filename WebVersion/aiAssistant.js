// ========================================================
// AI ASSISTANT MODULE — QAZGOST AI
// Умный чат-бот консультант по строительству
// v2.0 — SmartBrain + Gemini LLM integration
// ========================================================

(function () {
    'use strict';

    // ─── CONFIGURATION ───────────────────────────────────
    const CONFIG = {
        BOT_NAME: 'QAZGOST AI',
        BOT_ICON: '🤖',
        TYPING_DELAY_MIN: 600,
        TYPING_DELAY_MAX: 1800,
        MAX_HISTORY: 100,
        STORAGE_KEY: 'qazgost_ai_chat_history',
        API_ENDPOINT: null, // set when backend is ready: '/api/ai/chat'
    };

    // ─── STATE ───────────────────────────────────────────
    let _isOpen = false;
    let _messages = [];
    let _isTyping = false;
    let _welcomeShown = false;

    // ─── CONSTRUCTION KNOWLEDGE BASE ─────────────────────
    const KB = {
        // Приветствия
        greetings: {
            patterns: ['привет', 'здравствуй', 'салем', 'добрый', 'hello', 'hi ', 'хай', 'йо'],
            responses: [
                'Привет! 👋 Я AI-ассистент QAZGOST. Помогу вам с оценкой строительных работ, подбором материалов и подрядчиков. Что вас интересует?',
                'Салем! 🏗️ Рад видеть вас! Я ваш AI-консультант по строительству. Могу помочь с расчётами, нормативами и выбором материалов.',
                'Здравствуйте! 😊 Я QAZGOST AI — ваш умный помощник. Спрашивайте о строительстве, ценах, материалах — отвечу на всё!'
            ]
        },

        // Цены и стоимость
        pricing: {
            patterns: ['цена', 'стоимость', 'сколько стоит', 'прайс', 'расценка', 'дорого', 'дешево', 'бюджет', 'смета', 'калькулятор'],
            responses: [
                '💰 **Примерные цены на работы в Казахстане (2026):**\n\n' +
                '• Фундамент: 15 000 – 25 000 ₸/м²\n' +
                '• Кладка кирпича: 8 000 – 14 000 ₸/м²\n' +
                '• Штукатурка: 3 500 – 6 000 ₸/м²\n' +
                '• Электрика: 4 000 – 8 000 ₸/точка\n' +
                '• Сантехника: 5 000 – 12 000 ₸/точка\n\n' +
                '📊 Для точного расчёта загрузите фото объекта в модуль «Оценка стоимости»!',
            ],
            actions: [
                { text: '📊 Рассчитать смету', page: 'estimates' },
                { text: '📏 Расчёт объёмов', page: 'home' }
            ]
        },

        // Материалы
        materials: {
            patterns: ['материал', 'кирпич', 'цемент', 'бетон', 'арматур', 'песок', 'щебень', 'блок', 'утепл', 'гипсокартон', 'металлопрокат'],
            responses: [
                '🧱 **Популярные материалы и средние цены (2026, Казахстан):**\n\n' +
                '• Кирпич красный М-150: 45–65 ₸/шт\n' +
                '• Цемент М-500 (50кг): 2 800–3 500 ₸\n' +
                '• Бетон М-200: 28 000–35 000 ₸/м³\n' +
                '• Арматура d12: 320–380 ₸/м.п.\n' +
                '• Песок речной: 4 500–6 000 ₸/м³\n' +
                '• Щебень фр.5-20: 5 500–7 000 ₸/м³\n' +
                '• Пеноблок 600×300×200: 650–900 ₸/шт\n\n' +
                '💡 Цены зависят от региона. В Астане обычно дешевле, чем в Алматы на 10-15%.'
            ]
        },

        // Нормативы СНиП
        norms: {
            patterns: ['сниП', 'снип', 'СП ', 'норматив', 'гост', 'стандарт', 'норма', 'допуск', 'толщина стен', 'глубина фундамент'],
            responses: [
                '📋 **Ключевые нормативы строительства в РК:**\n\n' +
                '🔹 **СН РК 1.02-01-2019** — Порядок разработки проектной документации\n' +
                '🔹 **СП РК 2.02-01** — Фундаменты зданий: глубина ≥ глубины промерзания\n' +
                '🔹 **СН РК 5.04-01** — Теплотехника: термическое сопротивление стен R ≥ 3.5 м²·°C/Вт\n' +
                '🔹 **СП РК 5.01-01** — Несущие конструкции\n\n' +
                '⚠️ **Минимальные требования:**\n' +
                '• Глубина фундамента (Астана): ≥ 2.0м\n' +
                '• Толщина несущей стены (кирпич): ≥ 380мм\n' +
                '• Толщина утеплителя (Алматы): ≥ 100мм\n\n' +
                '🔍 Наш модуль «Проверка дефектов» автоматически проверяет соответствие нормам!'
            ]
        },

        // Техника и маркетплейс
        equipment: {
            patterns: ['техник', 'экскаватор', 'кран', 'бульдозер', 'самосвал', 'бетономешалк', 'аренда техн', 'маркетплейс техн'],
            responses: [
                '🚜 **Маркетплейс строительной техники QAZGOST:**\n\n' +
                'У нас доступна аренда:\n' +
                '• 🏗️ Экскаваторы — от 25 000 ₸/час\n' +
                '• 🏗️ Автокраны — от 35 000 ₸/час\n' +
                '• 🚛 Самосвалы — от 5 000 ₸/рейс\n' +
                '• 🔨 Бетономешалки — от 8 000 ₸/смена\n\n' +
                '✅ Все машины проверены, есть рейтинг и отзывы.\n' +
                '📍 Работаем по всему Казахстану!'
            ],
            actions: [
                { text: '🚜 Открыть маркетплейс техники', page: 'equipment' }
            ]
        },

        // Подрядчики
        contractors: {
            patterns: ['подрядчик', 'бригад', 'рабочи', 'исполнител', 'найти мастер', 'строител', 'ремонтн'],
            responses: [
                '👷 **Подбор подрядчиков:**\n\n' +
                'На нашей платформе вы можете:\n\n' +
                '1️⃣ **Опубликовать заказ** — описать работы, загрузить фото\n' +
                '2️⃣ **Получить предложения** — подрядчики сами откликнутся\n' +
                '3️⃣ **Сравнить** — рейтинг, портфолио, цены\n' +
                '4️⃣ **Выбрать лучшего** — и начать работу!\n\n' +
                '⭐ Средний рейтинг наших подрядчиков: **4.6/5**\n' +
                '🛡️ Гарантия качества и безопасности платежей.'
            ],
            actions: [
                { text: '📋 Создать заказ', page: 'orders' },
                { text: '👤 Мой профиль', page: 'profile' }
            ]
        },

        // VIP строительство
        vip: {
            patterns: ['здани', 'сооружени', 'проект дом', 'коттедж', 'многоэтаж', 'vip', 'строительство дом'],
            responses: [
                '🏗️ **Модуль «Строительство зданий и сооружений»:**\n\n' +
                'Полный цикл управления строительным проектом:\n\n' +
                '📐 **Проектирование** — WBS-декомпозиция, этапы, сроки\n' +
                '📋 **Лоты и тендеры** — публикация, ставки подрядчиков\n' +
                '📊 **Контроль** — прогресс, дефекты, фото-отчёты\n' +
                '📄 **Документы** — акты, сметы, PDF-отчёты\n\n' +
                '🏠 Подходит для: коттеджей, МЖК, коммерческих объектов.'
            ],
            actions: [
                { text: '🏗️ Открыть VIP-модуль', page: 'vip' }
            ]
        },

        // Объёмы
        volumes: {
            patterns: ['объём', 'котлован', 'траншея', 'карьер', 'грунт', 'земляны', 'выемка', 'насып'],
            responses: [
                '📐 **Модуль «Фото-объёмы грунта»:**\n\n' +
                'Быстрый расчёт объёмов по фотографиям:\n\n' +
                '📸 Загрузите фото котлована/карьера\n' +
                '📏 Укажите масштабный ориентир\n' +
                '🤖 AI рассчитает объём выемки/насыпи\n' +
                '📄 Получите PDF-отчёт с расчётами\n\n' +
                '⚡ Точность: до 90% по сравнению с геодезической съёмкой!'
            ],
            actions: [
                { text: '📐 Рассчитать объём', page: 'volume' }
            ]
        },

        // Инженерия
        engineering: {
            patterns: ['инженер', 'проектирован', 'чертёж', 'расчёт конструкц', 'проект'],
            responses: [
                '⚙️ **Инженерные решения:**\n\n' +
                'Наш каталог готовых инженерных решений:\n\n' +
                '🔸 Типовые фундаменты (ленточный, свайный, плитный)\n' +
                '🔸 Конструкции стен (кирпич, блок, каркас)\n' +
                '🔸 Кровельные системы\n' +
                '🔸 Инженерные сети (водоснабжение, канализация)\n\n' +
                '👨‍🔬 Все решения проверены профессиональными инженерами.'
            ],
            actions: [
                { text: '⚙️ Инженерные решения', page: 'engineering' }
            ]
        },

        // Кошелёк/оплата
        finance: {
            patterns: ['оплат', 'кошелёк', 'кошелек', 'баланс', 'пополн', 'комисс', 'деньг', 'перевод'],
            responses: [
                '💳 **Финансовая система QAZGOST:**\n\n' +
                '• 💰 Личный кошелёк с мгновенным пополнением\n' +
                '• 🔒 Безопасные платежи через эскроу\n' +
                '• 📊 История всех транзакций\n' +
                '• 💸 Комиссия: всего 3% для исполнителей\n\n' +
                '💡 Деньги замораживаются до подтверждения выполнения работ — это безопасно для всех сторон!'
            ],
            actions: [
                { text: '💳 Мой кошелёк', page: 'wallet' }
            ]
        },

        // Помощь по навигации
        navigation: {
            patterns: ['как пользоват', 'как работ', 'помощь', 'помоги', 'не понимаю', 'что делать', 'как начать', 'куда нажать', 'инструкц'],
            responses: [
                '📖 **Как пользоваться QAZGOST AI:**\n\n' +
                '**Для заказчика:**\n' +
                '1️⃣ Нажмите «Оценка стоимости» на главной\n' +
                '2️⃣ Загрузите фото объекта\n' +
                '3️⃣ AI рассчитает смету за 3 минуты\n' +
                '4️⃣ Опубликуйте заказ и получите предложения\n\n' +
                '**Для исполнителя:**\n' +
                '1️⃣ Переключитесь в режим «Исполнитель»\n' +
                '2️⃣ Просмотрите доступные заказы\n' +
                '3️⃣ Откликнитесь на интересные\n' +
                '4️⃣ Выполняйте работу и получайте оплату\n\n' +
                '❓ Что конкретно хотите узнать?'
            ]
        },

        // Спасибо / позитив
        thanks: {
            patterns: ['спасибо', 'благодар', 'круто', 'отлично', 'классно', 'супер', 'рахмет', 'молодец'],
            responses: [
                'Рад помочь! 😊 Если будут ещё вопросы — я всегда на связи! 💪',
                'Всегда пожалуйста! 🙏 Обращайтесь в любое время!',
                'Спасибо за добрые слова! 😄 Удачи с вашим проектом! 🏗️'
            ]
        },

        // Прощание
        goodbye: {
            patterns: ['пока', 'до свидани', 'увидимся', 'всего добр', 'bye'],
            responses: [
                'До встречи! 👋 Удачного строительства! Если понадоблюсь — просто откройте чат!',
                'Пока-пока! 🏗️ Хорошего дня! Я буду здесь, если потребуется помощь!'
            ]
        }
    };

    // ─── SMART REPLY ENGINE ──────────────────────────────
    function findBestResponse(userMessage) {
        const msg = userMessage.toLowerCase().trim();

        // Check each category
        let bestMatch = null;
        let bestScore = 0;

        for (const [category, data] of Object.entries(KB)) {
            for (const pattern of data.patterns) {
                if (msg.includes(pattern.toLowerCase())) {
                    const score = pattern.length; // longer match = better
                    if (score > bestScore) {
                        bestScore = score;
                        bestMatch = { category, data };
                    }
                }
            }
        }

        if (bestMatch) {
            const { data } = bestMatch;
            const response = data.responses[Math.floor(Math.random() * data.responses.length)];
            return {
                text: response,
                actions: data.actions || null
            };
        }

        // Fallback — context-aware default
        return _getSmartFallback(msg);
    }

    function _getSmartFallback(msg) {
        // Check if it's a question
        const isQuestion = msg.includes('?') || msg.startsWith('как') || msg.startsWith('что') ||
            msg.startsWith('где') || msg.startsWith('когда') || msg.startsWith('почему') ||
            msg.startsWith('сколько') || msg.startsWith('можно');

        if (isQuestion) {
            return {
                text: '🤔 Интересный вопрос! Вот что я могу предложить:\n\n' +
                    'Я специализируюсь на:\n' +
                    '• 💰 Расчёт стоимости строительных работ\n' +
                    '• 🧱 Информация о материалах и ценах\n' +
                    '• 📋 Нормативы СНиП/СП Казахстана\n' +
                    '• 🚜 Аренда строительной техники\n' +
                    '• 👷 Подбор подрядчиков\n\n' +
                    'Попробуйте задать вопрос в одной из этих областей!',
                actions: [
                    { text: '💰 Узнать цены', query: 'Какие цены на строительные работы?' },
                    { text: '📋 Нормативы', query: 'Расскажи про нормативы СНиП' },
                    { text: '🚜 Техника', query: 'Какая техника доступна в аренду?' }
                ]
            };
        }

        // Generic fallback
        return {
            text: '👋 Я AI-ассистент QAZGOST — специализируюсь на строительстве.\n\n' +
                'Могу помочь с:\n' +
                '• Расчётом стоимости работ\n' +
                '• Подбором материалов\n' +
                '• Нормативами и стандартами\n' +
                '• Навигацией по приложению\n\n' +
                'Задайте вопрос или выберите тему! 👇',
            actions: [
                { text: '📊 Рассчитать смету', page: 'estimates' },
                { text: '🧱 Цены материалов', query: 'Расскажи про цены на материалы' },
                { text: '📖 Как пользоваться?', query: 'Как пользоваться приложением?' }
            ]
        };
    }

    // ─── UI RENDERING ────────────────────────────────────

    function _createWidget() {
        // Floating Action Button
        const fab = document.createElement('button');
        fab.id = 'aiAssistantFab';
        fab.setAttribute('aria-label', 'Открыть AI ассистент');
        fab.innerHTML = `
            <span class="fab-icon">🤖</span>
            <span class="fab-badge" id="aiBadge"></span>
        `;
        fab.addEventListener('click', toggle);

        // Chat Panel
        const panel = document.createElement('div');
        panel.id = 'aiAssistantPanel';
        panel.innerHTML = `
            <div class="ai-chat-header">
                <div class="ai-avatar">${CONFIG.BOT_ICON}</div>
                <div class="ai-info">
                    <div class="ai-name">${CONFIG.BOT_NAME} <span style="font-size:11px;opacity:.5">✨</span></div>
                    <div class="ai-status">Онлайн — готов помочь</div>
                </div>
                <div class="header-actions">
                    <button class="header-btn" id="aiClearBtn" title="Очистить чат">🗑️</button>
                    <button class="header-btn" id="aiCloseBtn" title="Закрыть">✕</button>
                </div>
            </div>
            <div class="ai-quick-actions" id="aiQuickActions">
                <button class="ai-quick-btn" data-q="Сколько стоит ремонт?">💰 Цены</button>
                <button class="ai-quick-btn" data-q="Расскажи про материалы">🧱 Материалы</button>
                <button class="ai-quick-btn" data-q="Какие нормативы СНиП?">📋 Нормативы</button>
                <button class="ai-quick-btn" data-q="Какая техника в аренду?">🚜 Техника</button>
                <button class="ai-quick-btn" data-q="Как пользоваться?">❓ Помощь</button>
            </div>
            <div class="ai-chat-messages" id="aiMessages"></div>
            <div class="ai-powered-by">Powered by QAZGOST AI Engine</div>
            <div class="ai-chat-input">
                <div class="input-wrapper">
                    <textarea id="aiInput" placeholder="Задайте вопрос о строительстве..." rows="1"></textarea>
                    <button class="send-btn" id="aiSendBtn" disabled>➤</button>
                </div>
            </div>
        `;

        document.body.appendChild(fab);
        document.body.appendChild(panel);

        // Event listeners
        document.getElementById('aiCloseBtn').addEventListener('click', close);
        document.getElementById('aiClearBtn').addEventListener('click', _clearChat);

        const input = document.getElementById('aiInput');
        const sendBtn = document.getElementById('aiSendBtn');

        input.addEventListener('input', () => {
            sendBtn.disabled = !input.value.trim();
            _autoResize(input);
        });

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (input.value.trim()) _sendMessage();
            }
        });

        sendBtn.addEventListener('click', () => {
            if (input.value.trim()) _sendMessage();
        });

        // Quick actions
        document.getElementById('aiQuickActions').addEventListener('click', (e) => {
            const btn = e.target.closest('.ai-quick-btn');
            if (btn) {
                const q = btn.dataset.q;
                if (q) {
                    input.value = q;
                    _sendMessage();
                }
            }
        });

        // Load history
        _loadHistory();
    }

    function _autoResize(textarea) {
        textarea.style.height = 'auto';
        textarea.style.height = Math.min(textarea.scrollHeight, 100) + 'px';
    }

    // ─── MESSAGE HANDLING ────────────────────────────────

    function _sendMessage() {
        const input = document.getElementById('aiInput');
        const text = input.value.trim();
        if (!text || _isTyping) return;

        // Add user message
        _addMessage('user', text);

        // Clear input
        input.value = '';
        input.style.height = 'auto';
        document.getElementById('aiSendBtn').disabled = true;

        // Show typing indicator
        _showTyping();

        // Use SmartBrain if available, otherwise fallback to KB
        _getSmartResponse(text).then(response => {
            _hideTyping();
            const source = response.source || 'rules';
            _addMessage('bot', response.text, response.actions, source);
        }).catch(err => {
            console.warn('[AIAssistant] SmartBrain error:', err);
            _hideTyping();
            const response = findBestResponse(text);
            _addMessage('bot', response.text, response.actions);
        });
    }

    /**
     * Get response from SmartBrain (async, with LLM fallback)
     * Falls back to local KB if SmartBrain unavailable
     */
    async function _getSmartResponse(text) {
        // Try SmartBrain first
        if (window.AISmartBrain) {
            try {
                const response = await window.AISmartBrain.processMessage(text);
                if (response && response.text) {
                    return response;
                }
            } catch (e) {
                console.warn('[AIAssistant] SmartBrain failed:', e.message);
            }
        }

        // Fallback to local KB rules
        return new Promise(resolve => {
            const delay = CONFIG.TYPING_DELAY_MIN + Math.random() * (CONFIG.TYPING_DELAY_MAX - CONFIG.TYPING_DELAY_MIN);
            setTimeout(() => {
                resolve(findBestResponse(text));
            }, delay);
        });
    }

    function _addMessage(sender, text, actions, source) {
        const msg = {
            id: Date.now() + '_' + Math.random().toString(36).substr(2, 6),
            sender,
            text,
            actions: actions || null,
            source: source || null,
            time: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
        };

        _messages.push(msg);
        _saveHistory();
        _renderMessage(msg);
        _scrollToBottom();
    }

    function _renderMessage(msg) {
        const container = document.getElementById('aiMessages');
        if (!container) return;

        // Remove welcome screen if present
        const welcome = container.querySelector('.ai-welcome');
        if (welcome) welcome.remove();

        const el = document.createElement('div');
        el.className = `ai-msg ${msg.sender}`;
        el.dataset.id = msg.id;

        let html = '';

        if (msg.sender === 'bot') {
            const sourceLabel = msg.source === 'gemini'
                ? `<span class="ai-source-badge gemini">✨ Gemini</span>`
                : msg.source === 'brain'
                    ? `<span class="ai-source-badge brain">🧠 Smart</span>`
                    : '';
            html += `<div class="msg-sender">${CONFIG.BOT_ICON} ${CONFIG.BOT_NAME} ${sourceLabel}</div>`;
        }

        // Format text: bold, newlines, etc.
        html += `<div class="msg-text">${_formatText(msg.text)}</div>`;

        // Action buttons
        if (msg.actions && msg.actions.length) {
            html += '<div class="msg-actions">';
            msg.actions.forEach(a => {
                if (a.page) {
                    const prefill = a.prefillDescription ? ` data-prefill="${_escapeHtml(a.prefillDescription)}"` : '';
                    html += `<button class="msg-action-btn" data-page="${a.page}"${prefill}>${a.text}</button>`;
                } else if (a.query) {
                    html += `<button class="msg-action-btn" data-query="${_escapeHtml(a.query)}">${a.text}</button>`;
                } else if (a.action) {
                    html += `<button class="msg-action-btn" data-action="${a.action}">${a.text}</button>`;
                }
            });
            html += '</div>';
        }

        html += `<div class="msg-time">${msg.time}</div>`;

        el.innerHTML = html;

        // Action button events
        el.querySelectorAll('.msg-action-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                if (btn.dataset.page) {
                    // Navigate to page
                    if (window.showPage) {
                        window.showPage(btn.dataset.page);
                        // Prefill estimate description if coming from bot
                        if (btn.dataset.prefill && btn.dataset.page === 'estimates') {
                            setTimeout(() => {
                                const textarea = document.getElementById('peAiDescription');
                                if (textarea) {
                                    textarea.value = btn.dataset.prefill;
                                    textarea.dispatchEvent(new Event('input'));
                                }
                                // Also set skip category mode
                                if (window.PhotoEstimateModule && window.PhotoEstimateModule.setSkipCategory) {
                                    window.PhotoEstimateModule.setSkipCategory(true, btn.dataset.prefill);
                                }
                            }, 500);
                        }
                        close(); // close chat when navigating
                    }
                } else if (btn.dataset.query) {
                    // Send as new message
                    const input = document.getElementById('aiInput');
                    input.value = btn.dataset.query;
                    _sendMessage();
                } else if (btn.dataset.action) {
                    // Execute a special action
                    _executeAction(btn.dataset.action);
                }
            });
        });

        container.appendChild(el);
    }

    function _formatText(text) {
        return text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\n/g, '<br>');
    }

    /**
     * Execute special actions from bot responses
     */
    function _executeAction(actionName) {
        switch (actionName) {
            case 'reload':
                window.location.reload();
                break;
            case 'clear_cache':
                if (caches) caches.keys().then(ks => ks.forEach(k => caches.delete(k)));
                window.location.reload();
                break;
            default:
                console.log('[AIAssistant] Unknown action:', actionName);
        }
    }

    function _escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    // ─── TYPING INDICATOR ────────────────────────────────

    function _showTyping() {
        _isTyping = true;
        const container = document.getElementById('aiMessages');
        if (!container) return;

        const typing = document.createElement('div');
        typing.className = 'ai-typing';
        typing.id = 'aiTypingIndicator';
        typing.innerHTML = '<span class="dot"></span><span class="dot"></span><span class="dot"></span>';
        container.appendChild(typing);
        _scrollToBottom();
    }

    function _hideTyping() {
        _isTyping = false;
        const typing = document.getElementById('aiTypingIndicator');
        if (typing) typing.remove();
    }

    // ─── WELCOME SCREEN ─────────────────────────────────

    function _showWelcome() {
        const container = document.getElementById('aiMessages');
        if (!container || _messages.length > 0) return;

        container.innerHTML = `
            <div class="ai-welcome">
                <div class="welcome-icon">🏗️</div>
                <h3>Привет! Я QAZGOST AI</h3>
                <p>Ваш умный помощник по строительству. Задайте вопрос или выберите тему:</p>
                <div class="welcome-chips">
                    <button class="welcome-chip" data-q="Сколько стоит ремонт квартиры?">
                        <span class="chip-icon">💰</span> Сколько стоит ремонт?
                    </button>
                    <button class="welcome-chip" data-q="Какие материалы нужны для фундамента?">
                        <span class="chip-icon">🧱</span> Материалы для фундамента
                    </button>
                    <button class="welcome-chip" data-q="Расскажи про нормативы СНиП в Казахстане">
                        <span class="chip-icon">📋</span> Нормативы СНиП Казахстана
                    </button>
                    <button class="welcome-chip" data-q="Как найти хорошего подрядчика?">
                        <span class="chip-icon">👷</span> Найти подрядчика
                    </button>
                    <button class="welcome-chip" data-q="Как пользоваться приложением?">
                        <span class="chip-icon">📖</span> Как пользоваться?
                    </button>
                </div>
            </div>
        `;

        // Welcome chip click handler
        container.querySelectorAll('.welcome-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                const q = chip.dataset.q;
                if (q) {
                    const input = document.getElementById('aiInput');
                    input.value = q;
                    _sendMessage();
                }
            });
        });
    }

    // ─── SCROLL & UTILITIES ──────────────────────────────

    function _scrollToBottom() {
        const container = document.getElementById('aiMessages');
        if (container) {
            requestAnimationFrame(() => {
                container.scrollTop = container.scrollHeight;
            });
        }
    }

    // ─── PERSISTENCE ─────────────────────────────────────

    function _saveHistory() {
        try {
            const toSave = _messages.slice(-CONFIG.MAX_HISTORY);
            localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(toSave));
        } catch (e) { /* ignore */ }
    }

    function _loadHistory() {
        try {
            const saved = localStorage.getItem(CONFIG.STORAGE_KEY);
            if (saved) {
                _messages = JSON.parse(saved);
                const container = document.getElementById('aiMessages');
                if (container) {
                    _messages.forEach(msg => _renderMessage(msg));
                    _scrollToBottom();
                }
            }
        } catch (e) {
            _messages = [];
        }

        // Show welcome if no messages
        if (_messages.length === 0) {
            _showWelcome();
        }
    }

    async function _clearChat() {
        const ok = await (window.QazUI?.confirm || window.confirm)('Очистить историю чата?', 'Все сообщения будут удалены', { icon: '🗑️', confirmText: 'Очистить' });
        if (!ok) return;
        _messages = [];
        localStorage.removeItem(CONFIG.STORAGE_KEY);
        const container = document.getElementById('aiMessages');
        if (container) container.innerHTML = '';
        _showWelcome();
    }

    // ─── PUBLIC API ──────────────────────────────────────

    function open() {
        _isOpen = true;
        const fab = document.getElementById('aiAssistantFab');
        const panel = document.getElementById('aiAssistantPanel');
        if (fab) {
            fab.classList.add('open');
            fab.querySelector('.fab-icon').textContent = '✕';
        }
        if (panel) {
            panel.classList.add('open');
        }
        // Focus input
        setTimeout(() => {
            const input = document.getElementById('aiInput');
            if (input) input.focus();
        }, 400);
        // Hide badge
        const badge = document.getElementById('aiBadge');
        if (badge) badge.classList.remove('show');
    }

    function close() {
        _isOpen = false;
        const fab = document.getElementById('aiAssistantFab');
        const panel = document.getElementById('aiAssistantPanel');
        if (fab) {
            fab.classList.remove('open');
            fab.querySelector('.fab-icon').textContent = '🤖';
        }
        if (panel) {
            panel.classList.remove('open');
        }
    }

    function toggle() {
        if (_isOpen) close(); else open();
    }

    function isOpen() {
        return _isOpen;
    }

    /**
     * Programmatically send a message as the user
     * @param {string} message
     */
    function ask(message) {
        if (!_isOpen) open();
        setTimeout(() => {
            const input = document.getElementById('aiInput');
            if (input) {
                input.value = message;
                _sendMessage();
            }
        }, 500);
    }

    /**
     * Show notification badge on FAB
     * @param {number} count
     */
    function showBadge(count) {
        const badge = document.getElementById('aiBadge');
        if (badge) {
            badge.textContent = count > 9 ? '9+' : count;
            badge.classList.toggle('show', count > 0);
        }
    }

    // ─── INITIALIZATION ──────────────────────────────────

    function init() {
        // Don't double-init
        if (document.getElementById('aiAssistantFab')) return;

        _createWidget();

        const hasBrain = !!window.AISmartBrain;
        const hasGemini = !!(window.GeminiService && window.GeminiService.isConfigured());
        console.log(`[AIAssistant] ✅ AI Assistant v2.0 loaded | SmartBrain: ${hasBrain} | Gemini: ${hasGemini}`);

        // Show a proactive greeting after 5 seconds if user hasn't used it
        if (_messages.length === 0) {
            setTimeout(() => {
                if (!_isOpen) {
                    showBadge(1);
                }
            }, 5000);
        }
    }

    // ─── EXPORT ──────────────────────────────────────────

    window.AIAssistant = {
        init,
        open,
        close,
        toggle,
        isOpen,
        ask,
        showBadge
    };

    // Auto-init on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        // DOM already loaded, init with slight delay for other scripts
        setTimeout(init, 100);
    }

})();
