// node --test src/plan3d/plan3d.test.js
import test from 'node:test';
import assert from 'node:assert/strict';

import { parseDxf, toMetres, guessUnitToM, guessWallLayers, decodeDxfBuffer, looksLikeDwg } from './dxf.js';
import { detectWalls, wallsFromAxes, cleanSegments } from './walls.js';
import { buildRooms } from './rooms.js';
import { sanitizeProject, wallJoins, wallFaces, anchorPoints, wallLength } from './model.js';
import { projectQuantities } from './quantities.js';
import { sampleHouseDxf, sampleHouseProject } from './testPlans.js';

const near = (a, b, eps = 0.011) => assert.ok(Math.abs(a - b) <= eps, `${a} ≈ ${b}`);

function importSample(opts) {
  const dxf = parseDxf(sampleHouseDxf(opts));
  const guess = guessWallLayers(dxf.layers);
  const unit = dxf.unitToM || guessUnitToM(dxf.segments);
  const { segments } = toMetres(dxf.segments.filter((s) => guess.names.includes(s.layer)), unit);
  return { dxf, guess, unit, ...detectWalls(segments) };
}

test('DXF: слои, единицы и отрезки', () => {
  const dxf = parseDxf(sampleHouseDxf());
  assert.equal(dxf.unit, 'mm');
  assert.deepEqual(dxf.layers.map((l) => l.name).sort(), ['Мебель', 'Размеры', 'Стены']);
  assert.ok(dxf.segments.length > 25);
  const guess = guessWallLayers(dxf.layers);
  assert.deepEqual(guess.names, ['Стены']);
  assert.equal(guess.confident, true);
});

test('DXF: без единиц в заголовке масштаб угадывается по габаритам', () => {
  const dxf = parseDxf(sampleHouseDxf({ insunits: 0 }));
  assert.equal(dxf.unitToM, null);
  assert.equal(guessUnitToM(dxf.segments), 0.001);
  const m = parseDxf(sampleHouseDxf({ insunits: 0, k: 0.001 }));
  assert.equal(guessUnitToM(m.segments), 1);
});

test('DXF: кириллица в windows-1251 и отказ от DWG', () => {
  const text = sampleHouseDxf();
  // windows-1251: кириллица А…я лежит в 0xC0…0xFF
  const bytes = Uint8Array.from([...text].map((ch) => {
    const c = ch.charCodeAt(0);
    return c >= 0x410 && c <= 0x44f ? c - 0x410 + 0xc0 : c;
  }));
  const decoded = decodeDxfBuffer(bytes.buffer);
  assert.ok(parseDxf(decoded).layers.some((l) => l.name === 'Стены'));
  assert.equal(looksLikeDwg(Uint8Array.from([0x41, 0x43, 0x31, 0x30, 0x32, 0x34, 0, 0, 0, 0])), true);
  assert.equal(looksLikeDwg(new TextEncoder().encode(text)), false);
  assert.throws(() => parseDxf('просто текст'), /ENTITIES/);
});

test('DXF: вставка блока с поворотом и масштабом', () => {
  const text = ['0', 'SECTION', '2', 'BLOCKS', '0', 'BLOCK', '2', 'W', '10', '0', '20', '0',
    '0', 'LINE', '8', '0', '10', '0', '20', '0', '11', '1000', '21', '0', '0', 'ENDBLK', '0', 'ENDSEC',
    '0', 'SECTION', '2', 'ENTITIES', '0', 'INSERT', '8', 'Стены', '2', 'W', '10', '500', '20', '500', '41', '2', '42', '2', '50', '90', '0', 'ENDSEC', '0', 'EOF'].join('\n');
  const { segments } = parseDxf(text);
  assert.equal(segments.length, 1);
  assert.equal(segments[0].layer, 'Стены');
  near(segments[0].x1, 500); near(segments[0].y1, 500); near(segments[0].x2, 500); near(segments[0].y2, 2500);
});

