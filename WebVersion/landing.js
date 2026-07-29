// ========== LANDING PAGE SCRIPTS ==========
// Интегрированный скрипт титульного листа для QazGost AI SPA

(function () {
    'use strict';

    // ---------------------------
    // Helpers
    // ---------------------------
    const $ = (s, root = document) => root.querySelector(s);
    const $$ = (s, root = document) => Array.from(root.querySelectorAll(s));

    // ---------------------------
    // Auth Check Helpers
    // ---------------------------
    function isUserLoggedIn() {
        // Проверяем авторизацию: через Firebase или localStorage
        return window.currentUser || localStorage.getItem('isLoggedIn') === 'true';
    }

    function showAuthScreen() {
        const authScreen = document.querySelector('#authScreen');
        const landing = document.querySelector('#page-landing');
        const mainHeader = document.querySelector('#mainHeader');

        // Скрываем все страницы
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));

        // Скрываем главный header (он не нужен на экране авторизации)
        if (mainHeader) {
            mainHeader.hidden = true;
        }

        // Показываем экран авторизации
        if (authScreen) {
            authScreen.hidden = false;

            // Переключаемся на форму регистрации, если есть соответствующие элементы
            const registerTab = authScreen.querySelector('[data-tab="register"]') ||
                authScreen.querySelector('.register-tab') ||
                authScreen.querySelector('#registerTab');
            if (registerTab && typeof registerTab.click === 'function') {
                setTimeout(() => registerTab.click(), 100);
            }
        }

        // Скрываем лендинг
        if (landing) {
            landing.classList.remove('active');
        }

        // Показываем тост с подсказкой
        if (window.showToast) {
            window.showToast('🔐 Для продолжения необходимо войти или зарегистрироваться');
        }
    }

    // Требует авторизации перед выполнением действия
    function requireAuth(callback) {
        if (isUserLoggedIn()) {
            callback();
        } else {
            showAuthScreen();
        }
    }

    function updateLandingAuthUI() {
        const authBtns = document.getElementById('landingAuthBtns');
        const authIndicator = document.getElementById('landingAuthIndicator');
        if (!authBtns || !authIndicator) return;

        if (isUserLoggedIn()) {
            // Залогинен → скрыть кнопки Вход/Регистрация, показать индикатор
            authBtns.style.display = 'none';
            authIndicator.style.display = 'flex';

            // Имя пользователя
            const nameEl = document.getElementById('landingAuthName');
            if (nameEl) {
                const name = localStorage.getItem('userName') ||
                    localStorage.getItem('userDisplayName') ||
                    (window.currentUser && window.currentUser.displayName) ||
                    'Пользователь';
                nameEl.textContent = name;
            }

            // Аватар — онлайн-индикатор
            const avatarEl = document.getElementById('landingAuthAvatar');
            if (avatarEl) {
                avatarEl.innerHTML = '👤<span class="online-dot"></span>';
            }

            // Роль пользователя
            const roleEl = document.getElementById('landingAuthRole');
            if (roleEl) {
                const role = (window.RoleManager && window.RoleManager.currentUI()) ||
                    localStorage.getItem('userRole') || 'orderer';
                const roleLabels = { orderer: '📋 Заказчик', contractor: '🔧 Исполнитель', engineer: '👷 Инженер', admin: '⚙️ Админ' };
                roleEl.textContent = roleLabels[role] || role;
            }

            // Update CTA buttons text
            const ctaTop = document.getElementById('landingCtaText');
            if (ctaTop) ctaTop.textContent = 'Открыть приложение';
            const ctaBottom = document.getElementById('landingCtaBottomText');
            if (ctaBottom) ctaBottom.textContent = 'Открыть приложение';
        } else {
            // Не залогинен → показать кнопки, скрыть индикатор
            authBtns.style.display = 'flex';
            authIndicator.style.display = 'none';

            // Reset CTA text
            const ctaTop = document.getElementById('landingCtaText');
            if (ctaTop) ctaTop.textContent = 'Начать оценку';
            const ctaBottom = document.getElementById('landingCtaBottomText');
            if (ctaBottom) ctaBottom.textContent = 'Начать оценку';
        }

        // Также обновляем main header если он виден
        _updateMainHeaderAuth();
    }

    // Обновляет состояние авторизации в основном header (на внутренних страницах)
    function _updateMainHeaderAuth() {
        const headerUserName = document.getElementById('headerUserName');
        const headerAuthBtn = document.getElementById('headerAuthBtn');
        const headerUserMenu = document.getElementById('headerUserMenu');

        if (isUserLoggedIn()) {
            // Показываем имя пользователя, скрываем кнопку входа
            if (headerUserName) {
                const name = localStorage.getItem('userName') ||
                    localStorage.getItem('userDisplayName') ||
                    (window.currentUser && window.currentUser.displayName) ||
                    'Пользователь';
                headerUserName.textContent = name;
                headerUserName.style.display = '';
            }
            if (headerAuthBtn) headerAuthBtn.style.display = 'none';
            if (headerUserMenu) headerUserMenu.style.display = '';
        } else {
            // Показываем кнопку входа, скрываем имя
            if (headerUserName) headerUserName.style.display = 'none';
            if (headerAuthBtn) headerAuthBtn.style.display = '';
            if (headerUserMenu) headerUserMenu.style.display = 'none';
        }
    }

    // Expose globally
    window.updateLandingAuthUI = updateLandingAuthUI;

    // Run on load
    setTimeout(updateLandingAuthUI, 300);

    // Также при storage-изменении (другая вкладка логин/логаут)
    window.addEventListener('storage', (e) => {
        if (e.key === 'isLoggedIn' || e.key === 'userName') {
            updateLandingAuthUI();
        }
    });

    // При навигации обратно на лендинг тоже обновить
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) updateLandingAuthUI();
    });

    // ---------------------------
    // PDF Sample Modal
    // ---------------------------
    function showSamplePdfModal() {
        // Закрываем если уже открыто
        const existing = document.getElementById('samplePdfModal');
        if (existing) existing.remove();

        const modal = document.createElement('div');
        modal.id = 'samplePdfModal';
        modal.style.cssText = `
            position: fixed;
            inset: 0;
            background: rgba(0,0,0,0.85);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            padding: 1rem;
            animation: fadeIn 0.3s ease;
        `;

        // Пример данных для PDF превью
        const demoData = {
            title: 'Смета на ремонт ванной комнаты',
            date: new Date().toLocaleDateString('ru-RU'),
            area: '12.5 м²',
            volume: '2.8 м³',
            materials: [
                { name: 'Плитка керамическая 30x60', qty: '45 шт', price: '89 100 ₸' },
                { name: 'Клей для плитки Ceresit CM11', qty: '3 мешка', price: '12 450 ₸' },
                { name: 'Затирка Mapei', qty: '2 кг', price: '4 200 ₸' },
                { name: 'Гидроизоляция', qty: '15 л', price: '18 750 ₸' },
                { name: 'Сантехника (комплект)', qty: '1 компл.', price: '245 000 ₸' }
            ],
            works: [
                { name: 'Демонтаж старой плитки', price: '25 000 ₸' },
                { name: 'Гидроизоляция пола и стен', price: '18 000 ₸' },
                { name: 'Укладка плитки', price: '67 500 ₸' },
                { name: 'Установка сантехники', price: '35 000 ₸' }
            ],
            totalMaterials: '369 500 ₸',
            totalWorks: '145 500 ₸',
            total: '515 000 ₸'
        };

        modal.innerHTML = `
            <div style="
                background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
                border-radius: 20px;
                max-width: 700px;
                width: 100%;
                max-height: 85vh;
                overflow: hidden;
                box-shadow: 0 25px 80px rgba(0,0,0,0.5);
                border: 1px solid rgba(255,255,255,0.1);
            ">
                <!-- Header -->
                <div style="
                    background: linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%);
                    padding: 1.5rem 2rem;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                ">
                    <div>
                        <h2 style="margin:0;color:#fff;font-size:1.5rem;font-weight:700">📄 Пример сметы</h2>
                        <p style="margin:0.25rem 0 0;color:rgba(255,255,255,0.8);font-size:0.9rem">Смета и акт осмотра, сформированные AI-системой</p>
                    </div>
                    <button onclick="document.getElementById('samplePdfModal').remove()" style="
                        width:40px;height:40px;border-radius:50%;border:none;
                        background:rgba(255,255,255,0.2);color:#fff;font-size:1.5rem;cursor:pointer;
                        display:flex;align-items:center;justify-content:center;
                    ">×</button>
                </div>

                <!-- PDF Preview -->
                <div style="
                    padding: 2rem;
                    max-height: calc(85vh - 180px);
                    overflow-y: auto;
                    background: #fff;
                    color: #333;
                ">
                    <!-- Document Header -->
                    <div style="text-align:center;border-bottom:3px solid #8b5cf6;padding-bottom:1.5rem;margin-bottom:1.5rem">
                        <div style="font-size:2rem;margin-bottom:0.5rem">🏗️</div>
                        <h3 style="margin:0;font-size:1.3rem;color:#1a1a2e">QazGost AI</h3>
                        <h4 style="margin:0.5rem 0 0;font-size:1.1rem;color:#333">${demoData.title}</h4>
                        <p style="margin:0.5rem 0 0;color:#666;font-size:0.9rem">Дата: ${demoData.date} | Площадь: ${demoData.area}</p>
                    </div>

                    <!-- Materials Section -->
                    <div style="margin-bottom:1.5rem">
                        <h5 style="margin:0 0 0.75rem;color:#8b5cf6;font-size:1rem">🧱 Материалы</h5>
                        <table style="width:100%;border-collapse:collapse;font-size:0.9rem">
                            <thead>
                                <tr style="background:#f8f9fa">
                                    <th style="padding:0.5rem;text-align:left;border:1px solid #ddd">Наименование</th>
                                    <th style="padding:0.5rem;text-align:center;border:1px solid #ddd">Кол-во</th>
                                    <th style="padding:0.5rem;text-align:right;border:1px solid #ddd">Стоимость</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${demoData.materials.map(m => `
                                    <tr>
                                        <td style="padding:0.5rem;border:1px solid #ddd">${m.name}</td>
                                        <td style="padding:0.5rem;text-align:center;border:1px solid #ddd">${m.qty}</td>
                                        <td style="padding:0.5rem;text-align:right;border:1px solid #ddd;font-weight:600">${m.price}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                            <tfoot>
                                <tr style="background:#f0f9ff">
                                    <td colspan="2" style="padding:0.5rem;border:1px solid #ddd;font-weight:600">Итого материалы:</td>
                                    <td style="padding:0.5rem;text-align:right;border:1px solid #ddd;font-weight:700;color:#8b5cf6">${demoData.totalMaterials}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>

                    <!-- Works Section -->
                    <div style="margin-bottom:1.5rem">
                        <h5 style="margin:0 0 0.75rem;color:#ec4899;font-size:1rem">🔧 Работы</h5>
                        <table style="width:100%;border-collapse:collapse;font-size:0.9rem">
                            <thead>
                                <tr style="background:#f8f9fa">
                                    <th style="padding:0.5rem;text-align:left;border:1px solid #ddd">Наименование работы</th>
                                    <th style="padding:0.5rem;text-align:right;border:1px solid #ddd">Стоимость</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${demoData.works.map(w => `
                                    <tr>
                                        <td style="padding:0.5rem;border:1px solid #ddd">${w.name}</td>
                                        <td style="padding:0.5rem;text-align:right;border:1px solid #ddd;font-weight:600">${w.price}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                            <tfoot>
                                <tr style="background:#fdf2f8">
                                    <td style="padding:0.5rem;border:1px solid #ddd;font-weight:600">Итого работы:</td>
                                    <td style="padding:0.5rem;text-align:right;border:1px solid #ddd;font-weight:700;color:#ec4899">${demoData.totalWorks}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>

                    <!-- Total -->
                    <div style="
                        background:linear-gradient(135deg,#8b5cf6 0%,#ec4899 100%);
                        padding:1rem 1.5rem;
                        border-radius:12px;
                        display:flex;
                        justify-content:space-between;
                        align-items:center;
                        color:#fff;
                    ">
                        <span style="font-size:1.1rem;font-weight:600">💰 ИТОГО:</span>
                        <span style="font-size:1.5rem;font-weight:700">${demoData.total}</span>
                    </div>

                    <!-- Footer -->
                    <div style="margin-top:1.5rem;text-align:center;color:#999;font-size:0.8rem">
                        <p style="margin:0">Документ сформирован автоматически системой QazGost AI</p>
                        <p style="margin:0.25rem 0 0">Точность расчёта: 85-95% | QazGost AI v3.0</p>
                    </div>
                </div>

                <!-- Actions -->
                <div style="
                    padding: 1.25rem 2rem;
                    background: #1a1a2e;
                    display: flex;
                    gap: 1rem;
                    justify-content: center;
                    border-top: 1px solid rgba(255,255,255,0.1);
                ">
                    <button onclick="downloadDemoPdf()" style="
                        padding: 0.875rem 2rem;
                        background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
                        border: none;
                        border-radius: 10px;
                        color: #fff;
                        font-weight: 600;
                        font-size: 1rem;
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        gap: 0.5rem;
                    ">
                        📥 Скачать PDF
                    </button>
                    <button onclick="document.getElementById('samplePdfModal').remove(); requireAuthAndNavigate('estimate')" style="
                        padding: 0.875rem 2rem;
                        background: linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%);
                        border: none;
                        border-radius: 10px;
                        color: #fff;
                        font-weight: 600;
                        font-size: 1rem;
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        gap: 0.5rem;
                    ">
                        🚀 Создать свою смету
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
    }

    // Функция скачивания PDF
    function downloadSamplePdf() {
        // Проверяем наличие jsPDF
        if (typeof jspdf === 'undefined' && typeof window.jspdf === 'undefined') {
            window.showToast && window.showToast('⚠️ PDF библиотека загружается...');
            return;
        }

        const { jsPDF } = window.jspdf || jspdf;
        const doc = new jsPDF();

        // Header
        doc.setFontSize(20);
        doc.setFont(undefined, 'bold');
        doc.text('QazGost AI - Smeta', 105, 20, { align: 'center' });

        doc.setFontSize(14);
        doc.text('Smeta na remont vannoj komnaty', 105, 30, { align: 'center' });

        doc.setDrawColor(139, 92, 246);
        doc.setLineWidth(0.5);
        doc.line(20, 35, 190, 35);

        // Materials
        let y = 50;
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.text('Materialy:', 20, y);
        y += 10;

        doc.setFont(undefined, 'normal');
        doc.setFontSize(10);
        const materials = [
            'Plitka keramicheskaya 30x60 - 45 sht - 89 100 T',
            'Klej dlya plitki Ceresit CM11 - 3 meshka - 12 450 T',
            'Zatirka Mapei - 2 kg - 4 200 T',
            'Gidroizolyaciya - 15 l - 18 750 T',
            'Santehnika (komplekt) - 1 - 245 000 T'
        ];
        materials.forEach(m => {
            doc.text(m, 25, y);
            y += 7;
        });

        y += 5;
        doc.setFont(undefined, 'bold');
        doc.text('Itogo materialy: 369 500 T', 20, y);

        // Works
        y += 15;
        doc.text('Raboty:', 20, y);
        y += 10;

        doc.setFont(undefined, 'normal');
        const works = [
            'Demontazh staroj plitki - 25 000 T',
            'Gidroizolyaciya pola i sten - 18 000 T',
            'Ukladka plitki - 67 500 T',
            'Ustanovka santehniki - 35 000 T'
        ];
        works.forEach(w => {
            doc.text(w, 25, y);
            y += 7;
        });

        y += 5;
        doc.setFont(undefined, 'bold');
        doc.text('Itogo raboty: 145 500 T', 20, y);

        // Total
        y += 15;
        doc.setFontSize(14);
        doc.text('ITOGO: 515 000 T', 20, y);

        // Footer
        doc.setFontSize(8);
        doc.setFont(undefined, 'normal');
        doc.text('Dokument sformirovan avtomaticheski sistemoj QazGost AI', 105, 280, { align: 'center' });
        doc.text('Data: ' + new Date().toLocaleDateString('ru-RU') + ' | QazGost AI v3.0', 105, 285, { align: 'center' });

        // ── SAVE via Blob URL (reliable cross-origin download) ──
        const filename = 'QazGost_AI_Smeta.pdf';
        try {
            const blob = doc.output('blob');
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            a.style.display = 'none';
            document.body.appendChild(a);
            a.click();
            setTimeout(() => {
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }, 200);
        } catch (saveErr) {
            console.warn('Blob download failed, falling back to doc.save:', saveErr);
            doc.save(filename);
        }
        window.showToast && window.showToast('✅ PDF-смета скачана!');
    }

    // Экспортируем функцию
    window.downloadSamplePdf = downloadSamplePdf;
    window.downloadDemoPdf = downloadSamplePdf; // backward compat


    // ---------------------------
    // Landing Role UI Update (синхронизация с основным приложением)
    // ---------------------------
    function updateLandingRoleUI() {
        // Получаем UI-роль из RoleManager (единый источник правды)
        const role = (window.RoleManager && window.RoleManager.currentUI())
            || window.userRole
            || localStorage.getItem('userRole')
            || 'orderer';

        // Toggle кнопок ролей в лендинге
        const ordererBtn = $('#landingRoleOrderer');
        const contractorBtn = $('#landingRoleContractor');

        if (ordererBtn) {
            ordererBtn.classList.toggle('active', role === 'orderer');
            ordererBtn.setAttribute('aria-selected', role === 'orderer');
        }
        if (contractorBtn) {
            contractorBtn.classList.toggle('active', role === 'contractor');
            contractorBtn.setAttribute('aria-selected', role === 'contractor');
        }

        // Chip в demo-карточке
        const demoChip = $('#landingDemoChip');
        if (demoChip) {
            demoChip.textContent = 'Режим: ' + (role === 'orderer' ? 'Заказчик' : 'Исполнитель');
        }

        // Brand subtitle
        const brandSub = $('#landingBrandSub');
        if (brandSub) {
            brandSub.textContent = role === 'orderer'
                ? 'Смета • Дефекты • Выбор мастера'
                : 'Лента заказов • Отклики • Мои работы';
        }

        // Hero title & subtitle
        const heroTitle = $('#landingHeroTitle');
        const heroSub = $('#landingHeroSub');
        if (heroTitle) {
            heroTitle.textContent = role === 'orderer'
                ? 'Справедливая стоимость ремонта за 2 секунды'
                : 'Зарабатывайте на заказах — честно и прозрачно';
        }
        if (heroSub) {
            heroSub.innerHTML = role === 'orderer'
                ? 'Загрузите фото объекта — получите <b>детальную смету</b>, ведомость материалов с запасом и ориентировочную стоимость. Затем выберите лучшего исполнителя в маркетплейсе и контролируйте качество через AI-проверку дефектов.'
                : 'Открывайте ленту заказов, отправляйте предложения по цене и срокам, ведите проекты в «Моих работах» и сдавайте результат на проверку. Чат и статусы — внутри одной платформы.';
        }

        // Main CTA
        const ctaMain = $('#landingCtaMain');
        if (ctaMain) {
            ctaMain.innerHTML = role === 'orderer'
                ? '<span>Начать оценку</span><span class="landing-kbd">AI</span>'
                : '<span>Открыть ленту заказов</span><span class="landing-kbd">OPEN</span>';
        }

        // Start Order CTA text
        const ctaStartOrderText = $('#landingCtaStartOrderText');
        if (ctaStartOrderText) {
            ctaStartOrderText.textContent = role === 'orderer' ? 'Создать заказ' : 'Откликнуться на заказ';
        }

        // Orders button primary
        const ordersBtnPrimary = $('#landingOrdersBtnPrimary');
        if (ordersBtnPrimary) {
            ordersBtnPrimary.textContent = role === 'orderer' ? 'Создать заказ' : 'Открыть ленту';
        }

        // Works button primary
        const worksBtnPrimary = $('#landingWorksBtnPrimary');
        if (worksBtnPrimary) {
            worksBtnPrimary.textContent = role === 'orderer' ? 'Недоступно' : 'Мои работы';
            worksBtnPrimary.disabled = role === 'orderer';
            worksBtnPrimary.style.opacity = role === 'orderer' ? '0.5' : '1';
        }

        // Service descriptions
        const svc3 = $('#landingSvc3');
        if (svc3) {
            svc3.textContent = role === 'orderer'
                ? 'Создавайте заказы, собирайте предложения от мастеров, выбирайте лучшего по цене и срокам.'
                : 'Лента открытых заказов: отправляйте отклики (цена/срок), получайте назначение и начинайте работу.';
        }

        const svc4 = $('#landingSvc4');
        if (svc4) {
            svc4.textContent = role === 'orderer'
                ? 'Раздел «Мои работы» доступен для исполнителей после назначения на заказ.'
                : 'Исполнители ведут проекты: статус, сроки, сдача на проверку, исправления и завершение.';
        }

        // Bottom CTA
        const ctaBottomText = $('#landingCtaBottomText');
        if (ctaBottomText) {
            ctaBottomText.textContent = role === 'orderer' ? 'Начать оценку' : 'Смотреть заказы';
        }
    }

    // ---------------------------
    // CTA Click Handlers
    // ---------------------------
    function setupLandingCTAs() {
        const role = () => (window.RoleManager && window.RoleManager.currentUI()) || window.userRole || localStorage.getItem('userRole') || 'orderer';

        // Main CTA
        const ctaMain = $('#landingCtaMain');
        if (ctaMain) {
            ctaMain.addEventListener('click', () => {
                requireAuth(() => {
                    if (role() === 'orderer') {
                        if (window.showPage) window.showPage('estimate');
                    } else {
                        if (window.showPage) window.showPage('orders');
                    }
                });
            });
        }

        // Start Order CTA
        const ctaStartOrder = $('#landingCtaStartOrder');
        if (ctaStartOrder) {
            ctaStartOrder.addEventListener('click', () => {
                requireAuth(() => {
                    window.showPage && window.showPage('orders');
                });
            });
        }

        // Orders button
        const ordersBtnPrimary = $('#landingOrdersBtnPrimary');
        if (ordersBtnPrimary) {
            ordersBtnPrimary.addEventListener('click', () => {
                requireAuth(() => {
                    window.showPage && window.showPage('orders');
                });
            });
        }

        // Works button
        const worksBtnPrimary = $('#landingWorksBtnPrimary');
        if (worksBtnPrimary) {
            worksBtnPrimary.addEventListener('click', () => {
                if (role() === 'contractor') {
                    requireAuth(() => {
                        window.showPage && window.showPage('myworks');
                    });
                } else {
                    window.showToast && window.showToast('Этот раздел доступен только для исполнителей');
                }
            });
        }

        // Auth button - открывает экран авторизации
        const openAuth = $('#landingOpenAuth');
        if (openAuth) {
            openAuth.addEventListener('click', () => {
                // Скрываем landing и показываем authScreen
                const pageLanding = document.querySelector('#page-landing');
                const authScreen = document.querySelector('#authScreen');

                if (authScreen) {
                    // Скрываем все страницы
                    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
                    // Показываем экран авторизации
                    authScreen.hidden = false;
                } else {
                    // Fallback - если authScreen не найден
                    window.showToast && window.showToast('Модуль авторизации загружается...');
                }
            });
        }

        // Sample PDF button - требует авторизацию
        const ctaDemo = $('#landingCtaDemo');
        if (ctaDemo) {
            ctaDemo.addEventListener('click', () => {
                requireAuth(() => {
                    showSamplePdfModal();
                });
            });
        }

        // Download button
        const ctaDownload = $('#landingCtaDownload');
        if (ctaDownload) {
            ctaDownload.addEventListener('click', () => {
                window.showToast && window.showToast('📱 Мобильное приложение для iOS и Android скоро будет доступно!');
            });
        }

        // Bottom CTA (mirror of main)
        const ctaBottom = $('#landingCtaBottom');
        if (ctaBottom) {
            ctaBottom.addEventListener('click', () => {
                const main = $('#landingCtaMain');
                if (main) main.click();
            });
        }

        // Service mini-buttons
        $$('.landing-mini[data-page]').forEach(btn => {
            btn.addEventListener('click', () => {
                const page = btn.dataset.page;
                if (page && window.showPage) {
                    requireAuth(() => {
                        window.showPage(page);
                    });
                }
            });
        });
    }

    // ---------------------------
    // Role Switch Integration
    // ---------------------------
    function setupLandingRoleToggle() {
        const ordererBtn = $('#landingRoleOrderer');
        const contractorBtn = $('#landingRoleContractor');

        if (ordererBtn) {
            ordererBtn.addEventListener('click', () => {
                // Единая точка входа — RoleManager обновляет ВСЁ (storage, UI, landing)
                if (window.RoleManager) {
                    window.RoleManager.switchTo('orderer');
                } else if (window.setRole) {
                    window.setRole('orderer');
                }
                // updateLandingRoleUI вызовется автоматически из RoleManager
            });
        }

        if (contractorBtn) {
            contractorBtn.addEventListener('click', () => {
                // Единая точка входа
                if (window.RoleManager) {
                    window.RoleManager.switchTo('contractor');
                } else if (window.setRole) {
                    window.setRole('contractor');
                }

                // === СУПЕРРЕЖИМ: Исполнитель получает ВСЕ РОЛИ ===
                if (window.RoleManager) {
                    window.RoleManager.grantAllRoles();
                } else if (window.grantAllRoles) {
                    window.grantAllRoles();
                }
                console.log('🎯 СУПЕРРЕЖИМ: Исполнителю выданы все роли!');
                if (window.showToast) {
                    window.showToast('🎯 Режим исполнителя: доступны все функции системы');
                }
            });
        }
    }

    // ---------------------------
    // Reveal Animation
    // ---------------------------
    function setupLandingReveal() {
        const io = new IntersectionObserver((entries) => {
            entries.forEach(en => {
                if (en.isIntersecting) {
                    en.target.classList.add('in');
                }
            });
        }, { threshold: 0.08 });

        $$('.landing-reveal').forEach(el => io.observe(el));
    }

    // ---------------------------
    // Stats Counter Animation
    // ---------------------------
    function animateLandingCount(el) {
        const target = Number(el.dataset.count || '0');
        const suffix = el.dataset.suffix || '';
        const dur = 1100;
        const t0 = performance.now();

        function tick(now) {
            const p = Math.min(1, (now - t0) / dur);
            const eased = 1 - Math.pow(1 - p, 3);
            const val = Math.round(target * eased);
            el.textContent = val.toLocaleString('ru-RU') + suffix;
            if (p < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
    }

    function setupLandingStats() {
        const statObserver = new IntersectionObserver((entries) => {
            entries.forEach(en => {
                if (en.isIntersecting) {
                    const n = en.target.querySelector('.n');
                    // Пропускаем статические значения (например 50-98%)
                    if (n && !n._done && !n.dataset.static) {
                        n._done = true;
                        animateLandingCount(n);
                    }
                }
            });
        }, { threshold: 0.35 });

        $$('.landing-stat').forEach(el => statObserver.observe(el));
    }

    // ---------------------------
    // Particles (Canvas)
    // ---------------------------
    function setupLandingParticles() {
        const canvas = document.getElementById('landingParticles');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        let w, h, dpr;
        const particles = [];
        const P = 65;

        function resize() {
            dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
            w = canvas.parentElement?.clientWidth || window.innerWidth;
            h = canvas.parentElement?.clientHeight || 600;
            canvas.style.width = w + 'px';
            canvas.style.height = h + 'px';
            canvas.width = Math.floor(w * dpr);
            canvas.height = Math.floor(h * dpr);
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        }

        function rand(min, max) { return Math.random() * (max - min) + min; }

        function initParticles() {
            particles.length = 0;
            for (let i = 0; i < P; i++) {
                particles.push({
                    x: rand(0, w),
                    y: rand(0, h),
                    vx: rand(-.18, .18),
                    vy: rand(-.18, .18),
                    r: rand(1.0, 2.6),
                    a: rand(.12, .55)
                });
            }
        }

        function step() {
            ctx.clearRect(0, 0, w, h);

            for (const p of particles) {
                p.x += p.vx;
                p.y += p.vy;
                if (p.x < -20) p.x = w + 20;
                if (p.x > w + 20) p.x = -20;
                if (p.y < -20) p.y = h + 20;
                if (p.y > h + 20) p.y = -20;

                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255,255,255,${p.a})`;
                ctx.fill();
            }

            // Lines between particles
            for (let i = 0; i < particles.length; i++) {
                for (let j = i + 1; j < particles.length; j++) {
                    const a = particles[i], b = particles[j];
                    const dx = a.x - b.x, dy = a.y - b.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < 110) {
                        const alpha = (1 - dist / 110) * .18;
                        ctx.strokeStyle = `rgba(246,196,83,${alpha})`;
                        ctx.lineWidth = 1;
                        ctx.beginPath();
                        ctx.moveTo(a.x, a.y);
                        ctx.lineTo(b.x, b.y);
                        ctx.stroke();
                    }
                }
            }

            requestAnimationFrame(step);
        }

        // Debounced resize to improve performance
        let resizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                resize();
                initParticles();
            }, 150);
        });

        resize();
        initParticles();
        step();
    }

    // ---------------------------
    // Initialize Landing
    // ---------------------------
    function initLanding() {
        updateLandingRoleUI();
        setupLandingCTAs();
        setupLandingRoleToggle();
        setupLandingReveal();
        setupLandingStats();
        setupLandingParticles();

        // Initialize enhanced toast container
        initToastContainer();

        // Initialize modal system
        initModalSystem();

        // Initialize engineering solutions catalog (if available)
        if (window.EngineeringModels && typeof window.EngineeringModels.initSolutionsCatalog === 'function') {
            window.EngineeringModels.initSolutionsCatalog();
        }
    }

    // ---------------------------
    // ENHANCED TOAST SYSTEM
    // ---------------------------
    function initToastContainer() {
        if (!document.querySelector('.toast-container')) {
            const container = document.createElement('div');
            container.className = 'toast-container';
            container.id = 'toastContainer';
            document.body.appendChild(container);
        }
    }

    /**
     * Show enhanced toast notification
     * @param {Object|string} options - Toast options or message string
     * @param {string} options.message - Toast message
     * @param {string} options.type - Toast type: 'success' | 'error' | 'info' | 'warning'
     * @param {number} options.duration - Duration in ms (default: 4000)
     * @param {boolean} options.closable - Show close button (default: true)
     */
    function showEnhancedToast(options) {
        const config = typeof options === 'string'
            ? { message: options, type: 'info' }
            : { type: 'info', duration: 4000, closable: true, ...options };

        const container = document.querySelector('.toast-container') || createToastContainer();

        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };

        const toast = document.createElement('div');
        toast.className = `toast-item ${config.type}`;
        toast.innerHTML = `
            <span class="toast-icon">${icons[config.type] || icons.info}</span>
            <span class="toast-message">${config.message}</span>
            ${config.closable ? '<button class="toast-close" aria-label="Close">×</button>' : ''}
        `;

        container.appendChild(toast);

        // Close button handler
        const closeBtn = toast.querySelector('.toast-close');
        if (closeBtn) {
            closeBtn.onclick = () => dismissToast(toast);
        }

        // Auto-dismiss
        if (config.duration > 0) {
            setTimeout(() => dismissToast(toast), config.duration);
        }

        return toast;
    }

    function createToastContainer() {
        const container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
        return container;
    }

    function dismissToast(toast) {
        if (!toast || toast._dismissing) return;
        toast._dismissing = true;
        toast.classList.add('closing');
        setTimeout(() => {
            toast.remove();
        }, 250);
    }

    // ---------------------------
    // MODAL SYSTEM
    // ---------------------------
    let activeModal = null;
    let previousActiveElement = null;

    function initModalSystem() {
        // Create backdrop if not exists
        if (!document.querySelector('.modal-backdrop')) {
            const backdrop = document.createElement('div');
            backdrop.className = 'modal-backdrop';
            backdrop.id = 'modalBackdrop';
            document.body.appendChild(backdrop);
        }

        // Global Escape key handler
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && activeModal && !activeModal.dataset.critical) {
                closeModal();
            }
        });
    }

    /**
     * Open a modal dialog
     * @param {Object} options - Modal options
     * @param {string} options.id - Unique modal ID
     * @param {string} options.title - Modal title
     * @param {string} options.content - Modal body HTML content
     * @param {Array} options.buttons - Array of button configs [{text, type, onClick}]
     * @param {boolean} options.closable - Show close button (default: true)
     * @param {boolean} options.critical - If true, can't close by Esc/backdrop (default: false)
     * @param {Function} options.onClose - Callback when modal closes
     */
    function openModal(options) {
        const config = {
            id: 'modal-' + Date.now(),
            title: 'Modal',
            content: '',
            buttons: [],
            closable: true,
            critical: false,
            onClose: null,
            ...options
        };

        // Close existing modal first
        if (activeModal) {
            closeModal(true);
        }

        // Save previous focus
        previousActiveElement = document.activeElement;

        // Create modal
        const modal = document.createElement('div');
        modal.className = 'modal-glass';
        modal.id = config.id;
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-modal', 'true');
        modal.setAttribute('aria-labelledby', config.id + '-title');
        if (config.critical) modal.dataset.critical = 'true';

        // Build buttons HTML
        const buttonsHtml = config.buttons.map((btn, idx) => `
            <button class="landing-btn ${btn.type || 'ghost'}" data-btn-idx="${idx}">
                <span class="btn-text">${btn.text}</span>
            </button>
        `).join('');

        modal.innerHTML = `
            <div class="modal-header">
                <h2 class="modal-title" id="${config.id}-title">${config.title}</h2>
                ${config.closable ? '<button class="modal-close" aria-label="Close modal">×</button>' : ''}
            </div>
            <div class="modal-body">${config.content}</div>
            ${buttonsHtml ? `<div class="modal-footer">${buttonsHtml}</div>` : ''}
            <span class="focus-trap-sentinel" tabindex="0"></span>
        `;

        document.body.appendChild(modal);
        activeModal = modal;
        activeModal._onClose = config.onClose;

        // Show backdrop
        const backdrop = document.querySelector('.modal-backdrop');
        backdrop.classList.add('active');

        // Backdrop click to close
        if (!config.critical) {
            backdrop.onclick = () => closeModal();
        }

        // Close button
        const closeBtn = modal.querySelector('.modal-close');
        if (closeBtn) {
            closeBtn.onclick = () => closeModal();
        }

        // Button handlers
        config.buttons.forEach((btn, idx) => {
            const btnEl = modal.querySelector(`[data-btn-idx="${idx}"]`);
            if (btnEl && btn.onClick) {
                btnEl.onclick = () => btn.onClick(modal);
            }
        });

        // Focus trap
        setupFocusTrap(modal);

        // Lock body scroll
        lockBodyScroll();

        // Animate in
        requestAnimationFrame(() => {
            modal.classList.add('active');
        });

        // Focus first focusable element
        setTimeout(() => {
            const focusable = modal.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
            if (focusable) focusable.focus();
        }, 100);

        return modal;
    }

    function closeModal(immediate = false) {
        if (!activeModal) return;

        const modal = activeModal;
        const backdrop = document.querySelector('.modal-backdrop');

        if (modal._onClose) {
            modal._onClose();
        }

        if (immediate) {
            modal.remove();
            backdrop.classList.remove('active');
        } else {
            modal.classList.remove('active');
            modal.classList.add('closing');
            backdrop.classList.remove('active');

            setTimeout(() => {
                modal.remove();
            }, 250);
        }

        activeModal = null;
        unlockBodyScroll();

        // Restore focus
        if (previousActiveElement) {
            previousActiveElement.focus();
            previousActiveElement = null;
        }
    }

    function setupFocusTrap(modal) {
        const sentinel = modal.querySelector('.focus-trap-sentinel');
        if (sentinel) {
            sentinel.onfocus = () => {
                const focusable = modal.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
                if (focusable) focusable.focus();
            };
        }
    }

    function lockBodyScroll() {
        const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
        document.documentElement.style.setProperty('--scrollbar-width', scrollbarWidth + 'px');
        document.body.classList.add('modal-open');
    }

    function unlockBodyScroll() {
        document.body.classList.remove('modal-open');
        document.documentElement.style.removeProperty('--scrollbar-width');
    }

    /**
     * Shake the modal to indicate an error
     */
    function shakeModal() {
        if (!activeModal) return;
        activeModal.classList.add('shake');
        setTimeout(() => {
            activeModal.classList.remove('shake');
        }, 400);
    }

    /**
     * Shake an input field to indicate validation error
     */
    function shakeInput(input) {
        if (!input) return;
        input.classList.add('input-error');
        setTimeout(() => {
            input.classList.remove('input-error');
        }, 300);
    }

    /**
     * Add loading state to a button
     */
    function setButtonLoading(btn, loading = true) {
        if (!btn) return;
        if (loading) {
            btn.classList.add('btn-loading');
            btn.disabled = true;
        } else {
            btn.classList.remove('btn-loading');
            btn.disabled = false;
        }
    }

    // Запуск при загрузке DOM или сразу если DOM уже загружен
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initLanding);
    } else {
        // DOM уже загружен
        setTimeout(initLanding, 0);
    }

    // Экспортируем функции для использования в приложении
    window.updateLandingRoleUI = updateLandingRoleUI;
    window.showEnhancedToast = showEnhancedToast;
    window.openModal = openModal;
    window.closeModal = closeModal;
    window.shakeModal = shakeModal;
    window.shakeInput = shakeInput;
    window.setButtonLoading = setButtonLoading;

    // Глобальная функция для проверки авторизации и перехода на страницу
    window.requireAuthAndNavigate = function (page) {
        if (isUserLoggedIn()) {
            window.showPage && window.showPage(page);
        } else {
            showAuthScreen();
        }
    };

    // ═══════════════════════════════════════════════════
    // PUBLIC PRICE CATALOG MODULE (SLIDE-BASED)
    // ═══════════════════════════════════════════════════
    const LandingPrices = (function () {
        let _activeGroup = null;
        let _searchQuery = '';
        let _groupSearchQuery = '';
        let _page = 1;
        let _searchTimer = null;
        const PAGE_SIZE = 40;

        function getRegistry() {
            return window.WorkRegistry || null;
        }

        function init() {
            const reg = getRegistry();
            if (!reg) return;

            const stats = reg.getStats();

            // Обновляем счётчик работ на титульном листе
            const el = document.getElementById('priceTotalCount');
            if (el) el.textContent = stats.works.toLocaleString('ru-RU');

            // Обновляем счётчик категорий
            const catEl = document.getElementById('priceCatCount');
            if (catEl) catEl.textContent = stats.categories;

            // Обновляем также текст в сервисной карточке каталога цен
            const svcPricesP = document.querySelector('.svc-prices p');
            if (svcPricesP && stats.works > 0) {
                svcPricesP.textContent = `${stats.works.toLocaleString('ru-RU')}+ работ в ${stats.categories} категориях. Актуальные цены Казахстана 2026 года с поиском.`;
            }

            renderCategoryGrid();
            console.log(`[LandingPrices] Initialized: ${stats.works} работ, ${stats.categories} категорий`);
        }

        // ─── Slide 1: Category Grid ───
        function renderCategoryGrid() {
            const container = document.getElementById('landingPricesCatGrid');
            if (!container) return;
            const reg = getRegistry();
            if (!reg) {
                container.innerHTML = '<div class="price-loading">Загрузка каталога...</div>';
                return;
            }

            const cats = reg.getCategories();
            if (!cats.length) {
                container.innerHTML = '<div class="price-loading">Каталог пуст</div>';
                return;
            }

            container.innerHTML = cats.map(cat => {
                const colorRaw = cat.color || '#8b5cf6';
                return `
                    <div class="prices-category-card"
                         style="--cat-color: ${colorRaw}22; --cat-color-border: ${colorRaw}44"
                         onclick="LandingPrices.selectCategory('${cat.key}')"
                         id="lpCat_${cat.key}">
                        <span class="prices-cat-icon">${cat.icon}</span>
                        <div class="prices-cat-name">${escapeHtml(cat.name)}</div>
                        <div class="prices-cat-count"><b>${cat.workCount}</b> работ</div>
                    </div>
                `;
            }).join('');
        }

        // ─── Select category (slide to works) ───
        function selectCategory(groupKey) {
            _activeGroup = groupKey;
            _searchQuery = '';
            _groupSearchQuery = '';
            _page = 1;

            const reg = getRegistry();
            if (!reg) return;

            const cats = reg.getCategories();
            const cat = cats.find(c => c.key === groupKey);

            // Update works header
            const titleEl = document.getElementById('landingPricesWorksTitle');
            if (titleEl && cat) {
                titleEl.innerHTML = `<span>${cat.icon}</span> ${escapeHtml(cat.name)}`;
            }

            const countBadge = document.getElementById('landingPricesWorksBadge');
            if (countBadge && cat) {
                countBadge.textContent = `${cat.workCount} работ`;
            }

            // Clear group search
            const gs = document.getElementById('landingPricesWorksSearch');
            if (gs) gs.value = '';

            // Clear global search
            const globalSearch = document.getElementById('priceSearchInput');
            if (globalSearch) globalSearch.value = '';

            renderWorks();

            // Slide animation
            const slides = document.getElementById('landingPricesSlides');
            if (slides) slides.classList.add('show-works');
        }

        // ─── Go back to categories ───
        function backToCategories() {
            _activeGroup = null;
            _groupSearchQuery = '';
            _page = 1;

            const slides = document.getElementById('landingPricesSlides');
            if (slides) slides.classList.remove('show-works');

            // Re-render category grid to ensure it's populated
            renderCategoryGrid();

            // Clear group search input
            const gs = document.getElementById('landingPricesWorksSearch');
            if (gs) gs.value = '';

            // Scroll back to prices section
            const section = document.getElementById('landingPrices');
            if (section) section.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }

        // ─── Global search ───
        function search(query) {
            clearTimeout(_searchTimer);
            _searchTimer = setTimeout(() => {
                _searchQuery = query;

                if (query && query.length >= 2) {
                    // Search across all works and show matching categories
                    searchGlobal(query);
                } else if (!query || query.length === 0) {
                    _searchQuery = '';
                    renderCategoryGrid();
                    // Go back to slide 1 if on slide 2
                    const slides = document.getElementById('landingPricesSlides');
                    if (slides) slides.classList.remove('show-works');
                }
            }, 300);
        }

        function searchGlobal(query) {
            const reg = getRegistry();
            if (!reg) return;

            const results = reg.search(query);
            const container = document.getElementById('landingPricesCatGrid');
            if (!container) return;

            if (!results.length) {
                container.innerHTML = `<div class="price-loading" style="grid-column:1/-1">🔍 Ничего не найдено по запросу «${escapeHtml(query)}»</div>`;
                return;
            }

            // Group results by category
            const groupCounts = {};
            results.forEach(w => {
                groupCounts[w.group] = (groupCounts[w.group] || 0) + 1;
            });

            const cats = reg.getCategories().filter(c => groupCounts[c.key]);

            container.innerHTML = `<div style="grid-column:1/-1;font-size:13px;color:rgba(255,255,255,.5);padding:4px 0">
                Найдено <b style="color:#fff">${results.length}</b> работ в ${cats.length} категориях
            </div>` + cats.map(cat => {
                const colorRaw = cat.color || '#8b5cf6';
                const matchCount = groupCounts[cat.key] || 0;
                return `
                    <div class="prices-category-card"
                         style="--cat-color: ${colorRaw}22; --cat-color-border: ${colorRaw}44"
                         onclick="LandingPrices.selectCategory('${cat.key}')"
                         id="lpCat_${cat.key}">
                        <span class="prices-cat-icon">${cat.icon}</span>
                        <div class="prices-cat-name">${escapeHtml(cat.name)}</div>
                        <div class="prices-cat-count"><b>${matchCount}</b> совпадений</div>
                    </div>
                `;
            }).join('');

            // Make sure we're on slide 1
            const slides = document.getElementById('landingPricesSlides');
            if (slides) slides.classList.remove('show-works');
        }

        // ─── Search within group ───
        function searchInGroup(query) {
            clearTimeout(_searchTimer);
            _searchTimer = setTimeout(() => {
                _groupSearchQuery = query;
                _page = 1;
                renderWorks();
            }, 300);
        }

        function setPage(p) {
            _page = Math.max(1, parseInt(p) || 1);
            renderWorks();
            const el = document.getElementById('priceList');
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }

        function renderWorks() {
            const listEl = document.getElementById('priceList');
            const paginEl = document.getElementById('pricePagination');
            if (!listEl) return;

            const reg = getRegistry();
            if (!reg) {
                listEl.innerHTML = '<div class="price-loading">Каталог загружается...</div>';
                return;
            }

            let works;
            if (_groupSearchQuery && _groupSearchQuery.length >= 2) {
                const allInGroup = reg.getWorksByGroup(_activeGroup);
                const q = _groupSearchQuery.toLowerCase();
                works = allInGroup.filter(w => w.name.toLowerCase().includes(q));
            } else if (_activeGroup) {
                works = reg.getWorksByGroup(_activeGroup);
            } else {
                works = [];
            }

            const total = works.length;
            const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
            _page = Math.min(_page, totalPages);
            const start = (_page - 1) * PAGE_SIZE;
            const slice = works.slice(start, start + PAGE_SIZE);

            if (!slice.length) {
                listEl.innerHTML = '<div class="price-loading">' +
                    (_groupSearchQuery ? 'Ничего не найдено по запросу «' + escapeHtml(_groupSearchQuery) + '»' : 'Нет данных') +
                    '</div>';
                if (paginEl) paginEl.innerHTML = '';
                return;
            }

            // Results info bar
            let html = `<div class="price-results-info">
                <span>Найдено: <b style="color:#fff">${total.toLocaleString('ru-RU')}</b> работ</span>
                ${totalPages > 1 ? `<span>Стр. ${_page} / ${totalPages}</span>` : ''}
            </div>`;

            // Group by rawCategory for accordion
            if (_groupSearchQuery) {
                html += slice.map(w => renderRow(w)).join('');
            } else {
                const groups = {};
                slice.forEach(w => {
                    const cat = w.rawCategory || 'other';
                    if (!groups[cat]) groups[cat] = [];
                    groups[cat].push(w);
                });

                Object.entries(groups).forEach(([cat, items]) => {
                    html += `<details class="price-section" open>
                        <summary class="price-section-header">
                            <span>
                                <span class="section-name">${escapeHtml(cat.replace(/_/g, ' '))}</span>
                                <span class="section-count"> · ${items.length} работ</span>
                            </span>
                            <span class="section-chevron">▶</span>
                        </summary>
                        <div>
                            ${items.map(w => renderRow(w)).join('')}
                        </div>
                    </details>`;
                });
            }

            listEl.innerHTML = html;

            // Pagination
            if (paginEl) {
                if (totalPages <= 1) {
                    paginEl.innerHTML = '';
                } else {
                    let btns = '';
                    if (_page > 1) btns += pgBtn(_page - 1, '◀');
                    const lo = Math.max(1, _page - 2);
                    const hi = Math.min(totalPages, _page + 2);
                    if (lo > 1) { btns += pgBtn(1); if (lo > 2) btns += '<span class="price-page-dots">…</span>'; }
                    for (let p = lo; p <= hi; p++) btns += pgBtn(p, p, p === _page);
                    if (hi < totalPages) { if (hi < totalPages - 1) btns += '<span class="price-page-dots">…</span>'; btns += pgBtn(totalPages); }
                    if (_page < totalPages) btns += pgBtn(_page + 1, '▶');
                    paginEl.innerHTML = btns;
                }
            }
        }

        function renderRow(w) {
            const priceStr = w.price
                ? w.price.toLocaleString('ru-RU') + '\u00a0₸'
                : '—';
            const priceClass = w.price ? 'price-row-price' : 'price-row-price no-price';
            return `<div class="price-row">
                <span class="price-row-name" title="${escapeHtml(w.name)}">${escapeHtml(w.name)}</span>
                <span class="price-row-unit">${escapeHtml(w.unit || '—')}</span>
                <span class="${priceClass}">${priceStr}</span>
            </div>`;
        }

        function pgBtn(page, label, active) {
            label = label || page;
            return `<button class="price-page-btn${active ? ' active' : ''}"
                onclick="LandingPrices.setPage(${page})">${label}</button>`;
        }

        function escapeHtml(str) {
            if (!str) return '';
            return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
        }

        // Deferred init — AI_WRK_* files load after WorkRegistry via CatalogLoader
        // Используем событие catalogs:ready + retry вместо фиксированного timeout
        let _initRetries = 0;
        const MAX_RETRIES = 15;

        function deferredInit() {
            const reg = getRegistry();
            if (reg) {
                const stats = reg.getStats();
                if (stats.works > 0) {
                    init();
                    return;
                }
            }

            // Каталоги ещё не загружены — retry
            _initRetries++;
            if (_initRetries < MAX_RETRIES) {
                setTimeout(deferredInit, 800);
            } else {
                // Последняя попытка — показываем то что есть
                init();
            }
        }

        // Слушаем событие от CatalogLoader.loadAll()
        document.addEventListener('catalogs:ready', () => {
            // Каталоги загружены — пересканировать WorkRegistry и обновить UI
            if (window.WorkRegistry && window.WorkRegistry.invalidateCache) {
                window.WorkRegistry.invalidateCache();
            }
            init();
        });

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => setTimeout(deferredInit, 600));
        } else {
            setTimeout(deferredInit, 600);
        }

        return { selectCategory, search, searchInGroup, setPage, init, backToCategories };
    })();

    window.LandingPrices = LandingPrices;

})();
