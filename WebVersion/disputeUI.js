// ========================================
// DISPUTE RESOLUTION UI v1.0
// Управление спорами — панель администратора
// ========================================

(function () {
    'use strict';

    // =============================================
    // 1. STATE
    // =============================================

    let _container = null;
    let _currentFilter = 'all';
    let _selectedDispute = null;

    // =============================================
    // 2. DISPUTE STATUSES & TYPES
    // =============================================

    const STATUS = {
        open: { label: 'Открыт', color: '#ef4444', icon: '🔴', badge: 'status-open' },
        review: { label: 'На рассмотрении', color: '#f59e0b', icon: '🟡', badge: 'status-review' },
        evidence: { label: 'Сбор доказательств', color: '#3b82f6', icon: '🔵', badge: 'status-evidence' },
        mediation: { label: 'Медиация', color: '#8b5cf6', icon: '🟣', badge: 'status-mediation' },
        resolved: { label: 'Решён', color: '#22c55e', icon: '🟢', badge: 'status-resolved' },
        escalated: { label: 'Эскалирован', color: '#dc2626', icon: '⚠️', badge: 'status-escalated' }
    };

    const DISPUTE_TYPES = {
        quality: { label: 'Качество работ', icon: '🔨' },
        deadline: { label: 'Нарушение сроков', icon: '⏰' },
        payment: { label: 'Спор по оплате', icon: '💰' },
        scope: { label: 'Объём работ', icon: '📐' },
        materials: { label: 'Материалы', icon: '🧱' },
        safety: { label: 'Безопасность', icon: '⚠️' }
    };

    const RESOLUTION_TYPES = {
        refund_full: '💸 Полный возврат заказчику',
        refund_partial: '💰 Частичный возврат',
        pay_contractor: '👷 Оплата подрядчику',
        redo_work: '🔄 Переделка работ',
        compensation: '📋 Компенсация',
        dismiss: '❌ Отклонить спор'
    };

    // =============================================
    // 3. DEMO DATA
    // =============================================

    function _getDemoDisputes() {
        const stored = localStorage.getItem('disputes');
        if (stored) {
            try { return JSON.parse(stored); } catch (e) { /* ignore */ }
        }

        const demo = [
            {
                id: 'DSP-001', orderId: 'ORD-1042', orderTitle: 'Фундамент ленточный 10×12',
                type: 'quality', status: 'open', priority: 'high',
                customer: { name: 'Асланов Б.К.', phone: '+7 701 123-45-67', avatar: '👤' },
                contractor: { name: 'ИП Строй-Мастер', phone: '+7 702 987-65-43', avatar: '👷' },
                amount: 850000, disputedAmount: 280000,
                createdAt: '2026-02-12T10:30:00', updatedAt: '2026-02-14T15:00:00',
                description: 'Заказчик утверждает, что бетон залит с нарушением технологии — видны трещины на 3 участках фундамента. Подрядчик утверждает, что трещины — результат последующей нагрузки.',
                evidence: [
                    { type: 'photo', author: 'customer', description: 'Трещина в секции A (фото 1)', date: '2026-02-12' },
                    { type: 'photo', author: 'customer', description: 'Трещина в секции B (фото 2)', date: '2026-02-12' },
                    { type: 'document', author: 'contractor', description: 'Акт приёмки бетона М300', date: '2026-02-10' },
                    { type: 'photo', author: 'contractor', description: 'Фото до нагрузки', date: '2026-02-08' }
                ],
                timeline: [
                    { action: 'Спор создан', actor: 'Асланов Б.К.', date: '2026-02-12T10:30:00' },
                    { action: 'Уведомление отправлено подрядчику', actor: 'Система', date: '2026-02-12T10:31:00' },
                    { action: 'Подрядчик ответил', actor: 'ИП Строй-Мастер', date: '2026-02-13T09:15:00' },
                    { action: 'Загружены доказательства', actor: 'ИП Строй-Мастер', date: '2026-02-13T09:20:00' }
                ],
                aiAnalysis: { confidence: 0.72, recommendation: 'partial_refund', estimatedDamage: 180000 }
            },
            {
                id: 'DSP-002', orderId: 'ORD-1038', orderTitle: 'Кладка стен газоблок 2 этажа',
                type: 'deadline', status: 'review', priority: 'medium',
                customer: { name: 'Муратов С.Т.', phone: '+7 705 555-12-34', avatar: '👤' },
                contractor: { name: 'СтройГрупп KZ', phone: '+7 707 444-56-78', avatar: '👷' },
                amount: 1200000, disputedAmount: 120000,
                createdAt: '2026-02-10T14:00:00', updatedAt: '2026-02-14T11:00:00',
                description: 'Срок завершения — 5 февраля. Работа не завершена на 30%. Заказчик требует компенсацию за задержку 10% от суммы контракта.',
                evidence: [
                    { type: 'document', author: 'customer', description: 'Договор с дедлайном 05.02', date: '2026-01-15' },
                    { type: 'photo', author: 'customer', description: 'Текущее состояние (70%)', date: '2026-02-10' },
                    { type: 'document', author: 'contractor', description: 'Справка о погодных условиях', date: '2026-02-11' }
                ],
                timeline: [
                    { action: 'Спор создан', actor: 'Муратов С.Т.', date: '2026-02-10T14:00:00' },
                    { action: 'Назначен модератор', actor: 'Админ', date: '2026-02-10T16:00:00' },
                    { action: 'Запрошены доказательства', actor: 'Модератор', date: '2026-02-11T09:00:00' }
                ],
                aiAnalysis: { confidence: 0.85, recommendation: 'compensation', estimatedDamage: 100000 }
            },
            {
                id: 'DSP-003', orderId: 'ORD-1027', orderTitle: 'Монтаж кровли мягкой',
                type: 'payment', status: 'mediation', priority: 'high',
                customer: { name: 'Иванова Л.П.', phone: '+7 708 222-33-44', avatar: '👤' },
                contractor: { name: 'РуфМастер', phone: '+7 700 111-22-33', avatar: '👷' },
                amount: 650000, disputedAmount: 650000,
                createdAt: '2026-02-08T09:00:00', updatedAt: '2026-02-14T16:30:00',
                description: 'Заказчик отказывается платить, утверждая что кровля протекает. Подрядчик утверждает, что протечка из-за существующих проблем со стропилами.',
                evidence: [
                    { type: 'photo', author: 'customer', description: 'Протечка в зоне конька', date: '2026-02-07' },
                    { type: 'video', author: 'customer', description: 'Видео протечки во время дождя', date: '2026-02-08' },
                    { type: 'document', author: 'contractor', description: 'Акт осмотра стропил', date: '2026-02-09' },
                    { type: 'photo', author: 'contractor', description: 'Фото стропил до монтажа', date: '2026-01-25' },
                    { type: 'document', author: 'admin', description: 'Заключение независимого эксперта', date: '2026-02-13' }
                ],
                timeline: [
                    { action: 'Спор создан', actor: 'Иванова Л.П.', date: '2026-02-08T09:00:00' },
                    { action: 'Escrow заморожен', actor: 'Система', date: '2026-02-08T09:01:00' },
                    { action: 'Медиация начата', actor: 'Админ', date: '2026-02-10T10:00:00' },
                    { action: 'Эксперт назначен', actor: 'Админ', date: '2026-02-12T14:00:00' },
                    { action: 'Заключение эксперта загружено', actor: 'Эксперт', date: '2026-02-13T16:00:00' }
                ],
                aiAnalysis: { confidence: 0.58, recommendation: 'expert_review', estimatedDamage: 320000 }
            },
            {
                id: 'DSP-004', orderId: 'ORD-995', orderTitle: 'Штукатурка внутренняя 150м²',
                type: 'materials', status: 'resolved', priority: 'low',
                customer: { name: 'Козлов М.А.', phone: '+7 771 666-77-88', avatar: '👤' },
                contractor: { name: 'Отделочник PRO', phone: '+7 776 999-00-11', avatar: '👷' },
                amount: 320000, disputedAmount: 45000,
                createdAt: '2026-02-01T11:00:00', updatedAt: '2026-02-09T14:00:00',
                description: 'Заказчик обнаружил использование более дешёвой штукатурки вместо указанной в договоре.',
                evidence: [
                    { type: 'photo', author: 'customer', description: 'Этикетка использованного материала', date: '2026-02-01' },
                    { type: 'document', author: 'customer', description: 'Спецификация из договора', date: '2026-02-01' }
                ],
                timeline: [
                    { action: 'Спор создан', actor: 'Козлов М.А.', date: '2026-02-01T11:00:00' },
                    { action: 'Подрядчик признал замену', actor: 'Отделочник PRO', date: '2026-02-02T10:00:00' },
                    { action: 'Компенсация 45 000 ₸ одобрена', actor: 'Админ', date: '2026-02-09T14:00:00' }
                ],
                resolution: { type: 'refund_partial', amount: 45000, note: 'Компенсация разницы в стоимости материалов' },
                aiAnalysis: { confidence: 0.95, recommendation: 'refund_partial', estimatedDamage: 42000 }
            },
            {
                id: 'DSP-005', orderId: 'ORD-1050', orderTitle: 'Демонтаж старого здания',
                type: 'safety', status: 'escalated', priority: 'critical',
                customer: { name: 'Ахметов Р.Н.', phone: '+7 747 333-44-55', avatar: '👤' },
                contractor: { name: 'ДемонтажСервис', phone: '+7 778 888-99-00', avatar: '👷' },
                amount: 450000, disputedAmount: 450000,
                createdAt: '2026-02-13T08:00:00', updatedAt: '2026-02-14T18:00:00',
                description: 'При демонтаже повреждена стена соседнего здания. Требуется экстренная экспертиза и восстановление.',
                evidence: [
                    { type: 'photo', author: 'customer', description: 'Повреждённая стена соседа', date: '2026-02-13' },
                    { type: 'document', author: 'admin', description: 'Акт ЧС от инспектора', date: '2026-02-13' }
                ],
                timeline: [
                    { action: 'Спор создан (экстренный)', actor: 'Система', date: '2026-02-13T08:00:00' },
                    { action: 'Работы остановлены', actor: 'Админ', date: '2026-02-13T08:15:00' },
                    { action: 'Эскалация: привлечён юрист', actor: 'Админ', date: '2026-02-13T10:00:00' },
                    { action: 'Инспектор на объекте', actor: 'Инспектор', date: '2026-02-13T14:00:00' }
                ],
                aiAnalysis: null
            }
        ];

        localStorage.setItem('disputes', JSON.stringify(demo));
        return demo;
    }

    // =============================================
    // 4. UTILITIES
    // =============================================

    function _fmt(amount) {
        return new Intl.NumberFormat('ru-KZ').format(amount) + ' ₸';
    }

    function _timeAgo(dateStr) {
        const diff = Date.now() - new Date(dateStr).getTime();
        const h = Math.floor(diff / 3600000);
        if (h < 1) return 'только что';
        if (h < 24) return `${h}ч назад`;
        const d = Math.floor(h / 24);
        if (d < 7) return `${d}д назад`;
        return new Date(dateStr).toLocaleDateString('ru-KZ', { day: 'numeric', month: 'short' });
    }

    function _priorityBadge(p) {
        const map = {
            critical: '<span class="dsp-priority critical">🚨 Критический</span>',
            high: '<span class="dsp-priority high">🔴 Высокий</span>',
            medium: '<span class="dsp-priority medium">🟡 Средний</span>',
            low: '<span class="dsp-priority low">🟢 Низкий</span>'
        };
        return map[p] || '';
    }

    // =============================================
    // 5. MAIN RENDER
    // =============================================

    function open(container) {
        _container = typeof container === 'string' ? document.getElementById(container) : container;
        if (!_container) return;
        _render();
    }

    function _render() {
        const disputes = _getDemoDisputes();
        const filtered = _currentFilter === 'all'
            ? disputes
            : disputes.filter(d => d.status === _currentFilter);

        const stats = {
            total: disputes.length,
            open: disputes.filter(d => d.status === 'open').length,
            review: disputes.filter(d => d.status === 'review' || d.status === 'evidence' || d.status === 'mediation').length,
            resolved: disputes.filter(d => d.status === 'resolved').length,
            escalated: disputes.filter(d => d.status === 'escalated').length,
            totalAmount: disputes.reduce((s, d) => s + d.disputedAmount, 0)
        };

        _container.innerHTML = `
            <div class="dsp-page">
                <div class="dsp-header">
                    <div class="dsp-header-left">
                        <h2>⚖️ Управление спорами</h2>
                        <p class="dsp-subtitle">Dispute Resolution Center</p>
                    </div>
                    <div class="dsp-header-stats">
                        <div class="dsp-stat">
                            <span class="dsp-stat-value">${stats.total}</span>
                            <span class="dsp-stat-label">Всего</span>
                        </div>
                        <div class="dsp-stat stat-open">
                            <span class="dsp-stat-value">${stats.open}</span>
                            <span class="dsp-stat-label">Открытых</span>
                        </div>
                        <div class="dsp-stat stat-review">
                            <span class="dsp-stat-value">${stats.review}</span>
                            <span class="dsp-stat-label">В процессе</span>
                        </div>
                        <div class="dsp-stat stat-escalated">
                            <span class="dsp-stat-value">${stats.escalated}</span>
                            <span class="dsp-stat-label">Эскалация</span>
                        </div>
                    </div>
                </div>

                <div class="dsp-filters">
                    ${['all', 'open', 'review', 'evidence', 'mediation', 'resolved', 'escalated'].map(f => `
                        <button class="dsp-filter-btn ${_currentFilter === f ? 'active' : ''}"
                            onclick="window.DisputeUI.setFilter('${f}')">
                            ${f === 'all' ? 'Все' : STATUS[f].icon + ' ' + STATUS[f].label}
                            ${f !== 'all' ? `<span class="dsp-filter-count">${disputes.filter(d => d.status === f).length}</span>` : ''}
                        </button>
                    `).join('')}
                </div>

                <div class="dsp-content">
                    <div class="dsp-list">
                        ${filtered.length === 0
                ? '<div class="dsp-empty">Нет споров по фильтру</div>'
                : filtered.map(d => _renderDisputeCard(d)).join('')}
                    </div>
                    <div class="dsp-detail" id="dsp-detail-panel">
                        ${_selectedDispute
                ? _renderDetailPanel(_selectedDispute)
                : '<div class="dsp-detail-empty"><span>⚖️</span><p>Выберите спор для просмотра</p></div>'}
                    </div>
                </div>
            </div>
        `;
    }

    // =============================================
    // 6. DISPUTE CARD
    // =============================================

    function _renderDisputeCard(d) {
        const st = STATUS[d.status];
        const tp = DISPUTE_TYPES[d.type];
        const isSelected = _selectedDispute && _selectedDispute.id === d.id;

        return `
            <div class="dsp-card ${isSelected ? 'selected' : ''} ${d.priority === 'critical' ? 'critical-border' : ''}"
                onclick="window.DisputeUI.selectDispute('${d.id}')">
                <div class="dsp-card-top">
                    <span class="dsp-card-id">${d.id}</span>
                    ${_priorityBadge(d.priority)}
                    <span class="dsp-status-badge ${st.badge}">${st.icon} ${st.label}</span>
                </div>
                <h4 class="dsp-card-title">${d.orderTitle}</h4>
                <div class="dsp-card-type">${tp.icon} ${tp.label}</div>
                <div class="dsp-card-parties">
                    <span>${d.customer.avatar} ${d.customer.name}</span>
                    <span class="dsp-vs">vs</span>
                    <span>${d.contractor.avatar} ${d.contractor.name}</span>
                </div>
                <div class="dsp-card-bottom">
                    <span class="dsp-card-amount">💰 ${_fmt(d.disputedAmount)}</span>
                    <span class="dsp-card-time">${_timeAgo(d.updatedAt)}</span>
                </div>
                ${d.aiAnalysis ? `
                    <div class="dsp-card-ai">
                        🤖 AI: ${Math.round(d.aiAnalysis.confidence * 100)}% уверенность
                    </div>
                ` : ''}
            </div>
        `;
    }

    // =============================================
    // 7. DETAIL PANEL
    // =============================================

    function _renderDetailPanel(d) {
        const st = STATUS[d.status];
        const tp = DISPUTE_TYPES[d.type];

        return `
            <div class="dsp-detail-content">
                <!-- Header -->
                <div class="dsp-detail-header">
                    <div>
                        <div class="dsp-detail-top-row">
                            <span class="dsp-card-id">${d.id}</span>
                            <span class="dsp-status-badge ${st.badge}">${st.icon} ${st.label}</span>
                            ${_priorityBadge(d.priority)}
                        </div>
                        <h3>${d.orderTitle}</h3>
                        <span class="dsp-detail-type">${tp.icon} ${tp.label} • Заказ ${d.orderId}</span>
                    </div>
                </div>

                <!-- Parties -->
                <div class="dsp-detail-section">
                    <h4>👥 Стороны</h4>
                    <div class="dsp-parties-grid">
                        <div class="dsp-party-card customer">
                            <div class="dsp-party-role">Заказчик</div>
                            <div class="dsp-party-name">${d.customer.avatar} ${d.customer.name}</div>
                            <div class="dsp-party-phone">${d.customer.phone}</div>
                        </div>
                        <div class="dsp-party-card contractor">
                            <div class="dsp-party-role">Подрядчик</div>
                            <div class="dsp-party-name">${d.contractor.avatar} ${d.contractor.name}</div>
                            <div class="dsp-party-phone">${d.contractor.phone}</div>
                        </div>
                    </div>
                </div>

                <!-- Amounts -->
                <div class="dsp-detail-section">
                    <h4>💰 Финансы</h4>
                    <div class="dsp-finance-row">
                        <div class="dsp-finance-item">
                            <span class="dsp-finance-label">Сумма контракта</span>
                            <span class="dsp-finance-value">${_fmt(d.amount)}</span>
                        </div>
                        <div class="dsp-finance-item disputed">
                            <span class="dsp-finance-label">Оспариваемая сумма</span>
                            <span class="dsp-finance-value">${_fmt(d.disputedAmount)}</span>
                        </div>
                        ${d.aiAnalysis ? `
                            <div class="dsp-finance-item ai">
                                <span class="dsp-finance-label">AI оценка ущерба</span>
                                <span class="dsp-finance-value">${_fmt(d.aiAnalysis.estimatedDamage)}</span>
                            </div>
                        ` : ''}
                    </div>
                </div>

                <!-- Description -->
                <div class="dsp-detail-section">
                    <h4>📝 Описание</h4>
                    <p class="dsp-description">${d.description}</p>
                </div>

                <!-- AI Analysis -->
                ${d.aiAnalysis ? `
                    <div class="dsp-detail-section dsp-ai-section">
                        <h4>🤖 AI Анализ</h4>
                        <div class="dsp-ai-grid">
                            <div class="dsp-ai-metric">
                                <div class="dsp-ai-gauge" style="--confidence: ${d.aiAnalysis.confidence}">
                                    <svg viewBox="0 0 60 60">
                                        <circle cx="30" cy="30" r="25" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="5"/>
                                        <circle cx="30" cy="30" r="25" fill="none"
                                            stroke="${d.aiAnalysis.confidence >= 0.7 ? '#22c55e' : d.aiAnalysis.confidence >= 0.5 ? '#f59e0b' : '#ef4444'}"
                                            stroke-width="5" stroke-linecap="round"
                                            stroke-dasharray="${Math.round(d.aiAnalysis.confidence * 157)} 157"
                                            transform="rotate(-90 30 30)"/>
                                    </svg>
                                    <span>${Math.round(d.aiAnalysis.confidence * 100)}%</span>
                                </div>
                                <span class="dsp-ai-label">Уверенность</span>
                            </div>
                            <div class="dsp-ai-recommendation">
                                <span class="dsp-ai-rec-label">Рекомендация AI:</span>
                                <span class="dsp-ai-rec-value">${d.aiAnalysis.recommendation === 'partial_refund' ? '💰 Частичный возврат' :
                    d.aiAnalysis.recommendation === 'compensation' ? '📋 Компенсация' :
                        d.aiAnalysis.recommendation === 'expert_review' ? '🔍 Экспертиза' :
                            d.aiAnalysis.recommendation === 'refund_partial' ? '💰 Частичный возврат' :
                                d.aiAnalysis.recommendation
                }</span>
                                <span class="dsp-ai-damage">Оценка ущерба: ${_fmt(d.aiAnalysis.estimatedDamage)}</span>
                            </div>
                        </div>
                    </div>
                ` : ''}

                <!-- Evidence -->
                <div class="dsp-detail-section">
                    <h4>📎 Доказательства (${d.evidence.length})</h4>
                    <div class="dsp-evidence-list">
                        ${d.evidence.map(e => `
                            <div class="dsp-evidence-item">
                                <span class="dsp-evidence-icon">${e.type === 'photo' ? '📷' : e.type === 'video' ? '🎥' : '📄'}</span>
                                <div class="dsp-evidence-info">
                                    <span class="dsp-evidence-desc">${e.description}</span>
                                    <span class="dsp-evidence-meta">
                                        ${e.author === 'customer' ? '👤 Заказчик' : e.author === 'contractor' ? '👷 Подрядчик' : '🛡️ Админ'}
                                        • ${e.date}
                                    </span>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <!-- Timeline -->
                <div class="dsp-detail-section">
                    <h4>📅 Хронология</h4>
                    <div class="dsp-timeline">
                        ${d.timeline.map((t, i) => `
                            <div class="dsp-timeline-item ${i === 0 ? 'first' : ''}">
                                <div class="dsp-timeline-dot"></div>
                                <div class="dsp-timeline-content">
                                    <span class="dsp-timeline-action">${t.action}</span>
                                    <span class="dsp-timeline-meta">${t.actor} • ${_timeAgo(t.date)}</span>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <!-- Resolution (if resolved) -->
                ${d.resolution ? `
                    <div class="dsp-detail-section dsp-resolution-section">
                        <h4>✅ Решение</h4>
                        <div class="dsp-resolution">
                            <div class="dsp-resolution-type">${RESOLUTION_TYPES[d.resolution.type] || d.resolution.type}</div>
                            <div class="dsp-resolution-amount">Сумма: ${_fmt(d.resolution.amount)}</div>
                            <div class="dsp-resolution-note">${d.resolution.note}</div>
                        </div>
                    </div>
                ` : ''}

                <!-- Admin Actions -->
                ${d.status !== 'resolved' ? `
                    <div class="dsp-detail-section dsp-actions-section">
                        <h4>⚙️ Действия</h4>
                        <div class="dsp-admin-actions">
                            ${d.status === 'open' ? `
                                <button class="dsp-action-btn review" onclick="window.DisputeUI.changeStatus('${d.id}', 'review')">
                                    📋 Взять в работу
                                </button>
                            ` : ''}
                            ${d.status === 'review' ? `
                                <button class="dsp-action-btn evidence" onclick="window.DisputeUI.changeStatus('${d.id}', 'evidence')">
                                    📎 Запросить доказательства
                                </button>
                            ` : ''}
                            ${['review', 'evidence'].includes(d.status) ? `
                                <button class="dsp-action-btn mediation" onclick="window.DisputeUI.changeStatus('${d.id}', 'mediation')">
                                    🤝 Начать медиацию
                                </button>
                            ` : ''}
                            <button class="dsp-action-btn resolve" onclick="window.DisputeUI.openResolveModal('${d.id}')">
                                ✅ Принять решение
                            </button>
                            ${d.status !== 'escalated' ? `
                                <button class="dsp-action-btn escalate" onclick="window.DisputeUI.changeStatus('${d.id}', 'escalated')">
                                    ⚠️ Эскалировать
                                </button>
                            ` : ''}
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
    }

    // =============================================
    // 8. ACTIONS
    // =============================================

    function setFilter(filter) {
        _currentFilter = filter;
        _render();
    }

    function selectDispute(id) {
        const disputes = _getDemoDisputes();
        _selectedDispute = disputes.find(d => d.id === id) || null;
        _render();
    }

    function changeStatus(id, newStatus) {
        const disputes = _getDemoDisputes();
        const idx = disputes.findIndex(d => d.id === id);
        if (idx === -1) return;

        disputes[idx].status = newStatus;
        disputes[idx].updatedAt = new Date().toISOString();
        disputes[idx].timeline.push({
            action: `Статус изменён → ${STATUS[newStatus].label}`,
            actor: 'Админ',
            date: new Date().toISOString()
        });

        localStorage.setItem('disputes', JSON.stringify(disputes));
        _selectedDispute = disputes[idx];
        _render();
    }

    function openResolveModal(id) {
        const disputes = _getDemoDisputes();
        const d = disputes.find(dp => dp.id === id);
        if (!d) return;

        const modal = document.createElement('div');
        modal.className = 'dsp-modal-overlay';
        modal.innerHTML = `
            <div class="dsp-modal">
                <div class="dsp-modal-header">
                    <h3>✅ Решение по спору ${d.id}</h3>
                    <button class="dsp-modal-close" onclick="this.closest('.dsp-modal-overlay').remove()">✕</button>
                </div>
                <div class="dsp-modal-body">
                    <div class="dsp-form-group">
                        <label>Тип решения</label>
                        <select class="dsp-select" id="dsp-resolve-type">
                            ${Object.entries(RESOLUTION_TYPES).map(([k, v]) => `<option value="${k}">${v}</option>`).join('')}
                        </select>
                    </div>
                    <div class="dsp-form-group">
                        <label>Сумма, ₸</label>
                        <input type="number" class="dsp-input" id="dsp-resolve-amount" value="${d.aiAnalysis ? d.aiAnalysis.estimatedDamage : 0}">
                    </div>
                    <div class="dsp-form-group">
                        <label>Комментарий</label>
                        <textarea class="dsp-textarea" id="dsp-resolve-note" rows="3" placeholder="Обоснование решения..."></textarea>
                    </div>
                </div>
                <div class="dsp-modal-footer">
                    <button class="dsp-action-btn" onclick="this.closest('.dsp-modal-overlay').remove()">Отмена</button>
                    <button class="dsp-action-btn resolve" onclick="window.DisputeUI.resolveDispute('${d.id}')">
                        ✅ Подтвердить решение
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
    }

    function resolveDispute(id) {
        const type = document.getElementById('dsp-resolve-type')?.value;
        const amount = parseInt(document.getElementById('dsp-resolve-amount')?.value) || 0;
        const note = document.getElementById('dsp-resolve-note')?.value || '';

        const disputes = _getDemoDisputes();
        const idx = disputes.findIndex(d => d.id === id);
        if (idx === -1) return;

        disputes[idx].status = 'resolved';
        disputes[idx].updatedAt = new Date().toISOString();
        disputes[idx].resolution = { type, amount, note };
        disputes[idx].timeline.push({
            action: `Спор решён: ${RESOLUTION_TYPES[type]}`,
            actor: 'Админ',
            date: new Date().toISOString()
        });

        localStorage.setItem('disputes', JSON.stringify(disputes));
        _selectedDispute = disputes[idx];

        document.querySelector('.dsp-modal-overlay')?.remove();
        _render();
    }

    // =============================================
    // 9. EXPORT
    // =============================================

    window.DisputeUI = {
        open,
        setFilter,
        selectDispute,
        changeStatus,
        openResolveModal,
        resolveDispute,
        STATUS,
        DISPUTE_TYPES
    };

    console.log('[DisputeUI] ✅ Dispute Resolution UI v1.0 loaded');

})();
