import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Maximize } from 'lucide-react';
import { buildBuilding, disposeBuilding } from '../../plan3d/geometry3d.js';

/** Какие части модели видны: слои и число показанных этажей (срез сверху, чтобы заглянуть внутрь). */
export function applyVisibility(root, layers, levels) {
  const total = root.children.filter((c) => c.name !== 'anchors' && c.name !== 'roof').length;
  for (const group of root.children) {
    if (group.name === 'anchors') { group.visible = Boolean(layers.anchors); continue; }
    const level = group.userData.level;
    group.visible = group.name === 'roof' ? levels >= total : level < levels;
    for (const obj of group.children) obj.visible = Boolean(layers[obj.userData.kind]);
  }
}

export default function Model3DView({ project, layers, levels, fitKey }) {
  const boxRef = useRef(null);
  const three = useRef(null);
  const [error, setError] = useState('');
  const [info, setInfo] = useState({ ready: false, meshes: 0 });

  // сцена создаётся один раз
  useEffect(() => {
    const box = boxRef.current;
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: false });
    } catch {
      setError('Браузер не дал включить 3D-графику. Обновите страницу или откройте в Chrome.');
      return undefined;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    box.appendChild(renderer.domElement);
    renderer.domElement.setAttribute('aria-hidden', 'true');

    const scene = new THREE.Scene();
    scene.add(new THREE.HemisphereLight(0xffffff, 0x4a3f7a, 1.25));
    const sun = new THREE.DirectionalLight(0xfff1d6, 1.6);
    sun.position.set(18, 30, 12);
    scene.add(sun);
    const fill = new THREE.DirectionalLight(0xbfd4ff, 0.5);
    fill.position.set(-20, 12, -16);
    scene.add(fill);

    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 5000);
    camera.position.set(14, 12, 16);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.maxPolarAngle = Math.PI / 2 - 0.02; // не проваливаемся под землю
    controls.minDistance = 1;

    let frame = 0;
    const render = () => { frame = 0; renderer.render(scene, camera); };
    const request = () => { if (!frame) frame = requestAnimationFrame(render); };
    controls.addEventListener('change', request);

    const resize = () => {
      const w = box.clientWidth;
      const h = box.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      request();
    };
    const ro = new ResizeObserver(resize);
    ro.observe(box);
    resize();

    three.current = { renderer, scene, camera, controls, request, root: null, grid: null, fitted: false };
    return () => {
      ro.disconnect();
      cancelAnimationFrame(frame);
      controls.dispose();
      const t = three.current;
      if (t?.root) { scene.remove(t.root); disposeBuilding(t.root); }
      if (t?.grid) { t.grid.geometry.dispose(); t.grid.material.dispose(); }
      renderer.dispose();
      renderer.domElement.remove();
      three.current = null;
    };
  }, []);

  const fit = () => {
    const t = three.current;
    if (!t?.root) return;
    const { size, center } = t.root.userData;
    // расстояние, с которого модель целиком помещается и по высоте, и по ширине окна (на телефоне окно узкое)
    const radius = Math.max(Math.hypot(size.x, size.y, size.z) / 2, 2);
    const half = (t.camera.fov * Math.PI) / 360;
    const halfH = Math.atan(Math.tan(half) * t.camera.aspect);
    const dist = (radius / Math.sin(Math.min(half, halfH))) * 1.02;
    const dir = new THREE.Vector3(0.62, 0.5, 0.72).normalize();
    t.controls.target.set(center.x, center.y, center.z);
    t.camera.position.set(center.x + dir.x * dist, center.y + dir.y * dist, center.z + dir.z * dist);
    t.camera.near = Math.max(0.05, dist / 200);
    t.camera.far = dist * 40;
    t.camera.updateProjectionMatrix();
    t.controls.maxDistance = dist * 8;
    t.controls.update();
    t.request();
  };

  // модель пересобирается при любом изменении проекта
  useEffect(() => {
    const t = three.current;
    if (!t) return undefined;
    const timer = setTimeout(() => {
      if (!three.current) return;
      if (t.root) { t.scene.remove(t.root); disposeBuilding(t.root); }
      if (t.grid) { t.scene.remove(t.grid); t.grid.geometry.dispose(); t.grid.material.dispose(); }
      const root = buildBuilding(project, { anchors: true });
      t.root = root;
      t.scene.add(root);
      const { size, center } = root.userData;
      const span = Math.max(10, Math.ceil(Math.max(size.x, size.z) * 2.2 / 10) * 10);
      const grid = new THREE.GridHelper(span, span, 0x6f63b8, 0x3c3270);
      grid.position.set(Math.round(center.x), project.groundSlab ? -project.slab - 0.01 : -0.01, Math.round(center.z));
      t.grid = grid;
      t.scene.add(grid);
      applyVisibility(root, layers, levels);
      if (!t.fitted) { fit(); t.fitted = true; }
      t.request();
      let meshes = 0;
      root.traverse((o) => { if (o.isMesh) meshes += 1; });
      setInfo({ ready: true, meshes });
    }, 60);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project]);

  useEffect(() => {
    const t = three.current;
    if (!t?.root) return;
    applyVisibility(t.root, layers, levels);
    t.request();
  }, [layers, levels]);

  useEffect(() => { if (three.current?.root) fit(); }, [fitKey]);

  return (
    <div className="p3-view3d" ref={boxRef} data-ready={info.ready ? '1' : '0'} data-meshes={info.meshes} role="img" aria-label="3D-модель здания. Мышью или пальцем модель можно вращать и приближать.">
      {error && <p className="p3-alert" role="alert">{error}</p>}
      {!error && (
        <button type="button" className="p3-icon-btn p3-view3d-fit" onClick={fit} aria-label="Показать модель целиком"><Maximize size={18} aria-hidden="true" /></button>
      )}
    </div>
  );
}