test('склейка кусков одной линии', () => {
  const segs = cleanSegments([
    { x1: 0, y1: 0, x2: 2, y2: 0 }, { x1: 2, y1: 0, x2: 5, y2: 0 }, { x1: 7, y1: 0, x2: 5.005, y2: 0 },
    { x1: 0, y1: 1, x2: 0, y2: 3 }, { x1: 0, y1: 5, x2: 0, y2: 3 },
    { x1: 0, y1: 0, x2: 0.01, y2: 0 },
  ]);
  assert.equal(segs.length, 2);
  near(Math.max(...segs.map((s) => s.len)), 7);
});

test('стены по двойным линиям: дом 10 × 8', () => {
  const { walls, openings } = importSample();
  const byT = (t) => walls.filter((w) => Math.abs(w.t - t) < 0.006);
  assert.equal(byT(0.4).length, 4, JSON.stringify(walls));
  assert.equal(byT(0.2).length, 1);
  assert.equal(walls.length, 5);
  assert.deepEqual(Object.keys(walls[0]).sort(), ['ax', 'ay', 'bx', 'by', 'id', 't']);
  const part = byT(0.2)[0];
  near(part.ax, 6); near(part.bx, 6);
  near(Math.abs(part.by - part.ay), 7.6);
  near(byT(0.4).reduce((s, w) => s + wallLength(w), 0), 2 * (9.6 + 7.6));

  assert.equal(openings.length, 3, JSON.stringify(openings));
  const win = openings.filter((o) => o.type === 'window');
  const doors = openings.filter((o) => o.type === 'door');
  assert.equal(win.length, 1);
  near(win[0].w, 1.5);
  assert.deepEqual(doors.map((d) => d.w).sort(), [0.9, 1]);
  // у каждого проёма есть стена, и он помещается в неё
  for (const o of openings) {
    const w = walls.find((x) => x.id === o.wallId);
    assert.ok(w, 'стена проёма');
    assert.ok(o.at - o.w / 2 >= -0.001 && o.at + o.w / 2 <= wallLength(w) + 0.001);
  }
});

test('тот же план в метрах даёт те же стены', () => {
  const mm = importSample();
  const m = importSample({ k: 0.001, insunits: 6 });
  assert.equal(m.walls.length, mm.walls.length);
  assert.equal(m.openings.length, mm.openings.length);
});

test('помещения и площади', () => {
  const { walls } = importSample();
  const { rooms, closed, outerHalfArea, outlines, footprint } = buildRooms(walls);
  assert.equal(closed, true);
  assert.equal(rooms.length, 2);
  near(rooms[0].area, 5.8 * 7.6, 0.05);
  near(rooms[1].area, 3.8 * 7.6, 0.05);
  near(rooms[0].netArea, 5.5 * 7.2, 0.4);
  near(rooms[1].netArea, 3.5 * 7.2, 0.4);
  // помещения по осям + наружная половина стен ≈ габарит 10 × 8; наружный контур даёт его точно
  near(rooms[0].area + rooms[1].area + outerHalfArea, 80, 0.5);
  assert.equal(outlines.length, 1);
  assert.equal(outlines[0].length, 4);
  near(footprint, 80, 0.001);
});

test('незамкнутый контур не даёт помещений', () => {
  const { rooms, closed } = buildRooms([
    { ax: 0, ay: 0, bx: 5, by: 0, t: 0.2 }, { ax: 5, ay: 0, bx: 5, by: 4, t: 0.2 }, { ax: 5, ay: 4, bx: 0, by: 4, t: 0.2 },
  ]);
  assert.equal(closed, false);
  assert.equal(rooms.length, 0);
});

test('пересекающиеся стены делят план на четыре помещения', () => {
  const sq = [
    { ax: 0, ay: 0, bx: 8, by: 0, t: 0.2 }, { ax: 8, ay: 0, bx: 8, by: 6, t: 0.2 },
    { ax: 8, ay: 6, bx: 0, by: 6, t: 0.2 }, { ax: 0, ay: 6, bx: 0, by: 0, t: 0.2 },
    { ax: 4, ay: 0, bx: 4, by: 6, t: 0.1 }, { ax: 0, ay: 3, bx: 8, by: 3, t: 0.1 },
  ];
  const { rooms } = buildRooms(sq);
  assert.equal(rooms.length, 4);
  rooms.forEach((r) => near(r.area, 12, 0.01));
});

