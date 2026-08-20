// ========================================
// AUTO-CONTRACT GENERATOR v1.0
// 3.4 Авто-генерация договора подряда (PDF)
// ========================================

(function () {
    'use strict';

    // =============================================
    // 1. CONTRACT TEMPLATE
    // =============================================

    const CONTRACT_TEMPLATE = {
        title: 'ДОГОВОР ПОДРЯДА',
        subtitle: 'на выполнение строительно-монтажных работ',
        sections: [
            {
                id: 'header',
                render: (data) => `
                    <div class="contract-header-section">
                        <div class="contract-number">№ ${data.contractNumber}</div>
                        <div class="contract-city-date">
                            <span>г. ${data.city || 'Алматы'}</span>
                            <span>${_formatDate(data.date || new Date().toISOString())}</span>
                        </div>
                    </div>
                `
            },
            {
                id: 'parties',
                title: '1. СТОРОНЫ ДОГОВОРА',
                render: (data) => `
                    <p><strong>Заказчик:</strong> ${data.customer.fullName}, ИИН/БИН: ${data.customer.iin || '____________'},
                    проживающий(ая) по адресу: ${data.customer.address || '____________'},
                    тел.: ${data.customer.phone || '____________'},
                    далее именуемый "Заказчик".</p>
                    <p><strong>Подрядчик:</strong> ${data.contractor.fullName}, ИИН/БИН: ${data.contractor.iin || '____________'},
                    ${data.contractor.companyName ? `(${data.contractor.companyName}), ` : ''}
                    юридический адрес: ${data.contractor.address || '____________'},
                    тел.: ${data.contractor.phone || '____________'},
                    далее именуемый "Подрядчик".</p>
                    <p>совместно именуемые "Стороны", заключили настоящий Договор о нижеследующем:</p>
                `
            },
            {
                id: 'subject',
                title: '2. ПРЕДМЕТ ДОГОВОРА',
                render: (data) => `
                    <p>2.1. Подрядчик обязуется выполнить по заданию Заказчика следующие работы:</p>
                    <div class="contract-work-description">
                        <strong>${data.workTitle}</strong>
                    </div>
                    <p>2.2. Адрес объекта: ${data.objectAddress || '____________'}</p>
                    <p>2.3. Объём работ определяется согласно Приложению №1 (Смета).</p>
                    <p>2.4. Подрядчик выполняет работы из ${data.materialsBy === 'contractor' ? 'своих материалов' : 'материалов Заказчика'}.</p>
                `
            },
            {
                id: 'price',
                title: '3. СТОИМОСТЬ РАБОТ И ПОРЯДОК РАСЧЁТОВ',
                render: (data) => `
                    <p>3.1. Общая стоимость работ по настоящему Договору составляет:
                    <strong>${_fmtMoney(data.totalAmount)} (${_numberToWords(data.totalAmount)} тенге)</strong>.</p>
                    <p>3.2. Оплата производится в следующем порядке:</p>
                    <ul>
                        ${data.paymentSchedule ? data.paymentSchedule.map((p, i) => `
                            <li>${p.label}: <strong>${_fmtMoney(p.amount)}</strong> (${p.percent}%) — ${p.condition}</li>
                        `).join('') : `
                            <li>Аванс: <strong>${_fmtMoney(Math.round(data.totalAmount * 0.3))}</strong> (30%) — при подписании Договора</li>
                            <li>Промежуточный платёж: <strong>${_fmtMoney(Math.round(data.totalAmount * 0.4))}</strong> (40%) — по завершении 50% работ</li>
                            <li>Окончательный расчёт: <strong>${_fmtMoney(Math.round(data.totalAmount * 0.3))}</strong> (30%) — после подписания Акта приёмки</li>
                        `}
                    </ul>
                    <p>3.3. Оплата перечисляется через систему Escrow платформы QAZGOST AI.</p>
                    <p>3.4. Комиссия сервиса составляет 3% от суммы контракта, удерживается с Подрядчика.</p>
                `
            },
            {
                id: 'deadlines',
                title: '4. СРОКИ ВЫПОЛНЕНИЯ РАБОТ',
                render: (data) => `
                    <p>4.1. Дата начала работ: <strong>${_formatDate(data.startDate || new Date().toISOString())}</strong>.</p>
                    <p>4.2. Дата завершения работ: <strong>${_formatDate(data.endDate || _addDays(data.startDate || new Date().toISOString(), data.duration || 30))}</strong>.</p>
                    <p>4.3. Сроки выполнения отдельных этапов определяются в Приложении №2 (Календарный график).</p>
                    <p>4.4. Подрядчик вправе завершить работы досрочно.</p>
                    ${data.milestones ? `
                        <table class="contract-table">
                            <thead><tr><th>Этап</th><th>Описание</th><th>Срок</th><th>Сумма</th></tr></thead>
                            <tbody>
                                ${data.milestones.map((m, i) => `
                                    <tr>
                                        <td>${i + 1}</td>
                                        <td>${m.title}</td>
                                        <td>${_formatDate(m.deadline)}</td>
                                        <td>${_fmtMoney(m.amount)}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    ` : ''}
                `
            },
            {
                id: 'obligations',
                title: '5. ОБЯЗАННОСТИ СТОРОН',
                render: () => `
                    <p><strong>5.1. Подрядчик обязуется:</strong></p>
                    <ul>
                        <li>Выполнить работы качественно, в соответствии с техническим заданием и строительными нормами РК</li>
                        <li>Использовать материалы, соответствующие ГОСТ и СНиП</li>
                        <li>Обеспечить безопасность на объекте</li>
                        <li>Предоставлять фото-отчёты через платформу не реже 1 раза в 3 дня</li>
                        <li>Устранить недостатки, выявленные при приёмке, за свой счёт</li>
                    </ul>
                    <p><strong>5.2. Заказчик обязуется:</strong></p>
                    <ul>
                        <li>Обеспечить доступ к объекту в согласованное время</li>
                        <li>Произвести оплату в порядке, предусмотренном п. 3</li>
                        <li>Принять выполненные работы или мотивированно отказать</li>
                        <li>Не вмешиваться в оперативно-хозяйственную деятельность Подрядчика</li>
                    </ul>
                `
            },
            {
                id: 'warranty',
                title: '6. ГАРАНТИЙНЫЕ ОБЯЗАТЕЛЬСТВА',
                render: (data) => `
                    <p>6.1. Гарантийный срок на выполненные работы составляет <strong>${data.warrantyMonths || 12} месяцев</strong> с даты подписания Акта приёмки.</p>
                    <p>6.2. В случае обнаружения дефектов в гарантийный период Подрядчик обязуется устранить их за свой счёт в течение 14 рабочих дней.</p>
                    <p>6.3. Гарантия не распространяется на повреждения, возникшие по вине Заказчика или третьих лиц.</p>
                `
            },
            {
                id: 'disputes',
                title: '7. ПОРЯДОК РАЗРЕШЕНИЯ СПОРОВ',
                render: () => `
                    <p>7.1. Все споры разрешаются путём переговоров.</p>
                    <p>7.2. При невозможности урегулирования путём переговоров, Стороны обращаются к системе Dispute Resolution платформы QAZGOST AI.</p>
                    <p>7.3. В случае невозможности урегулирования через платформу, спор передаётся в суд по месту нахождения объекта в соответствии с законодательством Республики Казахстан.</p>
                `
            },
            {
                id: 'final',
                title: '8. ЗАКЛЮЧИТЕЛЬНЫЕ ПОЛОЖЕНИЯ',
                render: () => `
                    <p>8.1. Договор вступает в силу с момента подписания и действует до полного исполнения обязательств.</p>
                    <p>8.2. Изменения и дополнения оформляются письменно и подтверждаются обеими Сторонами.</p>
                    <p>8.3. Договор может быть расторгнут по соглашению Сторон или в судебном порядке.</p>
                    <p>8.4. Договор формируется в электронном виде через платформу QAZGOST AI и имеет юридическую силу.</p>
                    <p>8.5. Договор составлен в двух экземплярах, по одному для каждой Стороны.</p>
                `
            },
            {
                id: 'signatures',
                render: (data) => `
                    <div class="contract-signatures">
                        <div class="contract-sig-block">
                            <h4>ЗАКАЗЧИК</h4>
                            <p>${data.customer.fullName}</p>
                            <p>ИИН/БИН: ${data.customer.iin || '____________'}</p>
                            <p>Тел.: ${data.customer.phone || '____________'}</p>
                            <div class="contract-sig-line">Подпись: _________________</div>
                            <div class="contract-sig-date">Дата: ${_formatDate(data.date || new Date().toISOString())}</div>
                        </div>
                        <div class="contract-sig-block">
                            <h4>ПОДРЯДЧИК</h4>
                            <p>${data.contractor.fullName}</p>
                            <p>ИИН/БИН: ${data.contractor.iin || '____________'}</p>
                            <p>Тел.: ${data.contractor.phone || '____________'}</p>
                            <div class="contract-sig-line">Подпись: _________________</div>
                            <div class="contract-sig-date">Дата: ${_formatDate(data.date || new Date().toISOString())}</div>
                        </div>
                    </div>
                `
            }
        ]
    };

    // =============================================
    // 2. UTILITIES
    // =============================================

    function _formatDate(dateStr) {
        if (!dateStr) return '«___» _________ 20__г.';
        const d = new Date(dateStr);
        return `«${d.getDate()}» ${_monthGenitive(d.getMonth())} ${d.getFullYear()}г.`;
    }

    function _monthGenitive(m) {
        return ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
            'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'][m];
    }

    function _fmtMoney(n) {
        return new Intl.NumberFormat('ru-KZ').format(n) + ' ₸';
    }

    function _addDays(dateStr, days) {
        const d = new Date(dateStr);
        d.setDate(d.getDate() + days);
        return d.toISOString();
    }

    function _numberToWords(num) {
        if (!num) return 'ноль';
        const ones = ['', 'один', 'два', 'три', 'четыре', 'пять', 'шесть', 'семь', 'восемь', 'девять'];
        const teens = ['десять', 'одиннадцать', 'двенадцать', 'тринадцать', 'четырнадцать',
            'пятнадцать', 'шестнадцать', 'семнадцать', 'восемнадцать', 'девятнадцать'];
        const tens = ['', '', 'двадцать', 'тридцать', 'сорок', 'пятьдесят',
            'шестьдесят', 'семьдесят', 'восемьдесят', 'девяносто'];
        const hundreds = ['', 'сто', 'двести', 'триста', 'четыреста', 'пятьсот',
            'шестьсот', 'семьсот', 'восемьсот', 'девятьсот'];

        if (num >= 1000000) return Math.floor(num / 1000000) + ' млн ' + _numberToWords(num % 1000000);
        if (num >= 1000) {
            const t = Math.floor(num / 1000);
            return (t === 1 ? 'одна тысяча' : t === 2 ? 'две тысячи' : t + ' тысяч') + ' ' + _numberToWords(num % 1000);
        }
        if (num >= 100) return hundreds[Math.floor(num / 100)] + ' ' + _numberToWords(num % 100);
        if (num >= 20) return tens[Math.floor(num / 10)] + ' ' + ones[num % 10];
        if (num >= 10) return teens[num - 10];
        return ones[num];
    }

    function _generateContractNumber() {
        const y = new Date().getFullYear();
        const n = Math.floor(Math.random() * 9000) + 1000;
        return `QG-${y}-${n}`;
    }

    // =============================================
    // 3. CONTRACT GENERATION
    // =============================================

    /**
     * Generate contract from order data
     * @param {Object} orderData - Order + estimate + parties data
     * @returns {Object} - { contractNumber, html, data }
     */
    function generate(orderData = {}) {
        const data = {
            contractNumber: orderData.contractNumber || _generateContractNumber(),
            date: orderData.date || new Date().toISOString(),
            city: orderData.city || 'Алматы',
            customer: {
                fullName: orderData.customerName || 'ФИО Заказчика',
                iin: orderData.customerIIN || '',
                address: orderData.customerAddress || '',
                phone: orderData.customerPhone || ''
            },
            contractor: {
                fullName: orderData.contractorName || 'ФИО Подрядчика',
                companyName: orderData.contractorCompany || '',
                iin: orderData.contractorIIN || '',
                address: orderData.contractorAddress || '',
                phone: orderData.contractorPhone || ''
            },
            workTitle: orderData.title || orderData.workTitle || 'Описание работ',
            objectAddress: orderData.objectAddress || orderData.address || '',
            totalAmount: orderData.totalAmount || orderData.contractAmountKZT || 0,
            materialsBy: orderData.materialsBy || 'contractor',
            startDate: orderData.startDate || new Date().toISOString(),
            endDate: orderData.endDate || null,
            duration: orderData.duration || 30,
            warrantyMonths: orderData.warrantyMonths || 12,
            milestones: orderData.milestones || null,
            paymentSchedule: orderData.paymentSchedule || null,
            estimateItems: orderData.estimateItems || []
        };

        // Build HTML
        const html = _renderContractHTML(data);

        // Save contract
        const contract = {
            id: data.contractNumber,
            data,
            html,
            createdAt: new Date().toISOString(),
            status: 'draft'
        };

        let contracts = [];
        try {
            contracts = JSON.parse(localStorage.getItem('contracts') || '[]');
        } catch {
            contracts = [];
        }
        contracts.push(contract);
        try {
            localStorage.setItem('contracts', JSON.stringify(contracts));
        } catch (e) {
            console.error('Failed to save contract:', e);
        }

        console.log(`[Contract] ✅ Generated: ${data.contractNumber}`);
        return contract;
    }

    function _renderContractHTML(data) {
        const sectionsHTML = CONTRACT_TEMPLATE.sections.map(section => {
            const content = section.render(data);
            if (section.title) {
                return `<div class="contract-section"><h3>${section.title}</h3>${content}</div>`;
            }
            return content;
        }).join('');

        // Estimate appendix
        let appendixHTML = '';
        if (data.estimateItems && data.estimateItems.length > 0) {
            appendixHTML = `
                <div class="contract-appendix">
                    <h3>ПРИЛОЖЕНИЕ №1 — СМЕТА</h3>
                    <table class="contract-table">
                        <thead>
                            <tr><th>№</th><th>Наименование</th><th>Ед.</th><th>Кол-во</th><th>Цена</th><th>Сумма</th></tr>
                        </thead>
                        <tbody>
                            ${data.estimateItems.map((item, i) => `
                                <tr>
                                    <td>${i + 1}</td>
                                    <td>${item.work_name || item.name}</td>
                                    <td>${item.unit}</td>
                                    <td>${item.quantity}</td>
                                    <td>${_fmtMoney(item.unit_price || item.unitPrice)}</td>
                                    <td>${_fmtMoney(item.total_price || item.totalPrice)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                        <tfoot>
                            <tr><td colspan="5"><strong>ИТОГО:</strong></td><td><strong>${_fmtMoney(data.totalAmount)}</strong></td></tr>
                        </tfoot>
                    </table>
                </div>
            `;
        }

        return `
            <div class="contract-document">
                <div class="contract-title-block">
                    <h1>${CONTRACT_TEMPLATE.title}</h1>
                    <h2>${CONTRACT_TEMPLATE.subtitle}</h2>
                </div>
                ${sectionsHTML}
                ${appendixHTML}
                <div class="contract-footer">
                    <p>Сформировано платформой QAZGOST AI • ${new Date().toLocaleString('ru-KZ')}</p>
                </div>
            </div>
        `;
    }

    // =============================================
    // 4. PREVIEW UI
    // =============================================

    function preview(container, contractOrOrderData) {
        const el = typeof container === 'string' ? document.getElementById(container) : container;
        if (!el) return;

        let contract;
        if (contractOrOrderData.html) {
            contract = contractOrOrderData;
        } else {
            contract = generate(contractOrOrderData);
        }

        el.innerHTML = `
            <div class="contract-preview-wrapper">
                <div class="contract-toolbar">
                    <h3>📄 Договор подряда ${contract.data.contractNumber}</h3>
                    <div class="contract-toolbar-actions">
                        <button class="contract-btn" onclick="window.ContractGenerator.printContract()">🖨️ Печать</button>
                        <button class="contract-btn primary" onclick="window.ContractGenerator.downloadPDF('${contract.id}')">📥 Скачать PDF</button>
                    </div>
                </div>
                <div class="contract-preview" id="contract-preview-content">
                    ${contract.html}
                </div>
            </div>
        `;
    }

    // =============================================
    // 5. CONTRACT FORM (auto-fill from order)
    // =============================================

    function openForm(container, orderData = {}) {
        const el = typeof container === 'string' ? document.getElementById(container) : container;
        if (!el) return;

        el.innerHTML = `
            <div class="contract-form-wrapper">
                <div class="contract-form-header">
                    <h3>📝 Создание договора подряда</h3>
                    <p class="contract-form-subtitle">Заполните данные или используйте автозаполнение из заказа</p>
                </div>

                <div class="contract-form">
                    <!-- Parties -->
                    <div class="contract-form-section">
                        <h4>👥 Стороны договора</h4>
                        <div class="contract-form-grid">
                            <div class="contract-form-col">
                                <h5>Заказчик</h5>
                                <div class="contract-form-group">
                                    <label>ФИО</label>
                                    <input type="text" class="contract-input" id="cf-customer-name" value="${orderData.customerName || ''}">
                                </div>
                                <div class="contract-form-group">
                                    <label>ИИН/БИН</label>
                                    <input type="text" class="contract-input" id="cf-customer-iin" value="${orderData.customerIIN || ''}">
                                </div>
                                <div class="contract-form-group">
                                    <label>Адрес</label>
                                    <input type="text" class="contract-input" id="cf-customer-address" value="${orderData.customerAddress || ''}">
                                </div>
                                <div class="contract-form-group">
                                    <label>Телефон</label>
                                    <input type="text" class="contract-input" id="cf-customer-phone" value="${orderData.customerPhone || ''}">
                                </div>
                            </div>
                            <div class="contract-form-col">
                                <h5>Подрядчик</h5>
                                <div class="contract-form-group">
                                    <label>ФИО</label>
                                    <input type="text" class="contract-input" id="cf-contractor-name" value="${orderData.contractorName || ''}">
                                </div>
                                <div class="contract-form-group">
                                    <label>Компания</label>
                                    <input type="text" class="contract-input" id="cf-contractor-company" value="${orderData.contractorCompany || ''}">
                                </div>
                                <div class="contract-form-group">
                                    <label>ИИН/БИН</label>
                                    <input type="text" class="contract-input" id="cf-contractor-iin" value="${orderData.contractorIIN || ''}">
                                </div>
                                <div class="contract-form-group">
                                    <label>Телефон</label>
                                    <input type="text" class="contract-input" id="cf-contractor-phone" value="${orderData.contractorPhone || ''}">
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Work details -->
                    <div class="contract-form-section">
                        <h4>🏗️ Предмет договора</h4>
                        <div class="contract-form-group">
                            <label>Описание работ</label>
                            <textarea class="contract-textarea" id="cf-work-title" rows="2">${orderData.title || ''}</textarea>
                        </div>
                        <div class="contract-form-group">
                            <label>Адрес объекта</label>
                            <input type="text" class="contract-input" id="cf-object-address" value="${orderData.address || ''}">
                        </div>
                        <div class="contract-form-row">
                            <div class="contract-form-group">
                                <label>Город</label>
                                <input type="text" class="contract-input" id="cf-city" value="${orderData.city || 'Алматы'}">
                            </div>
                            <div class="contract-form-group">
                                <label>Сумма, ₸</label>
                                <input type="number" class="contract-input" id="cf-amount" value="${orderData.totalAmount || orderData.contractAmountKZT || 0}">
                            </div>
                        </div>
                    </div>

                    <!-- Dates -->
                    <div class="contract-form-section">
                        <h4>📅 Сроки</h4>
                        <div class="contract-form-row">
                            <div class="contract-form-group">
                                <label>Дата начала</label>
                                <input type="date" class="contract-input" id="cf-start-date" value="${(orderData.startDate || new Date().toISOString()).substring(0, 10)}">
                            </div>
                            <div class="contract-form-group">
                                <label>Длительность (дней)</label>
                                <input type="number" class="contract-input" id="cf-duration" value="${orderData.duration || 30}">
                            </div>
                            <div class="contract-form-group">
                                <label>Гарантия (мес.)</label>
                                <input type="number" class="contract-input" id="cf-warranty" value="${orderData.warrantyMonths || 12}">
                            </div>
                        </div>
                    </div>

                    <!-- Actions -->
                    <div class="contract-form-actions">
                        <button class="contract-btn" onclick="window.ContractGenerator._previewFromForm('${el.id}')">
                            👁️ Предпросмотр
                        </button>
                        <button class="contract-btn primary" onclick="window.ContractGenerator._generateFromForm('${el.id}')">
                            📄 Сформировать договор
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    function _collectFormData() {
        return {
            customerName: document.getElementById('cf-customer-name')?.value || '',
            customerIIN: document.getElementById('cf-customer-iin')?.value || '',
            customerAddress: document.getElementById('cf-customer-address')?.value || '',
            customerPhone: document.getElementById('cf-customer-phone')?.value || '',
            contractorName: document.getElementById('cf-contractor-name')?.value || '',
            contractorCompany: document.getElementById('cf-contractor-company')?.value || '',
            contractorIIN: document.getElementById('cf-contractor-iin')?.value || '',
            contractorPhone: document.getElementById('cf-contractor-phone')?.value || '',
            title: document.getElementById('cf-work-title')?.value || '',
            objectAddress: document.getElementById('cf-object-address')?.value || '',
            city: document.getElementById('cf-city')?.value || 'Алматы',
            totalAmount: parseInt(document.getElementById('cf-amount')?.value) || 0,
            startDate: document.getElementById('cf-start-date')?.value || '',
            duration: parseInt(document.getElementById('cf-duration')?.value) || 30,
            warrantyMonths: parseInt(document.getElementById('cf-warranty')?.value) || 12
        };
    }

    function _previewFromForm(containerId) {
        const data = _collectFormData();
        const contract = generate(data);
        preview(containerId, contract);
    }

    function _generateFromForm(containerId) {
        const data = _collectFormData();
        const contract = generate(data);
        preview(containerId, contract);
        // Notification
        if (window.NotificationService) {
            window.NotificationService.show('Договор сформирован', 'success');
        }
    }

    // =============================================
    // 6. PRINT & PDF
    // =============================================

    function printContract() {
        const content = document.getElementById('contract-preview-content');
        if (!content) return;

        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
            <head>
                <title>Договор подряда</title>
                <style>
                    body { font-family: 'Times New Roman', serif; font-size: 14px; line-height: 1.6; color: #000; padding: 40px; }
                    h1 { text-align: center; font-size: 18px; margin: 0; }
                    h2 { text-align: center; font-size: 14px; font-weight: normal; margin: 4px 0 20px; }
                    h3 { font-size: 14px; margin: 16px 0 8px; }
                    p { margin: 6px 0; text-indent: 20px; }
                    ul { margin: 6px 0; padding-left: 40px; }
                    li { margin: 3px 0; }
                    .contract-header-section { display: flex; justify-content: space-between; margin-bottom: 20px; }
                    .contract-number { font-weight: bold; font-size: 16px; }
                    .contract-city-date { display: flex; justify-content: space-between; }
                    .contract-work-description { padding: 8px 16px; border: 1px solid #ccc; margin: 8px 0; font-weight: bold; }
                    .contract-signatures { display: flex; justify-content: space-between; margin-top: 40px; }
                    .contract-sig-block { width: 45%; }
                    .contract-sig-line { margin-top: 40px; }
                    .contract-table { width: 100%; border-collapse: collapse; margin: 8px 0; }
                    .contract-table th, .contract-table td { border: 1px solid #ccc; padding: 6px 8px; font-size: 12px; }
                    .contract-table th { background: #f0f0f0; }
                    .contract-footer { text-align: center; margin-top: 30px; font-size: 10px; color: #999; }
                    @media print { body { padding: 0; } }
                </style>
            </head>
            <body>${content.innerHTML}</body>
            </html>
        `);
        printWindow.document.close();
        printWindow.print();
    }

    function downloadPDF(contractId) {
        // For now, use print-to-PDF approach
        // In production, use backend PDFKit
        printContract();
        console.log(`[Contract] PDF download triggered for ${contractId}`);
    }

    // =============================================
    // 7. GET CONTRACTS
    // =============================================

    function getContracts() {
        try {
            return JSON.parse(localStorage.getItem('contracts') || '[]');
        } catch {
            return [];
        }
    }

    // =============================================
    // 8. INJECT FORM STYLES
    // =============================================

    function _injectStyles() {
        if (document.getElementById('contract-gen-styles')) return;
        const s = document.createElement('style');
        s.id = 'contract-gen-styles';
        s.textContent = `
            .contract-preview-wrapper, .contract-form-wrapper { color:#e5e5e5; font-family:'Inter',-apple-system,sans-serif; }
            .contract-toolbar { display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; flex-wrap:wrap; gap:8px; }
            .contract-toolbar h3 { margin:0; font-size:18px; }
            .contract-toolbar-actions { display:flex; gap:8px; }
            .contract-btn { padding:8px 16px; border:1px solid rgba(255,255,255,0.1); border-radius:8px; background:rgba(255,255,255,0.04); color:#e5e5e5; font-size:13px; cursor:pointer; transition:all 0.2s; }
            .contract-btn:hover { background:rgba(255,255,255,0.08); transform:translateY(-1px); }
            .contract-btn.primary { background:linear-gradient(135deg,#6366f1,#8b5cf6); border-color:transparent; color:white; }
            .contract-btn.primary:hover { box-shadow:0 4px 12px rgba(99,102,241,0.4); }

            .contract-preview { background:#fff; color:#000; border-radius:8px; padding:40px; font-family:'Times New Roman',serif; font-size:14px; line-height:1.6; max-height:600px; overflow-y:auto; }
            .contract-preview h1 { text-align:center; font-size:18px; margin:0; }
            .contract-preview h2 { text-align:center; font-size:14px; font-weight:normal; margin:4px 0 20px; }
            .contract-preview h3 { font-size:14px; margin:16px 0 8px; }
            .contract-preview p { margin:6px 0; text-indent:20px; }
            .contract-preview ul { margin:6px 0; padding-left:40px; }
            .contract-preview li { margin:3px 0; }
            .contract-header-section { display:flex; justify-content:space-between; margin-bottom:20px; }
            .contract-number { font-weight:bold; font-size:16px; }
            .contract-city-date { display:flex; justify-content:space-between; width:100%; }
            .contract-work-description { padding:8px 16px; border:1px solid #ccc; margin:8px 0; font-weight:bold; }
            .contract-signatures { display:flex; justify-content:space-between; margin-top:40px; }
            .contract-sig-block { width:45%; }
            .contract-sig-line { margin-top:40px; }
            .contract-table { width:100%; border-collapse:collapse; margin:8px 0; }
            .contract-table th,.contract-table td { border:1px solid #ccc; padding:6px 8px; font-size:12px; text-align:left; }
            .contract-table th { background:#f0f0f0; }
            .contract-footer { text-align:center; margin-top:30px; font-size:10px; color:#999; }
            .contract-appendix { margin-top:30px; padding-top:20px; border-top:2px solid #000; }

            .contract-form-header { margin-bottom:16px; }
            .contract-form-header h3 { margin:0 0 4px; font-size:18px; }
            .contract-form-subtitle { margin:0; font-size:13px; color:#9ca3af; }
            .contract-form { display:flex; flex-direction:column; gap:16px; }
            .contract-form-section { background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.06); border-radius:12px; padding:16px; }
            .contract-form-section h4 { margin:0 0 12px; font-size:14px; }
            .contract-form-section h5 { margin:0 0 8px; font-size:13px; color:#9ca3af; }
            .contract-form-grid { display:grid; grid-template-columns:1fr 1fr; gap:16px; }
            .contract-form-row { display:flex; gap:12px; }
            .contract-form-group { margin-bottom:8px; flex:1; }
            .contract-form-group label { display:block; font-size:11px; color:#9ca3af; margin-bottom:3px; }
            .contract-input,.contract-textarea { width:100%; background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.1); border-radius:8px; padding:8px 10px; color:#e5e5e5; font-size:13px; font-family:inherit; box-sizing:border-box; transition:border-color 0.2s; }
            .contract-input:focus,.contract-textarea:focus { outline:none; border-color:#6366f1; }
            .contract-form-actions { display:flex; gap:8px; justify-content:flex-end; }

            @media (max-width:768px) {
                .contract-form-grid { grid-template-columns:1fr; }
                .contract-form-row { flex-direction:column; }
                .contract-preview { padding:20px; font-size:12px; }
                .contract-signatures { flex-direction:column; gap:20px; }
                .contract-sig-block { width:100%; }
            }
        `;
        document.head.appendChild(s);
    }

    _injectStyles();

    // =============================================
    // 9. EXPORT
    // =============================================

    window.ContractGenerator = {
        generate,
        preview,
        openForm,
        printContract,
        downloadPDF,
        getContracts,
        _previewFromForm,
        _generateFromForm
    };

    console.log('[ContractGenerator] ✅ Auto-Contract Generator v1.0 loaded');

})();
