// Наложение модели на живую картинку с камеры — без фона, как в приложениях для стройплощадки.
// Работает на любом телефоне и ноутбуке с камерой: видео идёт фоном, поверх — прозрачный слой с моделью.
// Телефон поворачивают — модель остаётся на месте (по датчикам ориентации). Шаги человека телефон здесь не чувствует:
// для этого нужен режим AR с ARCore, он запускается отдельно.

import * as THREE from 'three';
import { buildBuilding, disposeBuilding } from './geometry3d.js';

const EYE = 1.6; // высота камеры над землёй, м
const LONG_SIDE_FOV = 66; // угол обзора основной камеры телефона по длинной стороне кадра, градусы (типовое значение)
const rad = (d) => (d * Math.PI) / 180;

/** Вертикальный угол обзора видимой части кадра: видео растянуто на экран с обрезкой краёв. */
export function visibleFov(videoW, videoH, viewW, viewH) {
  if (!videoW || !videoH || !viewW || !viewH) return 60;
  const frameV = videoW >= videoH ? 2 * Math.atan(Math.tan(rad(LONG_SIDE_FOV) / 2) * (videoH / videoW)) : rad(LONG_SIDE_FOV);
  const scale = Math.max(viewW / videoW, viewH / videoH);
  const share = viewH / (videoH * scale); // какая доля высоты кадра видна
  return (2 * Math.atan(Math.tan(frameV / 2) * share) * 180) / Math.PI;
}

/** Ориентация телефона → поворот камеры сцены (как в классическом DeviceOrientationControls). */
const zee = new THREE.Vector3(0, 0, 1);
const euler = new THREE.Euler();
const q0 = new THREE.Quaternion();
const q1 = new THREE.Quaternion(-Math.sqrt(0.5), 0, 0, Math.sqrt(0.5)); // −90° вокруг X: телефон держат вертикально
export function orientationQuaternion(target, alpha, beta, gamma, screenAngle) {
  euler.set(beta, alpha, -gamma, 'YXZ');
  target.setFromEuler(euler);
  target.multiply(q1);
  target.multiply(q0.setFromAxisAngle(zee, -screenAngle));
  return target;
}

/**
 * @param {{ project:object, video:HTMLVideoElement, canvas:HTMLCanvasElement, onState:(s:object)=>void, cancelled?:()=>boolean }} options
 * @returns {Promise<object>} управление наложением
 */
