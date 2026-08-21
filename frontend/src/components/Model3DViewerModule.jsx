import React from 'react';
import Building3DViewer from './Building3DViewer';

export default function Model3DViewerModule() {
  return (
    <div className="fullpage-card-box" style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <h2 className="fullpage-heading" style={{ margin: 0, fontSize: '1.5rem', color: '#ffffff' }}>📐 3D BIM & Архитектурный Viewer 2026</h2>
          <p className="fullpage-sub" style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: '0.88rem' }}>Интерактивная 3D-модель объекта с поддержкой СНиП-инспекции, ночного освещения и строительного крана.</p>
        </div>
      </div>

      <div style={{ height: '620px', borderRadius: '18px', overflow: 'hidden', border: '1px solid rgba(56, 189, 248, 0.3)', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}>
        <Building3DViewer sampleIndex={0} height="100%" showControls={true} />
      </div>
    </div>
  );
}
