import React, { useMemo } from 'react';

/*
 * Декоративные эффекты главной (только оформление, aria-hidden):
 *  • LightTrails — светящиеся фиолетово-розовые и золотые шлейфы;
 *  • WaveMesh    — «рельеф» из тонких волнистых линий;
 *  • Sparkles    — мерцающие искры;
 *  • Ground      — тёмный склон с золотой подсветкой под ноутбуком.
 * Анимации выключаются при prefers-reduced-motion (см. landing-fx.css).
 */

// детерминированный ГПСЧ: одинаковая картинка при каждом рендере и на сервере
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const TRAILS = {
  hero: [
    { d: 'M-80 610 C 300 600, 560 470, 800 380 S 1260 150, 1540 -20', c: 'v', w: 2 },
    { d: 'M-80 640 C 340 630, 620 520, 860 440 S 1320 260, 1540 90', c: 'p', w: 1.2 },
    { d: 'M500 660 C 760 600, 1040 560, 1540 420', c: 'g', w: 1.4 },
  ],
  sweep: [
    { d: 'M-80 420 C 300 380, 520 120, 900 160 S 1380 300, 1540 120', c: 'v', w: 1.8 },
    { d: 'M-80 470 C 360 440, 620 220, 980 250 S 1400 380, 1540 220', c: 'p', w: 1.1 },
    { d: 'M-80 520 C 420 500, 760 330, 1540 330', c: 'g', w: 1 },
  ],
  low: [
    { d: 'M-80 300 C 360 250, 700 360, 1000 300 S 1380 180, 1540 220', c: 'p', w: 1.6 },
    { d: 'M-80 340 C 420 300, 760 400, 1080 340 S 1400 250, 1540 280', c: 'v', w: 1.1 },
  ],
};

export function LightTrails({ variant = 'sweep', className = '' }) {
  const paths = TRAILS[variant] || TRAILS.sweep;
  const id = `lt-${variant}`;
  return (
    <svg className={`fx-trails ${className}`} viewBox="0 0 1440 600" preserveAspectRatio="none" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={`${id}-v`} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#8b5cf6" stopOpacity="0" />
          <stop offset="0.35" stopColor="#a855f7" stopOpacity="0.9" />
          <stop offset="0.7" stopColor="#f472d0" stopOpacity="0.9" />
          <stop offset="1" stopColor="#f472d0" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={`${id}-p`} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#ec4899" stopOpacity="0" />
          <stop offset="0.45" stopColor="#f0abfc" stopOpacity="0.85" />
          <stop offset="1" stopColor="#7c3aed" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={`${id}-g`} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#f2b84b" stopOpacity="0" />
          <stop offset="0.55" stopColor="#ffd27a" stopOpacity="0.75" />
          <stop offset="1" stopColor="#f2b84b" stopOpacity="0" />
        </linearGradient>
        <filter id={`${id}-blur`} x="-10%" y="-50%" width="120%" height="200%">
          <feGaussianBlur stdDeviation="7" />
        </filter>
      </defs>
      <g filter={`url(#${id}-blur)`} opacity="0.85">
        {paths.map((p, i) => (
          <path key={`b${i}`} d={p.d} fill="none" stroke={`url(#${id}-${p.c})`} strokeWidth={p.w * 7} vectorEffect="non-scaling-stroke" />
        ))}
      </g>
      <g>
        {paths.map((p, i) => (
          <path key={`l${i}`} className="fx-trail-line" d={p.d} fill="none" stroke={`url(#${id}-${p.c})`} strokeWidth={p.w} vectorEffect="non-scaling-stroke" style={{ animationDelay: `${i * -2.3}s` }} />
        ))}
      </g>
    </svg>
  );
}

export function WaveMesh({ lines = 34, seed = 7, className = '' }) {
  const paths = useMemo(() => {
    const r = rng(seed);
    const ph = r() * 6;
    const out = [];
    for (let i = 0; i < lines; i += 1) {
      const t = i / (lines - 1);
      const base = 120 + Math.pow(t, 1.6) * 380; // ближе к зрителю — реже
      const amp = 26 + t * 44;
      let d = '';
      for (let x = -40; x <= 1480; x += 24) {
        const y = base
          + Math.sin(x * 0.0042 + ph + t * 1.9) * amp
          + Math.sin(x * 0.011 + t * 4.1) * amp * 0.28;
        d += `${x === -40 ? 'M' : 'L'}${x} ${y.toFixed(1)} `;
      }
      out.push({ d, o: 0.12 + t * 0.5 });
    }
    return out;
  }, [lines, seed]);
  return (
    <svg className={`fx-mesh ${className}`} viewBox="0 0 1440 560" preserveAspectRatio="none" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={`wm-${seed}`} x1="0" x2="1">
          <stop offset="0" stopColor="#7c3aed" />
          <stop offset="0.6" stopColor="#c084fc" />
          <stop offset="1" stopColor="#f472d0" />
        </linearGradient>
      </defs>
      {paths.map((p, i) => (
        <path key={i} d={p.d} fill="none" stroke={`url(#wm-${seed})`} strokeOpacity={p.o} strokeWidth="1" vectorEffect="non-scaling-stroke" />
      ))}
    </svg>
  );
}

