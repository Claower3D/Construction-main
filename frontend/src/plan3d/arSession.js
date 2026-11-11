// Дополненная реальность через WebXR (Chrome на Android): модель поверх картинки с камеры.
// Два режима: «подойти» — здание в настоящую величину встаёт перед человеком, к нему можно подойти, обойти и зайти внутрь
// (там же переключатель «макет»); «по точкам» — точная привязка по двум углам A и B, отмеченным на площадке.

import * as THREE from 'three';
import { buildBuilding, disposeBuilding } from './geometry3d.js';
import { alignTwoPoints, placeAtPoint, placeFacing, rescaleAbout, rotateAbout } from './arMath.js';

/** @returns {Promise<'webxr'|'quicklook'|'none'>} что умеет это устройство */
export async function arSupport() {
  try {
    if (navigator.xr?.isSessionSupported && await navigator.xr.isSessionSupported('immersive-ar')) return 'webxr';
  } catch { /* запрещено политикой или нет поддержки */ }
  try {
    if (document.createElement('a').relList?.supports?.('ar')) return 'quicklook';
  } catch { /* старый браузер */ }
  return 'none';
}

const TABLE_SIZE = 0.5; // большая сторона макета, м

/**
 * @param {{ project:object, overlayRoot:HTMLElement, mode:'walk'|'site', onState:(s:object)=>void, onEnd:()=>void }} options
 * @returns {Promise<object>} управление сеансом
 */
