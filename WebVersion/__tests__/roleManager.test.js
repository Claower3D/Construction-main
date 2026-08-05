/**
 * Jest tests for RoleManager v1.0
 * Тесты системы управления ролями
 * 
 * Run with: npm test -- roleManager.test.js
 */

// ===== Mock localStorage =====
const localStorageMock = (() => {
    let store = {};
    return {
        getItem: jest.fn(key => store[key] || null),
        setItem: jest.fn((key, value) => { store[key] = String(value); }),
        removeItem: jest.fn(key => { delete store[key]; }),
        clear: jest.fn(() => { store = {}; }),
        _getStore: () => store
    };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// ===== Mock window functions =====
window.showToast = jest.fn();
window.showPage = jest.fn();
window.logEvent = jest.fn();
window.dispatchEvent = jest.fn();

// ===== Load RoleManager =====
beforeAll(() => {
    // RoleManager загружается как IIFE, нужен eval
    const fs = require('fs');
    const path = require('path');
    const code = fs.readFileSync(
        path.resolve(__dirname, '..', 'roleManager.js'), 'utf-8'
    );
    eval(code);
});

beforeEach(() => {
    jest.clearAllMocks();
    // Restore mock implementations after clearAllMocks
    localStorageMock.getItem.mockImplementation(key => localStorageMock._getStore()[key] || null);
    localStorageMock.setItem.mockImplementation((key, value) => { localStorageMock._getStore()[key] = String(value); });
    localStorageMock.removeItem.mockImplementation(key => { delete localStorageMock._getStore()[key]; });
    localStorageMock.clear.mockImplementation(() => {
        const s = localStorageMock._getStore();
        Object.keys(s).forEach(k => delete s[k]);
    });
    localStorageMock.clear();
    // Сбрасываем состояние RoleManager
    if (window.RoleManager) {
        window.RoleManager.switchTo('customer', { showToast: false, updateUI: false });
        window.RoleManager.setRoles(['customer']);
    }
});

// ===== ТЕСТЫ =====

describe('RoleManager - Загрузка', () => {
    test('должен экспортировать RoleManager в window', () => {
        expect(window.RoleManager).toBeDefined();
    });

    test('должен иметь все необходимые методы', () => {
        const rm = window.RoleManager;
        expect(typeof rm.switchTo).toBe('function');
        expect(typeof rm.current).toBe('function');
        expect(typeof rm.currentUI).toBe('function');
        expect(typeof rm.normalize).toBe('function');
        expect(typeof rm.toUI).toBe('function');
        expect(typeof rm.label).toBe('function');
        expect(typeof rm.hasRole).toBe('function');
        expect(typeof rm.hasAllRoles).toBe('function');
        expect(typeof rm.grantAllRoles).toBe('function');
        expect(typeof rm.allRoles).toBe('function');
        expect(typeof rm.isCustomer).toBe('function');
        expect(typeof rm.isExecutor).toBe('function');
        expect(typeof rm.isEngineer).toBe('function');
        expect(typeof rm.isAdmin).toBe('function');
        expect(typeof rm.setRole).toBe('function');
        expect(typeof rm.toggleRole).toBe('function');
        expect(typeof rm.init).toBe('function');
    });

    test('должен экспортировать константы Role', () => {
        const rm = window.RoleManager;
        expect(rm.Role).toBeDefined();
        expect(rm.Role.CUSTOMER).toBe('customer');
        expect(rm.Role.EXECUTOR).toBe('executor');
        expect(rm.Role.ENGINEER).toBe('engineer');
        expect(rm.Role.CONTROLLER).toBe('controller');
        expect(rm.Role.ADMIN).toBe('admin');
    });

    test('должен экспортировать глобальные алиасы', () => {
        expect(typeof window.setRole).toBe('function');
        expect(typeof window.grantAllRoles).toBe('function');
        expect(typeof window.hasRole).toBe('function');
        expect(typeof window.hasAllRoles).toBe('function');
        expect(typeof window.getAllRoles).toBe('function');
        expect(typeof window.getCurrentRole).toBe('function');
        expect(typeof window.updateNavigationForRole).toBe('function');
    });
});

describe('RoleManager - Нормализация ролей', () => {
    test('orderer → customer', () => {
        expect(window.RoleManager.normalize('orderer')).toBe('customer');
    });

    test('contractor → executor', () => {
        expect(window.RoleManager.normalize('contractor')).toBe('executor');
    });

    test('engineer → engineer', () => {
        expect(window.RoleManager.normalize('engineer')).toBe('engineer');
    });

    test('customer → customer (без изменений)', () => {
        expect(window.RoleManager.normalize('customer')).toBe('customer');
    });

    test('executor → executor (без изменений)', () => {
        expect(window.RoleManager.normalize('executor')).toBe('executor');
    });

    test('admin → admin', () => {
        expect(window.RoleManager.normalize('admin')).toBe('admin');
    });

    test('controller → controller', () => {
        expect(window.RoleManager.normalize('controller')).toBe('controller');
    });

    test('null/undefined → customer (default)', () => {
        expect(window.RoleManager.normalize(null)).toBe('customer');
        expect(window.RoleManager.normalize(undefined)).toBe('customer');
        expect(window.RoleManager.normalize('')).toBe('customer');
    });

    test('неизвестная роль → customer (default)', () => {
        expect(window.RoleManager.normalize('superadmin')).toBe('customer');
        expect(window.RoleManager.normalize('xyz')).toBe('customer');
    });
});

describe('RoleManager - toUI (обратный маппинг)', () => {
    test('customer → orderer', () => {
        expect(window.RoleManager.toUI('customer')).toBe('orderer');
    });

    test('executor → contractor', () => {
        expect(window.RoleManager.toUI('executor')).toBe('contractor');
    });

    test('engineer → engineer', () => {
        expect(window.RoleManager.toUI('engineer')).toBe('engineer');
    });

    test('admin → admin', () => {
        expect(window.RoleManager.toUI('admin')).toBe('admin');
    });

    test('orderer (UI alias) → orderer', () => {
        expect(window.RoleManager.toUI('orderer')).toBe('orderer');
    });

    test('contractor (UI alias) → contractor', () => {
        expect(window.RoleManager.toUI('contractor')).toBe('contractor');
    });
});

describe('RoleManager - label (метки)', () => {
    test('customer → Заказчик', () => {
        expect(window.RoleManager.label('customer')).toBe('Заказчик');
    });

    test('executor → Исполнитель', () => {
        expect(window.RoleManager.label('executor')).toBe('Исполнитель');
    });

    test('orderer → Заказчик (через нормализацию)', () => {
        expect(window.RoleManager.label('orderer')).toBe('Заказчик');
    });

    test('contractor → Исполнитель (через нормализацию)', () => {
        expect(window.RoleManager.label('contractor')).toBe('Исполнитель');
    });

    test('engineer → Инженер', () => {
        expect(window.RoleManager.label('engineer')).toBe('Инженер');
    });

    test('admin → Администратор', () => {
        expect(window.RoleManager.label('admin')).toBe('Администратор');
    });
});

describe('RoleManager - Переключение ролей', () => {
    test('switchTo("contractor") устанавливает роль executor', () => {
        window.RoleManager.switchTo('contractor', { showToast: false, updateUI: false });
        expect(window.RoleManager.current()).toBe('executor');
        expect(window.RoleManager.currentUI()).toBe('contractor');
    });

    test('switchTo("orderer") устанавливает роль customer', () => {
        window.RoleManager.switchTo('orderer', { showToast: false, updateUI: false });
        expect(window.RoleManager.current()).toBe('customer');
        expect(window.RoleManager.currentUI()).toBe('orderer');
    });

    test('switchTo("engineer") устанавливает роль engineer', () => {
        window.RoleManager.switchTo('engineer', { showToast: false, updateUI: false });
        expect(window.RoleManager.current()).toBe('engineer');
        expect(window.RoleManager.currentUI()).toBe('engineer');
    });

    test('switchTo("admin") устанавливает роль admin', () => {
        window.RoleManager.switchTo('admin', { showToast: false, updateUI: false });
        expect(window.RoleManager.current()).toBe('admin');
    });

    test('switchTo сохраняет в localStorage', () => {
        window.RoleManager.switchTo('contractor', { showToast: false, updateUI: false });
        expect(localStorageMock.setItem).toHaveBeenCalledWith('selectedRole', 'executor');
        expect(localStorageMock.setItem).toHaveBeenCalledWith('userRole', 'contractor');
    });

    test('switchTo синхронизирует window.userRole', () => {
        window.RoleManager.switchTo('contractor', { showToast: false, updateUI: false });
        expect(window.userRole).toBe('contractor');
    });

    test('switchTo возвращает true при успехе', () => {
        const result = window.RoleManager.switchTo('engineer', { showToast: false, updateUI: false });
        expect(result).toBe(true);
    });

    test('switchTo с showToast: true показывает тост', () => {
        window.RoleManager.switchTo('contractor', { showToast: true, updateUI: false });
        expect(window.showToast).toHaveBeenCalled();
    });

    test('switchTo с showToast: false НЕ показывает тост', () => {
        window.RoleManager.switchTo('contractor', { showToast: false, updateUI: false });
        expect(window.showToast).not.toHaveBeenCalled();
    });

    test('switchTo НЕ показывает тост если роль не изменилась', () => {
        window.RoleManager.switchTo('customer', { showToast: true, updateUI: false });
        expect(window.showToast).not.toHaveBeenCalled();
    });

    test('switchTo автоматически добавляет роль в список', () => {
        window.RoleManager.switchTo('engineer', { showToast: false, updateUI: false });
        expect(window.RoleManager.allRoles()).toContain('engineer');
    });

    test('switchTo с addRole: false НЕ добавляет роль', () => {
        window.RoleManager.setRoles(['customer']);
        window.RoleManager.switchTo('engineer', { showToast: false, updateUI: false, addRole: false });
        expect(window.RoleManager.allRoles()).not.toContain('engineer');
    });
});

describe('RoleManager - Защита от рекурсии', () => {
    test('switchTo защищён от повторного вызова', () => {
        // Симулируем ситуацию, когда switchTo вызывается внутри обработчика roleChanged
        let callCount = 0;
        const originalDispatch = window.dispatchEvent;
        window.dispatchEvent = jest.fn((event) => {
            callCount++;
            if (callCount <= 1) {
                // Попытка рекурсивного вызова
                const result = window.RoleManager.switchTo('admin', { showToast: false, updateUI: false });
                expect(result).toBe(false); // Должен вернуть false (рекурсия заблокирована)
            }
        });

        window.RoleManager.switchTo('engineer', { showToast: false, updateUI: false });
        expect(callCount).toBe(1); // Только 1 вызов dispatch

        window.dispatchEvent = originalDispatch;
    });
});

describe('RoleManager - Проверщики ролей', () => {
    test('isCustomer() возвращает true для customer', () => {
        window.RoleManager.switchTo('customer', { showToast: false, updateUI: false });
        expect(window.RoleManager.isCustomer()).toBe(true);
        expect(window.RoleManager.isExecutor()).toBe(false);
    });

    test('isExecutor() возвращает true для executor', () => {
        window.RoleManager.switchTo('executor', { showToast: false, updateUI: false });
        expect(window.RoleManager.isExecutor()).toBe(true);
        expect(window.RoleManager.isCustomer()).toBe(false);
    });

    test('isEngineer() возвращает true для engineer', () => {
        window.RoleManager.switchTo('engineer', { showToast: false, updateUI: false });
        expect(window.RoleManager.isEngineer()).toBe(true);
    });

    test('isAdmin() возвращает true для admin', () => {
        window.RoleManager.switchTo('admin', { showToast: false, updateUI: false });
        expect(window.RoleManager.isAdmin()).toBe(true);
    });

    test('isOneOf() проверяет несколько ролей', () => {
        window.RoleManager.switchTo('engineer', { showToast: false, updateUI: false });
        expect(window.RoleManager.isOneOf('customer', 'engineer')).toBe(true);
        expect(window.RoleManager.isOneOf('customer', 'executor')).toBe(false);
    });
});

describe('RoleManager - Управление списком ролей', () => {
    test('hasRole проверяет наличие роли', () => {
        window.RoleManager.setRoles(['customer', 'executor']);
        expect(window.RoleManager.hasRole('customer')).toBe(true);
        expect(window.RoleManager.hasRole('executor')).toBe(true);
        expect(window.RoleManager.hasRole('admin')).toBe(false);
    });

    test('hasRole принимает UI алиасы', () => {
        window.RoleManager.setRoles(['customer', 'executor']);
        expect(window.RoleManager.hasRole('orderer')).toBe(true);
        expect(window.RoleManager.hasRole('contractor')).toBe(true);
    });

    test('allRoles() возвращает копию массива', () => {
        const roles = window.RoleManager.allRoles();
        roles.push('hacker');
        expect(window.RoleManager.allRoles()).not.toContain('hacker');
    });

    test('setRoles устанавливает список ролей', () => {
        window.RoleManager.setRoles(['customer', 'engineer']);
        expect(window.RoleManager.allRoles()).toEqual(['customer', 'engineer']);
    });

    test('setRoles нормализует имена', () => {
        window.RoleManager.setRoles(['orderer', 'contractor']);
        expect(window.RoleManager.allRoles()).toEqual(['customer', 'executor']);
    });
});

describe('RoleManager - grantAllRoles', () => {
    test('grantAllRoles даёт все 6 ролей', () => {
        window.RoleManager.grantAllRoles();
        const roles = window.RoleManager.allRoles();
        expect(roles).toContain('customer');
        expect(roles).toContain('executor');
        expect(roles).toContain('engineer');
        expect(roles).toContain('controller');
        expect(roles).toContain('admin');
        expect(roles).toContain('manager');
        expect(roles.length).toBe(6);
    });

    test('hasAllRoles() возвращает true после grantAllRoles', () => {
        window.RoleManager.grantAllRoles();
        expect(window.RoleManager.hasAllRoles()).toBe(true);
    });

    test('hasAllRoles() возвращает false если не все роли', () => {
        window.RoleManager.setRoles(['customer']);
        expect(window.RoleManager.hasAllRoles()).toBe(false);
    });

    test('grantAllRoles сохраняет в localStorage', () => {
        window.RoleManager.grantAllRoles();
        expect(localStorageMock.setItem).toHaveBeenCalledWith(
            'userRoles',
            JSON.stringify(['customer', 'executor', 'engineer', 'controller', 'admin', 'manager'])
        );
    });
});

describe('RoleManager - Обратная совместимость', () => {
    test('setRole("orderer") работает как switchTo', () => {
        window.RoleManager.setRole('orderer');
        expect(window.RoleManager.current()).toBe('customer');
    });

    test('setRole("contractor") работает как switchTo', () => {
        window.RoleManager.setRole('contractor');
        expect(window.RoleManager.current()).toBe('executor');
    });

    test('toggleRole() переключает customer ↔ executor', () => {
        window.RoleManager.switchTo('customer', { showToast: false, updateUI: false });
        window.RoleManager.toggleRole();
        expect(window.RoleManager.current()).toBe('executor');

        window.RoleManager.toggleRole();
        expect(window.RoleManager.current()).toBe('customer');
    });

    test('window.getCurrentRole() возвращает текущую роль', () => {
        window.RoleManager.switchTo('engineer', { showToast: false, updateUI: false });
        expect(window.getCurrentRole()).toBe('engineer');
    });

    test('window.getAllRoles() возвращает все роли', () => {
        window.RoleManager.setRoles(['customer', 'executor']);
        expect(window.getAllRoles()).toEqual(['customer', 'executor']);
    });

    test('window.grantAllRoles() работает', () => {
        window.grantAllRoles();
        expect(window.RoleManager.hasAllRoles()).toBe(true);
    });

    test('window.hasRole() работает', () => {
        window.RoleManager.setRoles(['customer', 'executor']);
        expect(window.hasRole('customer')).toBe(true);
        expect(window.hasRole('admin')).toBe(false);
    });
});

describe('RoleManager - Хранилище', () => {
    test('init загружает роль из localStorage', () => {
        localStorageMock.setItem('selectedRole', 'engineer');
        localStorageMock.setItem('userRoles', JSON.stringify(['customer', 'engineer']));

        window.RoleManager.init();

        expect(window.RoleManager.current()).toBe('engineer');
        expect(window.RoleManager.allRoles()).toContain('engineer');
    });

    test('init загружает роль из userRole (fallback)', () => {
        // Очищаем все, чтобы selectedRole не имел приоритета
        localStorageMock.clear();
        // Ставим только userRole — fallback
        localStorageMock.setItem('userRole', 'contractor');

        window.RoleManager.init();

        expect(window.RoleManager.current()).toBe('executor');
    });

    test('init по умолчанию устанавливает customer', () => {
        localStorageMock.clear();
        window.RoleManager.init();

        expect(window.RoleManager.current()).toBe('customer');
    });
});