export function Sparkles({ count = 28, seed = 3, className = '' }) {
  const dots = useMemo(() => {
    const r = rng(seed);
    return Array.from({ length: count }, (_, i) => ({
      left: `${(r() * 100).toFixed(2)}%`,
      top: `${(r() * 100).toFixed(2)}%`,
      size: 1.5 + r() * 2.5,
      gold: r() > 0.55,
      delay: `${(r() * -6).toFixed(2)}s`,
      dur: `${(3 + r() * 4).toFixed(2)}s`,
      key: i,
    }));
  }, [count, seed]);
  return (
    <div className={`fx-sparkles ${className}`} aria-hidden="true">
      {dots.map((d) => (
        <span
          key={d.key}
          className={d.gold ? 'is-gold' : undefined}
          style={{ left: d.left, top: d.top, width: d.size, height: d.size, animationDelay: d.delay, animationDuration: d.dur }}
        />
      ))}
    </div>
  );
}

export function Ground({ className = '' }) {
  return (
    <svg className={`fx-ground ${className}`} viewBox="0 0 900 220" preserveAspectRatio="none" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="gr-fill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#4a2f86" />
          <stop offset="0.35" stopColor="#24174a" />
          <stop offset="1" stopColor="#0b0a1c" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="gr-rim" x1="0" x2="1">
          <stop offset="0" stopColor="#a855f7" stopOpacity="0" />
          <stop offset="0.3" stopColor="#c084fc" />
          <stop offset="0.55" stopColor="#ffcf7a" />
          <stop offset="0.8" stopColor="#f472d0" />
          <stop offset="1" stopColor="#a855f7" stopOpacity="0" />
        </linearGradient>
        <filter id="gr-blur"><feGaussianBlur stdDeviation="6" /></filter>
        <pattern id="gr-rock" width="14" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(-8)">
          <path d="M0 8 L5 3 L9 6 L14 1" fill="none" stroke="rgba(214,170,255,0.28)" strokeWidth="1" />
        </pattern>
      </defs>
      <path d="M0 120 C 90 96, 150 70, 240 78 S 380 50, 470 62 S 640 40, 720 70 S 840 92, 900 84 L900 220 L0 220 Z" fill="url(#gr-fill)" />
      <path d="M0 120 C 90 96, 150 70, 240 78 S 380 50, 470 62 S 640 40, 720 70 S 840 92, 900 84 L900 220 L0 220 Z" fill="url(#gr-rock)" />
      <path d="M0 120 C 90 96, 150 70, 240 78 S 380 50, 470 62 S 640 40, 720 70 S 840 92, 900 84" fill="none" stroke="url(#gr-rim)" strokeWidth="14" filter="url(#gr-blur)" opacity="1" />
      <path d="M0 120 C 90 96, 150 70, 240 78 S 380 50, 470 62 S 640 40, 720 70 S 840 92, 900 84" fill="none" stroke="url(#gr-rim)" strokeWidth="2.4" />
    </svg>
  );
}

/* ── «3D»-объекты на CSS ── */

export function PhotoStack({ small = false }) {
  return (
    <span className={`fx-photos${small ? ' fx-photos--sm' : ''}`} aria-hidden="true">
      <span style={{ backgroundImage: 'url(/assets/landing/cat-facade.webp)' }} />
      <span style={{ backgroundImage: 'url(/assets/landing/cat-masonry.webp)' }} />
      <span style={{ backgroundImage: 'url(/assets/landing/hero-site.webp)' }} />
    </span>
  );
}

export function HardHat3D() {
  return (
    <svg className="fx-helmet" viewBox="0 0 140 110" aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id="hh-dome" cx="0.35" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#ffe3a6" />
          <stop offset="0.35" stopColor="#f7b64a" />
          <stop offset="0.8" stopColor="#c66d17" />
          <stop offset="1" stopColor="#7a3d0a" />
        </radialGradient>
        <linearGradient id="hh-brim" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#f2a43a" />
          <stop offset="1" stopColor="#8a4510" />
        </linearGradient>
      </defs>
      <ellipse cx="70" cy="86" rx="64" ry="15" fill="url(#hh-brim)" />
      <path d="M18 84 C 18 44, 40 18, 70 18 C 100 18, 122 44, 122 84 Z" fill="url(#hh-dome)" />
      <path d="M62 19 C 60 40, 60 62, 62 84 L78 84 C 80 62, 80 40, 78 19 Z" fill="#ffd27a" opacity="0.55" />
      <path d="M30 70 C 38 46, 52 32, 66 26" fill="none" stroke="#fff" strokeOpacity="0.55" strokeWidth="5" strokeLinecap="round" />
      <ellipse cx="70" cy="84" rx="52" ry="7" fill="#5a2c08" opacity="0.45" />
    </svg>
  );
}

export function PdfDoc({ label = 'PDF', big = false }) {
  return (
    <span className={`fx-doc${big ? ' fx-doc--big' : ''}`} aria-hidden="true">
      <span className="fx-doc-sheet fx-doc-sheet--back" />
      <span className="fx-doc-sheet">
        <span className="fx-doc-lines" />
        <span className="fx-doc-badge">{label}</span>
      </span>
    </span>
  );
}

export function AiChip() {
  return (
    <span className="fx-chip" aria-hidden="true">
      <span className="fx-chip-core">AI</span>
    </span>
  );
}

export function SealDoc() {
  return (
    <span className="fx-seal" aria-hidden="true">
      <span className="fx-doc-sheet fx-doc-sheet--back" />
      <span className="fx-doc-sheet"><span className="fx-doc-lines" /></span>
      <span className="fx-seal-coin">₸</span>
    </span>
  );
}
