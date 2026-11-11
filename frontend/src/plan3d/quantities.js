// Ведомость объёмов по модели: стены, проёмы, перекрытия, помещения.

import { wallJoins, wallLength } from './model.js';
import { buildRooms } from './rooms.js';

const r2 = (v) => Math.round(v * 100) / 100;

/** Длина стены для объёма: у примыкания к середине другой стены вычитаем полтолщины той стены. */
export function effectiveLength(wall, joins) {
  let len = wallLength(wall);
  const j = joins.get(wall.id);
  if (j?.a?.kind === 'tee') len -= j.a.t / 2;
  if (j?.b?.kind === 'tee') len -= j.b.t / 2;
  return Math.max(0, len);
}

export function floorQuantities(floor, wallHeight) {
  const joins = wallJoins(floor.walls);
  const groups = new Map();
  let wallFootprint = 0;
  for (const w of floor.walls) {
    const len = effectiveLength(w, joins);
    const g = groups.get(w.t) || { t: w.t, length: 0, gross: 0, openings: 0 };
    g.length += len;
    g.gross += len * wallHeight;
    groups.set(w.t, g);
    wallFootprint += len * w.t;
  }
  const byId = new Map(floor.walls.map((w) => [w.id, w]));
  let doors = 0;
  let windows = 0;
  for (const o of floor.openings) {
    const w = byId.get(o.wallId);
    if (!w) continue;
    const h = Math.max(0, Math.min(o.h, wallHeight - o.sill));
    groups.get(w.t).openings += o.w * h;
    if (o.type === 'window') windows += 1; else doors += 1;
  }
  const walls = [...groups.values()].sort((a, b) => b.t - a.t).map((g) => {
    const net = Math.max(0, g.gross - g.openings);
    return { t: g.t, length: r2(g.length), gross: r2(g.gross), openings: r2(g.openings), net: r2(net), volume: r2(net * g.t) };
  });

  const { rooms, footprint, closed } = buildRooms(floor.walls);
  return {
    walls,
    wallLength: r2(walls.reduce((s, g) => s + g.length, 0)),
    wallArea: r2(walls.reduce((s, g) => s + g.net, 0)),
    wallVolume: r2(walls.reduce((s, g) => s + g.volume, 0)),
    wallFootprint: r2(wallFootprint),
    doors,
    windows,
    rooms: rooms.map((r, i) => ({ n: i + 1, area: r2(r.area), netArea: r2(r.netArea), perimeter: r2(r.perimeter), center: r.center, polygon: r.polygon })),
    roomsNetArea: r2(rooms.reduce((s, r) => s + r.netArea, 0)),
    // площадь перекрытия — по наружному контуру стен
    slabArea: closed ? r2(footprint) : 0,
    closed,
  };
}

export function projectQuantities(project) {
  const wallHeight = Math.max(0.5, project.floorHeight - project.slab);
  const floors = project.floors.map((f) => ({ id: f.id, name: f.name, ...floorQuantities(f, wallHeight) }));
  // плита под каждым этажом (нижнюю можно отключить) и покрытие над последним
  const slabs = [];
  floors.forEach((f, i) => {
    if (i === 0) { if (project.groundSlab) slabs.push({ name: 'Плита пола 1 этажа', area: f.slabArea }); } else slabs.push({ name: `Перекрытие над ${i} этажом`, area: floors[i - 1].slabArea });
  });
  if (floors.length) slabs.push({ name: 'Покрытие', area: floors[floors.length - 1].slabArea });
  const slabArea = slabs.reduce((s, x) => s + x.area, 0);
  const sum = (k) => r2(floors.reduce((s, f) => s + f[k], 0));
  return {
    wallHeight: r2(wallHeight),
    height: r2(project.floors.length * project.floorHeight),
    floors,
    slabs: slabs.map((s) => ({ ...s, volume: r2(s.area * project.slab) })),
    totals: {
      wallLength: sum('wallLength'), wallArea: sum('wallArea'), wallVolume: sum('wallVolume'),
      doors: floors.reduce((s, f) => s + f.doors, 0), windows: floors.reduce((s, f) => s + f.windows, 0),
      roomsNetArea: sum('roomsNetArea'), rooms: floors.reduce((s, f) => s + f.rooms.length, 0),
      slabArea: r2(slabArea), slabVolume: r2(slabArea * project.slab),
      unclosedFloors: floors.filter((f) => !f.closed).length,
    },
  };
}
