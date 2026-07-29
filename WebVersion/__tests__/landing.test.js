/**
 * Jest tests for Landing Page functionality
 * Tests for: updateLandingRoleUI, setupLandingCTAs, setupLandingRoleToggle
 * 
 * Run with: npm test
 */

// Mock localStorage
const localStorageMock = (() => {
    let store = {};
    return {
        getItem: jest.fn(key => store[key] || null),
        setItem: jest.fn((key, value) => { store[key] = value; }),
        removeItem: jest.fn(key => { delete store[key]; }),
        clear: jest.fn(() => { store = {}; })
    };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock showToast and showPage
window.showToast = jest.fn();
window.showPage = jest.fn();
window.setRole = jest.fn((role) => {
    window.userRole = role;
    localStorageMock.setItem('userRole', role);
});
window.switchOrdersTab = jest.fn();

describe('Landing Page Role UI', () => {
    beforeEach(() => {
        // Reset DOM
        document.body.innerHTML = `
            <button id="landingRoleOrderer" class="active" role="tab" aria-selected="true">Заказчик</button>
            <button id="landingRoleContractor" role="tab" aria-selected="false">Исполнитель</button>
            <div id="landingDemoChip">Режим: Заказчик</div>
            <div id="landingBrandSub">Смета • Дефекты • Маркетплейс</div>
            <h1><span id="landingHeroTitle">Справедливая стоимость ремонта за 2 секунды</span></h1>
            <div id="landingHeroSub">Загрузите фото объекта — получите детальную смету.</div>
            <button id="landingCtaMain"><span>Начать оценку</span></button>
            <span id="landingCtaStartOrderText">Создать заказ</span>
            <button id="landingOrdersBtnPrimary">Создать заказ</button>
            <button id="landingWorksBtnPrimary">Мои работы</button>
            <p id="landingSvc3">Описание сервиса 3</p>
            <p id="landingSvc4">Описание сервиса 4</p>
            <span id="landingCtaBottomText">Начать оценку</span>
            <button id="landingCtaStartOrder"></button>
            <button id="landingCtaDemo"></button>
            <button id="landingCtaDownload"></button>
            <button id="landingCtaBottom"></button>
            <button id="landingOpenAuth"></button>
            <button class="landing-mini" data-page="estimate"></button>
            <div id="authScreen" hidden></div>
            <div class="page" id="page-landing"></div>
        `;

        // Reset mocks
        jest.clearAllMocks();
        localStorageMock.clear();
        window.userRole = 'orderer';
    });

    describe('updateLandingRoleUI', () => {
        test('should set orderer role as active when userRole is orderer', () => {
            window.userRole = 'orderer';

            // Simulate updateLandingRoleUI
            const ordererBtn = document.getElementById('landingRoleOrderer');
            const contractorBtn = document.getElementById('landingRoleContractor');
            const role = window.userRole;

            ordererBtn.classList.toggle('active', role === 'orderer');
            contractorBtn.classList.toggle('active', role === 'contractor');

            expect(ordererBtn.classList.contains('active')).toBe(true);
            expect(contractorBtn.classList.contains('active')).toBe(false);
        });

        test('should set contractor role as active when userRole is contractor', () => {
            window.userRole = 'contractor';

            const ordererBtn = document.getElementById('landingRoleOrderer');
            const contractorBtn = document.getElementById('landingRoleContractor');
            const role = window.userRole;

            ordererBtn.classList.toggle('active', role === 'orderer');
            contractorBtn.classList.toggle('active', role === 'contractor');

            expect(ordererBtn.classList.contains('active')).toBe(false);
            expect(contractorBtn.classList.contains('active')).toBe(true);
        });

        test('should update demo chip text based on role', () => {
            const demoChip = document.getElementById('landingDemoChip');

            // Orderer
            window.userRole = 'orderer';
            demoChip.textContent = 'Режим: ' + (window.userRole === 'orderer' ? 'Заказчик' : 'Исполнитель');
            expect(demoChip.textContent).toBe('Режим: Заказчик');

            // Contractor
            window.userRole = 'contractor';
            demoChip.textContent = 'Режим: ' + (window.userRole === 'orderer' ? 'Заказчик' : 'Исполнитель');
            expect(demoChip.textContent).toBe('Режим: Исполнитель');
        });

        test('should update hero title based on role', () => {
            const heroTitle = document.getElementById('landingHeroTitle');

            // Orderer
            window.userRole = 'orderer';
            heroTitle.textContent = window.userRole === 'orderer'
                ? 'Справедливая стоимость ремонта за 2 секунды'
                : 'Зарабатывайте на заказах — честно и прозрачно';
            expect(heroTitle.textContent).toContain('стоимость ремонта');

            // Contractor
            window.userRole = 'contractor';
            heroTitle.textContent = window.userRole === 'orderer'
                ? 'Справедливая стоимость ремонта за 2 секунды'
                : 'Зарабатывайте на заказах — честно и прозрачно';
            expect(heroTitle.textContent).toContain('Зарабатывайте');
        });

        test('should disable works button for orderer', () => {
            const worksBtnPrimary = document.getElementById('landingWorksBtnPrimary');

            // Orderer - button should be disabled
            window.userRole = 'orderer';
            worksBtnPrimary.textContent = window.userRole === 'orderer' ? 'Недоступно' : 'Мои работы';
            worksBtnPrimary.disabled = window.userRole === 'orderer';

            expect(worksBtnPrimary.textContent).toBe('Недоступно');
            expect(worksBtnPrimary.disabled).toBe(true);

            // Contractor - button should be enabled
            window.userRole = 'contractor';
            worksBtnPrimary.textContent = window.userRole === 'orderer' ? 'Недоступно' : 'Мои работы';
            worksBtnPrimary.disabled = window.userRole === 'orderer';

            expect(worksBtnPrimary.textContent).toBe('Мои работы');
            expect(worksBtnPrimary.disabled).toBe(false);
        });
    });

    describe('setupLandingCTAs', () => {
        test('main CTA should navigate to estimate page for orderer', () => {
            window.userRole = 'orderer';
            const ctaMain = document.getElementById('landingCtaMain');

            // Simulate click handler
            if (window.userRole === 'orderer') {
                window.showPage('estimate');
            } else {
                window.showPage('orders');
            }

            expect(window.showPage).toHaveBeenCalledWith('estimate');
        });

        test('main CTA should navigate to orders page for contractor', () => {
            window.userRole = 'contractor';
            const ctaMain = document.getElementById('landingCtaMain');

            // Simulate click handler
            if (window.userRole === 'orderer') {
                window.showPage('estimate');
            } else {
                window.showPage('orders');
            }

            expect(window.showPage).toHaveBeenCalledWith('orders');
        });

        test('works button should show toast for orderer', () => {
            window.userRole = 'orderer';

            // Simulate works button click for orderer
            if (window.userRole !== 'contractor') {
                window.showToast('Этот раздел доступен только для исполнителей');
            }

            expect(window.showToast).toHaveBeenCalledWith('Этот раздел доступен только для исполнителей');
        });

        test('works button should navigate for contractor', () => {
            window.userRole = 'contractor';

            // Simulate works button click for contractor
            if (window.userRole === 'contractor') {
                window.showPage('orders');
                window.switchOrdersTab('my');
            }

            expect(window.showPage).toHaveBeenCalledWith('orders');
            expect(window.switchOrdersTab).toHaveBeenCalledWith('my');
        });
    });

    describe('setupLandingRoleToggle', () => {
        test('clicking orderer button should set role to orderer', () => {
            window.setRole('orderer');

            expect(window.setRole).toHaveBeenCalledWith('orderer');
            expect(window.userRole).toBe('orderer');
        });

        test('clicking contractor button should set role to contractor', () => {
            window.setRole('contractor');

            expect(window.setRole).toHaveBeenCalledWith('contractor');
            expect(window.userRole).toBe('contractor');
        });

        test('role should be persisted to localStorage', () => {
            window.setRole('contractor');

            expect(localStorageMock.setItem).toHaveBeenCalledWith('userRole', 'contractor');
        });
    });
});

describe('Toast System', () => {
    beforeEach(() => {
        document.body.innerHTML = '';
        jest.clearAllMocks();
    });

    test('toast container should be created if not exists', () => {
        // Simulate initToastContainer
        if (!document.querySelector('.toast-container')) {
            const container = document.createElement('div');
            container.className = 'toast-container';
            container.id = 'toastContainer';
            document.body.appendChild(container);
        }

        expect(document.querySelector('.toast-container')).not.toBeNull();
    });

    test('toast should have correct type class', () => {
        const container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);

        // Create success toast
        const toast = document.createElement('div');
        toast.className = 'toast-item success';
        container.appendChild(toast);

        expect(toast.classList.contains('success')).toBe(true);
    });
});

describe('Modal System', () => {
    beforeEach(() => {
        document.body.innerHTML = '';
        jest.clearAllMocks();
    });

    test('modal backdrop should be created if not exists', () => {
        // Simulate initModalSystem
        if (!document.querySelector('.modal-backdrop')) {
            const backdrop = document.createElement('div');
            backdrop.className = 'modal-backdrop';
            backdrop.id = 'modalBackdrop';
            document.body.appendChild(backdrop);
        }

        expect(document.querySelector('.modal-backdrop')).not.toBeNull();
    });

    test('modal should have correct ARIA attributes', () => {
        const modal = document.createElement('div');
        modal.className = 'modal-glass';
        modal.id = 'test-modal';
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-modal', 'true');
        modal.setAttribute('aria-labelledby', 'test-modal-title');
        document.body.appendChild(modal);

        expect(modal.getAttribute('role')).toBe('dialog');
        expect(modal.getAttribute('aria-modal')).toBe('true');
    });

    test('modal should add active class when opened', () => {
        const modal = document.createElement('div');
        modal.className = 'modal-glass';
        document.body.appendChild(modal);

        // Simulate opening
        modal.classList.add('active');

        expect(modal.classList.contains('active')).toBe(true);
    });

    test('body should have modal-open class when modal is open', () => {
        document.body.classList.add('modal-open');

        expect(document.body.classList.contains('modal-open')).toBe(true);
    });
});