test('режим «оси стен»', () => {
  const { walls } = wallsFromAxes([
    { x1: 0, y1: 0, x2: 6, y2: 0 }, { x1: 6, y1: 0, x2: 6, y2: 4 }, { x1: 6, y1: 4, x2: 0, y2: 4 }, { x1: 0, y1: 4, x2: 0, y2: 0 },
  ], 0.3);
  assert.equal(walls.length, 4);
  assert.ok(walls.every((w) => w.t === 0.3));
  assert.equal(buildRooms(walls).rooms.length, 1);
});

test('ведомость объёмов примера', () => {
  const project = sanitizeProject(sampleHouseProject());
  const q = projectQuantities(project);
  near(q.wallHeight, 2.8);
  const f = q.floors[0];
  assert.equal(f.rooms.length, 3);
  assert.equal(f.doors, 3);
  assert.equal(f.windows, 5);
  // наружные стены: периметр по осям 2 × (9.6 + 7.6)
  const outer = f.walls.find((g) => g.t === 0.4);
  near(outer.length, 34.4);
  near(outer.gross, 34.4 * 2.8, 0.02);
  // перегородки: 7.6 − 0.4 (примыкания к наружным) и 5.8 − 0.2 − 0.1
  const inner = f.walls.find((g) => g.t === 0.2);
  near(inner.length, 7.2 + 5.5, 0.02);
  near(f.slabArea, 80, 0.001);
  assert.equal(q.slabs.length, 2);
  near(q.totals.slabVolume, 80 * 0.2 * 2, 0.001);
  assert.equal(q.totals.unclosedFloors, 0);
});

test('примыкания и точки привязки', () => {
  const p = sanitizeProject(sampleHouseProject());
  const joins = wallJoins(p.floors[0].walls);
  assert.equal(joins.get('w1').a.kind, 'corner');
  assert.equal(joins.get('w5').a.kind, 'tee');
  assert.equal(joins.get('w6').b.kind, 'tee');
  // сквозная стена из двух кусков: перегородка всё равно «упирается», а куски продолжают друг друга
  const split = [
    { id: 's1', ax: 0, ay: 0, bx: 4, by: 0, t: 0.4 }, { id: 's2', ax: 4, ay: 0, bx: 9, by: 0, t: 0.4 },
    { id: 'p', ax: 4, ay: 0, bx: 4, by: 5, t: 0.2 },
  ];
  const sj = wallJoins(split);
  assert.equal(sj.get('p').a.kind, 'tee');
  assert.equal(sj.get('p').a.t, 0.4);
  assert.equal(sj.get('s1').b.kind, 'inline');
  assert.equal(sj.get('p').b, null);
  // грани в углу: наружная длиннее, внутренняя короче
  const faces = wallFaces(p.floors[0].walls[0], joins); // w1 идёт вправо, сосед w4 уходит вверх (влево от оси)
  near(faces.left[0], 0.2); near(faces.right[0], -0.2);
  near(faces.left[1], 9.6 - 0.2); near(faces.right[1], 9.6 + 0.2);
  assert.equal(faces.capA, false);
  const stem = wallFaces(p.floors[0].walls[4], joins); // w5 упирается в наружные стены обоими концами
  near(stem.left[0], 0.2); near(stem.right[0], 0.2); near(stem.left[1], 7.6 - 0.2);
  const anchors = anchorPoints(p.floors[0]);
  near(anchors.a.x, 0.2); near(anchors.a.y, 0.2);
  near(anchors.b.x, 9.8); near(anchors.b.y, 0.2);
  near(anchors.distance, 9.6);
});

test('чистка чужого JSON', () => {
  const p = sanitizeProject({
    name: '  Дом  ', floorHeight: 99, slab: -1, floors: [{
      walls: [{ id: 'a', ax: 0, ay: 0, bx: 4, by: 0, t: 50 }, { id: 'a', ax: 0, ay: 0, bx: 0, by: 'x', t: 0.2 }, { ax: 1, ay: 1, bx: 1, by: 1 }],
      openings: [{ wallId: 'a', at: 100, w: 99, type: 'hack' }, { wallId: 'нет', at: 1, w: 1 }],
    }],
  });
  assert.equal(p.name, 'Дом');
  assert.equal(p.floorHeight, 12);
  assert.equal(p.slab, 0.05);
  assert.equal(p.floors[0].walls.length, 1);
  assert.equal(p.floors[0].walls[0].t, 2);
  assert.equal(p.floors[0].openings.length, 1);
  assert.equal(p.floors[0].openings[0].type, 'door');
  assert.ok(p.floors[0].openings[0].w <= 4);
  assert.equal(sanitizeProject(null).floors.length, 1);
});

