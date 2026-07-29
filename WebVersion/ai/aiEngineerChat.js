// ========== AI ENGINEER CHAT ==========
// ИИ-консультант для технических вопросов
// Замена функции инженера "Консультирует"

(function () {
    'use strict';

    // ========== KNOWLEDGE BASE ==========
    // База знаний по строительным нормам и стандартам

    const KNOWLEDGE_BASE = {
        // Категории знаний
        categories: {
            snip: 'СНиПы и строительные нормы',
            gost: 'ГОСТы',
            materials: 'Материалы и технологии',
            pricing: 'Ценообразование',
            timeline: 'Сроки выполнения',
            permits: 'Разрешения и документы',
            safety: 'Безопасность',
            energy: 'Энергоэффективность'
        },

        // FAQ — часто задаваемые вопросы
        faq: [
            {
                id: 'faq_1',
                question: 'Какие документы нужны для начала проектирования?',
                answer: 'Для начала проектирования необходимы:\n• Правоустанавливающие документы на участок\n• Топографическая съёмка\n• Геологические изыскания (для крупных объектов)\n• Технические условия на подключение коммуникаций\n• Архитектурное задание или эскиз',
                keywords: ['документы', 'проектирование', 'начало', 'что нужно'],
                category: 'permits'
            },
            {
                id: 'faq_2',
                question: 'Сколько стоит проектирование дома?',
                answer: 'Стоимость проектирования зависит от площади и сложности:\n• Эскизный проект: 500-1500 тг/м²\n• Архитектурный раздел: 1000-3000 тг/м²\n• Полный комплект (АР+КР+ИР): 3000-8000 тг/м²\n• VIP-проект с авторским надзором: от 10000 тг/м²\n\nТочную стоимость рассчитает калькулятор при оформлении заявки.',
                keywords: ['стоимость', 'цена', 'проектирование', 'сколько стоит'],
                category: 'pricing'
            },
            {
                id: 'faq_3',
                question: 'Какой фундамент выбрать для дома?',
                answer: 'Выбор фундамента зависит от грунта и нагрузки:\n• Ленточный — для домов до 2 этажей на стабильном грунте\n• Плитный — для сложных грунтов и тяжёлых домов\n• Свайный — для болотистой местности и склонов\n• Комбинированный — для индивидуальных случаев\n\nРекомендуем заказать геологию перед выбором.',
                keywords: ['фундамент', 'основание', 'грунт', 'какой выбрать'],
                category: 'materials'
            },
            {
                id: 'faq_4',
                question: 'Сколько времени занимает проектирование?',
                answer: 'Средние сроки проектирования:\n• Эскизный проект: 5-10 рабочих дней\n• Архитектурный раздел: 15-30 дней\n• Полный комплект: 30-60 дней\n• Экспертиза: +20-40 дней\n\nСрочное проектирование (VIP) сокращает сроки на 30-50%.',
                keywords: ['сроки', 'время', 'сколько занимает', 'как долго'],
                category: 'timeline'
            },
            {
                id: 'faq_5',
                question: 'Нужно ли разрешение на строительство частного дома?',
                answer: 'Да, для строительства частного дома нужны:\n• Архитектурно-планировочное задание (АПЗ)\n• Согласование с управлением архитектуры\n• Уведомление о начале строительства\n\nДля домов до 100 м² на ИЖС — упрощённая процедура.\nМы можем помочь с оформлением всех разрешений.',
                keywords: ['разрешение', 'строительство', 'согласование', 'документы'],
                category: 'permits'
            },
            {
                id: 'faq_6',
                question: 'Какие нормы по высоте потолков?',
                answer: 'Минимальные высоты по СНиП:\n• Жилые комнаты: 2.5 м (в климатических районах)\n• Кухня: 2.5 м\n• Коридоры: 2.1 м\n• Подвал: 2.0 м\n• Мансарда: 2.3 м (под скатом можно 1.5 м)\n\nРекомендуемая высота для комфорта: 2.7-3.0 м.',
                keywords: ['высота', 'потолок', 'нормы', 'снип'],
                category: 'snip'
            },
            {
                id: 'faq_7',
                question: 'Как рассчитать толщину утеплителя?',
                answer: 'Толщина утеплителя зависит от региона и материала:\n• Алматы (зона I): 100-150 мм минваты\n• Астана (зона II): 150-200 мм\n• Северные районы: 200-250 мм\n\nФормула: R = δ/λ, где R — требуемое сопротивление теплопередаче.\nМы делаем точный расчёт в проекте энергоэффективности.',
                keywords: ['утеплитель', 'утепление', 'толщина', 'теплоизоляция'],
                category: 'energy'
            },
            {
                id: 'faq_8',
                question: 'Какой материал стен лучше?',
                answer: 'Сравнение материалов стен:\n• Кирпич — прочный, долговечный, дорогой\n• Газобетон — тёплый, лёгкий, быстрый монтаж\n• СИП-панели — самый быстрый монтаж, требует качественной пароизоляции\n• Каркас — экономичный, но требует качественного утепления\n• Монолит — для многоэтажек и сложных форм\n\nВыбор зависит от бюджета, сроков и климата.',
                keywords: ['материал', 'стены', 'кирпич', 'газобетон', 'какой лучше'],
                category: 'materials'
            }
        ],

        // Шаблоны ответов
        templates: {
            greeting: 'Здравствуйте! Я ИИ-консультант QAZGOST AI. Чем могу помочь?',
            notFound: 'К сожалению, я не нашёл точного ответа на ваш вопрос. Рекомендую:\n• Переформулировать вопрос\n• Обратиться к администратору для сложных вопросов\n\nИли выберите тему из списка: СНиПы, материалы, цены, сроки, разрешения.',
            escalate: 'Этот вопрос требует консультации специалиста. Я передам ваш запрос администратору, и вам ответят в течение 24 часов.',
            suggestion: 'Возможно, вас интересует:',
            confidence: (level) => {
                if (level > 0.8) return '✅ Высокая уверенность';
                if (level > 0.5) return '⚠️ Средняя уверенность — проверьте информацию';
                return '❓ Низкая уверенность — рекомендую консультацию специалиста';
            }
        }
    };

    // ========== CHAT ENGINE ==========

    class AIChatEngine {
        constructor() {
            this.conversationHistory = [];
            this.userId = null;
            this.sessionId = this.generateSessionId();
            this.estimateContext = null; // Current estimate for context-aware answers
        }

        generateSessionId() {
            return 'chat_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        }

        // Поиск релевантного FAQ
        findRelevantFAQ(query) {
            const queryLower = query.toLowerCase();
            const words = queryLower.split(/\s+/);

            let bestMatch = null;
            let bestScore = 0;

            KNOWLEDGE_BASE.faq.forEach(faq => {
                let score = 0;

                // Проверка ключевых слов
                faq.keywords.forEach(keyword => {
                    if (queryLower.includes(keyword)) {
                        score += 2;
                    }
                    words.forEach(word => {
                        if (word.length > 3 && keyword.includes(word)) {
                            score += 1;
                        }
                    });
                });

                // Проверка вопроса
                const questionWords = faq.question.toLowerCase().split(/\s+/);
                words.forEach(word => {
                    if (word.length > 3 && questionWords.some(qw => qw.includes(word))) {
                        score += 0.5;
                    }
                });

                if (score > bestScore) {
                    bestScore = score;
                    bestMatch = faq;
                }
            });

            return {
                faq: bestMatch,
                confidence: Math.min(bestScore / 6, 1) // Нормализация до 0-1
            };
        }

        // Обработка сообщения
        async processMessage(message) {
            const startTime = Date.now();

            // Добавляем в историю
            this.conversationHistory.push({
                role: 'user',
                content: message,
                timestamp: new Date().toISOString()
            });

            // Анализ сообщения
            const response = this.analyzeAndRespond(message);

            // Добавляем ответ в историю
            this.conversationHistory.push({
                role: 'assistant',
                content: response.text,
                timestamp: new Date().toISOString(),
                confidence: response.confidence,
                source: response.source
            });

            return {
                text: response.text,
                confidence: response.confidence,
                confidenceLabel: KNOWLEDGE_BASE.templates.confidence(response.confidence),
                suggestions: response.suggestions || [],
                source: response.source,
                needsEscalation: response.confidence < 0.3,
                processingTime: Date.now() - startTime
            };
        }

        // Анализ и генерация ответа
        async analyzeAndRespond(message) {
            const messageLower = message.toLowerCase();

            // Проверка приветствия
            if (this.isGreeting(messageLower)) {
                return {
                    text: KNOWLEDGE_BASE.templates.greeting,
                    confidence: 1.0,
                    source: 'greeting',
                    suggestions: this.getTopicSuggestions()
                };
            }

            // Поиск в FAQ
            const faqResult = this.findRelevantFAQ(message);

            if (faqResult.faq && faqResult.confidence >= 0.5) {
                return {
                    text: faqResult.faq.answer,
                    confidence: faqResult.confidence,
                    source: 'faq',
                    faqId: faqResult.faq.id,
                    category: faqResult.faq.category,
                    suggestions: this.getSimilarQuestions(faqResult.faq.category)
                };
            }

            // Частичное совпадение
            if (faqResult.faq && faqResult.confidence >= 0.3) {
                return {
                    text: `${KNOWLEDGE_BASE.templates.suggestion}\n\n**${faqResult.faq.question}**\n\n${faqResult.faq.answer}`,
                    confidence: faqResult.confidence,
                    source: 'faq_partial',
                    suggestions: this.getSimilarQuestions(faqResult.faq.category)
                };
            }

            // Не найдено в FAQ — попробуем Gemini AI
            if (window.GeminiService && window.GeminiService.isConfigured()) {
                try {
                    const contextPrompt = this._buildGeminiPrompt(message);
                    const geminiResponse = await window.GeminiService.generateContent(contextPrompt);
                    if (geminiResponse && geminiResponse.text) {
                        return {
                            text: geminiResponse.text,
                            confidence: 0.7,
                            source: 'gemini_ai',
                            suggestions: this.getTopicSuggestions()
                        };
                    }
                } catch (geminiErr) {
                    console.warn('[AIChat] Gemini fallback failed:', geminiErr.message);
                }
            }

            // Финальный fallback
            return {
                text: KNOWLEDGE_BASE.templates.notFound,
                confidence: 0.1,
                source: 'not_found',
                suggestions: this.getTopicSuggestions()
            };
        }

        /** Build Gemini prompt with construction context */
        _buildGeminiPrompt(question) {
            let systemCtx = 'Ты — ИИ-инженер QAZGOST AI, эксперт по строительству в Казахстане. ';
            systemCtx += 'Отвечай на русском, кратко и по существу. ';
            systemCtx += 'Используй СНиПы, ГОСТы РК и СП РК. Цены в тенге.';

            if (this.estimateContext) {
                const ctx = this.estimateContext;
                systemCtx += `\n\nТекущая смета: ${ctx.objectType || 'объект'}, ${(ctx.items || []).length} позиций, итого ${ctx.total || 0} ₸.`;
                if (ctx.items && ctx.items.length > 0) {
                    systemCtx += '\nПозиции: ' + ctx.items.slice(0, 10).map(i => `${i.name || i.work_name} (${i.total_price || 0}₸)`).join(', ');
                }
            }

            return [{ text: systemCtx + '\n\nВопрос пользователя: ' + question }];
        }

        /** Set current estimate context for context-aware answers */
        setEstimateContext(ctx) {
            this.estimateContext = ctx;
            console.log(`[AIChat] Estimate context set: ${ctx?.objectType || 'generic'}, ${(ctx?.items || []).length} items`);
        }

        // Проверка приветствия
        isGreeting(message) {
            const greetings = ['привет', 'здравствуй', 'добрый день', 'добрый вечер',
                'доброе утро', 'хай', 'hello', 'hi', 'салем'];
            return greetings.some(g => message.includes(g));
        }

        // Получить предложения по темам
        getTopicSuggestions() {
            return [
                'Документы для проектирования',
                'Стоимость проектирования',
                'Сроки выполнения работ',
                'Выбор материалов',
                'Разрешения на строительство'
            ];
        }

        // Получить похожие вопросы
        getSimilarQuestions(category) {
            return KNOWLEDGE_BASE.faq
                .filter(faq => faq.category === category)
                .slice(0, 3)
                .map(faq => faq.question);
        }

        // Эскалация на человека
        escalateToHuman(message, reason = 'complex_query') {
            const escalation = {
                id: 'esc_' + Date.now(),
                sessionId: this.sessionId,
                userId: this.userId,
                message: message,
                reason: reason,
                conversationHistory: this.conversationHistory.slice(-10),
                createdAt: new Date().toISOString(),
                status: 'pending'
            };

            // Сохраняем эскалацию
            const escalations = JSON.parse(localStorage.getItem('ai_escalations') || '[]');
            escalations.push(escalation);
            localStorage.setItem('ai_escalations', JSON.stringify(escalations));

            return {
                text: KNOWLEDGE_BASE.templates.escalate,
                escalationId: escalation.id
            };
        }

        // Получить историю разговора
        getHistory() {
            return this.conversationHistory;
        }

        // Очистить историю
        clearHistory() {
            this.conversationHistory = [];
        }
    }

    // ========== CHAT UI CONTROLLER ==========

    const ChatUI = {
        isOpen: false,
        engine: null,

        init() {
            this.engine = new AIChatEngine();
            this.createChatWidget();
            console.log('[AIChat] Initialized');
        },

        createChatWidget() {
            // Проверяем, существует ли уже виджет
            if (document.getElementById('ai-chat-widget')) return;

            const widget = document.createElement('div');
            widget.id = 'ai-chat-widget';
            widget.innerHTML = `
                <style>
                    #ai-chat-widget {
                        position: fixed;
                        bottom: 20px;
                        right: 20px;
                        z-index: 10000;
                        font-family: 'Inter', -apple-system, sans-serif;
                    }
                    
                    #ai-chat-button {
                        width: 60px;
                        height: 60px;
                        border-radius: 50%;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        border: none;
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        box-shadow: 0 4px 20px rgba(102, 126, 234, 0.4);
                        transition: transform 0.3s, box-shadow 0.3s;
                    }
                    
                    #ai-chat-button:hover {
                        transform: scale(1.1);
                        box-shadow: 0 6px 30px rgba(102, 126, 234, 0.6);
                    }
                    
                    #ai-chat-button svg {
                        width: 28px;
                        height: 28px;
                        fill: white;
                    }
                    
                    #ai-chat-window {
                        position: absolute;
                        bottom: 80px;
                        right: 0;
                        width: 380px;
                        height: 520px;
                        background: white;
                        border-radius: 16px;
                        box-shadow: 0 10px 40px rgba(0,0,0,0.15);
                        display: none;
                        flex-direction: column;
                        overflow: hidden;
                    }
                    
                    #ai-chat-window.open {
                        display: flex;
                        animation: slideUp 0.3s ease-out;
                    }
                    
                    @keyframes slideUp {
                        from { opacity: 0; transform: translateY(20px); }
                        to { opacity: 1; transform: translateY(0); }
                    }
                    
                    .ai-chat-header {
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                        padding: 16px 20px;
                        display: flex;
                        align-items: center;
                        gap: 12px;
                    }
                    
                    .ai-chat-header-avatar {
                        width: 40px;
                        height: 40px;
                        background: rgba(255,255,255,0.2);
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 20px;
                    }
                    
                    .ai-chat-header-info h4 {
                        margin: 0;
                        font-size: 16px;
                        font-weight: 600;
                    }
                    
                    .ai-chat-header-info span {
                        font-size: 12px;
                        opacity: 0.8;
                    }
                    
                    .ai-chat-close {
                        margin-left: auto;
                        background: none;
                        border: none;
                        color: white;
                        cursor: pointer;
                        font-size: 24px;
                        opacity: 0.8;
                    }
                    
                    .ai-chat-close:hover {
                        opacity: 1;
                    }
                    
                    .ai-chat-messages {
                        flex: 1;
                        overflow-y: auto;
                        padding: 16px;
                        display: flex;
                        flex-direction: column;
                        gap: 12px;
                    }
                    
                    .ai-message {
                        max-width: 85%;
                        padding: 12px 16px;
                        border-radius: 16px;
                        font-size: 14px;
                        line-height: 1.5;
                        white-space: pre-wrap;
                    }
                    
                    .ai-message.bot {
                        background: #f0f0f5;
                        align-self: flex-start;
                        border-bottom-left-radius: 4px;
                    }
                    
                    .ai-message.user {
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                        align-self: flex-end;
                        border-bottom-right-radius: 4px;
                    }
                    
                    .ai-message-confidence {
                        font-size: 11px;
                        margin-top: 8px;
                        opacity: 0.7;
                    }
                    
                    .ai-suggestions {
                        display: flex;
                        flex-wrap: wrap;
                        gap: 8px;
                        margin-top: 8px;
                    }
                    
                    .ai-suggestion-btn {
                        background: #e8eaf6;
                        border: none;
                        padding: 6px 12px;
                        border-radius: 20px;
                        font-size: 12px;
                        cursor: pointer;
                        transition: background 0.2s;
                    }
                    
                    .ai-suggestion-btn:hover {
                        background: #c5cae9;
                    }
                    
                    .ai-chat-input {
                        padding: 16px;
                        border-top: 1px solid #eee;
                        display: flex;
                        gap: 12px;
                    }
                    
                    .ai-chat-input input {
                        flex: 1;
                        padding: 12px 16px;
                        border: 1px solid #ddd;
                        border-radius: 24px;
                        font-size: 14px;
                        outline: none;
                        transition: border-color 0.2s;
                    }
                    
                    .ai-chat-input input:focus {
                        border-color: #667eea;
                    }
                    
                    .ai-chat-input button {
                        width: 44px;
                        height: 44px;
                        border-radius: 50%;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        border: none;
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    }
                    
                    .ai-chat-input button svg {
                        width: 20px;
                        height: 20px;
                        fill: white;
                    }
                    
                    .ai-typing {
                        display: flex;
                        gap: 4px;
                        padding: 12px 16px;
                        background: #f0f0f5;
                        border-radius: 16px;
                        width: fit-content;
                    }
                    
                    .ai-typing span {
                        width: 8px;
                        height: 8px;
                        background: #667eea;
                        border-radius: 50%;
                        animation: typing 1s infinite;
                    }
                    
                    .ai-typing span:nth-child(2) { animation-delay: 0.2s; }
                    .ai-typing span:nth-child(3) { animation-delay: 0.4s; }
                    
                    @keyframes typing {
                        0%, 100% { opacity: 0.3; }
                        50% { opacity: 1; }
                    }
                </style>
                
                <button id="ai-chat-button" onclick="ChatUI.toggle()">
                    <svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/></svg>
                </button>
                
                <div id="ai-chat-window">
                    <div class="ai-chat-header">
                        <div class="ai-chat-header-avatar">🤖</div>
                        <div class="ai-chat-header-info">
                            <h4>ИИ-Инженер</h4>
                            <span>Онлайн • Готов помочь</span>
                        </div>
                        <button class="ai-chat-close" onclick="ChatUI.toggle()">×</button>
                    </div>
                    
                    <div class="ai-chat-messages" id="ai-chat-messages">
                        <div class="ai-message bot">
                            Здравствуйте! 👋 Я ИИ-консультант QAZGOST AI.
                            
Могу помочь с вопросами по:
• Проектированию и документам
• Ценам и срокам
• Материалам и технологиям
• Строительным нормам

Задайте ваш вопрос!
                        </div>
                    </div>
                    
                    <div class="ai-chat-input">
                        <input type="text" id="ai-chat-input-field" placeholder="Введите вопрос..." 
                               onkeypress="if(event.key==='Enter')ChatUI.sendMessage()">
                        <button onclick="ChatUI.sendMessage()">
                            <svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
                        </button>
                    </div>
                </div>
            `;

            document.body.appendChild(widget);
        },

        toggle() {
            const window = document.getElementById('ai-chat-window');
            this.isOpen = !this.isOpen;
            window.classList.toggle('open', this.isOpen);
        },

        async sendMessage() {
            const input = document.getElementById('ai-chat-input-field');
            const message = input.value.trim();
            if (!message) return;

            const messagesContainer = document.getElementById('ai-chat-messages');

            // Добавляем сообщение пользователя
            messagesContainer.innerHTML += `
                <div class="ai-message user">${this.escapeHtml(message)}</div>
            `;

            input.value = '';
            messagesContainer.scrollTop = messagesContainer.scrollHeight;

            // Показываем индикатор набора
            messagesContainer.innerHTML += `
                <div class="ai-typing" id="ai-typing">
                    <span></span><span></span><span></span>
                </div>
            `;
            messagesContainer.scrollTop = messagesContainer.scrollHeight;

            // Обрабатываем сообщение
            const response = await this.engine.processMessage(message);

            // Убираем индикатор
            document.getElementById('ai-typing')?.remove();

            // Добавляем ответ бота
            let suggestionsHtml = '';
            if (response.suggestions && response.suggestions.length > 0) {
                suggestionsHtml = `
                    <div class="ai-suggestions">
                        ${response.suggestions.map(s =>
                    `<button class="ai-suggestion-btn" onclick="ChatUI.askQuestion('${this.escapeHtml(s)}')">${this.escapeHtml(s)}</button>`
                ).join('')}
                    </div>
                `;
            }

            messagesContainer.innerHTML += `
                <div class="ai-message bot">
                    ${this.formatMessage(response.text)}
                    <div class="ai-message-confidence">${response.confidenceLabel}</div>
                    ${suggestionsHtml}
                </div>
            `;

            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        },

        askQuestion(question) {
            document.getElementById('ai-chat-input-field').value = question;
            this.sendMessage();
        },

        escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        },

        formatMessage(text) {
            return text
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/•/g, '•')
                .replace(/\n/g, '<br>');
        }
    };

    // ========== EXPORT ==========
    window.AIChatEngine = AIChatEngine;
    window.EngineerChatUI = ChatUI; // Renamed to avoid conflict with ChatIntegration's ChatUI
    window.AI_KNOWLEDGE_BASE = KNOWLEDGE_BASE;

    // NOTE: Auto-initialization DISABLED to prevent duplicate FAB button.
    // The main AI assistant is handled by aiAssistant.js (#aiAssistantFab).
    // To use the Engineer Chat programmatically:
    //   window.EngineerChatUI.init();
    //   window.EngineerChatUI.toggle();

    console.log('✅ AI Engineer Chat module loaded (auto-init disabled — use aiAssistant.js)');
})();
