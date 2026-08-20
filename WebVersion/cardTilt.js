// 3D Perspective Card Tilt & Dynamic Spotlight Engine
function init3DCardTilt() {
  if (typeof window === 'undefined') return;

  const selector = '.role-bento-card, .service-card, .em-card, .telemetry-item, .luxury-em-card, .role-card';

  function attachTilt(el) {
    if (el._hasTilt) return;
    el._hasTilt = true;

    el.style.transformStyle = 'preserve-3d';
    el.style.transition = 'transform 0.15s ease-out, box-shadow 0.2s ease-out';

    let spotlight = document.createElement('div');
    spotlight.className = 'card-3d-spotlight';
    spotlight.style.position = 'absolute';
    spotlight.style.inset = '0';
    spotlight.style.borderRadius = 'inherit';
    spotlight.style.pointerEvents = 'none';
    spotlight.style.opacity = '0';
    spotlight.style.transition = 'opacity 0.3s ease';
    spotlight.style.zIndex = '1';
    el.style.position = 'relative';
    el.appendChild(spotlight);

    el.addEventListener('mouseenter', () => {
      spotlight.style.opacity = '1';
      if (window.sfx) window.sfx.playHover();
    });

    el.addEventListener('mousemove', (e) => {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const rotateX = ((centerY - y) / centerY) * 7.5;
      const rotateY = ((x - centerX) / centerX) * 7.5;

      el.style.transform = `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateZ(10px)`;
      spotlight.style.background = `radial-gradient(circle 220px at ${x}px ${y}px, rgba(56, 189, 248, 0.2), transparent 80%)`;
    });

    el.addEventListener('mouseleave', () => {
      spotlight.style.opacity = '0';
      el.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0px)';
    });

    el.addEventListener('click', () => {
      if (window.sfx) window.sfx.playClick();
    });
  }

  function scanAndAttach() {
    document.querySelectorAll(selector).forEach(attachTilt);
  }

  scanAndAttach();
  const observer = new MutationObserver(scanAndAttach);
  observer.observe(document.body, { childList: true, subtree: true });
}

if (typeof window !== 'undefined') {
  window.init3DCardTilt = init3DCardTilt;
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init3DCardTilt);
  } else {
    init3DCardTilt();
  }
}