export async function startArSession({ project, overlayRoot, mode: initialMode = 'walk', onState, onEnd }) {
  const session = await navigator.xr.requestSession('immersive-ar', {
    requiredFeatures: ['hit-test'],
    optionalFeatures: ['dom-overlay'],
    domOverlay: { root: overlayRoot },
  });

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.xr.enabled = true;
  renderer.xr.setReferenceSpaceType('local');

  const scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight(0xffffff, 0x8880a0, 1.6));
  const sun = new THREE.DirectionalLight(0xffffff, 1.2);
  sun.position.set(4, 10, 6);
  scene.add(sun);
  const camera = new THREE.PerspectiveCamera(60, 1, 0.05, 2000);

  const reticle = new THREE.Mesh(
    new THREE.RingGeometry(0.07, 0.09, 40).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({ color: 0xf8d27a }),
  );
  reticle.matrixAutoUpdate = false;
  reticle.visible = false;
  scene.add(reticle);

  const pin = (color) => {
    const m = new THREE.Mesh(new THREE.SphereGeometry(0.05, 20, 14), new THREE.MeshBasicMaterial({ color }));
    m.visible = false;
    scene.add(m);
    return m;
  };
  const pinA = pin(0xf8d27a);
  const pinB = pin(0x4fc3ff);

  const building = buildBuilding(project, { edges: true });
  const holder = new THREE.Group();
  holder.add(building);
  holder.visible = false;
  scene.add(holder);

  const { size, center, anchors } = building.userData;
  const bottomY = project.groundSlab ? -project.slab : 0;
  const floors = project.floors.length;

  const front = { x: center.x, z: center.z + size.z / 2 }; // середина фасада, обращённого к зрителю
  const modelScale = TABLE_SIZE / Math.max(size.x, size.z, 0.01);
  const state = {
    mode: initialMode, step: initialMode === 'site' ? 'A' : 'aim', hit: false,
    mismatch: null, expected: anchors ? anchors.distance : 0, ratio: null, levels: floors, ghost: false, overlay: true,
    width: size.x, depth: size.z, height: size.y,
  };
  let lastHit = null;
  let worldA = null;
  let pivot = null; // точка, вокруг которой доворачиваем
  let ended = false;
  const emit = () => onState?.({ ...state });

  const applyTransform = (t) => {
    holder.position.set(t.position.x, t.position.y, t.position.z);
    holder.rotation.set(0, t.rotationY, 0);
    holder.scale.setScalar(t.scale || 1);
    holder.visible = true;
  };
  const current = () => ({ position: { x: holder.position.x, y: holder.position.y, z: holder.position.z }, rotationY: holder.rotation.y, scale: holder.scale.x });

  const controller = {
    /** Поставить в точку, на которую сейчас наведён прицел. */
    place() {
      if (!lastHit || ended) return false;
      const hit = { ...lastHit };
      if (state.mode === 'walk') {
        // ближний фасад — в отмеченную точку, здание уходит от человека вглубь
        const eye = new THREE.Vector3();
        renderer.xr.getCamera().getWorldPosition(eye);
        applyTransform(placeFacing(front, hit, { x: eye.x, z: eye.z }, 1, 0));
        pivot = hit;
        state.ratio = null;
        state.step = 'placed';
      } else if (state.step === 'A' || !anchors) {
        worldA = hit;
        pinA.position.set(hit.x, hit.y, hit.z);
        pinA.visible = true;
        if (!anchors) {
          applyTransform({ position: { x: hit.x - center.x, y: hit.y, z: hit.z - center.z }, rotationY: 0 });
          pivot = hit;
          state.step = 'placed';
        } else state.step = 'B';
      } else if (state.step === 'B') {
        const t = alignTwoPoints(anchors.a, anchors.b, worldA, hit);
        applyTransform(t);
        pinB.position.set(hit.x, hit.y, hit.z);
        pinB.visible = true;
        pivot = worldA;
        state.mismatch = t.mismatch;
        state.step = 'placed';
      }
      emit();
      return true;
    },
    /** Натура без второй точки: ставим по A, направление потом доворачивается вручную. */
    skipSecondPoint() {
      if (state.mode !== 'site' || state.step !== 'B' || !worldA) return;
      applyTransform(placeAtPoint(anchors.a, worldA, 0));
      pivot = worldA;
      state.mismatch = null;
      state.step = 'placed';
      emit();
    },
    reset() {
      holder.visible = false;
      holder.scale.setScalar(1);
      pinA.visible = false;
      pinB.visible = false;
      worldA = null;
      pivot = null;
      state.mismatch = null;
      state.ratio = null;
      state.step = state.mode === 'site' ? 'A' : 'aim';
      emit();
    },
    setMode(mode) {
      if (mode !== 'walk' && mode !== 'site') return;
      state.mode = mode;
      controller.reset();
    },
    /** Натуральная величина ↔ макет размером с полметра. Точка привязки остаётся на месте. */
    setModel(on) {
      if (state.step !== 'placed' || !pivot) return;
      const from = holder.scale.x;
      const to = on ? modelScale : 1;
      if (Math.abs(from - to) < 1e-9) return;
      // макет ставим на поверхность низом плиты; здание в натуре — нулевой отметкой
      const p = rescaleAbout(holder.position, pivot, from, to, pivot.y - (on ? bottomY * to : 0));
      holder.position.set(p.x, p.y, p.z);
      holder.scale.setScalar(to);
      state.ratio = on ? Math.round(1 / to) : null;
      emit();
    },
    /** Доворот вокруг точки привязки, в градусах. */
    rotate(deg) {
      if (state.step !== 'placed' || !pivot) return;
      const c = current();
      const t = rotateAbout(c.position, c.rotationY, pivot, (deg * Math.PI) / 180);
      applyTransform({ ...t, scale: c.scale });
    },
    /** Сдвиг относительно взгляда: right и forward в метрах. */
    nudge(right, forward) {
      if (state.step !== 'placed') return;
      const dir = new THREE.Vector3();
      renderer.xr.getCamera().getWorldDirection(dir);
      dir.y = 0;
      if (dir.lengthSq() < 1e-6) dir.set(0, 0, -1);
      dir.normalize();
      const dx = dir.x * forward - dir.z * right;
      const dz = dir.z * forward + dir.x * right;
      holder.position.x += dx;
      holder.position.z += dz;
      if (pivot) pivot = { ...pivot, x: pivot.x + dx, z: pivot.z + dz };
      pinA.position.x += dx; pinA.position.z += dz;
      pinB.position.x += dx; pinB.position.z += dz;
    },
    lift(dy) {
      if (state.step !== 'placed') return;
      holder.position.y += dy;
    },
    setLevels(n) {
      state.levels = Math.max(1, Math.min(floors, n));
      for (const g of building.children) g.visible = g.name === 'roof' ? state.levels >= floors : g.userData.level < state.levels;
      emit();
    },
    /** Полупрозрачные стены, чтобы видеть площадку сквозь модель. */
    setGhost(on) {
      state.ghost = Boolean(on);
      const seen = new Set();
      building.traverse((o) => {
        if (!o.isMesh || o.userData.kind === 'glass' || seen.has(o.material)) return;
        seen.add(o.material);
        o.material.transparent = state.ghost;
        o.material.opacity = state.ghost ? 0.45 : 1;
        o.material.depthWrite = !state.ghost;
        o.material.needsUpdate = true;
      });
      emit();
    },
    end() { if (!ended) session.end().catch(() => {}); },
    getState: () => ({ ...state }),
  };

  const cleanup = () => {
    if (ended) return;
    ended = true;
    renderer.setAnimationLoop(null);
    disposeBuilding(building);
    reticle.geometry.dispose(); reticle.material.dispose();
    [pinA, pinB].forEach((p) => { p.geometry.dispose(); p.material.dispose(); });
    renderer.dispose();
    onEnd?.();
  };
  session.addEventListener('end', cleanup);

  try {
    await renderer.xr.setSession(session);
    const viewerSpace = await session.requestReferenceSpace('viewer');
    const hitSource = await session.requestHitTestSource({ space: viewerSpace });
    // без оверлея кнопок не будет — тогда ставим модель нажатием на экран
    state.overlay = Boolean(session.domOverlayState);
    if (!state.overlay) session.addEventListener('select', () => { if (state.step !== 'placed') controller.place(); });

    const m = new THREE.Matrix4();
    const pos = new THREE.Vector3();
    renderer.setAnimationLoop((time, frame) => {
      if (frame) {
        const results = frame.getHitTestResults(hitSource);
        const pose = results.length ? results[0].getPose(renderer.xr.getReferenceSpace()) : null;
        const had = state.hit;
        if (pose) {
          m.fromArray(pose.transform.matrix);
          reticle.matrix.copy(m);
          pos.setFromMatrixPosition(m);
          lastHit = { x: pos.x, y: pos.y, z: pos.z };
          state.hit = true;
        } else {
          lastHit = null;
          state.hit = false;
        }
        reticle.visible = state.hit && state.step !== 'placed';
        if (had !== state.hit) emit();
      }
      renderer.render(scene, camera);
    });
  } catch (e) {
    session.end().catch(() => {});
    cleanup();
    throw e;
  }

  emit();
  return controller;
}
