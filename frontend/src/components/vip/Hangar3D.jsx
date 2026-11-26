import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { HANGAR } from './vipSchedule';
import { translate } from '../../i18n';

// Модель ангара завода: 25 × 70 м, двускатная кровля (стены 20 м, конёк 23 м), внутри стальной каркас
// из рам с шагом 7 м. Обшивка полупрозрачная — каркас виден. zone — какое место подсветить
// (см. HANGAR_ZONES): кровля, стена, торец, пол, каркас, площадка вокруг или всё здание.

const GOLD = 0xfbbf24;
const COLORS = { frame: 0xa9bbdc, roof: 0x64748b, wall: 0xb6c2d6, floor: 0x596274, outside: 0x1b2333 };

function label(source, color = '#e9e5f7') {
  const text = translate(source) || source; // подписи рисуются на картинке — переводим их сами
  const c = document.createElement('canvas');
  c.width = 256; c.height = 96;
  const g = c.getContext('2d');
  g.font = '700 54px system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.lineWidth = 8; g.strokeStyle = 'rgba(11,18,32,0.9)';
  g.strokeText(text, 128, 48);
  g.fillStyle = color;
  g.fillText(text, 128, 48);
  const tex = new THREE.CanvasTexture(c);
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthTest: false, transparent: true }));
  s.scale.set(13, 4.9, 1);
  s.renderOrder = 10;
  return s;
}

function beam(a, b, size, mat) {
  const dir = new THREE.Vector3().subVectors(b, a);
  const m = new THREE.Mesh(new THREE.BoxGeometry(size, size, dir.length()), mat);
  m.position.copy(a).addScaledVector(dir, 0.5);
  m.lookAt(b);
  return m;
}

function dimLine(a, b, mat) {
  return new THREE.Line(new THREE.BufferGeometry().setFromPoints([a, b]), mat);
}

