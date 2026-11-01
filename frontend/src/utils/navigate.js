// SPA-навигация без перезагрузки: App слушает popstate и переключает раздел по пути.
export function navigateTo(path) {
  if (typeof window === 'undefined') return;
  if (window.location.pathname !== path) window.history.pushState({}, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
  window.scrollTo({ top: 0, behavior: 'auto' });
}

// Открыть окно входа/регистрации из любого места (App слушает событие)
export function openAuth(mode = 'login') {
  window.dispatchEvent(new CustomEvent('qazgost_open_auth', { detail: { mode } }));
}

// Плавная прокрутка к секции лендинга с учётом фиксированной шапки
export function scrollToSection(id) {
  const el = document.getElementById(id);
  if (!el) return;
  const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const top = el.getBoundingClientRect().top + window.scrollY - 76;
  window.scrollTo({ top, behavior: reduce ? 'auto' : 'smooth' });
}

// «Начать» для текущего пользователя: кабинет, если вошёл, иначе — регистрация
export function startFlow(mode = 'register') {
  let user = null;
  try { user = JSON.parse(localStorage.getItem('app_currentUser') || 'null'); } catch { user = null; }
  if (user && user.role) navigateTo(`/${user.role}`);
  else openAuth(mode);
}