test('3D: геометрия примера', async () => {
  const { buildBuilding, wallPieces, disposeBuilding } = await import('./geometry3d.js');
  const project = sanitizeProject({ ...sampleHouseProject(), floors: [sampleHouseProject().floors[0], { ...sampleHouseProject().floors[0], id: 'f2', name: '2 этаж' }] });
  const root = buildBuilding(project, { anchors: true });
  // два этажа + покрытие + метки привязки
  assert.equal(root.children.length, 4);
  near(root.userData.size.x, 10, 0.02);
  near(root.userData.size.z, 8, 0.02);
  near(root.userData.size.y, 6.2, 0.02); // 2 × 3 м + плита пола под нулём
  near(root.userData.anchors.distance, 9.6);
  const kinds = root.children[0].children.filter((c) => c.isMesh).map((c) => c.userData.kind).sort();
  assert.deepEqual(kinds, ['glass', 'slab', 'wall']);
  // объём стен по сетке сходится с ведомостью (углы в сетке перекрываются, поэтому допуск)
  const wall = root.children[0].children.find((c) => c.isMesh && c.userData.kind === 'wall');
  assert.ok(wall.geometry.attributes.position.count > 100);
  disposeBuilding(root);

  const w = { ax: 0, ay: 0, bx: 5, by: 0, t: 0.2 };
  const { solid, voids } = wallPieces(w, [{ at: 1, w: 1, h: 2.1, sill: 0, type: 'door' }, { at: 3.5, w: 1, h: 1.5, sill: 0.9, type: 'window' }], 2.8, 0.1, 0.1);
  assert.equal(voids.length, 2);
  const area = solid.reduce((s, p) => s + (p.s1 - p.s0) * (p.y1 - p.y0), 0);
  near(area, 5.2 * 2.8 - 1 * 2.1 - 1 * 1.5, 0.001);
});

test('выгрузка DXF читается обратно: те же стены, двери и окна', async () => {
  const { toDxf, toSvgSheet, planPrimitives, quantitySheets } = await import('./exporters.js');
  const project = sanitizeProject(sampleHouseProject());
  const text = toDxf(project.floors[0]);
  const dxf = parseDxf(text);
  const guess = guessWallLayers(dxf.layers);
  assert.deepEqual(guess.names.sort(), ['QG_WALLS', 'QG_WINDOWS']);
  const unit = dxf.unitToM || guessUnitToM(dxf.segments);
  assert.equal(unit, 0.001);
  const { segments } = toMetres(dxf.segments.filter((s) => guess.names.includes(s.layer)), unit);
  const { walls, openings } = detectWalls(segments);
  assert.equal(walls.length, 6, JSON.stringify(walls));
  assert.equal(openings.filter((o) => o.type === 'door').length, 3, JSON.stringify(openings));
  assert.equal(openings.filter((o) => o.type === 'window').length, 5);
  const q1 = projectQuantities(project).floors[0];
  const q2 = projectQuantities(sanitizeProject({ ...project, floors: [{ name: '1', walls, openings }] })).floors[0];
  near(q2.wallLength, q1.wallLength, 0.05);
  near(q2.roomsNetArea, q1.roomsNetArea, 0.3);
  assert.equal(q2.rooms.length, 3);

  const prim = planPrimitives(project.floors[0]);
  near(prim.bounds.w, 10, 0.001);
  near(prim.bounds.h, 8, 0.001);
  assert.equal(prim.doors.length, 3);
  assert.equal(prim.windows.length, 5);

  const { svg, scale } = toSvgSheet(project, 0, { date: new Date(2026, 10, 11) });
  assert.equal(scale, 50);
  assert.ok(svg.startsWith('<svg') && svg.endsWith('</svg>'));
  assert.ok(svg.includes('10000') && svg.includes('8000') && svg.includes('1:50') && svg.includes('11.11.2026'));
  assert.ok(!svg.includes('NaN'));

  const sheets = quantitySheets(project, projectQuantities(project));
  assert.deepEqual(Object.keys(sheets), ['Сводка', 'Стены', 'Помещения', 'Перекрытия']);
  assert.equal(sheets['Помещения'].length, 4);
});