export default function Hangar3D({ zone = '', skin = true, height = 380 }) {
  const mountRef = useRef(null);
  const apiRef = useRef(null);

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return undefined;
    const { width: Wd, length: L, eave, ridge, bays } = HANGAR;
    const hw = Wd / 2, hl = L / 2;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0e1424);
    const camera = new THREE.PerspectiveCamera(38, 1, 0.5, 900);
    camera.position.set(60, 36, 64);
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true });
    } catch (e) {
      el.textContent = 'Трёхмерная модель не открылась на этом устройстве.';
      return undefined;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    el.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 1.25));
    const sun = new THREE.DirectionalLight(0xffffff, 1.6);
    sun.position.set(60, 90, 40);
    scene.add(sun);

    const zones = {}; // id → [{ mat, base, opacity }]
    const skins = []; // обшивка: стены и кровля
    const reg = (id, mat) => { (zones[id] = zones[id] || []).push({ mat, base: mat.color.getHex(), opacity: mat.opacity }); return mat; };
    const cover = (id, color, opacity) => reg(id, new THREE.MeshStandardMaterial({ color, transparent: true, opacity, side: THREE.DoubleSide, roughness: 0.7, metalness: 0.1, depthWrite: false }));

    // площадка и пол
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(L + 70, Wd + 70), reg('outside', new THREE.MeshStandardMaterial({ color: COLORS.outside, roughness: 1 })));
    ground.rotation.x = -Math.PI / 2; ground.position.y = -0.05;
    scene.add(ground);
    const grid = new THREE.GridHelper(Math.max(L, Wd) + 70, 14, 0x334155, 0x1e293b);
    grid.position.y = 0.01;
    scene.add(grid);
    const floor = new THREE.Mesh(new THREE.BoxGeometry(L, 0.4, Wd), reg('floor', new THREE.MeshStandardMaterial({ color: COLORS.floor, roughness: 0.9 })));
    floor.position.y = 0.2;
    scene.add(floor);

    // каркас: рамы с шагом L / bays, прогоны кровли, ригели стен, связи в крайних пролётах
    const steel = reg('frame', new THREE.MeshStandardMaterial({ color: COLORS.frame, roughness: 0.45, metalness: 0.6 }));
    const frame = new THREE.Group();
    const V = (x, y, z) => new THREE.Vector3(x, y, z);
    const step = L / bays;
    for (let i = 0; i <= bays; i++) {
      const x = -hl + i * step;
      frame.add(beam(V(x, 0.4, -hw), V(x, eave, -hw), 0.55, steel));
      frame.add(beam(V(x, 0.4, hw), V(x, eave, hw), 0.55, steel));
      frame.add(beam(V(x, eave, -hw), V(x, ridge, 0), 0.5, steel));
      frame.add(beam(V(x, eave, hw), V(x, ridge, 0), 0.5, steel));
      frame.add(beam(V(x, eave, -hw), V(x, eave, hw), 0.22, steel)); // затяжка
    }
    const slopeY = (z) => ridge - (Math.abs(z) / hw) * (ridge - eave);
    for (const z of [-hw, -hw * 0.66, -hw * 0.33, 0, hw * 0.33, hw * 0.66, hw]) {
      frame.add(beam(V(-hl, slopeY(z) + 0.2, z), V(hl, slopeY(z) + 0.2, z), 0.26, steel));
    }
    for (const y of [5, 10, 15]) {
      frame.add(beam(V(-hl, y, -hw), V(hl, y, -hw), 0.22, steel));
      frame.add(beam(V(-hl, y, hw), V(hl, y, hw), 0.22, steel));
    }
    for (const x0 of [-hl, hl - step]) {
      for (const z of [-hw, hw]) {
        frame.add(beam(V(x0, 0.4, z), V(x0 + step, eave, z), 0.16, steel));
        frame.add(beam(V(x0 + step, 0.4, z), V(x0, eave, z), 0.16, steel));
      }
    }
    scene.add(frame);

    // обшивка: две длинные стены, два торца, два ската кровли
    const wallGeo = new THREE.PlaneGeometry(L, eave);
    const north = new THREE.Mesh(wallGeo, cover('wall-n', COLORS.wall, 0.3));
    north.position.set(0, eave / 2, -hw - 0.3);
    const south = new THREE.Mesh(wallGeo, cover('wall-s', COLORS.wall, 0.3));
    south.position.set(0, eave / 2, hw + 0.3);
    scene.add(north, south);
    skins.push(north, south);
    const gable = new THREE.Shape();
    gable.moveTo(-hw, 0); gable.lineTo(hw, 0); gable.lineTo(hw, eave); gable.lineTo(0, ridge); gable.lineTo(-hw, eave); gable.closePath();
    const gableGeo = new THREE.ShapeGeometry(gable);
    const west = new THREE.Mesh(gableGeo, cover('wall-w', COLORS.wall, 0.3));
    west.rotation.y = Math.PI / 2; west.position.x = -hl - 0.3;
    const east = new THREE.Mesh(gableGeo, cover('wall-e', COLORS.wall, 0.3));
    east.rotation.y = Math.PI / 2; east.position.x = hl + 0.3;
    scene.add(west, east);
    skins.push(west, east);
    // ворота в западном торце
    const gate = new THREE.Mesh(new THREE.PlaneGeometry(6, 7), new THREE.MeshStandardMaterial({ color: 0x334155, side: THREE.DoubleSide, roughness: 0.8 }));
    gate.rotation.y = Math.PI / 2; gate.position.set(-hl - 0.45, 3.5, 0);
    scene.add(gate); skins.push(gate);
    const slopeLen = Math.hypot(hw, ridge - eave);
    const roofMat = cover('roof', COLORS.roof, 0.55);
    for (const side of [-1, 1]) {
      const r = new THREE.Mesh(new THREE.PlaneGeometry(L + 1.2, slopeLen + 0.6), roofMat);
      r.position.set(0, (eave + ridge) / 2 + 0.45, side * hw / 2);
      r.rotation.x = -Math.PI / 2 + side * Math.atan2(ridge - eave, hw);
      scene.add(r); skins.push(r);
    }

    // размеры и стороны света
    const dm = new THREE.LineBasicMaterial({ color: 0xfcd34d });
    scene.add(dimLine(V(-hl, 0.3, hw + 6), V(hl, 0.3, hw + 6), dm));
    scene.add(dimLine(V(hl + 6, 0.3, -hw), V(hl + 6, 0.3, hw), dm));
    scene.add(dimLine(V(hl + 6, 0, hw), V(hl + 6, eave, hw), dm));
    scene.add(dimLine(V(hl + 6, 0, 0), V(hl + 6, ridge, 0), dm));
    const put = (s, x, y, z) => { s.position.set(x, y, z); scene.add(s); };
    put(label(`${L} м`, '#fcd34d'), 0, 2.4, hw + 9.5);
    put(label(`${Wd} м`, '#fcd34d'), hl + 9, 2.4, 0);
    put(label(`${eave} м`, '#fcd34d'), hl + 9, eave * 0.5, hw + 1);
    put(label(`${ridge} м`, '#fcd34d'), hl + 9, ridge + 2.6, 0);
    put(label('Север'), -hl * 0.45, 2.4, -hw - 9);
    put(label('Юг'), -hl * 0.6, 2.4, hw + 9.5);
    put(label('Запад'), -hl - 9, 2.4, 0);
    put(label('Восток'), hl + 9, 2.4, -hw - 4);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 9, 0);
    controls.enableDamping = true;
    controls.maxPolarAngle = Math.PI / 2 - 0.03;
    controls.minDistance = 30;
    controls.maxDistance = 320;
    controls.update();

    // подсветка места работы
    const api = { skin: (on) => { skins.forEach((m) => { m.visible = on; }); } };
    api.zone = (id) => {
      for (const [zid, list] of Object.entries(zones)) {
        const on = !!id && (id === zid || (id === 'all' && zid !== 'outside'));
        const soft = id === 'all';
        for (const z of list) {
          z.mat.color.setHex(on ? (zid === 'outside' ? 0x4a3c12 : GOLD) : z.base);
          if (z.mat.transparent) z.mat.opacity = on ? (soft ? 0.34 : 0.72) : z.opacity;
          if ('emissive' in z.mat) { z.mat.emissive.setHex(on && zid !== 'outside' ? 0x7a5200 : 0x000000); z.mat.emissiveIntensity = on ? (soft ? 0.35 : 0.9) : 0; }
        }
      }
    };
    apiRef.current = api;

    const resize = () => {
      const w = el.clientWidth || 600, h = el.clientHeight || 380;
      renderer.setSize(w, h, false);
      renderer.domElement.style.width = '100%';
      renderer.domElement.style.height = '100%';
      camera.aspect = w / h;
      // узкий экран телефона: отодвигаем камеру, чтобы ангар помещался целиком
      const dist = 104 * Math.min(2.4, Math.max(1, 1.15 / camera.aspect));
      const dir = camera.position.clone().sub(controls.target).normalize();
      camera.position.copy(controls.target).addScaledVector(dir, dist);
      camera.updateProjectionMatrix();
    };
    resize();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(resize) : null;
    if (ro) ro.observe(el);

    let raf = 0;
    const tick = () => { controls.update(); renderer.render(scene, camera); raf = requestAnimationFrame(tick); };
    tick();

    return () => {
      cancelAnimationFrame(raf);
      if (ro) ro.disconnect();
      controls.dispose();
      scene.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) { if (o.material.map) o.material.map.dispose(); o.material.dispose(); }
      });
      renderer.dispose();
      if (renderer.domElement.parentNode === el) el.removeChild(renderer.domElement);
      apiRef.current = null;
    };
  }, []);

  useEffect(() => { if (apiRef.current) apiRef.current.zone(zone); }, [zone]);
  useEffect(() => { if (apiRef.current) apiRef.current.skin(skin); }, [skin]);
  // первая подсветка — после постройки сцены
  useEffect(() => { const t = setTimeout(() => { if (apiRef.current) { apiRef.current.zone(zone); apiRef.current.skin(skin); } }, 0); return () => clearTimeout(t); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return <div ref={mountRef} className="vob-3d" style={{ height }} role="img" aria-label={`Модель ангара ${HANGAR.width} на ${HANGAR.length} метров, высота в коньке ${HANGAR.ridge} метра`} />;
}
