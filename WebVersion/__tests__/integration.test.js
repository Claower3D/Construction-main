/**
 * Integration Test Suite - Browser-based E2E Testing
 * Полный интеграционный тест приложения QAZGOST AI
 * 
 * Run with: npm test -- integration.test.js
 */

// Mock localStorage
const localStorageMock = (() => {
    let store = {};
    const mock = {
        getItem: jest.fn(key => store[key] || null),
        setItem: jest.fn((key, value) => { store[key] = String(value); }),
        removeItem: jest.fn(key => { delete store[key]; }),
        clear: jest.fn(() => { store = {}; }),
        get _store() { return store; },
    };
    return mock;
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock window functions
window.showToast = jest.fn();
window.showEnhancedToast = jest.fn();
window.showPage = jest.fn();
window.logEvent = jest.fn();
window.updateGlobalRoleUI = jest.fn();
window.updateNavigationForRole = jest.fn();
window.updateLandingRoleUI = jest.fn();
window.dispatchEvent = jest.fn();

// Mock fetch для apiService (не ломает тесты если нет бэкенда)
global.fetch = jest.fn(() =>
    Promise.resolve({
        ok: false,
        status: 503,
        json: () => Promise.resolve({ error: 'backend not running' })
    })
);

// Load all modules in correct order
beforeAll(() => {
    const fs = require('fs');
    const path = require('path');

    const load = (file) => {
        const code = fs.readFileSync(
            path.resolve(__dirname, '..', file), 'utf-8'
        );
        eval(code);
    };

    load('models.js');
    load('roleManager.js');
    load('services.js');
    load('statusMachine.js');
    load('dataService.js');
});

beforeEach(() => {
    jest.clearAllMocks();
    // Restore mock implementations after clearAllMocks
    localStorageMock.getItem.mockImplementation(key => {
        const store = localStorageMock._store;
        return store[key] || null;
    });
    localStorageMock.setItem.mockImplementation((key, value) => {
        localStorageMock._store[key] = String(value);
    });
    localStorageMock.removeItem.mockImplementation(key => {
        delete localStorageMock._store[key];
    });
    localStorageMock.clear.mockImplementation(() => {
        Object.keys(localStorageMock._store).forEach(k => delete localStorageMock._store[k]);
    });
    localStorageMock.clear();

    if (window.RoleManager) {
        window.RoleManager.switchTo('customer', { showToast: false, updateUI: false });
        window.RoleManager.setRoles(['customer']);
    }
});

// ===== ИНТЕГРАЦИОННЫЕ ТЕСТЫ =====

describe('INT-1: Полный цикл роли Заказчик → Исполнитель → Инженер', () => {
    test('начальное состояние — Заказчик', () => {
        expect(window.RoleManager.current()).toBe('customer');
        expect(window.RoleManager.currentUI()).toBe('orderer');
        expect(window.userRole).toBe('orderer');
    });

    test('переключение на Исполнителя через UI', () => {
        window.setRole('contractor');

        expect(window.RoleManager.current()).toBe('executor');
        expect(window.RoleManager.currentUI()).toBe('contractor');
        expect(window.userRole).toBe('contractor');
    });

    test('переключение на Инженера через UI', () => {
        window.setRole('engineer');

        expect(window.RoleManager.current()).toBe('engineer');
        expect(window.RoleManager.currentUI()).toBe('engineer');
        expect(window.userRole).toBe('engineer');
    });

    test('переключение через каноничные имена', () => {
        window.switchRole('executor');
        expect(window.RoleManager.current()).toBe('executor');

        window.switchRole('customer');
        expect(window.RoleManager.current()).toBe('customer');
    });
});

describe('INT-2: Синхронизация Auth ↔ RoleManager', () => {
    test('Auth.getCurrentRole === RoleManager.current', () => {
        window.RoleManager.switchTo('engineer', { showToast: false, updateUI: false });
        expect(window.AppServices.Auth.getCurrentRole()).toBe(window.RoleManager.current());
    });

    test('Auth.getAllRoles === RoleManager.allRoles', () => {
        window.RoleManager.setRoles(['customer', 'executor', 'engineer']);
        expect(window.AppServices.Auth.getAllRoles()).toEqual(window.RoleManager.allRoles());
    });

    test('Auth.hasRole делегирует в RoleManager', () => {
        window.RoleManager.setRoles(['customer', 'executor']);
        expect(window.AppServices.Auth.hasRole('executor')).toBe(true);
        expect(window.AppServices.Auth.hasRole('admin')).toBe(false);
    });

    test('Auth.switchRole меняет RoleManager', () => {
        window.AppServices.Auth.switchRole('contractor');
        expect(window.RoleManager.current()).toBe('executor');
    });

    test('Auth.grantAllRoles → RoleManager.hasAllRoles', () => {
        window.AppServices.Auth.grantAllRoles();
        expect(window.RoleManager.hasAllRoles()).toBe(true);
    });
});

describe('INT-3: DataService + RoleManager интеграция', () => {
    test('DataService должен быть загружен', () => {
        expect(window.DataService).toBeDefined();
    });

    test('DataService.setUserRole работает', () => {
        expect(typeof window.DataService.setUserRole).toBe('function');
    });

    test('canAccessCustomerFeatures - для customer', () => {
        window.RoleManager.switchTo('customer', { showToast: false, updateUI: false });
        window.RoleManager.setRoles(['customer']);
        expect(window.DataService.canAccessCustomerFeatures()).toBe(true);
    });

    test('canAccessExecutorFeatures - для executor', () => {
        window.RoleManager.switchTo('executor', { showToast: false, updateUI: false });
        window.RoleManager.setRoles(['executor']);
        expect(window.DataService.canAccessExecutorFeatures()).toBe(true);
    });

    test('canAccessEngineerFeatures - для engineer', () => {
        window.RoleManager.switchTo('engineer', { showToast: false, updateUI: false });
        window.RoleManager.setRoles(['engineer']);
        expect(window.DataService.canAccessEngineerFeatures()).toBe(true);
    });

    test('grantAllRoles → доступ ко всем функциям', () => {
        window.RoleManager.grantAllRoles();
        expect(window.DataService.canAccessCustomerFeatures()).toBe(true);
        expect(window.DataService.canAccessExecutorFeatures()).toBe(true);
        expect(window.DataService.canAccessEngineerFeatures()).toBe(true);
    });
});

describe('INT-4: localStorage консистентность', () => {
    test('после switchTo данные в localStorage синхронизированы', () => {
        window.RoleManager.switchTo('contractor', { showToast: false, updateUI: false });

        expect(localStorageMock.setItem).toHaveBeenCalledWith('selectedRole', 'executor');
        expect(localStorageMock.setItem).toHaveBeenCalledWith('userRole', 'contractor');
    });

    test('после grantAllRoles роли сохранены', () => {
        window.RoleManager.grantAllRoles();

        expect(localStorageMock.setItem).toHaveBeenCalledWith(
            'userRoles',
            JSON.stringify(['customer', 'executor', 'engineer', 'controller', 'admin', 'manager'])
        );
    });
});

describe('INT-5: Защита от рекурсии', () => {
    test('setRole → RoleManager.switchTo → НЕ вызывает setRole снова', () => {
        const callCount = { value: 0 };
        const originalSetRole = window.setRole;

        // Перехватываем setRole, чтобы считать вызовы
        window.setRole = function (role) {
            callCount.value++;
            if (callCount.value > 5) {
                throw new Error('INFINITE LOOP DETECTED!');
            }
            originalSetRole(role);
        };

        window.setRole('contractor');
        expect(callCount.value).toBeLessThanOrEqual(2); // максимум 2 — прямой + обратный
        expect(window.RoleManager.current()).toBe('executor');

        window.setRole = originalSetRole;
    });

    test('switchRole → RoleManager.switchTo → НЕ вызывает switchRole снова', () => {
        const callCount = { value: 0 };
        const originalSwitchRole = window.switchRole;

        window.switchRole = function (role) {
            callCount.value++;
            if (callCount.value > 5) {
                throw new Error('INFINITE LOOP DETECTED!');
            }
            originalSwitchRole(role);
        };

        window.switchRole('executor');
        expect(callCount.value).toBeLessThanOrEqual(2);

        window.switchRole = originalSwitchRole;
    });
});

describe('INT-6: Маппинг ролей End-to-End', () => {
    const mappings = [
        { input: 'orderer', canonical: 'customer', ui: 'orderer', label: 'Заказчик' },
        { input: 'contractor', canonical: 'executor', ui: 'contractor', label: 'Исполнитель' },
        { input: 'customer', canonical: 'customer', ui: 'orderer', label: 'Заказчик' },
        { input: 'executor', canonical: 'executor', ui: 'contractor', label: 'Исполнитель' },
        { input: 'engineer', canonical: 'engineer', ui: 'engineer', label: 'Инженер' },
        { input: 'admin', canonical: 'admin', ui: 'admin', label: 'Администратор' },
    ];

    mappings.forEach(({ input, canonical, ui, label }) => {
        test(`"${input}" → canonical="${canonical}", UI="${ui}", label="${label}"`, () => {
            expect(window.RoleManager.normalize(input)).toBe(canonical);
            expect(window.RoleManager.toUI(input)).toBe(ui);
            expect(window.RoleManager.label(input)).toBe(label);
        });
    });
});

describe('INT-7: Нет конфликтов глобальных функций', () => {
    test('window.setRole определена и работает', () => {
        expect(typeof window.setRole).toBe('function');
        window.setRole('orderer');
        expect(window.RoleManager.current()).toBe('customer');
    });

    test('window.switchRole определена и работает', () => {
        expect(typeof window.switchRole).toBe('function');
        window.switchRole('executor');
        expect(window.RoleManager.current()).toBe('executor');
    });

    test('window.getCurrentRole определена и работает', () => {
        expect(typeof window.getCurrentRole).toBe('function');
        window.RoleManager.switchTo('engineer', { showToast: false, updateUI: false });
        expect(window.getCurrentRole()).toBe('engineer');
    });

    test('window.grantAllRoles определена и работает', () => {
        expect(typeof window.grantAllRoles).toBe('function');
        window.grantAllRoles();
        expect(window.RoleManager.hasAllRoles()).toBe(true);
    });

    test('window.getAllRoles определена и работает', () => {
        expect(typeof window.getAllRoles).toBe('function');
        window.RoleManager.setRoles(['customer', 'executor']);
        expect(window.getAllRoles()).toEqual(['customer', 'executor']);
    });

    test('window.hasRole определена и работает', () => {
        expect(typeof window.hasRole).toBe('function');
        window.RoleManager.setRoles(['customer']);
        expect(window.hasRole('customer')).toBe(true);
        expect(window.hasRole('admin')).toBe(false);
    });
});
