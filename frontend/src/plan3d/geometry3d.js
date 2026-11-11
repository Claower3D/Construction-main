// 3D-модель здания из проекта: стены с проёмами, остекление, перекрытия.
// План (x, y) ложится в сцену как (x, высота, −y): сверху модель выглядит так же, как чертёж.

import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { anchorPoints, joinExtension, wallJoins, wallLength } from './model.js';
import { buildRooms } from './rooms.js';

export const COLORS = { wall: 0xe9e3d8, slab: 0x8f93b5, glass: 0x7fd4ff, edge: 0x2a2146, anchorA: 0xf8d27a, anchorB: 0x4fc3ff };

function box(len, height, depth, cx, cy, cz, angle) {
  const g = new THREE.BoxGeometry(len, height, depth);
  g.rotateY(angle);
  g.translate(cx, cy, cz);
  return g;
}

/** Куски стены вдоль её оси: сплошные участки, подоконные и надпроёмные части. */
export function wallPieces(wall, openings, wallHeight, extA = 0, extB = 0) {
  const len = wallLength(wall);
  const ops = openings
    .map((o) => ({ s0: Math.max(0, o.at - o.w / 2), s1: Math.min(len, o.at + o.w / 2), sill: Math.min(o.sill, wallHeight), top: Math.min(o.sill + o.h, wallHeight), type: o.type }))
    .filter((o) => o.s1 - o.s0 > 0.02 && o.top - o.sill > 0.02)
    .sort((a, b) => a.s0 - b.s0);
  const solid = [];
  const voids = [];
  let cursor = -extA;
  for (const o of ops) {
    const s0 = Math.max(o.s0, cursor);
    if (s0 - cursor > 0.005) solid.push({ s0: cursor, s1: s0, y0: 0, y1: wallHeight });
    if (o.s1 - s0 > 0.005) {
      if (o.sill > 0.005) solid.push({ s0, s1: o.s1, y0: 0, y1: o.sill });
      if (wallHeight - o.top > 0.005) solid.push({ s0, s1: o.s1, y0: o.top, y1: wallHeight });
      voids.push({ s0, s1: o.s1, y0: o.sill, y1: o.top, type: o.type });
    }
    cursor = Math.max(cursor, o.s1);
  }
  if (len + extB - cursor > 0.005) solid.push({ s0: cursor, s1: len + extB, y0: 0, y1: wallHeight });
  return { solid, voids };
}

function wallGeometries(floor, wallHeight) {
  const joins = wallJoins(floor.walls);
  const byWall = new Map();
  for (const o of floor.openings) {
    const arr = byWall.get(o.wallId);
    if (arr) arr.push(o); else byWall.set(o.wallId, [o]);
  }
  const walls = [];
  const glass = [];
  for (const w of floor.walls) {
    const len = wallLength(w);
    if (len < 0.02) continue;
    const ux = (w.bx - w.ax) / len;
    const uy = (w.by - w.ay) / len;
    const angle = Math.atan2(uy, ux);
    const j = joins.get(w.id) || {};
    const at = (s) => [w.ax + ux * s, -(w.ay + uy * s)];
    const { solid, voids } = wallPieces(w, byWall.get(w.id) || [], wallHeight, joinExtension(j.a), joinExtension(j.b));
    for (const p of solid) {
      const [x, z] = at((p.s0 + p.s1) / 2);
      walls.push(box(p.s1 - p.s0, p.y1 - p.y0, w.t, x, (p.y0 + p.y1) / 2, z, angle));
    }
    for (const v of voids) {
      if (v.type !== 'window') continue;
      const [x, z] = at((v.s0 + v.s1) / 2);
      glass.push(box(v.s1 - v.s0, v.y1 - v.y0, Math.min(0.04, w.t / 3), x, (v.y0 + v.y1) / 2, z, angle));
    }
  }
  return { walls, glass };
}

/** Плита по наружному контуру стен этажа. Верх плиты — на отметке 0. Без замкнутого контура плиты нет. */
function slabGeometries(floor, slab) {
  return buildRooms(floor.walls).outlines.map((outline) => {
    const shape = new THREE.Shape(outline.map((p) => new THREE.Vector2(p.x, p.y)));
    const g = new THREE.ExtrudeGeometry(shape, { depth: slab, bevelEnabled: false });
    g.rotateX(-Math.PI / 2); // (x, y, глубина) → (x, высота, −y)
    g.translate(0, -slab, 0);
    return g;
  });
}