export async function startCameraOverlay({ project, video, canvas, onState, cancelled = () => false }) {
  const aborted = () => { const e = new Error('cancelled'); e.name = 'AbortError'; return e; };
  if (!navigator.mediaDevices?.getUserMedia) {
    const e = new Error('no-camera-api');
    e.name = 'NotSupportedError';
    throw e;
  }
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: false,
    video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1080 } },
  });
  // экран могли закрыть, пока браузер спрашивал разрешение: тогда к видео не прикасаемся — им уже может владеть новый запуск
  if (cancelled()) { stream.getTracks().forEach((t) => t.stop()); throw aborted(); }
  video.srcObject = stream;
  video.muted = true;
  video.playsInline = true;
  try { await video.play(); } catch { /* автозапуск запрещён — кадр появится после касания */ }
  if (cancelled()) {
    stream.getTracks().forEach((t) => t.stop());
    if (video.srcObject === stream) video.srcObject = null;
    throw aborted();
  }

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, premultipliedAlpha: true });
  } catch (e) {
    stream.getTracks().forEach((t) => t.stop());
    if (video.srcObject === stream) video.srcObject = null;
    throw e;
  }
  renderer.setClearColor(0x000000, 0); // фон прозрачный: за моделью видна камера
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight(0xffffff, 0x9088b8, 1.7));
  const sun = new THREE.DirectionalLight(0xffffff, 1.1);
  sun.position.set(6, 12, 8);
  scene.add(sun);

  const rig = new THREE.Group(); // поправка курса: чтобы модель в начале была прямо перед человеком
  const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 4000);
  rig.add(camera);
  scene.add(rig);

  const building = buildBuilding(project, { edges: true, scheme: true });
  const { size, center } = building.userData;
  const bottom = project.groundSlab ? -project.slab : 0;
  // модель держим за центр основания
  building.position.set(-center.x, -bottom, -center.z);
  const holder = new THREE.Group();
  holder.add(building);
  scene.add(holder);
  const floors = project.floors.length;

  const state = {
    ready: false, motion: 'off', scale: 1, distance: 0, levels: floors, opacity: 0.5,
    layers: { wall: true, slab: true, glass: true },
    size: { x: size.x, y: size.y, z: size.z },
  };
  const model = { x: 0, z: -10, yaw: 0, lift: 0, scale: 1 };
  let dirty = true;
  let disposed = false;
  let ori = null;
  let needRecenter = true;
  let raf = 0;
  const emit = () => onState?.({ ...state, layers: { ...state.layers } });

  const forward = new THREE.Vector3();
  const groundDirs = () => {
    camera.getWorldDirection(forward);
    forward.y = 0;
    if (forward.lengthSq() < 1e-6) forward.set(0, 0, -1);
    forward.normalize();
    return { fx: forward.x, fz: forward.z, rx: -forward.z, rz: forward.x };
  };
  const distanceNow = () => Math.hypot(model.x - rig.position.x, model.z - rig.position.z);
  const apply = () => {
    holder.position.set(model.x, -EYE + model.lift, model.z);
    holder.rotation.y = model.yaw;
    holder.scale.setScalar(model.scale);
    state.scale = model.scale;
    state.distance = distanceNow();
    dirty = true;
  };

  const resize = () => {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.fov = visibleFov(video.videoWidth, video.videoHeight, w, h);
    camera.updateProjectionMatrix();
    dirty = true;
  };

  /** Поставить модель перед собой так, чтобы она помещалась в кадр. */
  const fit = (keepScale = false) => {
    if (!keepScale) model.scale = 1;
    // дальность, с которой фасад помещается по ширине, а здание — по высоте (камера на уровне глаз смотрит в горизонт)
    const half = rad(camera.fov) / 2;
    const halfH = Math.atan(Math.tan(half) * camera.aspect);
    const w = size.x * model.scale;
    const depth = size.z * model.scale;
    const above = Math.max(0.5, size.y * model.scale - EYE);
    const dist = Math.max(
      3,
      w / 2 / (Math.tan(halfH) * 0.82) + depth / 2,
      above / Math.tan(half * 0.82) + depth / 2,
      EYE / Math.tan(half * 0.9) + depth / 2,
    );
    const d = groundDirs();
    model.x = d.fx * dist;
    model.z = d.fz * dist;
    model.yaw = Math.atan2(-d.fx, -d.fz); // лицом к человеку
    model.lift = 0;
    apply();
    emit();
  };

  const onOrientation = (e) => {
    if (e.alpha == null || e.beta == null || e.gamma == null) return;
    ori = { alpha: rad(e.alpha), beta: rad(e.beta), gamma: rad(e.gamma) };
    if (state.motion !== 'on') { state.motion = 'on'; emit(); }
    dirty = true;
  };

  const screenAngle = () => rad(window.screen?.orientation?.angle ?? window.orientation ?? 0);
  const loop = () => {
    if (disposed) return;
    raf = requestAnimationFrame(loop);
    if (ori) {
      orientationQuaternion(camera.quaternion, ori.alpha, ori.beta, ori.gamma, screenAngle());
      if (needRecenter) {
        // курс телефона произвольный: разворачиваем сцену так, чтобы взгляд смотрел на модель
        rig.rotation.y = 0;
        rig.updateMatrixWorld(true);
        const d = groundDirs();
        rig.rotation.y = -Math.atan2(-d.fx, -d.fz);
        rig.updateMatrixWorld(true);
        needRecenter = false;
        fit(true);
      }
    }
    if (dirty) {
      dirty = false;
      renderer.render(scene, camera);
    }
  };

  const onMeta = () => { resize(); if (!state.ready) { state.ready = true; fit(); } };
  video.addEventListener('loadedmetadata', onMeta);
  video.addEventListener('resize', resize);
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);
  window.addEventListener('deviceorientation', onOrientation);
  window.addEventListener('orientationchange', resize);

  resize();
  if (video.videoWidth) onMeta();
  apply();
  loop();
  emit();

  const controller = {
    /**
     * Датчики поворота. На iPhone браузер спрашивает разрешение, и только по нажатию — поэтому это отдельный вызов.
     * @returns {Promise<'on'|'denied'|'off'>}
     */
    async enableMotion() {
      const D = window.DeviceOrientationEvent;
      if (!D) return 'off';
      if (typeof D.requestPermission === 'function') {
        try {
          const res = await D.requestPermission();
          if (res !== 'granted') { state.motion = 'denied'; emit(); return 'denied'; }
        } catch { state.motion = 'denied'; emit(); return 'denied'; }
      }
      return state.motion;
    },
    /** Снова поставить модель прямо перед собой, вписав в кадр. */
    fit() { fit(false); },
    /** Сдвиг пальцем: вправо-влево и ближе-дальше. dx, dy — в пикселях экрана. */
    drag(dx, dy) {
      const dist = Math.max(1, distanceNow());
      const mpp = (2 * dist * Math.tan(rad(camera.fov) / 2)) / Math.max(1, canvas.clientHeight); // метров в пикселе на дальности модели
      const d = groundDirs();
      model.x += d.rx * dx * mpp - d.fx * dy * mpp * 2.2;
      model.z += d.rz * dx * mpp - d.fz * dy * mpp * 2.2;
      apply();
      emit();
    },
    /** Сдвиг кнопками, в метрах: вправо и от себя. */
    nudge(right, away) {
      const d = groundDirs();
      model.x += d.rx * right + d.fx * away;
      model.z += d.rz * right + d.fz * away;
      apply();
      emit();
    },
    rotate(deg) { model.yaw += rad(deg); apply(); },
    lift(dy) { model.lift = Math.max(-20, Math.min(50, model.lift + dy)); apply(); },
    /** Масштаб: 1 — натуральная величина. */
    zoom(k) { model.scale = Math.max(0.01, Math.min(4, model.scale * k)); apply(); emit(); },
    setScale(v) { model.scale = Math.max(0.01, Math.min(4, v)); apply(); emit(); },
    setLayers(layers) {
      state.layers = { ...state.layers, ...layers };
      building.traverse((o) => { if (o.userData.kind && o.parent !== building) o.visible = Boolean(state.layers[o.userData.kind]); });
      dirty = true;
      emit();
    },
    setLevels(n) {
      state.levels = Math.max(1, Math.min(floors, n));
      for (const g of building.children) g.visible = g.name === 'roof' ? state.levels >= floors : g.userData.level < state.levels;
      dirty = true;
      emit();
    },
    /** Прозрачность объёмов; рёбра остаются яркими. */
    setOpacity(v) {
      state.opacity = Math.max(0.05, Math.min(1, v));
      const seen = new Set();
      building.traverse((o) => {
        if (!o.isMesh || seen.has(o.material)) return;
        seen.add(o.material);
        const k = o.userData.kind === 'slab' ? 0.85 : 1;
        o.material.opacity = Math.min(1, state.opacity * k);
        o.material.depthWrite = state.opacity > 0.95;
        o.material.transparent = state.opacity <= 0.95;
        o.material.needsUpdate = true;
      });
      dirty = true;
      emit();
    },
    /** Кадр с камеры вместе с моделью — JPEG. */
    async snapshot() {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      const k = Math.min(window.devicePixelRatio || 1, 2);
      const out = document.createElement('canvas');
      out.width = Math.round(w * k);
      out.height = Math.round(h * k);
      const ctx = out.getContext('2d');
      const vw = video.videoWidth;
      const vh = video.videoHeight;
      if (vw && vh) {
        const s = Math.max(out.width / vw, out.height / vh);
        ctx.drawImage(video, (out.width - vw * s) / 2, (out.height - vh * s) / 2, vw * s, vh * s);
      }
      renderer.render(scene, camera); // буфер WebGL живёт только до конца кадра — рисуем и сразу забираем
      ctx.drawImage(renderer.domElement, 0, 0, out.width, out.height);
      return new Promise((resolve, reject) => out.toBlob((b) => (b ? resolve(b) : reject(new Error('snapshot'))), 'image/jpeg', 0.9));
    },
    getState: () => ({ ...state, layers: { ...state.layers } }),
    dispose() {
      if (disposed) return;
      disposed = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener('deviceorientation', onOrientation);
      window.removeEventListener('orientationchange', resize);
      video.removeEventListener('loadedmetadata', onMeta);
      video.removeEventListener('resize', resize);
      stream.getTracks().forEach((t) => t.stop());
      // видео могло уже перейти к следующему запуску (повторное открытие) — чужой поток не трогаем
      if (video.srcObject === stream) video.srcObject = null;
      disposeBuilding(building);
      renderer.dispose();
    },
  };
  return controller;
}
