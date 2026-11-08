// Геометрия обмера: перевод точек холста в метры (масштаб, линия-эталон или
// прямоугольник-эталон с исправлением перспективы) и уточнение масштаба комнаты
// по реальным длинам сторон. Чистые функции — их проверяют тесты.

// Площадь (по модулю) и периметр многоугольника в тех же единицах, что и точки
export function polyStats(pts) {
  let a = 0;
  let p = 0;
  for (let i = 0; i < pts.length; i++) {
    const j = (i + 1) % pts.length;
    a += pts[i].x * pts[j].y - pts[j].x * pts[i].y;
    p += Math.hypot(pts[j].x - pts[i].x, pts[j].y - pts[i].y);
  }
  return { area: Math.abs(a) / 2, perimeter: p };
}

// Решение системы линейных уравнений методом Гаусса с выбором ведущего элемента.
// Возвращает null, если система вырождена.
function solve(A, b) {
  const n = b.length;
  const M = A.map((row, i) => [...row, b[i]]);
  for (let c = 0; c < n; c++) {
    let piv = c;
    for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[piv][c])) piv = r;
    if (Math.abs(M[piv][c]) < 1e-12) return null;
    [M[c], M[piv]] = [M[piv], M[c]];
    for (let r = 0; r < n; r++) {
      if (r === c) continue;
      const f = M[r][c] / M[c][c];
      if (f === 0) continue;
      for (let k = c; k <= n; k++) M[r][k] -= f * M[c][k];
    }
  }
  return M.map((row, i) => row[n] / row[i]);
}

// Проективное преобразование (гомография), переводящее 4 точки src в 4 точки dst.
// Матрица 3×3 построчно, h33 = 1. null — если точки вырождены (три на одной прямой).
export function homography(src, dst) {
  if (src.length !== 4 || dst.length !== 4) return null;
  // нормализация координат холста улучшает обусловленность системы
  const s = 1 / Math.max(1, ...src.map((p) => Math.max(Math.abs(p.x), Math.abs(p.y))));
  const A = [];
  const b = [];
  for (let i = 0; i < 4; i++) {
    const x = src[i].x * s;
    const y = src[i].y * s;
    const { x: u, y: v } = dst[i];
    A.push([x, y, 1, 0, 0, 0, -x * u, -y * u]); b.push(u);
    A.push([0, 0, 0, x, y, 1, -x * v, -y * v]); b.push(v);
  }
  const h = solve(A, b);
  if (!h || h.some((v) => !Number.isFinite(v))) return null;
  // возвращаем к ненормализованным координатам: H · diag(s, s, 1)
  return [h[0] * s, h[1] * s, h[2], h[3] * s, h[4] * s, h[5], h[6] * s, h[7] * s, 1];
}

// Знаменатель гомографии: точки по разные стороны от «линии горизонта» имеют разный знак
export function homW(H, p) {
  return H[6] * p.x + H[7] * p.y + H[8];
}

export function applyH(H, p) {
  const w = homW(H, p);
  return { x: (H[0] * p.x + H[1] * p.y + H[2]) / w, y: (H[3] * p.x + H[4] * p.y + H[5]) / w };
}

// Четырёхугольник выпуклый и обходится в одном направлении (углы отмечены по кругу)
export function isConvexQuad(q) {
  if (q.length !== 4) return false;
  let sign = 0;
  for (let i = 0; i < 4; i++) {
    const a = q[i];
    const b = q[(i + 1) % 4];
    const c = q[(i + 2) % 4];
    const cr = (b.x - a.x) * (c.y - b.y) - (b.y - a.y) * (c.x - b.x);
    if (Math.abs(cr) < 1e-6) return false;
    const s = Math.sign(cr);
    if (sign && s !== sign) return false;
    sign = s;
  }
  return true;
}

// Уточнение масштаба комнаты по реальным длинам сторон.
// vecs — векторы сторон в метрах (по текущей калибровке), fixes — [{i, len}] реальные длины.
// Одна сторона → общий множитель. Две и больше непараллельных → отдельные множители
// по осям (план, растянутый по-разному по ширине и высоте), метод наименьших квадратов.
// Возвращает {sx, sy, kind, maxDev} или null, если поправок нет.
export function fitSideScale(vecs, fixes) {
  const used = fixes.filter((f) => f.len > 0 && vecs[f.i] && Math.hypot(vecs[f.i].x, vecs[f.i].y) > 1e-9);
  if (!used.length) return null;
  const uniform = () => {
    // среднее геометрическое множителей — не зависит от порядка и единиц
    const lg = used.reduce((s, f) => s + Math.log(f.len / Math.hypot(vecs[f.i].x, vecs[f.i].y)), 0) / used.length;
    const k = Math.exp(lg);
    return { sx: k, sy: k, kind: 'uniform' };
  };
  let res = null;
  let note = used.length === 1 ? 'one' : '';
  if (used.length >= 2) {
    // a·vx² + b·vy² = L², нормировано на L²; a = sx², b = sy²
    let s11 = 0; let s12 = 0; let s22 = 0; let r1 = 0; let r2 = 0;
    used.forEach((f) => {
      const v = vecs[f.i];
      const L2 = f.len * f.len;
      const p = (v.x * v.x) / L2;
      const q = (v.y * v.y) / L2;
      s11 += p * p; s12 += p * q; s22 += q * q; r1 += p; r2 += q;
    });
    const det = s11 * s22 - s12 * s12;
    // стороны почти параллельны — по осям масштаб не определить
    if (!(det > 1e-6 * (s11 * s22 || 1))) note = 'parallel';
    else {
      const a = (r1 * s22 - r2 * s12) / det;
      const b = (s11 * r2 - s12 * r1) / det;
      if (a > 0 && b > 0) {
        const sx = Math.sqrt(a);
        const sy = Math.sqrt(b);
        // растяжение больше чем в 2 раза — почти наверняка ошибка ввода, а не свойство плана
        if (sx / sy < 2 && sy / sx < 2) res = { sx, sy, kind: 'axes' };
        else note = 'stretch';
      } else note = 'stretch';
    }
  }
  if (!res) res = uniform();
  const maxDev = used.reduce((m, f) => {
    const v = vecs[f.i];
    const got = Math.hypot(v.x * res.sx, v.y * res.sy);
    return Math.max(m, Math.abs(got - f.len) / f.len);
  }, 0);
  return { ...res, maxDev, count: used.length, note };
}