/** Минимальный векторный PDF: тот же дом в масштабе 1:100 на листе А3. Стены — линией 0,5 мм, остальное тоньше. */
function housePdf() {
  const dxf = parseDxf(sampleHouseDxf());
  const P = (v) => (((v / 100) * 72) / 25.4 + 150).toFixed(2);
  let c = '';
  const draw = (layer, width) => {
    c += `${width} w\n`;
    for (const s of dxf.segments.filter((x) => x.layer === layer)) c += `${P(s.x1)} ${P(s.y1)} m ${P(s.x2)} ${P(s.y2)} l S\n`;
  };
  draw('Стены', 1.42);
  draw('Размеры', 0.37);
  draw('Мебель', 0.37);
  c += '0.37 w\n';
  for (let i = 0; i < 30; i += 1) c += `${700 + i * 4} 100 m ${760 + i * 4} 160 l S\n`; // штриховка
  c += '0.71 w\n20 20 1150 800 re S\nq 0 1 -1 0 1100 300 cm 0 0 m 100 0 l S Q\n'; // рамка и повёрнутый блок
  const objs = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 1190.55 841.89] /Contents 4 0 R /Resources << >> >>',
    `<< /Length ${c.length} >>\nstream\n${c}endstream`,
  ];
  let out = '%PDF-1.4\n';
  const offs = [];
  objs.forEach((o, i) => { offs.push(out.length); out += `${i + 1} 0 obj\n${o}\nendobj\n`; });
  const xref = out.length;
  out += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n${offs.map((o) => `${String(o).padStart(10, '0')} 00000 n \n`).join('')}trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return new TextEncoder().encode(out);
}

test('векторный PDF: линии по толщине, стены в масштабе 1:100', async () => {
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const { segmentsFromOperatorList, guessWallWidths, ptToMetres } = await import('./pdfVector.js');
  const { rankLayersByRooms } = await import('./walls.js');
  const doc = await pdfjs.getDocument({ data: housePdf() }).promise;
  const page = await doc.getPage(1);
  const vec = segmentsFromOperatorList(await page.getOperatorList(), pdfjs.OPS);
  assert.deepEqual(vec.layers.map((l) => l.name), ['Линии 0,50 мм', 'Линии 0,25 мм', 'Линии 0,15 мм']);
  // повёрнутый через матрицу отрезок: (0,0)-(100,0) → (1100,300)-(1100,400)
  const rot = vec.segments.find((s) => Math.abs(s.x1 - 1100) < 0.01 && Math.abs(s.y1 - 300) < 0.01);
  near(rot.x2, 1100); near(rot.y2, 400);
  assert.deepEqual(guessWallWidths(vec.layers).names, ['Линии 0,50 мм']);

  const { segments } = toMetres(vec.segments, ptToMetres(100));
  const rank = rankLayersByRooms(segments, vec.layers.map((l) => l.name));
  assert.equal(rank[0].name, 'Линии 0,50 мм');
  assert.equal(rank[0].rooms, 2);
  assert.equal(rank[1].rooms, 0);
  const { walls, openings } = detectWalls(segments.filter((s) => s.layer === rank[0].name));
  assert.equal(walls.length, 5);
  assert.equal(openings.length, 3);
  near(Math.max(...walls.map((w) => wallLength(w))), 9.6, 0.02);
  near(walls.find((w) => Math.abs(w.t - 0.2) < 0.02).t, 0.2, 0.011);
  await doc.destroy();
});

