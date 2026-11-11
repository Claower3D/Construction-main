// Выгрузка 3D-модели. Загрузчики three.js тянем только по нажатию кнопки.

import { buildBuilding, disposeBuilding } from './geometry3d.js';

/** GLB — открывается в Blender, 3D-просмотрщике Windows, на Android и в любом glTF-вьюере. */
export async function toGlb(project) {
  const { GLTFExporter } = await import('three/examples/jsm/exporters/GLTFExporter.js');
  const root = buildBuilding(project, { edges: false });
  try {
    const buffer = await new GLTFExporter().parseAsync(root, { binary: true });
    return new Blob([buffer], { type: 'model/gltf-binary' });
  } finally {
    disposeBuilding(root);
  }
}

/** USDZ — формат «Быстрого просмотра» на iPhone и iPad: модель ставится на пол в натуральную величину. */
export async function toUsdz(project) {
  const { USDZExporter } = await import('three/examples/jsm/exporters/USDZExporter.js');
  const root = buildBuilding(project, { edges: false });
  try {
    // плита пола ниже нуля — поднимаем, чтобы модель стояла на полу, а не уходила в него
    root.position.y = project.groundSlab ? project.slab : 0;
    root.updateMatrixWorld(true);
    const bytes = await new USDZExporter().parseAsync(root);
    return new Blob([bytes], { type: 'model/vnd.usdz+zip' });
  } finally {
    disposeBuilding(root);
  }
}

export async function toXlsx(sheets) {
  const XLSX = await import('xlsx');
  const wb = XLSX.utils.book_new();
  for (const [name, rows] of Object.entries(sheets)) {
    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = rows[0].map((_, i) => ({ wch: Math.min(48, Math.max(12, ...rows.map((r) => String(r[i] ?? '').length + 2))) }));
    XLSX.utils.book_append_sheet(wb, ws, name);
  }
  const out = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return new Blob([out], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

export function download(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

export function fileSlug(name) {
  const s = String(name || 'model').trim().replace(/[\\/:*?"<>|\s]+/g, '_').replace(/^_+|_+$/g, '');
  return (s || 'model').slice(0, 60);
}
