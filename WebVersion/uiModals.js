// ========== QazUI — Global Modal & Toast System ==========
// Replaces browser confirm() / alert() with premium glassmorphism modals
// Usage:
//   await QazUI.confirm('Удалить?', 'Данные будут потеряны')  → true/false
//   QazUI.alert('Готово!', 'Файл сохранён')
//   QazUI.toast('✅ Успешно', 3000)

(function () {
    'use strict';

    // ─── STYLE INJECTION ───
    const MODAL_CSS = `
.qaz-modal-overlay {
    position: fixed; inset: 0; z-index: 99999;
    display: flex; align-items: center; justify-content: center;
    background: rgba(0,0,0,0.6);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    animation: qazModalFadeIn 0.25s ease;
}
@keyframes qazModalFadeIn { from { opacity: 0; } to { opacity: 1; } }
.qaz-modal-card {
    width: 100%; max-width: 380px; margin: 1rem;
    padding: 2rem 1.75rem 1.5rem;
    background: rgba(15, 15, 35, 0.92);
    backdrop-filter: blur(30px);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 20px;
    box-shadow: 0 20px 60px rgba(0,0,0,0.5), 0 0 80px rgba(124,58,237,0.06);
    animation: qazModalSlide 0.35s cubic-bezier(0.16,1,0.3,1);
    text-align: center;
}
@keyframes qazModalSlide {
    from { opacity: 0; transform: translateY(20px) scale(0.96); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
}
.qaz-modal-card::before {
    content: ''; position: absolute; top: 0; left: 0; right: 0; height: 1px;
    background: linear-gradient(90deg, transparent, rgba(250,204,21,0.25), rgba(124,58,237,0.25), transparent);
}
.qaz-modal-icon { font-size: 2.2rem; margin-bottom: 0.75rem; }
.qaz-modal-title {
    font-size: 1.15rem; font-weight: 700; color: #fff; margin-bottom: 0.4rem;
}
.qaz-modal-message {
    font-size: 0.88rem; color: rgba(255,255,255,0.55); line-height: 1.5;
    margin-bottom: 1.5rem;
}
.qaz-modal-actions { display: flex; gap: 0.6rem; }
.qaz-modal-btn {
    flex: 1; padding: 0.75rem 1rem; border: none; border-radius: 12px;
    font-size: 0.9rem; font-weight: 600; font-family: inherit;
    cursor: pointer; transition: all 0.25s ease;
}
.qaz-modal-btn.cancel {
    background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.6);
    border: 1px solid rgba(255,255,255,0.08);
}
.qaz-modal-btn.cancel:hover {
    background: rgba(255,255,255,0.1); color: #fff;
}
.qaz-modal-btn.confirm {
    background: linear-gradient(135deg, #facc15, #f59e0b); color: #000;
    box-shadow: 0 4px 15px rgba(250,204,21,0.25);
}
.qaz-modal-btn.confirm:hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 20px rgba(250,204,21,0.35);
}
.qaz-modal-btn.danger {
    background: linear-gradient(135deg, #ef4444, #dc2626); color: #fff;
    box-shadow: 0 4px 15px rgba(239,68,68,0.25);
}
.qaz-modal-btn.danger:hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 20px rgba(239,68,68,0.35);
}
.qaz-modal-btn.ok {
    background: linear-gradient(135deg, #7c3aed, #a855f7); color: #fff;
    box-shadow: 0 4px 15px rgba(124,58,237,0.25);
}
.qaz-modal-btn.ok:hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 20px rgba(124,58,237,0.35);
}
.qaz-toast-container {
    position: fixed; top: 1rem; right: 1rem; z-index: 100000;
    display: flex; flex-direction: column; gap: 0.5rem;
    pointer-events: none;
}
.qaz-toast {
    pointer-events: auto;
    padding: 0.75rem 1.25rem; border-radius: 12px;
    background: rgba(15,15,35,0.92);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255,255,255,0.08);
    color: #fff; font-size: 0.88rem; font-weight: 500;
    box-shadow: 0 8px 30px rgba(0,0,0,0.3);
    animation: qazToastIn 0.35s cubic-bezier(0.16,1,0.3,1);
    max-width: 360px;
}
@keyframes qazToastIn {
    from { opacity: 0; transform: translateX(20px); }
    to   { opacity: 1; transform: translateX(0); }
}
.qaz-toast.fade-out {
    animation: qazToastOut 0.3s ease forwards;
}
@keyframes qazToastOut {
    from { opacity: 1; transform: translateX(0); }
    to   { opacity: 0; transform: translateX(30px); }
}
`;

    // Inject styles once
    if (!document.getElementById('qaz-modal-styles')) {
        const style = document.createElement('style');
        style.id = 'qaz-modal-styles';
        style.textContent = MODAL_CSS;
        document.head.appendChild(style);
    }

    // ─── CONFIRM ───
    /**
     * Show a confirmation modal (async, returns Promise<boolean>).
     * @param {string} title - Title text
     * @param {string} [message] - Detail message
     * @param {object} [opts] - { icon, confirmText, cancelText, danger }
     * @returns {Promise<boolean>}
     */
    function confirm(title, message, opts = {}) {
        return new Promise(resolve => {
            const {
                icon = '⚠️',
                confirmText = 'Подтвердить',
                cancelText = 'Отмена',
                danger = false
            } = opts;

            const overlay = document.createElement('div');
            overlay.className = 'qaz-modal-overlay';
            overlay.innerHTML = `
                <div class="qaz-modal-card">
                    <div class="qaz-modal-icon">${icon}</div>
                    <div class="qaz-modal-title">${_esc(title)}</div>
                    ${message ? `<div class="qaz-modal-message">${_esc(message)}</div>` : '<div style="margin-bottom:1rem"></div>'}
                    <div class="qaz-modal-actions">
                        <button class="qaz-modal-btn cancel" data-action="cancel">${_esc(cancelText)}</button>
                        <button class="qaz-modal-btn ${danger ? 'danger' : 'confirm'}" data-action="confirm">${_esc(confirmText)}</button>
                    </div>
                </div>
            `;

            function close(result) {
                overlay.style.animation = 'qazModalFadeIn 0.2s ease reverse';
                setTimeout(() => { overlay.remove(); resolve(result); }, 180);
            }

            overlay.querySelector('[data-action="cancel"]').onclick = () => close(false);
            overlay.querySelector('[data-action="confirm"]').onclick = () => close(true);
            overlay.addEventListener('click', e => { if (e.target === overlay) close(false); });
            document.addEventListener('keydown', function onKey(e) {
                if (e.key === 'Escape') { document.removeEventListener('keydown', onKey); close(false); }
                if (e.key === 'Enter') { document.removeEventListener('keydown', onKey); close(true); }
            });

            document.body.appendChild(overlay);
            overlay.querySelector('[data-action="confirm"]').focus();
        });
    }

    // ─── ALERT ───
    /**
     * Show an alert modal (async, returns when dismissed).
     * @param {string} title
     * @param {string} [message]
     * @param {object} [opts] - { icon, okText }
     * @returns {Promise<void>}
     */
    function alert(title, message, opts = {}) {
        return new Promise(resolve => {
            const { icon = 'ℹ️', okText = 'ОК' } = opts;

            const overlay = document.createElement('div');
            overlay.className = 'qaz-modal-overlay';
            overlay.innerHTML = `
                <div class="qaz-modal-card">
                    <div class="qaz-modal-icon">${icon}</div>
                    <div class="qaz-modal-title">${_esc(title)}</div>
                    ${message ? `<div class="qaz-modal-message">${_esc(message)}</div>` : '<div style="margin-bottom:1rem"></div>'}
                    <div class="qaz-modal-actions">
                        <button class="qaz-modal-btn ok" data-action="ok">${_esc(okText)}</button>
                    </div>
                </div>
            `;

            function close() {
                overlay.style.animation = 'qazModalFadeIn 0.2s ease reverse';
                setTimeout(() => { overlay.remove(); resolve(); }, 180);
            }

            overlay.querySelector('[data-action="ok"]').onclick = close;
            overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
            document.addEventListener('keydown', function onKey(e) {
                if (e.key === 'Escape' || e.key === 'Enter') {
                    document.removeEventListener('keydown', onKey); close();
                }
            });

            document.body.appendChild(overlay);
            overlay.querySelector('[data-action="ok"]').focus();
        });
    }

    // ─── TOAST ───
    let _toastContainer = null;

    function toast(message, duration = 3000) {
        if (!_toastContainer) {
            _toastContainer = document.createElement('div');
            _toastContainer.className = 'qaz-toast-container';
            document.body.appendChild(_toastContainer);
        }

        const el = document.createElement('div');
        el.className = 'qaz-toast';
        el.textContent = message;
        _toastContainer.appendChild(el);

        setTimeout(() => {
            el.classList.add('fade-out');
            setTimeout(() => el.remove(), 300);
        }, duration);
    }

    // ─── PROMPT (input modal) ───
    /**
     * Show a prompt modal with input field (async, returns Promise<string|null>).
     * @param {string} title - Title text
     * @param {string} [message] - Detail message
     * @param {object} [opts] - { icon, confirmText, cancelText, defaultValue, placeholder, inputType }
     * @returns {Promise<string|null>} - input value or null if cancelled
     */
    function promptInput(title, message, opts = {}) {
        return new Promise(resolve => {
            const {
                icon = '📝',
                confirmText = 'ОК',
                cancelText = 'Отмена',
                defaultValue = '',
                placeholder = '',
                inputType = 'text',
            } = opts;

            const overlay = document.createElement('div');
            overlay.className = 'qaz-modal-overlay';
            overlay.innerHTML = `
                <div class="qaz-modal-card">
                    <div class="qaz-modal-icon">${icon}</div>
                    <div class="qaz-modal-title">${_esc(title)}</div>
                    ${message ? `<div class="qaz-modal-message">${_esc(message)}</div>` : '<div style="margin-bottom:0.5rem"></div>'}
                    <input class="qaz-modal-input" type="${inputType}" value="${_esc(String(defaultValue))}"
                           placeholder="${_esc(placeholder)}"
                           style="width:100%;padding:0.75rem 1rem;margin-bottom:1.25rem;border-radius:12px;border:1px solid rgba(255,255,255,0.12);
                                  background:rgba(255,255,255,0.06);color:#fff;font-size:1rem;font-family:inherit;outline:none;
                                  transition:border-color 0.2s;box-sizing:border-box;"
                           onfocus="this.style.borderColor='rgba(250,204,21,0.5)'"
                           onblur="this.style.borderColor='rgba(255,255,255,0.12)'"
                    >
                    <div class="qaz-modal-actions">
                        <button class="qaz-modal-btn cancel" data-action="cancel">${_esc(cancelText)}</button>
                        <button class="qaz-modal-btn confirm" data-action="confirm">${_esc(confirmText)}</button>
                    </div>
                </div>
            `;

            const input = overlay.querySelector('.qaz-modal-input');

            function close(result) {
                overlay.style.animation = 'qazModalFadeIn 0.2s ease reverse';
                setTimeout(() => { overlay.remove(); resolve(result); }, 180);
            }

            overlay.querySelector('[data-action="cancel"]').onclick = () => close(null);
            overlay.querySelector('[data-action="confirm"]').onclick = () => close(input.value);
            overlay.addEventListener('click', e => { if (e.target === overlay) close(null); });
            input.addEventListener('keydown', e => {
                if (e.key === 'Enter') { e.preventDefault(); close(input.value); }
            });
            document.addEventListener('keydown', function onKey(e) {
                if (e.key === 'Escape') { document.removeEventListener('keydown', onKey); close(null); }
            });

            document.body.appendChild(overlay);
            input.focus();
            input.select();
        });
    }

    // ─── HELPERS ───
    function _esc(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    // ─── EXPORT ───
    window.QazUI = { confirm, alert, toast, prompt: promptInput };

    console.log('✅ [QazUI] Global modal system loaded — confirm(), alert(), toast()');
})();