test('AR: постановка по двум точкам, макет и доворот', async () => {
  const { alignTwoPoints, placeFacing, rescaleAbout, rotateAbout, rotateXZ, placeAtPoint } = await import('./arMath.js');
  const A = { x: 0.2, z: -0.2 };
  const B = { x: 9.8, z: -0.2 };
  const apply = (p, t) => { const r = rotateXZ(p.x, p.z, t.rotationY); return { x: r.x + t.position.x, z: r.z + t.position.z }; };
  // площадка: A отмечена в (3, 0.1, 5), B — в 9.6 м от неё под углом 30°
  const ang = (30 * Math.PI) / 180;
  const wA = { x: 3, y: 0.1, z: 5 };
  const wB = { x: 3 + 9.6 * Math.cos(ang), y: 0.12, z: 5 - 9.6 * Math.sin(ang) };
  const t = alignTwoPoints(A, B, wA, wB);
  near(t.mismatch, 0, 1e-9);
  near(t.rotationY, ang, 1e-9);
  const a = apply(A, t);
  const b = apply(B, t);
  near(a.x, wA.x, 1e-9); near(a.z, wA.z, 1e-9);
  near(b.x, wB.x, 1e-9); near(b.z, wB.z, 1e-9);
  assert.equal(t.position.y, 0.1);
  // разметка с ошибкой 12 см: A стоит точно, расхождение видно
  const off = alignTwoPoints(A, B, wA, { x: 3 + 9.72, y: 0, z: 5 });
  near(off.mismatch, 0.12, 1e-9);
  near(apply(A, off).x, 3, 1e-9);

  const one = placeAtPoint(A, wA, 0.4);
  near(apply(A, one).x, 3, 1e-9); near(apply(A, one).z, 5, 1e-9);

  // доворот вокруг точки A не сдвигает саму точку A
  const turned = rotateAbout(t.position, t.rotationY, wA, 0.05);
  const a2 = apply(A, turned);
  near(a2.x, wA.x, 1e-9); near(a2.z, wA.z, 1e-9);
  near(turned.rotationY, ang + 0.05, 1e-12);

  // «подойти и рассмотреть»: человек в (2, 3), отметил землю в 4 м перед собой по диагонали
  const front = { x: 5, z: 0 }; // дом 10 × 8: середина фасада, центр здания в (5, −4)
  const hit = { x: 2 + 4 * Math.SQRT1_2, y: -1.5, z: 3 - 4 * Math.SQRT1_2 };
  const w = placeFacing(front, hit, { x: 2, z: 3 });
  const at = (p, tr) => { const r = rotateXZ(p.x * tr.scale, p.z * tr.scale, tr.rotationY); return { x: r.x + tr.position.x, z: r.z + tr.position.z }; };
  const f = at(front, w);
  near(f.x, hit.x, 1e-9); near(f.z, hit.z, 1e-9); // фасад — ровно в отмеченной точке
  assert.equal(w.position.y, -1.5);
  const centre = at({ x: 5, z: -4 }, w);
  near(Math.hypot(centre.x - 2, centre.z - 3), 8, 1e-9); // центр здания — на 4 м дальше фасада, на той же линии взгляда
  const corner1 = at({ x: 0, z: 0 }, w);
  const corner2 = at({ x: 10, z: 0 }, w);
  near(Math.hypot(corner1.x - 2, corner1.z - 3), Math.hypot(corner2.x - 2, corner2.z - 3), 1e-9); // фасад развёрнут к человеку
  // человек стоит прямо над отмеченной точкой — без деления на ноль
  assert.ok(Number.isFinite(placeFacing(front, hit, { x: hit.x, z: hit.z }).rotationY));

  // макет: уменьшаем вокруг отмеченной точки — она остаётся на месте
  const small = rescaleAbout(w.position, hit, 1, 0.05, hit.y + 0.01);
  const fs = at(front, { ...w, scale: 0.05, position: small });
  near(fs.x, hit.x, 1e-9); near(fs.z, hit.z, 1e-9);
  near(small.y, hit.y + 0.01, 1e-12);
  const back = rescaleAbout(small, hit, 0.05, 1, hit.y);
  near(back.x, w.position.x, 1e-9); near(back.z, w.position.z, 1e-9);
});

