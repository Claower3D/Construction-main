/* QazGost: ярлык «⇄ сменить приложение» внутри каждого из приложений.
   Подключается в index.html приложения сценарием scripts/assemble.mjs.
   Маленький язычок у левого края экрана; его можно перетащить вверх-вниз,
   чтобы не закрывал кнопки. Нажатие возвращает к экрану выбора. */
(function () {
  if (window.__qzHubSwitch) return;
  window.__qzHubSwitch = true;

  var app = (location.pathname.split('/').filter(Boolean).slice(-2, -1)[0]) || '';
  try { if (app) localStorage.setItem('qazgost_hub_last', app); } catch (e) {}

  var POS_KEY = 'qazgost_hub_switch_y';
  function savedY() {
    var v = parseFloat((function () { try { return localStorage.getItem(POS_KEY); } catch (e) { return null; } })());
    return isFinite(v) ? Math.min(Math.max(v, 0.08), 0.92) : 0.5;
  }

  function mount() {
    var css = document.createElement('style');
    css.textContent =
      '.qz-hub-switch{position:fixed;left:0;z-index:2147483000;width:22px;height:56px;margin-top:-28px;padding:0;' +
      'display:flex;align-items:center;justify-content:center;border:1px solid rgba(242,184,75,.55);border-left:0;' +
      'border-radius:0 12px 12px 0;background:linear-gradient(160deg,rgba(52,37,104,.92),rgba(21,15,47,.94));' +
      'color:#f8d27a;font:700 13px/1 system-ui,sans-serif;box-shadow:0 8px 22px -10px rgba(0,0,0,.9),0 0 18px -8px rgba(242,184,75,.6);' +
      'opacity:.78;touch-action:none;-webkit-user-select:none;user-select:none;cursor:pointer}' +
      '.qz-hub-switch:active{opacity:1}' +
      '.qz-hub-switch:focus-visible{outline:2px solid #f8d27a;outline-offset:2px;opacity:1}' +
      '@media print{.qz-hub-switch{display:none}}';
    document.head.appendChild(css);

    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'qz-hub-switch';
    b.setAttribute('aria-label', 'Сменить приложение');
    b.title = 'Сменить приложение';
    b.textContent = '⇄';
    b.style.top = (savedY() * 100) + 'vh';
    document.body.appendChild(b);

    // перетаскивание по вертикали; короткое касание — переход к выбору
    var startY = 0, startTop = 0, moved = false, dragging = false;
    b.addEventListener('pointerdown', function (e) {
      dragging = true; moved = false; startY = e.clientY;
      startTop = b.getBoundingClientRect().top + 28;
      try { b.setPointerCapture(e.pointerId); } catch (err) {}
    });
    b.addEventListener('pointermove', function (e) {
      if (!dragging) return;
      var dy = e.clientY - startY;
      if (Math.abs(dy) > 6) moved = true;
      if (!moved) return;
      var h = window.innerHeight || 1;
      var y = Math.min(Math.max((startTop + dy) / h, 0.08), 0.92);
      b.style.top = (y * 100) + 'vh';
    });
    function end() {
      if (!dragging) return;
      dragging = false;
      if (moved) {
        var y = (b.getBoundingClientRect().top + 28) / (window.innerHeight || 1);
        try { localStorage.setItem(POS_KEY, String(y)); } catch (err) {}
      }
    }
    b.addEventListener('pointerup', end);
    b.addEventListener('pointercancel', end);
    b.addEventListener('click', function (e) {
      if (moved) { e.preventDefault(); moved = false; return; }
      location.href = '../index.html?choose=1';
    });
  }

  if (document.body) mount();
  else document.addEventListener('DOMContentLoaded', mount);
})();
