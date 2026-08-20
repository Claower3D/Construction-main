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
    const canvas = document.getElementById('landingCanvas') || document.getElementById('bgCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;

    let mouse = {
        x: width * 0.5,
        y: height * 0.45,
        targetX: width * 0.5,
        targetY: height * 0.45,
        isHovered: false,
        shockwaves: []
    };

    window.addEventListener('mousemove', (e) => {
        mouse.targetX = e.clientX;
        mouse.targetY = e.clientY;
        mouse.isHovered = true;
    });

    window.addEventListener('mousedown', (e) => {
        mouse.shockwaves.push({
            x: e.clientX,
            y: e.clientY,
            radius: 8,
            alpha: 0.85,
            speed: 7.0
        });
        if (window.sfx) window.sfx.playRadar();
    });

    window.addEventListener('resize', () => {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    });

    let tick = 0;

    const count = Math.min(Math.floor((width * height) / 3200), 380);
    const particles = [];
    const colorPalette = ['#38bdf8', '#60a5fa', '#34d399', '#fbbf24', '#f59e0b', '#a855f7', '#ffffff'];

    for (let i = 0; i < count; i++) {
        particles.push({
            x: Math.random() * width,
            y: Math.random() * height,
            vx: (Math.random() - 0.5) * 0.5,
            vy: (Math.random() - 0.5) * 0.5,
            radius: Math.random() * 2.0 + 1.0,
            color: colorPalette[i % colorPalette.length],
            pulseVal: Math.random() * Math.PI * 2,
            pulseSpeed: 0.02 + Math.random() * 0.02
        });
    }

    const comets = [];
    function spawnComet() {
        if (comets.length < 3 && Math.random() < 0.025) {
            comets.push({
                x: Math.random() * width * 0.8 + width * 0.1,
                y: -20,
                vx: (Math.random() - 0.3) * 6 - 2,
                vy: Math.random() * 7 + 5,
                length: Math.random() * 90 + 50,
                alpha: 0.9,
                color: Math.random() > 0.4 ? '#38bdf8' : '#fbbf24'
            });
        }
    }

    const cityBuildings = [
        { id: 'L1', name: 'БЛОК А1', xR: 0.03, yR: 0.52, w: 90, h: 220, floors: 8, spire: 35, color: 'rgba(56, 189, 248, 0.14)' },
        { id: 'L2', name: 'ТАУЭР А2', xR: 0.10, yR: 0.56, w: 115, h: 280, floors: 11, spire: 55, color: 'rgba(37, 99, 235, 0.16)' },
        { id: 'L3', name: 'КОРПУС А3', xR: 0.19, yR: 0.59, w: 80, h: 180, floors: 6, spire: 20, color: 'rgba(14, 165, 233, 0.12)' },
        { id: 'R1', name: 'КОРПУС В1', xR: 0.75, yR: 0.57, w: 85, h: 190, floors: 7, spire: 25, color: 'rgba(16, 185, 129, 0.12)' },
        { id: 'R2', name: 'ТАУЭР В2', xR: 0.82, yR: 0.53, w: 130, h: 310, floors: 12, spire: 70, color: 'rgba(56, 189, 248, 0.16)' },
        { id: 'R3', name: 'БЛОК В3', xR: 0.92, yR: 0.55, w: 95, h: 240, floors: 9, spire: 40, color: 'rgba(245, 158, 11, 0.14)' }
    ];

    const cranes = [
        { bxR: 0.10, byR: 0.56, bh: 280, armLen: 70, color: '#fbbf24' },
        { bxR: 0.82, byR: 0.53, bh: 310, armLen: 85, color: '#38bdf8' }
    ];

    const waterLabyrinth = [
        { id: 'W_L1', name: 'ВЫПУСК L1 Ø200', color: '#06b6d4', glowColor: 'rgba(6, 182, 212, 0.4)', width: 3.2, points: [{ xR: 0.05, yR: 0.52 }, { xR: 0.05, yR: 0.67 }, { xR: 0.09, yR: 0.67 }, { xR: 0.09, yR: 0.77 }], pulses: [0.15, 0.65], speed: 0.07 },
        { id: 'W_L2', name: 'МАГИСТРАЛЬ К1 Ø1200', color: '#06b6d4', glowColor: 'rgba(6, 182, 212, 0.45)', width: 4.0, points: [{ xR: 0.13, yR: 0.56 }, { xR: 0.13, yR: 0.77 }, { xR: 0.18, yR: 0.77 }, { xR: 0.18, yR: 0.85 }, { xR: 0.28, yR: 0.85 }, { xR: 0.32, yR: 0.91 }, { xR: 0.50, yR: 0.91 }], pulses: [0.08, 0.38, 0.72], speed: 0.06 },
        { id: 'W_L3', name: 'ВЫПУСК L3 Ø250', color: '#38bdf8', glowColor: 'rgba(56, 189, 248, 0.4)', width: 3.0, points: [{ xR: 0.21, yR: 0.59 }, { xR: 0.21, yR: 0.71 }, { xR: 0.18, yR: 0.71 }, { xR: 0.18, yR: 0.85 }], pulses: [0.22, 0.78], speed: 0.08 },
        { id: 'W_R3', name: 'ВЫПУСК R3 Ø250', color: '#06b6d4', glowColor: 'rgba(6, 182, 212, 0.4)', width: 3.2, points: [{ xR: 0.95, yR: 0.55 }, { xR: 0.95, yR: 0.69 }, { xR: 0.89, yR: 0.69 }, { xR: 0.89, yR: 0.79 }], pulses: [0.20, 0.70], speed: 0.07 },
        { id: 'W_R2', name: 'КОЛЛЕКТОР К1 Ø1200', color: '#06b6d4', glowColor: 'rgba(6, 182, 212, 0.45)', width: 4.0, points: [{ xR: 0.86, yR: 0.53 }, { xR: 0.86, yR: 0.79 }, { xR: 0.79, yR: 0.79 }, { xR: 0.79, yR: 0.87 }, { xR: 0.68, yR: 0.87 }, { xR: 0.64, yR: 0.91 }, { xR: 0.50, yR: 0.91 }], pulses: [0.12, 0.45, 0.82], speed: 0.06 },
        { id: 'W_R1', name: 'ВЫПУСК R1 Ø200', color: '#38bdf8', glowColor: 'rgba(56, 189, 248, 0.4)', width: 3.0, points: [{ xR: 0.77, yR: 0.57 }, { xR: 0.77, yR: 0.73 }, { xR: 0.79, yR: 0.73 }, { xR: 0.79, yR: 0.87 }], pulses: [0.30, 0.85], speed: 0.08 }
    ];

    const electricGrid = [
        { id: 'E_LEFT_TP1', name: 'КАБЕЛЬ 10 кВ // ТП-1', color: '#fbbf24', glowColor: 'rgba(251, 191, 36, 0.45)', width: 2.2, points: [{ xR: 0.04, yR: 0.52 }, { xR: 0.04, yR: 0.62 }, { xR: 0.11, yR: 0.62 }, { xR: 0.11, yR: 0.56 }, { xR: 0.11, yR: 0.65 }, { xR: 0.20, yR: 0.65 }, { xR: 0.20, yR: 0.59 }], pulses: [0.1, 0.45, 0.75], speed: 0.12 },
        { id: 'E_RIGHT_TP2', name: 'КАБЕЛЬ 35 кВ // ТП-2', color: '#fbbf24', glowColor: 'rgba(251, 191, 36, 0.45)', width: 2.2, points: [{ xR: 0.76, yR: 0.57 }, { xR: 0.76, yR: 0.65 }, { xR: 0.84, yR: 0.65 }, { xR: 0.84, yR: 0.53 }, { xR: 0.84, yR: 0.68 }, { xR: 0.94, yR: 0.68 }, { xR: 0.94, yR: 0.55 }], pulses: [0.15, 0.50, 0.85], speed: 0.12 },
        { id: 'E_INTER_TRUNK', name: 'МАГИСТРАЛЬ 35 кВ ТП-1 ⟷ ТП-2', color: '#f59e0b', glowColor: 'rgba(245, 158, 11, 0.4)', width: 2.5, points: [{ xR: 0.11, yR: 0.65 }, { xR: 0.11, yR: 0.73 }, { xR: 0.26, yR: 0.73 }, { xR: 0.30, yR: 0.78 }, { xR: 0.70, yR: 0.78 }, { xR: 0.74, yR: 0.73 }, { xR: 0.84, yR: 0.73 }, { xR: 0.84, yR: 0.68 }], pulses: [0.20, 0.65], speed: 0.14 }
    ];

    const utilityNodes = [
        { xR: 0.05, yR: 0.67, label: 'КК-1 (L1)', desc: 'h=-2.5m', color: '#06b6d4', type: 'water' },
        { xR: 0.13, yR: 0.77, label: 'КК-2 (L2)', desc: 'h=-4.2m', color: '#06b6d4', type: 'water' },
        { xR: 0.21, yR: 0.71, label: 'КК-3 (L3)', desc: 'h=-3.1m', color: '#06b6d4', type: 'water' },
        { xR: 0.11, yR: 0.62, label: '⚡ ТП-1 (10/0.4кВ)', desc: 'P=630 кВА', color: '#fbbf24', type: 'electric' },
        { xR: 0.95, yR: 0.69, label: 'КК-11 (R3)', desc: 'h=-2.8m', color: '#06b6d4', type: 'water' },
        { xR: 0.86, yR: 0.79, label: 'КК-12 (R2)', desc: 'h=-4.5m', color: '#06b6d4', type: 'water' },
        { xR: 0.77, yR: 0.73, label: 'КК-13 (R1)', desc: 'h=-3.4m', color: '#06b6d4', type: 'water' },
        { xR: 0.84, yR: 0.65, label: '⚡ ТП-2 (35/10кВ)', desc: 'P=1000 кВА', color: '#fbbf24', type: 'electric' },
        { xR: 0.50, yR: 0.91, label: 'КНС-ГЛАВНАЯ (ХПВ+К1)', desc: 'Q=320м³/ч // h=-8.5m', color: '#38bdf8', type: 'hub' }
    ];

    function getPointAlongPath(points, progress) {
        let totalLength = 0;
        const segLengths = [];
        for (let i = 0; i < points.length - 1; i++) {
            const pA = { x: points[i].xR * width, y: points[i].yR * height };
            const pB = { x: points[i + 1].xR * width, y: points[i + 1].yR * height };
            const len = Math.hypot(pB.x - pA.x, pB.y - pA.y);
            segLengths.push(len);
            totalLength += len;
        }
        const targetDist = (progress % 1.0) * totalLength;
        let accDist = 0;
        for (let i = 0; i < segLengths.length; i++) {
            if (accDist + segLengths[i] >= targetDist) {
                const segProgress = (targetDist - accDist) / segLengths[i];
                const pA = { x: points[i].xR * width, y: points[i].yR * height };
                const pB = { x: points[i + 1].xR * width, y: points[i + 1].yR * height };
                return {
                    x: pA.x + (pB.x - pA.x) * segProgress,
                    y: pA.y + (pB.y - pA.y) * segProgress
                };
            }
            accDist += segLengths[i];
        }
        const lastP = points[points.length - 1];
        return { x: lastP.xR * width, y: lastP.yR * height };
    }

    function drawConduitPath(ch) {
        ctx.save();
        ctx.beginPath();
        ch.points.forEach((pt, idx) => {
            const px = pt.xR * width;
            const py = pt.yR * height;
            if (idx === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        });
        ctx.strokeStyle = ch.glowColor;
        ctx.lineWidth = ch.width + 4;
        ctx.lineJoin = 'miter';
        ctx.stroke();

        ctx.strokeStyle = ch.color;
        ctx.lineWidth = ch.width;
        ctx.shadowColor = ch.color;
        ctx.shadowBlur = 8;
        ctx.stroke();
        ctx.shadowBlur = 0;

        ch.pulses.forEach((pVal) => {
            const prog = (pVal + tick * ch.speed) % 1.0;
            const pt = getPointAlongPath(ch.points, prog);
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, ch.width * 1.3, 0, Math.PI * 2);
            ctx.fillStyle = '#ffffff';
            ctx.shadowColor = ch.color;
            ctx.shadowBlur = 12;
            ctx.fill();
        });

        const startP = ch.points[0];
        ctx.fillStyle = ch.color;
        ctx.font = '7px JetBrains Mono, monospace';
        ctx.fillText(ch.name, startP.xR * width + 6, startP.yR * height + 10);
        ctx.restore();
    }

    function drawUtilityNode(node) {
        const nx = node.xR * width;
        const ny = node.yR * height;
        ctx.save();
        const pulse = (Math.sin(tick * 3.5 + node.xR * 20) + 1) * 0.5;

        if (node.type === 'electric') {
            ctx.fillStyle = 'rgba(251, 191, 36, 0.15)';
            ctx.strokeStyle = node.color;
            ctx.lineWidth = 1.2;
            ctx.strokeRect(nx - 7, ny - 7, 14, 14);
            ctx.fillRect(nx - 7, ny - 7, 14, 14);
            ctx.beginPath();
            ctx.arc(nx, ny, 2.5 + pulse * 1.5, 0, Math.PI * 2);
            ctx.fillStyle = '#ffffff';
            ctx.shadowColor = '#fbbf24';
            ctx.shadowBlur = 10;
            ctx.fill();
        } else {
            ctx.beginPath();
            ctx.arc(nx, ny, 4.5 + pulse * 3, 0, Math.PI * 2);
            ctx.strokeStyle = node.color;
            ctx.lineWidth = 1;
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(nx, ny, 3.5, 0, Math.PI * 2);
            ctx.fillStyle = '#ffffff';
            ctx.shadowColor = node.color;
            ctx.shadowBlur = 8;
            ctx.fill();
        }

        ctx.fillStyle = '#ffffff';
        ctx.font = '8px JetBrains Mono, monospace';
        ctx.fillText(node.label, nx + 9, ny - 2);
        ctx.fillStyle = node.color;
        ctx.font = '7px JetBrains Mono, monospace';
        ctx.fillText(node.desc, nx + 9, ny + 8);
        ctx.restore();
    }

    function drawHoloBuilding(b) {
        const bx = b.xR * width;
        const by = b.yR * height;
        const bw = b.w;
        const bh = b.h;
        const isoX = bw * 0.5;
        const isoY = bw * 0.25;

        ctx.save();
        ctx.strokeStyle = b.color;
        ctx.lineWidth = 1;
        ctx.fillStyle = 'rgba(8, 14, 28, 0.4)';

        ctx.beginPath();
        ctx.moveTo(bx, by);
        ctx.lineTo(bx + bw, by);
        ctx.lineTo(bx + bw, by - bh);
        ctx.lineTo(bx, by - bh);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(bx, by - bh);
        ctx.lineTo(bx + bw, by - bh);
        ctx.lineTo(bx + bw + isoX, by - bh - isoY);
        ctx.lineTo(bx + isoX, by - bh - isoY);
        ctx.closePath();
        ctx.fillStyle = 'rgba(56, 189, 248, 0.04)';
        ctx.fill();
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(bx + bw, by);
        ctx.lineTo(bx + bw + isoX, by - isoY);
        ctx.lineTo(bx + bw + isoX, by - bh - isoY);
        ctx.lineTo(bx + bw, by - bh);
        ctx.closePath();
        ctx.fillStyle = 'rgba(37, 99, 235, 0.03)';
        ctx.fill();
        ctx.stroke();

        const floorH = bh / b.floors;
        for (let f = 1; f < b.floors; f++) {
            const fy = by - f * floorH;
            ctx.beginPath();
            ctx.moveTo(bx, fy);
            ctx.lineTo(bx + bw, fy);
            ctx.lineTo(bx + bw + isoX, fy - isoY);
            ctx.strokeStyle = 'rgba(56, 189, 248, 0.08)';
            ctx.stroke();
        }

        ctx.beginPath();
        ctx.moveTo(bx, by);
        ctx.lineTo(bx, by + 16);
        ctx.lineTo(bx + bw, by + 16);
        ctx.lineTo(bx + bw, by);
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
        ctx.stroke();

        ctx.fillStyle = '#38bdf8';
        ctx.font = '8px JetBrains Mono, monospace';
        ctx.fillText(b.name, bx + 6, by - bh + 14);

        if (b.spire > 0) {
            const topCenterX = bx + bw * 0.5 + isoX * 0.5;
            const topCenterY = by - bh - isoY * 0.5;
            ctx.beginPath();
            ctx.moveTo(topCenterX, topCenterY);
            ctx.lineTo(topCenterX, topCenterY - b.spire);
            ctx.strokeStyle = '#38bdf8';
            ctx.lineWidth = 1.2;
            ctx.stroke();

            const pulse = (Math.sin(tick * 4 + b.xR * 20) + 1) * 0.5;
            ctx.beginPath();
            ctx.arc(topCenterX, topCenterY - b.spire, 1.8 + pulse * 2, 0, Math.PI * 2);
            ctx.fillStyle = pulse > 0.4 ? '#38bdf8' : '#fbbf24';
            ctx.shadowColor = '#38bdf8';
            ctx.shadowBlur = 10;
            ctx.fill();
        }
        ctx.restore();
    }

    function drawCrane(c) {
        const cx = c.bxR * width + 40;
        const cy = c.byR * height - c.bh - 15;
        const mastH = 45;
        const armRot = Math.sin(tick * 0.5 + c.bxR * 10) * 0.4;

        ctx.save();
        ctx.strokeStyle = c.color;
        ctx.lineWidth = 1;

        ctx.beginPath();
        ctx.moveTo(cx - 3, cy);
        ctx.lineTo(cx - 3, cy - mastH);
        ctx.lineTo(cx + 3, cy - mastH);
        ctx.lineTo(cx + 3, cy);
        ctx.stroke();

        for (let y = cy; y > cy - mastH; y -= 8) {
            ctx.beginPath();
            ctx.moveTo(cx - 3, y);
            ctx.lineTo(cx + 3, y - 8);
            ctx.stroke();
        }

        const armEndX = cx + Math.cos(armRot) * c.armLen;
        const armEndY = cy - mastH + Math.sin(armRot) * (c.armLen * 0.2);
        const counterEndX = cx - Math.cos(armRot) * (c.armLen * 0.35);
        const counterEndY = cy - mastH - Math.sin(armRot) * (c.armLen * 0.1);

        ctx.beginPath();
        ctx.moveTo(counterEndX, counterEndY);
        ctx.lineTo(armEndX, armEndY);
        ctx.stroke();

        const apexY = cy - mastH - 12;
        ctx.beginPath();
        ctx.arc(cx, apexY, 2, 0, Math.PI * 2);
        ctx.fillStyle = '#fbbf24';
        ctx.shadowColor = '#fbbf24';
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.restore();
    }

    function render() {
        tick += 0.016;

        mouse.x += (mouse.targetX - mouse.x) * 0.08;
        mouse.y += (mouse.targetY - mouse.y) * 0.08;

        ctx.clearRect(0, 0, width, height);

        // 1. Deep Sapphire Base
        const baseGrad = ctx.createRadialGradient(
            width * 0.5, height * 0.42, 60,
            width * 0.5, height * 0.5, Math.max(width, height) * 0.95
        );
        baseGrad.addColorStop(0, '#0c142c');
        baseGrad.addColorStop(0.35, '#080d1e');
        baseGrad.addColorStop(0.75, '#040712');
        baseGrad.addColorStop(1, '#020308');
        ctx.fillStyle = baseGrad;
        ctx.fillRect(0, 0, width, height);

        // 2. City Buildings & Cranes
        cityBuildings.forEach(b => drawHoloBuilding(b));
        cranes.forEach(c => drawCrane(c));

        // 3. Complete Water Labyrinth & Electric Grid (All Buildings Connected)
        waterLabyrinth.forEach(ch => drawConduitPath(ch));
        electricGrid.forEach(eg => drawConduitPath(eg));
        utilityNodes.forEach(node => drawUtilityNode(node));

        // 4. Blueprint Elevation Grid
        ctx.save();
        ctx.lineWidth = 0.8;
        const rows = 16;
        const cols = 22;
        const gridStartX = -width * 0.1;
        const gridEndX = width * 1.1;
        const gridStartY = height * 0.52;
        const gridEndY = height * 1.12;

        for (let c = 0; c <= cols; c++) {
            const colPercent = c / cols;
            const x = gridStartX + (gridEndX - gridStartX) * colPercent;
            ctx.beginPath();
            for (let r = 0; r <= rows; r++) {
                const rowPercent = r / rows;
                const y = gridStartY + (gridEndY - gridStartY) * rowPercent;
                const wave = Math.sin(colPercent * 5 + tick * 0.8) * Math.cos(rowPercent * 4 - tick * 0.6) * 16;
                const perspectiveScale = 0.5 + rowPercent * 0.7;
                const projX = width * 0.5 + (x - width * 0.5) * perspectiveScale;
                const projY = y + wave * perspectiveScale;
                if (r === 0) ctx.moveTo(projX, projY);
                else ctx.lineTo(projX, projY);
            }
            const alpha = Math.max(0.02, (1 - Math.abs(colPercent - 0.5) * 1.2) * 0.10);
            ctx.strokeStyle = `rgba(56, 189, 248, ${alpha})`;
            ctx.stroke();
        }

        for (let r = 0; r <= rows; r++) {
            const rowPercent = r / rows;
            const y = gridStartY + (gridEndY - gridStartY) * rowPercent;
            const perspectiveScale = 0.5 + rowPercent * 0.7;
            ctx.beginPath();
            for (let c = 0; c <= cols; c++) {
                const colPercent = c / cols;
                const x = gridStartX + (gridEndX - gridStartX) * colPercent;
                const wave = Math.sin(colPercent * 5 + tick * 0.8) * Math.cos(rowPercent * 4 - tick * 0.6) * 16;
                const projX = width * 0.5 + (x - width * 0.5) * perspectiveScale;
                const projY = y + wave * perspectiveScale;
                if (c === 0) ctx.moveTo(projX, projY);
                else ctx.lineTo(projX, projY);
            }
            ctx.strokeStyle = `rgba(37, 99, 235, ${0.02 + rowPercent * 0.08})`;
            ctx.stroke();
        }
        ctx.restore();

        // 5. Comets
        spawnComet();
        for (let i = comets.length - 1; i >= 0; i--) {
            const c = comets[i];
            c.x += c.vx;
            c.y += c.vy;
            c.alpha *= 0.98;
            const tailX = c.x - c.vx * 8;
            const tailY = c.y - c.vy * 8;
            const grad = ctx.createLinearGradient(c.x, c.y, tailX, tailY);
            grad.addColorStop(0, c.color);
            grad.addColorStop(1, 'transparent');
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(c.x, c.y);
            ctx.lineTo(tailX, tailY);
            ctx.strokeStyle = grad;
            ctx.lineWidth = 2.0;
            ctx.shadowColor = c.color;
            ctx.shadowBlur = 12;
            ctx.stroke();
            ctx.restore();
            if (c.y > height + 50 || c.alpha < 0.05) comets.splice(i, 1);
        }

        // 6. Shockwaves
        mouse.shockwaves.forEach((sw, idx) => {
            sw.radius += sw.speed;
            sw.alpha *= 0.96;
            if (sw.alpha > 0.01) {
                ctx.save();
                ctx.beginPath();
                ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
                ctx.strokeStyle = `rgba(56, 189, 248, ${sw.alpha})`;
                ctx.lineWidth = 2.2;
                ctx.shadowColor = '#38bdf8';
                ctx.shadowBlur = 16;
                ctx.stroke();
                ctx.restore();
            } else {
                mouse.shockwaves.splice(idx, 1);
            }
        });

        // 7. Particles and Quantum Trusses
        for (let i = 0; i < particles.length; i++) {
            const p = particles[i];
            p.pulseVal += p.pulseSpeed;
            p.x += p.vx;
            p.y += p.vy;

            if (p.x < 0) p.x = width;
            if (p.x > width) p.x = 0;
            if (p.y < 0) p.y = height;
            if (p.y > height) p.y = 0;

            const mDist = Math.hypot(p.x - mouse.x, p.y - mouse.y);
            if (mDist < 200) {
                const force = (1 - mDist / 200) * 1.0;
                p.x += (mouse.x - p.x) * force * 0.04;
                p.y += (mouse.y - p.y) * force * 0.04;
                if (mDist < 120) {
                    ctx.beginPath();
                    ctx.moveTo(p.x, p.y);
                    ctx.lineTo(mouse.x, mouse.y);
                    ctx.strokeStyle = `rgba(56, 189, 248, ${(1 - mDist / 120) * 0.45})`;
                    ctx.lineWidth = 0.8;
                    ctx.stroke();
                }
            }

            const pRad = p.radius + Math.sin(p.pulseVal) * 0.6;
            ctx.save();
            ctx.beginPath();
            ctx.arc(p.x, p.y, Math.max(0.6, pRad), 0, Math.PI * 2);
            ctx.fillStyle = p.color;
            ctx.shadowColor = p.color;
            ctx.shadowBlur = pRad > 1.8 ? 10 : 0;
            ctx.fill();
            ctx.restore();

            for (let j = i + 1; j < particles.length; j++) {
                const p2 = particles[j];
                const dist = Math.hypot(p.x - p2.x, p.y - p2.y);
                if (dist < 80) {
                    const lineAlpha = (1 - dist / 80) * 0.20;
                    ctx.beginPath();
                    ctx.moveTo(p.x, p.y);
                    ctx.lineTo(p2.x, p2.y);
                    ctx.strokeStyle = `rgba(56, 189, 248, ${lineAlpha})`;
                    ctx.lineWidth = 0.6;
                    ctx.stroke();
                }
            }
        }

        requestAnimationFrame(render);
    }
    render();
}
});
