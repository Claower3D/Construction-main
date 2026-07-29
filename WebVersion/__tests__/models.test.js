/**
 * Jest tests for Models (models.js)
 * Тесты для моделей данных приложения
 * 
 * Run with: npm test -- models.test.js
 */

// Mock localStorage
const localStorageMock = (() => {
    let store = {};
    return {
        getItem: jest.fn(key => store[key] || null),
        setItem: jest.fn((key, value) => { store[key] = String(value); }),
        removeItem: jest.fn(key => { delete store[key]; }),
        clear: jest.fn(() => { store = {}; }),
        get length() { return Object.keys(store).length; },
        key: jest.fn(i => Object.keys(store)[i] || null),
    };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Load models.js
beforeAll(() => {
    const fs = require('fs');
    const path = require('path');
    const code = fs.readFileSync(
        path.resolve(__dirname, '..', 'models.js'), 'utf-8'
    );
    eval(code);
});

beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();
});

describe('UserRole Enum', () => {
    test('должен содержать все роли', () => {
        const { UserRole } = window.Models;
        expect(UserRole.CUSTOMER).toBe('customer');
        expect(UserRole.EXECUTOR).toBe('executor');
        expect(UserRole.ENGINEER).toBe('engineer');
        expect(UserRole.ADMIN).toBe('admin');
    });

    test('должен содержать роль CONTROLLER', () => {
        const { UserRole } = window.Models;
        expect(UserRole.CONTROLLER).toBe('controller');
    });
});

describe('OrderStatus Enum', () => {
    test('должен содержать основные статусы', () => {
        const { OrderStatus } = window.Models;
        expect(OrderStatus).toBeDefined();
        expect(OrderStatus.DRAFT).toBe('DRAFT');
        expect(OrderStatus.PUBLISHED).toBe('PUBLISHED');
    });
});

describe('DefectStatus Enum', () => {
    test('должен содержать статусы дефектов', () => {
        const { DefectStatus } = window.Models;
        expect(DefectStatus).toBeDefined();
        expect(DefectStatus.NEW).toBe('NEW');
    });
});

describe('Models Export', () => {
    test('Models должен быть определён в window', () => {
        expect(window.Models).toBeDefined();
    });

    test('User модель должна быть доступна', () => {
        expect(window.Models.User).toBeDefined();
    });

    test('Order модель должна быть доступна', () => {
        expect(window.Models.Order).toBeDefined();
    });

    test('Application модель должна быть доступна', () => {
        expect(window.Models.Application).toBeDefined();
    });

    test('Defect модель должна быть доступна', () => {
        expect(window.Models.Defect).toBeDefined();
    });
});

describe('User Model', () => {
    test('find должна искать пользователя', () => {
        const { User } = window.Models;
        expect(typeof User.find).toBe('function');
    });

    test('конструктор должен создавать пользователя', () => {
        const { User } = window.Models;
        const user = new User({
            name: 'Тест Пользователь',
            role: 'customer',
            phone: '+77001234567'
        });
        expect(user).toBeDefined();
        expect(user.name).toBe('Тест Пользователь');
        expect(user.role).toBe('customer');
        expect(user.id).toBeTruthy();
    });

    test('save должна сохранять пользователя', () => {
        const { User } = window.Models;
        const user = new User({ name: 'Тест', role: 'customer' });
        user.save();
        expect(localStorageMock.setItem).toHaveBeenCalled();
    });
});

describe('Order Model', () => {
    test('find должна быть функцией', () => {
        const { Order } = window.Models;
        expect(typeof Order.find).toBe('function');
    });

    test('getAll должна быть функцией', () => {
        const { Order } = window.Models;
        expect(typeof Order.getAll).toBe('function');
    });
});

describe('CustomerProfile Model', () => {
    test('CustomerProfile должна быть доступна', () => {
        expect(window.Models.CustomerProfile).toBeDefined();
    });
});

describe('ExecutorProfile Model', () => {
    test('ExecutorProfile должна быть доступна', () => {
        expect(window.Models.ExecutorProfile).toBeDefined();
    });
});

describe('EngineerProfile Model', () => {
    test('EngineerProfile должна быть доступна', () => {
        expect(window.Models.EngineerProfile).toBeDefined();
    });
});