function merged(list) {
  if (!list.length) return null;
  // у ExtrudeGeometry нет индекса, у BoxGeometry есть — приводим к одному виду
  const flat = list.map((g) => (g.index ? g.toNonIndexed() : g));
  const out = mergeGeometries(flat, false);
  list.forEach((g) => g.dispose());
  flat.forEach((g) => g.dispose());
  return out;
}

/**
 * @param {object} project очищенный проект
 * @param {{ edges?: boolean, anchors?: boolean }} options
 * @returns {THREE.Group} группа с детьми-этажами; userData.size — габариты, userData.center — центр в плане
 */
export function buildBuilding(project, options = {}) {
  const { edges = true, anchors = false } = options;
  const wallHeight = Math.max(0.5, project.floorHeight - project.slab);
  const root = new THREE.Group();
  root.name = project.name || 'building';

  const mats = {
    wall: new THREE.MeshStandardMaterial({ color: COLORS.wall, roughness: 0.92, metalness: 0 }),
    slab: new THREE.MeshStandardMaterial({ color: COLORS.slab, roughness: 0.85, metalness: 0 }),
    glass: new THREE.MeshStandardMaterial({ color: COLORS.glass, roughness: 0.15, metalness: 0, transparent: true, opacity: 0.45 }),
    edge: new THREE.LineBasicMaterial({ color: COLORS.edge }),
  };
  const add = (group, geometry, kind) => {
    if (!geometry) return;
    const mesh = new THREE.Mesh(geometry, mats[kind]);
    mesh.name = kind;
    mesh.userData.kind = kind;
    group.add(mesh);
    if (edges && kind !== 'glass') {
      const lines = new THREE.LineSegments(new THREE.EdgesGeometry(geometry, 30), mats.edge);
      lines.name = `${kind}-edges`;
      lines.userData.kind = kind;
      lines.userData.helper = true;
      group.add(lines);
    }
  };

  const n = project.floors.length;
  project.floors.forEach((floor, i) => {
    const g = wallGeometries(floor, wallHeight);
    const level = new THREE.Group();
    level.name = floor.name || `floor-${i + 1}`;
    level.userData.level = i;
    level.position.y = i * project.floorHeight;
    add(level, merged(g.walls), 'wall');
    add(level, merged(g.glass), 'glass');
    // плита под этажом лежит на стенах этажа ниже и повторяет его контур; под первым этажом — свой контур
    if (i > 0) add(level, merged(slabGeometries(project.floors[i - 1], project.slab)), 'slab');
    else if (project.groundSlab) add(level, merged(slabGeometries(floor, project.slab)), 'slab');
    root.add(level);
  });
  if (n) {
    const roof = new THREE.Group();
    roof.name = 'roof';
    roof.userData.level = n;
    roof.position.y = n * project.floorHeight;
    add(roof, merged(slabGeometries(project.floors[n - 1], project.slab)), 'slab');
    root.add(roof);
  }

  const boxAll = new THREE.Box3().setFromObject(root);
  const size = new THREE.Vector3();
  const center = new THREE.Vector3();
  if (!boxAll.isEmpty()) { boxAll.getSize(size); boxAll.getCenter(center); }
  root.userData.size = { x: size.x, y: size.y, z: size.z };
  root.userData.center = { x: center.x, y: center.y, z: center.z };

  const pts = project.floors[0] ? anchorPoints(project.floors[0]) : null;
  root.userData.anchors = pts ? { a: { x: pts.a.x, z: -pts.a.y }, b: { x: pts.b.x, z: -pts.b.y }, distance: pts.distance } : null;
  if (anchors && pts) {
    const pins = new THREE.Group();
    pins.name = 'anchors';
    pins.userData.helper = true;
    // вешки выше крыши: сам узел спрятан в толще стены
    const top = Math.max(size.y, 2) + 1.2;
    [[pts.a, COLORS.anchorA], [pts.b, COLORS.anchorB]].forEach(([p, color]) => {
      const mat = new THREE.MeshBasicMaterial({ color });
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, top, 12), mat);
      pole.position.set(p.x, top / 2, -p.y);
      const ball = new THREE.Mesh(new THREE.SphereGeometry(0.32, 20, 14), mat);
      ball.position.set(p.x, top, -p.y);
      pins.add(pole, ball);
    });
    root.add(pins);
  }
  return root;
}

export function disposeBuilding(root) {
  if (!root) return;
  const mats = new Set();
  root.traverse((o) => {
    if (o.geometry) o.geometry.dispose();
    if (o.material) mats.add(o.material);
  });
  mats.forEach((m) => m.dispose());
}
