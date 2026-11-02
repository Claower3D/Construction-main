import React from 'react';
import { LightTrails, Sparkles, WaveMesh } from './LuxFx';

/*
 * Общий фон маркетплейсов: тонированное фото стройки сверху, мягкое
 * фиолетово-золотое сияние, волновой рельеф, световые шлейфы и искры.
 * Слой фиксирован позади контента и не перехватывает клики.
 */
const PHOTOS = {
  materials: '/assets/landing/mk-materials.webp',
  equipment: '/assets/landing/mk-equipment.webp',
  crews: '/assets/landing/mk-crews.webp',
};

export default function MarketBackdrop({ variant = 'materials' }) {
  return (
    <div className={`mk-bg mk-bg--${variant}`} aria-hidden="true">
      <div className="mk-bg-photo" style={{ backgroundImage: `url(${PHOTOS[variant] || PHOTOS.materials})` }} />
      <div className="mk-bg-aurora" />
      <WaveMesh seed={variant.length * 7} lines={26} className="mk-bg-mesh" />
      <LightTrails variant="sweep" className="mk-bg-trails" />
      <Sparkles count={36} seed={variant.length * 3} />
      <div className="mk-bg-grid" />
    </div>
  );
}
