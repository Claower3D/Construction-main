import React, { lazy, Suspense } from 'react';

// three.js (~600 КБ) подтягивается только когда на экране реально появляется 3D-сцена
const Building3DViewer = lazy(() => import('./Building3DViewer'));

export default function Building3DViewerLazy(props) {
  const height = props.height || '100%';
  return (
    <Suspense
      fallback={
        <div className="qg-3d-placeholder" style={{ height, minHeight: 280 }} role="status">
          Загружаем 3D-модель…
        </div>
      }
    >
      <Building3DViewer {...props} />
    </Suspense>
  );
}
