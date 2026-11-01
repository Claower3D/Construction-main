import React from 'react';
import './AnimatedBackground.scss';

// Статичный фон «синька»: мягкий свет сверху и чертёжная сетка.
// Раньше — 5 анимированных пятен с blur(120px) и полноэкранный backdrop-filter: заметная нагрузка на CPU/GPU
// и фиолетово-розовая гамма вне бренда.
export default function AnimatedBackground() {
  return <div className="mesh-gradient-bg qg-backdrop" aria-hidden="true" />;
}