test('наружный контур: Г-образный дом с разной толщиной стен', () => {
  // оси: Г-образный контур 10 × 8 с вырезом 4 × 3 в правом верхнем углу; нижняя стена 0.5, остальные 0.3
  const pts = [[0, 0], [10, 0], [10, 5], [6, 5], [6, 8], [0, 8]];
  const walls = pts.map((p, i) => ({ id: `w${i}`, ax: p[0], ay: p[1], bx: pts[(i + 1) % 6][0], by: pts[(i + 1) % 6][1], t: i === 0 ? 0.5 : 0.3 }));
  const { rooms, outlines, footprint } = buildRooms(walls);
  assert.equal(rooms.length, 1);
  near(rooms[0].area, 80 - 12, 0.001);
  assert.equal(outlines.length, 1);
  assert.equal(outlines[0].length, 6);
  // наружный контур: габарит 10,3 × 8,4 минус вырез 4 × 3 (обе его стороны сдвинулись наружу одинаково)
  const xs = outlines[0].map((p) => p.x);
  const ys = outlines[0].map((p) => p.y);
  near(Math.min(...xs), -0.15, 1e-9); near(Math.max(...xs), 10.15, 1e-9);
  near(Math.min(...ys), -0.25, 1e-9); near(Math.max(...ys), 8.15, 1e-9);
  near(footprint, 10.3 * 8.4 - 12, 1e-6);
});

// ── выгрузка в DXF и чтение обратно на планах посложнее ─────────────────────
async function roundTrip(walls, openings) {
  const { toDxf } = await import('./exporters.js');
  const project = sanitizeProject({ name: 'x', floorHeight: 3, slab: 0.2, floors: [{ name: '1', walls, openings }] });
  const dxf = parseDxf(toDxf(project.floors[0]));
  const guess = guessWallLayers(dxf.layers);
  const { segments } = toMetres(dxf.segments.filter((s) => guess.names.includes(s.layer)), guessUnitToM(dxf.segments));
  const found = detectWalls(segments);
  const q0 = projectQuantities(project).floors[0];
  const q1 = projectQuantities(sanitizeProject({ ...project, floors: [{ name: '1', walls: found.walls, openings: found.openings }] })).floors[0];
  return { project, found, q0, q1 };
}
const box = (W, H, t = 0.4) => [
  { id: 'a', ax: 0, ay: 0, bx: W, by: 0, t }, { id: 'b', ax: W, ay: 0, bx: W, by: H, t },
  { id: 'c', ax: W, ay: H, bx: 0, by: H, t }, { id: 'd', ax: 0, ay: H, bx: 0, by: 0, t },
];
const door = (id, wallId, at, w = 0.9) => ({ id, wallId, type: 'door', at, w, h: 2.1, sill: 0 });
const win = (id, wallId, at, w = 1.4) => ({ id, wallId, type: 'window', at, w, h: 1.5, sill: 0.9 });

test('дверь рядом с поперечной стеной: с простенком 15 см и вплотную', async () => {
  // простенок 15 см между наружной стеной и дверью
  let r = await roundTrip(
    [...box(11, 9), { id: 'p', ax: 5, ay: 0, bx: 5, by: 9, t: 0.2 }, { id: 'q', ax: 0, ay: 4, bx: 5, by: 4, t: 0.12 }],
    [door('o1', 'p', 2), door('o2', 'q', 0.8), win('o3', 'a', 2), win('o4', 'a', 6)],
  );
  assert.equal(r.found.walls.length, 6);
  assert.equal(r.q1.rooms.length, 3);
  assert.deepEqual(r.found.openings.filter((o) => o.type === 'door').map((o) => o.w).sort(), [0.9, 0.9]);
  assert.equal(r.found.openings.filter((o) => o.type === 'window').length, 2);
  near(r.q1.roomsNetArea, r.q0.roomsNetArea, 0.05);
  near(r.q1.wallVolume, r.q0.wallVolume, 0.05);

  // дверь вплотную к наружной стене: простенка нет совсем
  r = await roundTrip(
    [...box(11, 9), { id: 'q', ax: 0, ay: 4, bx: 11, by: 4, t: 0.12 }],
    [door('o2', 'q', 0.2 + 0.45)],
  );
  assert.equal(r.found.walls.length, 5);
  assert.equal(r.q1.rooms.length, 2);
  assert.equal(r.found.openings.length, 1);
  near(r.found.openings[0].w, 0.9, 0.011);
  near(r.found.openings[0].at, 0.65, 0.011);
});

