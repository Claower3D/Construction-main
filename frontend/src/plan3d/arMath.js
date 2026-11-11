// Постановка модели в дополненной реальности. Чистая математика без WebXR — её можно проверить в Node.
// Координаты сцены: X и Z — по земле, Y — вверх. Поворот вокруг Y на угол θ переводит (x, z) в (x·cosθ + z·sinθ, −x·sinθ + z·cosθ).

const heading = (dx, dz) => Math.atan2(-dz, dx);

export function rotateXZ(x, z, angle) {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return { x: x * c + z * s, z: -x * s + z * c };
}

/**
 * Натура 1:1 по двум точкам: точку A модели ставим в отмеченную точку, а направление A→B поворачиваем на отмеченное.
 * @param {{x:number,z:number}} modelA @param {{x:number,z:number}} modelB точки привязки в координатах модели
 * @param {{x:number,y:number,z:number}} worldA @param {{x:number,y:number,z:number}} worldB отмеченные на площадке
 * @returns {{ position:{x:number,y:number,z:number}, rotationY:number, measured:number, expected:number, mismatch:number }}
 *          mismatch — на сколько отмеченное расстояние A–B расходится с проектным (контроль разметки)
 */
export function alignTwoPoints(modelA, modelB, worldA, worldB) {
  const expected = Math.hypot(modelB.x - modelA.x, modelB.z - modelA.z);
  const measured = Math.hypot(worldB.x - worldA.x, worldB.z - worldA.z);
  const rotationY = measured > 1e-6 && expected > 1e-6
    ? heading(worldB.x - worldA.x, worldB.z - worldA.z) - heading(modelB.x - modelA.x, modelB.z - modelA.z)
    : 0;
  const a = rotateXZ(modelA.x, modelA.z, rotationY);
  return {
    position: { x: worldA.x - a.x, y: worldA.y, z: worldA.z - a.z },
    rotationY,
    measured,
    expected,
    mismatch: measured - expected,
  };
}

/** Натура 1:1 по одной точке: A модели — в отмеченную точку, поворот задаётся вручную. */
export function placeAtPoint(modelA, worldA, rotationY = 0) {
  const a = rotateXZ(modelA.x, modelA.z, rotationY);
  return { position: { x: worldA.x - a.x, y: worldA.y, z: worldA.z - a.z }, rotationY };
}

/** Поворот уже поставленной модели вокруг точки (обычно вокруг точки A), чтобы подправить направление не сдвигая привязку. */
export function rotateAbout(position, rotationY, pivot, delta) {
  const dx = position.x - pivot.x;
  const dz = position.z - pivot.z;
  const r = rotateXZ(dx, dz, delta);
  return { position: { x: pivot.x + r.x, y: position.y, z: pivot.z + r.z }, rotationY: rotationY + delta };
}

/**
 * «Подойти и рассмотреть»: середина ближнего фасада встаёт в отмеченную точку, здание уходит от человека вглубь,
 * фасад смотрит на него. Дальше телефон сам держит модель на месте.
 * @param {{x:number,z:number}} front середина фасада в координатах модели
 * @param {{x:number,y:number,z:number}} world отмеченная точка на земле
 * @param {{x:number,z:number}} viewer где стоит человек
 */
export function placeFacing(front, world, viewer, scale = 1, lift = 0) {
  let dx = world.x - viewer.x;
  let dz = world.z - viewer.z;
  const len = Math.hypot(dx, dz);
  if (len < 1e-6) { dx = 0; dz = -1; } else { dx /= len; dz /= len; }
  const rotationY = Math.atan2(-dx, -dz); // ось «к зрителю» модели (+Z) разворачиваем навстречу человеку
  const f = rotateXZ(front.x * scale, front.z * scale, rotationY);
  return { scale, rotationY, position: { x: world.x - f.x, y: world.y + lift, z: world.z - f.z } };
}

/** Смена масштаба вокруг точки привязки: сама точка остаётся на месте. */
export function rescaleAbout(position, pivot, from, to, y = position.y) {
  const k = to / from;
  return { x: pivot.x + (position.x - pivot.x) * k, y, z: pivot.z + (position.z - pivot.z) * k };
}
