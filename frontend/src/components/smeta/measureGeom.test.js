// Тесты геометрии обмера. Запуск: npm run test:geom (node --test, без зависимостей)
import test from 'node:test';
import assert from 'node:assert/strict';
import { polyStats, homography, applyH, homW, isConvexQuad, fitSideScale } from './measureGeom.js';

// «камера»: метры → пиксели фото с перспективой
const P = [0.9 * 50, 0.12 * 50, 40, 0.05 * 50, 0.7 * 50, 90, 0.0004 * 50, 0.0009 * 50, 1];
const shoot = (p) => applyH(P, p);
const close = (a, b, eps = 1e-6) => assert.ok(Math.abs(a - b) < eps, `${a} ≠ ${b}`);

test('площадь и периметр Г-образного контура', () => {
  const L = [{ x: 0, y: 0 }, { x: 6, y: 0 }, { x: 6, y: 2.5 }, { x: 4, y: 2.5 }, { x: 4, y: 5 }, { x: 0, y: 5 }];
  const s = polyStats(L);
  close(s.area, 25);
  close(s.perimeter, 22);
});

test('прямоугольник-эталон снимает перспективу: комнаты на фото под углом меряются точно', () => {
  const ref = [{ x: 0, y: 0 }, { x: 5, y: 0 }, { x: 5, y: 4 }, { x: 0, y: 4 }];
  const img = ref.map(shoot);
  assert.ok(isConvexQuad(img));
  const H = homography(img, ref);
  const room = [{ x: 6, y: 0.5 }, { x: 9.2, y: 0.5 }, { x: 9.2, y: 3.3 }, { x: 6, y: 3.3 }];
  const back = room.map(shoot).map((p) => applyH(H, p));
  close(polyStats(back).area, 3.2 * 2.8, 1e-6);
  close(polyStats(back).perimeter, 12, 1e-6);
  assert.ok(room.map(shoot).every((p) => Math.sign(homW(H, p)) === Math.sign(homW(H, img[0]))));
});

test('углы, отмеченные не по кругу, не принимаются', () => {
  assert.equal(isConvexQuad([{ x: 0, y: 0 }, { x: 10, y: 10 }, { x: 10, y: 0 }, { x: 0, y: 10 }]), false);
  assert.equal(isConvexQuad([{ x: 0, y: 0 }, { x: 5, y: 0 }, { x: 10, y: 0 }, { x: 0, y: 10 }]), false);
  assert.equal(homography([{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 3, y: 0 }], [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 0, y: 1 }]), null);
});

test('план растянут по осям: две стороны разных направлений восстанавливают размеры', () => {
  const vecs = [{ x: 5.16 * 1.2, y: 0 }, { x: 0, y: 3.48 * 0.9 }, { x: -5.16 * 1.2, y: 0 }, { x: 0, y: -3.48 * 0.9 }];
  const f = fitSideScale(vecs, [{ i: 0, len: 5.16 }, { i: 1, len: 3.48 }]);
  assert.equal(f.kind, 'axes');
  close(Math.hypot(vecs[0].x * f.sx, vecs[0].y * f.sy), 5.16);
  close(Math.hypot(vecs[1].x * f.sx, vecs[1].y * f.sy), 3.48);
  assert.equal(f.note, '');
});

test('одна сторона или параллельные стороны — общий множитель и подсказка', () => {
  const vecs = [{ x: 6, y: 0 }, { x: 0, y: 3 }, { x: -6, y: 0 }, { x: 0, y: -3 }];
  const one = fitSideScale(vecs, [{ i: 0, len: 5 }]);
  assert.equal(one.kind, 'uniform'); close(one.sx, 5 / 6); assert.equal(one.note, 'one');
  const par = fitSideScale(vecs, [{ i: 0, len: 5 }, { i: 2, len: 5 }]);
  assert.equal(par.kind, 'uniform'); assert.equal(par.note, 'parallel');
  assert.equal(fitSideScale(vecs, []), null);
  assert.equal(fitSideScale(vecs, [{ i: 0, len: 0 }]), null);
});

test('противоречивые длины не дают растянуть план больше чем вдвое', () => {
  const vecs = [{ x: 5, y: 0 }, { x: 0, y: 3 }];
  const f = fitSideScale(vecs, [{ i: 0, len: 5 }, { i: 1, len: 30 }]);
  assert.equal(f.kind, 'uniform');
  assert.equal(f.note, 'stretch');
  assert.ok(f.maxDev > 0.03);
});
