/**
 * GuestMigration — миграция гостевых данных при регистрации
 * QazGost AI — Перенос данных из localStorage в аккаунт пользователя
 */
(function () {
    'use strict';

    // Ключи данных, которые могут быть созданы гостем
    const GUEST_DATA_KEYS = [
        'estimates',
        'projects',
        'photos',
        'inspectResults',
        'savedEstimates',
        'recentWorks',
        'favoriteExecutors',
        'defectAnalysis',
        'volumeCalculations',
        'priceSearchHistory'
    ];

    /**
     * Сохранить гостевые данные перед регистрацией
     * Вызывается перед регистрацией/входом
     * @returns {object|null} snapshot гостевых данных
     */
    function captureGuestData() {
        const snapshot = {};
        let hasData = false;

        GUEST_DATA_KEYS.forEach(key => {
            const data = localStorage.getItem(key);
            if (data) {
                try {
                    snapshot[key] = JSON.parse(data);
                    hasData = true;
                } catch {
                    snapshot[key] = data;
                    hasData = true;
                }
            }
        });

        if (hasData) {
            // Сохраняем snapshot для безопасного восстановления
            localStorage.setItem('_guestDataSnapshot', JSON.stringify({
                data: snapshot,
                capturedAt: new Date().toISOString()
            }));
            console.log('[GuestMigration] 📸 Captured guest data:', Object.keys(snapshot).join(', '));
        }

        return hasData ? snapshot : null;
    }

    /**
     * Перенести гостевые данные в аккаунт пользователя
     * Вызывается ПОСЛЕ успешной регистрации/входа
     * @param {string} userId — ID нового пользователя
     * @returns {object} результат миграции
     */
    async function migrateToAccount(userId) {
        const snapshotRaw = localStorage.getItem('_guestDataSnapshot');
        if (!snapshotRaw) {
            return { migrated: false, reason: 'no_guest_data' };
        }

        try {
            const { data: guestData, capturedAt } = JSON.parse(snapshotRaw);
            const migratedKeys = [];

            // Для каждого ключа — сохраняем с привязкой к userId
            for (const [key, value] of Object.entries(guestData)) {
                const userKey = `user_${userId}_${key}`;

                // Не перезаписываем, если у пользователя уже есть данные
                if (!localStorage.getItem(userKey)) {
                    localStorage.setItem(userKey, JSON.stringify(value));
                    migratedKeys.push(key);
                }
            }

            // Попытка отправить на сервер
            if (window.API && window.API.isBackendOnline) {
                try {
                    const isOnline = await window.API.isBackendOnline();
                    if (isOnline) {
                        // Отправляем на сервер для серверной миграции
                        const result = await fetch(`${window.API.BASE_URL}/users/migrate-guest`, {
                            method: 'POST',
                            credentials: 'include', // HttpOnly cookie auth
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                guestData,
                                capturedAt,
                                keys: migratedKeys
                            })
                        });
                        if (result.ok) {
                            console.log('[GuestMigration] ✅ Server migration completed');
                        }
                    }
                } catch (e) {
                    console.warn('[GuestMigration] Server migration skipped:', e.message);
                }
            }

            // Очищаем snapshot
            localStorage.removeItem('_guestDataSnapshot');

            console.log(`[GuestMigration] ✅ Migrated ${migratedKeys.length} items for user ${userId}:`, migratedKeys.join(', '));

            // Уведомляем пользователя
            if (migratedKeys.length > 0 && typeof window.showToast === 'function') {
                setTimeout(() => {
                    window.showToast(`✅ Перенесено ${migratedKeys.length} элементов из гостевого режима`);
                }, 1500);
            }

            return {
                migrated: true,
                count: migratedKeys.length,
                keys: migratedKeys
            };

        } catch (e) {
            console.error('[GuestMigration] Migration failed:', e);
            return { migrated: false, error: e.message };
        }
    }

    /**
     * Проверить, есть ли гостевые данные для миграции
     * @returns {boolean}
     */
    function hasGuestData() {
        return GUEST_DATA_KEYS.some(key => !!localStorage.getItem(key));
    }

    // ========== ЭКСПОРТ ==========
    window.GuestMigration = {
        capture: captureGuestData,
        migrate: migrateToAccount,
        hasGuestData
    };

    console.log('[GuestMigration] ✅ Module loaded');
})();
