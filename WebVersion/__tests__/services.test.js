/**
 * Jest tests for Services (services.js)
 * Тесты для Auth сервиса и управления ролями
 * 
 * Run with: npm test -- services.test.js
 */

// Mock localStorage
const localStorageMock = (() => {
    let store = {};
    return {
        getItem: jest.fn(key => store[key] || null),
        setItem: jest.fn((key, value) => { store[key] = String(value); }),
        removeItem: jest.fn(key => { delete store[key]; }),
        clear: jest.fn(() => { store = {}; }),
    };
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

// Load models first, then roleManager, then services
beforeAll(() => {
    const fs = require('fs');
    const path = require('path');

    // Load models.js
    const modelsCode = fs.readFileSync(
        path.resolve(__dirname, '..', 'models.js'), 'utf-8'
    );
    eval(modelsCode);

    // Load roleManager.js
    const rmCode = fs.readFileSync(
        path.resolve(__dirname, '..', 'roleManager.js'), 'utf-8'
    );
    eval(rmCode);

    // Load services.js
    const servicesCode = fs.readFileSync(
        path.resolve(__dirname, '..', 'services.js'), 'utf-8'
    );
    eval(servicesCode);
});

beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();
});

describe('AppServices - Загрузка', () => {
    test('должен экспортировать AppServices', () => {
        expect(window.AppServices).toBeDefined();
    });

    test('должен содержать Auth модуль', () => {
        expect(window.AppServices.Auth).toBeDefined();
    });

    test('должен содержать History модуль', () => {
        expect(window.AppServices.History).toBeDefined();
    });

    test('должен содержать StateMachine модуль', () => {
        expect(window.AppServices.StateMachine).toBeDefined();
    });
});

describe('Auth Service - getCurrentRole', () => {
    test('должен возвращать текущую роль из RoleManager', () => {
        window.RoleManager.switchTo('engineer', { showToast: false, updateUI: false });
        expect(window.AppServices.Auth.getCurrentRole()).toBe('engineer');
    });

    test('должен возвращать customer по умолчанию', () => {
        window.RoleManager.switchTo('customer', { showToast: false, updateUI: false });
        expect(window.AppServices.Auth.getCurrentRole()).toBe('customer');
    });
});

describe('Auth Service - getAllRoles', () => {
    test('должен возвращать массив ролей', () => {
        window.RoleManager.setRoles(['customer', 'executor']);
        const roles = window.AppServices.Auth.getAllRoles();
        expect(Array.isArray(roles)).toBe(true);
        expect(roles).toContain('customer');
        expect(roles).toContain('executor');
    });
});

describe('Auth Service - hasRole', () => {
    test('должен проверять наличие роли', () => {
        window.RoleManager.setRoles(['customer', 'executor']);
        expect(window.AppServices.Auth.hasRole('customer')).toBe(true);
        expect(window.AppServices.Auth.hasRole('admin')).toBe(false);
    });
});

describe('Auth Service - grantAllRoles', () => {
    test('должен выдавать все роли', () => {
        window.AppServices.Auth.grantAllRoles();
        const roles = window.AppServices.Auth.getAllRoles();
        expect(roles).toContain('customer');
        expect(roles).toContain('executor');
        expect(roles).toContain('engineer');
        expect(roles).toContain('controller');
        expect(roles).toContain('admin');
    });

    test('hasAllRoles должен вернуть true', () => {
        window.AppServices.Auth.grantAllRoles();
        expect(window.AppServices.Auth.hasAllRoles()).toBe(true);
    });
});

describe('Auth Service - switchRole', () => {
    test('должен переключать роль через RoleManager', () => {
        window.AppServices.Auth.switchRole('executor');
        expect(window.RoleManager.current()).toBe('executor');
    });

    test('должен принимать UI-алиасы', () => {
        window.AppServices.Auth.switchRole('contractor');
        expect(window.RoleManager.current()).toBe('executor');
    });
});

describe('Auth Service - isLoggedIn', () => {
    test('должен возвращать false по умолчанию', () => {
        expect(window.AppServices.Auth.isLoggedIn()).toBe(false);
    });

    test('должен возвращать true если isLoggedIn в localStorage', () => {
        localStorageMock.setItem('isLoggedIn', 'true');
        expect(window.AppServices.Auth.isLoggedIn()).toBe(true);
    });
});

describe('Auth Service - requireAuth', () => {
    test('должен быть функцией', () => {
        expect(typeof window.AppServices.Auth.requireAuth).toBe('function');
    });
});

describe('Global aliases', () => {
    test('window.switchRole должен быть функцией', () => {
        expect(typeof window.switchRole).toBe('function');
    });

    test('window.getCurrentRole должен быть функцией', () => {
        expect(typeof window.getCurrentRole).toBe('function');
    });

    test('window.grantAllRoles должен быть функцией', () => {
        expect(typeof window.grantAllRoles).toBe('function');
    });

    test('window.requireAuth должен быть функцией', () => {
        expect(typeof window.requireAuth).toBe('function');
    });

    test('window.getCurrentUser должен быть функцией', () => {
        expect(typeof window.getCurrentUser).toBe('function');
    });
});

describe('History Service', () => {
    test('logEvent должен быть доступен', () => {
        expect(typeof window.AppServices.History.logEvent).toBe('function');
    });
});

describe('StateMachine Service', () => {
    test('transition должен быть доступен', () => {
        expect(typeof window.AppServices.StateMachine.transition).toBe('function');
    });
});
