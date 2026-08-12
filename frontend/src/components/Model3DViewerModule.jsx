import React from 'react';

export default function Model3DViewerModule() {
  return (
    <div className="fullpage-card-box">
      <h2 className="fullpage-heading">📐 3D BIM & Фотограмметрия Viewer</h2>
      <p className="fullpage-sub">Интерактивный просмотрщик 3D-моделей зданий, чертежей и облаков точек.</p>

      <div className="model-3d-canvas-box" style={{ background: '#090d16', border: '1px dashed rgba(245,158,11,0.4)', borderRadius: '18px', padding: '4rem 2rem', textAlign: 'center', margin: '1.5rem 0' }}>
        <div className="spinning-cube-icon" style={{ fontSize: '4rem' }}>🧊</div>
        <h3 style={{ color: '#fff', marginTop: '1rem' }}>3D Модель объекта сгенерирована (142,000 точек)</h3>
        <p style={{ color: '#94a3b8' }}>Используется WebGL 2.0 / Three.js рендерер с поддержкой BIM IFC и GLTF файлов.</p>
        <button className="btn-action-hero" style={{ marginTop: '1.25rem', maxWidth: '300px' }}>🔄 Вращать 3D-модель (360° View)</button>
      </div>
    </div>
  );
}
