/**
 * OnboardingWizard — пошаговый мастер для новых пользователей
 * QazGost AI — UX первого входа
 */
(function () {
    'use strict';

    const ONBOARDING_DONE_KEY = 'onboardingCompleted';

    const STEPS = [
        {
            id: 'welcome',
            icon: '🏗️',
            title: 'Добро пожаловать в QazGost AI!',
            text: 'Платформа для расчёта стоимости ремонта, проверки качества и поиска мастеров. Давайте разберёмся, как всё работает.',
            cta: 'Начнём →'
        },
        {
            id: 'estimate',
            icon: '📐',
            title: 'Расчёт сметы за секунды',
            text: 'Загрузите фото помещения — AI проанализирует дефекты и рассчитает стоимость работ и материалов с точностью до 85%.',
            cta: 'Далее →'
        },
        {
            id: 'masters',
            icon: '👷',
            title: 'Найдите лучшего мастера',
            text: 'Маркетплейс проверенных исполнителей с рейтингами, отзывами и гарантией качества. Деньги на эскроу до приёмки работ.',
            cta: 'Далее →'
        },
        {
            id: 'quality',
            icon: '🔍',
            title: 'Контроль качества AI',
            text: 'Сфотографируйте результат — AI проверит соответствие стандартам ГОСТ и СНиП и выявит дефекты.',
            cta: 'Далее →'
        },
        {
            id: 'role',
            icon: '🎯',
            title: 'Выберите вашу роль',
            text: 'Вы заказчик и ищете мастера? Или исполнитель и хотите получать заказы? Выберите роль для персонализации интерфейса.',
            cta: 'Завершить ✓',
            hasRoleSelect: true
        }
    ];

    function isCompleted() {
        return localStorage.getItem(ONBOARDING_DONE_KEY) === 'true';
    }

    function markCompleted() {
        localStorage.setItem(ONBOARDING_DONE_KEY, 'true');
        localStorage.setItem('onboardingDate', new Date().toISOString());
    }

    /**
     * Показать onboarding overlay
     */
    function show() {
        if (isCompleted()) return;

        let currentStep = 0;

        // Создаём стили
        const style = document.createElement('style');
        style.textContent = `
            .onboarding-overlay {
                position: fixed; inset: 0; z-index: 95000;
                background: rgba(0, 0, 0, 0.85);
                backdrop-filter: blur(20px);
                display: flex; align-items: center; justify-content: center;
                animation: onbFadeIn 0.4s ease;
            }
            .onboarding-card {
                background: linear-gradient(145deg, rgba(20,20,40,0.95), rgba(30,20,50,0.95));
                border: 1px solid rgba(139, 92, 246, 0.2);
                border-radius: 24px;
                padding: 2.5rem;
                max-width: 480px;
                width: 90%;
                text-align: center;
                box-shadow: 0 30px 80px rgba(0,0,0,0.5);
                animation: onbSlideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
            }
            .onboarding-icon { font-size: 3.5rem; margin-bottom: 1rem; }
            .onboarding-title {
                font-size: 1.5rem; font-weight: 700;
                background: linear-gradient(135deg, #fff, #a78bfa);
                -webkit-background-clip: text; -webkit-text-fill-color: transparent;
                margin-bottom: 0.8rem;
            }
            .onboarding-text {
                color: rgba(255,255,255,0.65);
                font-size: 0.95rem; line-height: 1.6;
                margin-bottom: 2rem;
            }
            .onboarding-dots {
                display: flex; gap: 8px; justify-content: center; margin-bottom: 1.5rem;
            }
            .onboarding-dot {
                width: 10px; height: 10px; border-radius: 50%;
                background: rgba(255,255,255,0.15);
                transition: all 0.3s ease;
            }
            .onboarding-dot.active {
                background: #a78bfa; width: 28px; border-radius: 5px;
            }
            .onboarding-cta {
                background: linear-gradient(135deg, #7c3aed, #a78bfa);
                color: #fff; border: none; border-radius: 14px;
                padding: 0.8rem 2rem; font-size: 1rem; font-weight: 600;
                cursor: pointer; transition: all 0.2s ease;
                box-shadow: 0 6px 20px rgba(124,58,237,0.3);
                font-family: inherit;
            }
            .onboarding-cta:hover {
                transform: translateY(-2px);
                box-shadow: 0 10px 30px rgba(124,58,237,0.4);
            }
            .onboarding-skip {
                background: none; border: none; color: rgba(255,255,255,0.35);
                font-size: 0.82rem; cursor: pointer; margin-top: 1rem;
                display: block; margin-left: auto; margin-right: auto;
                font-family: inherit;
            }
            .onboarding-skip:hover { color: rgba(255,255,255,0.6); }
            .onboarding-roles {
                display: flex; gap: 0.8rem; flex-wrap: wrap;
                justify-content: center; margin-bottom: 1.5rem;
            }
            .onboarding-role-btn {
                background: rgba(255,255,255,0.06);
                border: 2px solid rgba(255,255,255,0.1);
                border-radius: 14px; padding: 0.8rem 1.2rem;
                color: rgba(255,255,255,0.7); cursor: pointer;
                transition: all 0.2s ease; font-family: inherit;
                font-size: 0.9rem;
            }
            .onboarding-role-btn:hover {
                border-color: rgba(139,92,246,0.4);
                background: rgba(139,92,246,0.1);
            }
            .onboarding-role-btn.selected {
                border-color: #7c3aed;
                background: rgba(124,58,237,0.2);
                color: #fff;
            }
            @keyframes onbFadeIn { from { opacity: 0; } to { opacity: 1; } }
            @keyframes onbSlideUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        `;
        document.head.appendChild(style);

        // Создаём overlay
        const overlay = document.createElement('div');
        overlay.className = 'onboarding-overlay';
        overlay.id = 'onboardingOverlay';

        function renderStep(index) {
            const step = STEPS[index];
            overlay.innerHTML = `
                <div class="onboarding-card">
                    <div class="onboarding-icon">${step.icon}</div>
                    <h2 class="onboarding-title">${step.title}</h2>
                    <p class="onboarding-text">${step.text}</p>
                    ${step.hasRoleSelect ? `
                        <div class="onboarding-roles">
                            <button class="onboarding-role-btn" data-role="customer">🏠 Заказчик</button>
                            <button class="onboarding-role-btn" data-role="executor">🔧 Исполнитель</button>
                            <button class="onboarding-role-btn" data-role="engineer">📋 Инженер</button>
                        </div>
                    ` : ''}
                    <div class="onboarding-dots">
                        ${STEPS.map((_, i) => `<div class="onboarding-dot${i === index ? ' active' : ''}"></div>`).join('')}
                    </div>
                    <button class="onboarding-cta" id="onbNext">${step.cta}</button>
                    <button class="onboarding-skip" id="onbSkip">Пропустить</button>
                </div>
            `;

            // Role selection
            if (step.hasRoleSelect) {
                overlay.querySelectorAll('.onboarding-role-btn').forEach(btn => {
                    btn.addEventListener('click', () => {
                        overlay.querySelectorAll('.onboarding-role-btn').forEach(b => b.classList.remove('selected'));
                        btn.classList.add('selected');
                        const role = btn.dataset.role;
                        if (window.RoleManager) {
                            window.RoleManager.switchTo(role, { showToast: false });
                        }
                    });
                });
            }

            // Next / Complete
            overlay.querySelector('#onbNext').addEventListener('click', () => {
                if (index < STEPS.length - 1) {
                    currentStep++;
                    renderStep(currentStep);
                } else {
                    complete();
                }
            });

            // Skip
            overlay.querySelector('#onbSkip').addEventListener('click', complete);
        }

        function complete() {
            markCompleted();
            overlay.style.opacity = '0';
            overlay.style.transition = 'opacity 0.3s ease';
            setTimeout(() => overlay.remove(), 300);

            if (typeof window.showToast === 'function') {
                window.showToast('👋 Онбординг завершён! Приятного использования.');
            }
        }

        renderStep(0);
        document.body.appendChild(overlay);
    }

    /**
     * Сброс для тестирования
     */
    function reset() {
        localStorage.removeItem(ONBOARDING_DONE_KEY);
        localStorage.removeItem('onboardingDate');
        console.log('[Onboarding] Reset. Reload page to see wizard.');
    }

    // ========== ЭКСПОРТ ==========
    window.OnboardingWizard = {
        show,
        isCompleted,
        reset
    };

    console.log('[OnboardingWizard] ✅ Module loaded');
})();