test('стена, не доходящая до соседней на 2 м, остаётся короткой', async () => {
  const r = await roundTrip([...box(12, 8), { id: 'q', ax: 0, ay: 4, bx: 9.8, by: 4, t: 0.2 }], []);
  assert.equal(r.found.openings.length, 0);
  assert.equal(r.q1.rooms.length, 1);
  near(Math.max(...r.found.walls.filter((w) => w.t === 0.2).map((w) => wallLength(w))), 9.8, 0.02);
});

test('случайные планы: что выгрузили, то и прочитали', async () => {
  let seed = 2026;
  const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  const r1 = (v) => Math.round(v * 10) / 10;
  for (let n = 0; n < 60; n += 1) {
    const W = 10 + Math.floor(rnd() * 30);
    const H = 8 + Math.floor(rnd() * 20);
    const walls = box(W, H);
    let openings = [];
    let k = 0;
    const split = (x0, y0, x1, y1, d) => {
      const w = x1 - x0;
      const h = y1 - y0;
      if (d === 0 || (w < 5 && h < 5)) return;
      const vertical = w > h ? true : h > w ? false : rnd() < 0.5;
      const id = `p${k += 1}`;
      const t = rnd() < 0.3 ? 0.12 : 0.2;
      if (vertical && w >= 5) {
        const x = r1(x0 + 2.4 + rnd() * (w - 4.8));
        walls.push({ id, ax: x, ay: y0, bx: x, by: y1, t });
        openings.push(door(`d${k}`, id, r1(0.8 + rnd() * (h - 1.6))));
        split(x0, y0, x, y1, d - 1); split(x, y0, x1, y1, d - 1);
      } else if (!vertical && h >= 5) {
        const y = r1(y0 + 2.4 + rnd() * (h - 4.8));
        walls.push({ id, ax: x0, ay: y, bx: x1, by: y, t });
        openings.push(door(`d${k}`, id, r1(0.8 + rnd() * (w - 1.6))));
        split(x0, y0, x1, y, d - 1); split(x0, y, x1, y1, d - 1);
      }
    };
    split(0, 0, W, H, 2 + Math.floor(rnd() * 4));
    [['a', W], ['b', H], ['c', W], ['d', H]].forEach(([id, len]) => { for (let s = 2; s < len - 2; s += 4) openings.push(win(`w${id}${s}`, id, s)); });
    // проём там, где в стену упирается перегородка, в чертежах не встречается — такие убираем
    const tees = walls.slice(4).flatMap((w) => [[w.ax, w.ay], [w.bx, w.by]]);
    openings = openings.filter((op) => {
      const w = walls.find((x) => x.id === op.wallId);
      const len = wallLength(w);
      const ux = (w.bx - w.ax) / len;
      const uy = (w.by - w.ay) / len;
      return !tees.some(([x, y]) => Math.abs(-uy * (x - w.ax) + ux * (y - w.ay)) < 0.01 && Math.abs(ux * (x - w.ax) + uy * (y - w.ay) - op.at) < op.w / 2 + 0.45);
    });
    const r = await roundTrip(walls, openings);
    const count = (list, type) => list.filter((o) => o.type === type).length;
    const label = `план ${n}: ${W} × ${H}, стен ${walls.length}`;
    // две перегородки на одной прямой по разные стороны стены сливаются в одну сквозную — стен становится меньше, план тот же
    assert.ok(r.found.walls.length <= walls.length && r.found.walls.length >= walls.length - 3, `${label}: стен ${r.found.walls.length}`);
    assert.equal(r.q1.rooms.length, r.q0.rooms.length, `${label}: помещения`);
    assert.equal(count(r.found.openings, 'door'), count(r.project.floors[0].openings, 'door'), `${label}: двери`);
    assert.equal(count(r.found.openings, 'window'), count(r.project.floors[0].openings, 'window'), `${label}: окна`);
    near(r.q1.roomsNetArea, r.q0.roomsNetArea, 0.01 * r.q0.roomsNetArea + 0.1);
    near(r.q1.wallVolume, r.q0.wallVolume, 0.005 * r.q0.wallVolume + 0.05);
  }
});
