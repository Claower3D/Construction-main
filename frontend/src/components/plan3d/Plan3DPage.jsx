import React, { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Upload, PenLine, Shapes, Save, FolderOpen, Plus, Copy, Trash2, AlertTriangle, Check, FileUp, X } from 'lucide-react';
import PlanEditor from './PlanEditor';
import ImportPanel from './ImportPanel';
import { NumField, QuantitiesPanel, ExportPanel, ModelsList, ArPanel, ArOverlay, fmt } from './Plan3DPanels';
import { decodeDxfBuffer, looksLikeDwg, parseDxf } from '../../plan3d/dxf.js';
import { ptToMetres } from '../../plan3d/pdfVector.js';
import { anchorPoints, cloneFloor, newFloor, newProject, sanitizeProject, wallLength, LIMITS } from '../../plan3d/model.js';
import { projectQuantities } from '../../plan3d/quantities.js';
import { quantitySheets, toDxf, toSvgSheet } from '../../plan3d/exporters.js';
import { sampleHouseProject } from '../../plan3d/testPlans.js';
import { canUseServer, clearDraft, deleteModel, listModels, loadDraft, loadModel, saveDraft, saveModel } from '../../plan3d/store.js';
import './Plan3D.css';

const Model3DView = lazy(() => import('./Model3DView'));
const CameraOverlay = lazy(() => import('./CameraOverlay'));

const TABS = [
  { id: 'plan', label: 'План' },
  { id: 'view', label: '3D' },
  { id: 'qty', label: 'Объёмы' },
  { id: 'ar', label: 'Камера' },
  { id: 'out', label: 'Файлы' },
];
const MAX_FILE = 40 * 1024 * 1024;

// Тип файла определяем по содержимому, а не по расширению и не по MIME: у DXF он, например, «image/vnd.dxf».
function isRasterImage(head, buffer) {
  if (head[0] === 0x89 && head[1] === 0x50 && head[2] === 0x4e && head[3] === 0x47) return true; // PNG
  if (head[0] === 0xff && head[1] === 0xd8) return true; // JPEG
  if (head[0] === 0x42 && head[1] === 0x4d) return true; // BMP
  if (head[0] === 0x47 && head[1] === 0x49 && head[2] === 0x46) return true; // GIF
  if (String.fromCharCode(...head.slice(0, 4)) === 'RIFF' && String.fromCharCode(...new Uint8Array(buffer.slice(8, 12))) === 'WEBP') return true;
  return false;
}
const HISTORY = 60;

export default function Plan3DPage() {
  const [project, setProject] = useState(() => loadDraft() || newProject());
  const [restored] = useState(() => project.floors.some((f) => f.walls.length));
  const [started, setStarted] = useState(restored);
  const [history, setHistory] = useState({ undo: [], redo: [] });
  const [floorIndex, setFloorIndex] = useState(0);
  const [tab, setTab] = useState('plan');
  const [tool, setTool] = useState('select');
  const [selection, setSelection] = useState(null);
  const [wallT, setWallT] = useState(0.2);
  const [underlays, setUnderlays] = useState({});
  const [importSource, setImportSource] = useState(null);
  const [busy, setBusy] = useState('');
  const [notice, setNotice] = useState(restored ? { kind: 'info', text: 'Открыт несохранённый черновик с прошлого раза.' } : null);
  const [saved, setSaved] = useState({ where: null, dirty: restored }); // восстановленный черновик — тоже несохранённая работа
  const [models, setModels] = useState({ open: false, loading: false, items: [], error: null });
  const [layers3d, setLayers3d] = useState({ wall: true, slab: true, glass: true, anchors: false });
  const [levels, setLevels] = useState(1);
  const [fitTick, setFitTick] = useState(0);
  const [fit3dTick, setFit3dTick] = useState(0);
  const [arSupportState, setArSupportState] = useState('checking');
  const [ar, setAr] = useState({ active: false, state: null, error: '' });
  const [pending, setPending] = useState(null); // действие, которое сотрёт несохранённую работу
  const [camOpen, setCamOpen] = useState(false);
  const arController = useRef(null);
  const arRoot = useRef(null);
  const editorRef = useRef(null);
  const fileRef = useRef(null);
  const projectFileRef = useRef(null);
  const pdfBuffer = useRef(null);

  const floor = project.floors[Math.min(floorIndex, project.floors.length - 1)];
  const q = useMemo(() => projectQuantities(project), [project]);
  const anchors = useMemo(() => (project.floors[0].walls.length ? anchorPoints(project.floors[0]) : null), [project.floors]);
  const hasWalls = project.floors.some((f) => f.walls.length > 0);
  const underlay = underlays[floor.id] || null;

  useEffect(() => { setLevels(project.floors.length); }, [project.floors.length]);
  useEffect(() => { if (started && tab === 'plan' && !importSource) editorRef.current?.fit(); }, [fitTick, started, tab, importSource]);

  // черновик — чтобы обновление страницы не стёрло работу
  useEffect(() => {
    if (!hasWalls) return undefined;
    const t = setTimeout(() => saveDraft(project), 500);
    return () => clearTimeout(t);
  }, [project, hasWalls]);

  // ── изменения проекта с историей ───────────────────────────────────────────
  const update = (next) => {
    setHistory((h) => ({ undo: [...h.undo.slice(-HISTORY + 1), project], redo: [] }));
    setProject(next);
    setSaved((s) => ({ ...s, dirty: true }));
  };
  const undo = () => {
    if (!history.undo.length) return;
    const prev = history.undo[history.undo.length - 1];
    setHistory({ undo: history.undo.slice(0, -1), redo: [project, ...history.redo].slice(0, HISTORY) });
    setProject(prev);
    setSelection(null);
    setFloorIndex((i) => Math.min(i, prev.floors.length - 1));
  };
  const redo = () => {
    if (!history.redo.length) return;
    const next = history.redo[0];
    setHistory({ undo: [...history.undo, project].slice(-HISTORY), redo: history.redo.slice(1) });
    setProject(next);
    setSelection(null);
    setFloorIndex((i) => Math.min(i, next.floors.length - 1));
  };
  const setFloor = (nextFloor) => update({ ...project, floors: project.floors.map((f) => (f.id === nextFloor.id ? nextFloor : f)) });

  const openProject = (p, where = null) => {
    setProject(p);
    setHistory({ undo: [], redo: [] });
    setFloorIndex(0);
    setSelection(null);
    setTool('select');
    setUnderlays({});
    setImportSource(null);
    setStarted(true);
    setTab('plan');
    setSaved({ where, dirty: false });
    setFitTick((n) => n + 1);
    setFit3dTick((n) => n + 1);
  };

  // прежде чем заменить проект другим, спрашиваем, если есть несохранённая работа
  const guard = (text, run) => { if (saved.dirty && hasWalls) setPending({ text, run }); else run(); };

  const startBlank = () => { openProject(newProject()); setTool('wall'); setNotice(null); };
  const startSample = () => { openProject(sanitizeProject(sampleHouseProject())); setNotice({ kind: 'info', text: 'Это пример: дом 10 × 8 м. Поправьте стены на плане и посмотрите вкладки «3D» и «Объёмы».' }); };
  const startOver = () => { clearDraft(); setStarted(false); setProject(newProject()); setHistory({ undo: [], redo: [] }); setUnderlays({}); setImportSource(null); setNotice(null); setSaved({ where: null, dirty: false }); setFloorIndex(0); setSelection(null); };

  // ── загрузка чертежа ───────────────────────────────────────────────────────
  const fail = (text) => setNotice({ kind: 'error', text });
  const setUnderlay = (u) => setUnderlays((all) => ({ ...all, [floor.id]: u }));

  const handleFile = async (file) => {
    if (!file) return;
    if (file.size > MAX_FILE) { fail('Файл больше 40 МБ. Сохраните из чертежа только нужный лист или план этажа.'); return; }
    setBusy('Читаем файл…');
    setNotice(null);
    try {
      const buffer = await file.arrayBuffer();
      const head = new Uint8Array(buffer.slice(0, 8));
      const magic = String.fromCharCode(...head.slice(0, 4));
      const name = file.name || 'чертёж';
      if (magic === '%PDF') {
        const { readPdfPage } = await import('../../plan3d/pdfImport.js');
        pdfBuffer.current = { buffer, name };
        const page = await readPdfPage(buffer, 1);
        showPdfPage(page, name);
      } else if (looksLikeDwg(head)) {
        fail('Это DWG — закрытый формат AutoCAD, прочитать его напрямую нельзя. Откройте чертёж в AutoCAD или nanoCAD и сохраните как DXF («Сохранить как» → DXF), затем загрузите сюда.');
      } else if (isRasterImage(head, buffer)) {
        const { readImage } = await import('../../plan3d/pdfImport.js');
        const img = await readImage(file);
        setUnderlay({ src: img.image, x: 0, y: 0, w: 20, h: (20 * img.height) / img.width, opacity: 0.6, visible: true });
        setStarted(true); setImportSource(null); setTab('plan'); setTool('scale'); setFitTick((n) => n + 1);
        setNotice({ kind: 'info', text: 'Картинка стала подложкой. Сначала задайте масштаб: отметьте две точки с известным расстоянием. Потом обведите стены инструментом «Стена».' });
      } else {
        const dxf = parseDxf(decodeDxfBuffer(buffer));
        if (!dxf.segments.length) { fail('В файле не нашлось линий. Стены должны быть начерчены отрезками или полилиниями.'); return; }
        setImportSource({ kind: 'dxf', name, ...dxf });
        setStarted(true); setTab('plan');
      }
    } catch (e) {
      fail(e?.message?.startsWith('В файле') || e?.message?.startsWith('PDF') || e?.message?.startsWith('Не удалось') ? e.message : 'Не удалось прочитать файл. Подойдут DXF, PDF, JPG и PNG.');
    } finally {
      setBusy('');
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const showPdfPage = (page, name) => {
    if (page.segments.length >= 20) {
      setImportSource({ kind: 'pdf', name, segments: page.segments, layers: page.layers, skipped: page.skipped, image: page.image, ptWidth: page.ptWidth, ptHeight: page.ptHeight, pages: page.pages, page: page.page });
      setStarted(true); setTab('plan');
      return;
    }
    // скан: линий нет, остаётся подложка. Размер листа пересчитываем как для масштаба 1:100 — потом его уточнят по двум точкам
    const k = ptToMetres(100);
    setUnderlay({ src: page.image, x: 0, y: 0, w: page.ptWidth * k, h: page.ptHeight * k, opacity: 0.6, visible: true });
    setStarted(true); setImportSource(null); setTab('plan'); setTool('scale'); setFitTick((n) => n + 1);
    setNotice({ kind: 'info', text: 'В этом PDF нет линий — это скан. Он стал подложкой: задайте масштаб по двум точкам и обведите стены инструментом «Стена».' });
  };

  const changePdfPage = async (n) => {
    if (!pdfBuffer.current) return;
    setBusy('Открываем страницу…');
    try {
      const { readPdfPage } = await import('../../plan3d/pdfImport.js');
      showPdfPage(await readPdfPage(pdfBuffer.current.buffer, n), pdfBuffer.current.name);
    } catch (e) {
      fail(e.message || 'Не удалось открыть страницу.');
    } finally { setBusy(''); }
  };

  const applyImport = ({ walls, openings, underlay: u }) => {
    setFloor({ ...floor, walls, openings });
    if (u) setUnderlay(u);
    setImportSource(null);
    setSelection(null);
    setTool('select');
    setFitTick((n) => n + 1);
    setFit3dTick((n) => n + 1);
    setNotice({ kind: 'ok', text: `Перенесено стен: ${walls.length}, проёмов: ${openings.length}. Проверьте план: лишнее удалите, недостающее дочертите.` });
  };

  const openProjectFile = async (file) => {
    if (!file) return;
    try {
      const p = sanitizeProject(JSON.parse(await file.text()));
      p.id = null;
      openProject(p);
      setNotice({ kind: 'ok', text: 'Проект открыт из файла.' });
    } catch {
      fail('Не удалось открыть файл проекта: это не файл «План → 3D» или он повреждён.');
    } finally { if (projectFileRef.current) projectFileRef.current.value = ''; }
  };

  // ── этажи ──────────────────────────────────────────────────────────────────
  const addFloor = (copy) => {
    if (project.floors.length >= LIMITS.floors) return;
    const name = `${project.floors.length + 1} этаж`;
    const f = copy ? cloneFloor(floor, name) : newFloor(name);
    update({ ...project, floors: [...project.floors, f] });
    setFloorIndex(project.floors.length);
    setSelection(null);
    setFitTick((n) => n + 1);
  };
  const removeFloor = () => {
    if (project.floors.length < 2) return;
    const floors = project.floors.filter((f) => f.id !== floor.id);
    update({ ...project, floors });
    setFloorIndex(Math.max(0, Math.min(floorIndex, floors.length - 1)));
    setSelection(null);
  };

  // ── выбранный элемент ──────────────────────────────────────────────────────
  const selWall = selection?.kind === 'wall' ? floor.walls.find((w) => w.id === selection.id) : null;
  const selOpening = selection?.kind === 'opening' ? floor.openings.find((o) => o.id === selection.id) : null;
  const selOpeningWall = selOpening ? floor.walls.find((w) => w.id === selOpening.wallId) : null;

  const deleteSelection = () => {
    if (selWall) setFloor({ ...floor, walls: floor.walls.filter((w) => w.id !== selWall.id), openings: floor.openings.filter((o) => o.wallId !== selWall.id) });
    else if (selOpening) setFloor({ ...floor, openings: floor.openings.filter((o) => o.id !== selOpening.id) });
    setSelection(null);
  };
  const patchWall = (patch) => setFloor({ ...floor, walls: floor.walls.map((w) => (w.id === selWall.id ? { ...w, ...patch } : w)) });
  const setWallLength = (len) => {
    const cur = wallLength(selWall);
    const k = len / cur;
    const bx = Math.round((selWall.ax + (selWall.bx - selWall.ax) * k) * 1000) / 1000;
    const by = Math.round((selWall.ay + (selWall.by - selWall.ay) * k) * 1000) / 1000;
    const openings = floor.openings.map((o) => {
      if (o.wallId !== selWall.id) return o;
      const w = Math.min(o.w, len);
      return { ...o, w, at: Math.min(Math.max(o.at, w / 2), len - w / 2) };
    });
    setFloor({ ...floor, walls: floor.walls.map((w) => (w.id === selWall.id ? { ...w, bx, by } : w)), openings });
  };
  const patchOpening = (patch) => {
    const len = wallLength(selOpeningWall);
    const next = { ...selOpening, ...patch };
    if (patch.type && patch.type !== selOpening.type) Object.assign(next, patch.type === 'window' ? { h: 1.5, sill: 0.9 } : { h: 2.1, sill: 0 });
    next.w = Math.min(next.w, len);
    next.at = Math.min(Math.max(next.at, next.w / 2), len - next.w / 2);
    setFloor({ ...floor, openings: floor.openings.map((o) => (o.id === selOpening.id ? next : o)) });
  };

  const calibrate = (p1, p2, metres) => {
    if (!underlay) return;
    const d = Math.hypot(p2.x - p1.x, p2.y - p1.y);
    if (!(d > 0)) return;
    const f = metres / d;
    setUnderlay({ ...underlay, x: p1.x + (underlay.x - p1.x) * f, y: p1.y + (underlay.y - p1.y) * f, w: underlay.w * f, h: underlay.h * f });
    setFitTick((n) => n + 1);
    setNotice({ kind: 'ok', text: `Масштаб задан: отмеченный отрезок равен ${fmt(metres)} м. Теперь обведите стены.` });
  };

  // ── сохранение и список моделей ────────────────────────────────────────────
  const save = async () => {
    if (!hasWalls) { fail('Сохранять пока нечего: на плане нет стен.'); return; }
    setBusy('Сохраняем…');
    try {
      const res = await saveModel(project, q.totals.roomsNetArea);
      setProject((p) => ({ ...p, id: res.id }));
      setSaved({ where: res.where, dirty: false });
      clearDraft();
      setNotice({ kind: 'ok', text: res.where === 'server' ? 'Модель сохранена на сервере. Откройте «Мои модели» на телефоне под тем же аккаунтом — она будет там.' : 'Модель сохранена в этом браузере. Чтобы открыть её на телефоне, войдите в аккаунт и сохраните ещё раз.' });
    } catch (e) { fail(e.message); } finally { setBusy(''); }
  };
  const refreshModels = async () => {
    setModels((m) => ({ ...m, open: true, loading: true, error: null }));
    const { items, serverError } = await listModels();
    setModels({ open: true, loading: false, items, error: serverError });
  };
  const openModel = (entry) => guard(`Открыть «${entry.name}»?`, () => openModelNow(entry));
  const openModelNow = async (entry) => {
    setBusy('Открываем модель…');
    try {
      openProject(await loadModel(entry), entry.where);
      setModels((m) => ({ ...m, open: false }));
      setNotice(null);
    } catch (e) { fail(e.message); } finally { setBusy(''); }
  };
  const removeModel = async (entry) => {
    try {
      await deleteModel(entry);
      if (project.id === entry.id) { setProject((p) => ({ ...p, id: null })); setSaved({ where: null, dirty: true }); }
      refreshModels();
    } catch (e) { setModels((m) => ({ ...m, error: e.message })); }
  };

  // ── выгрузка ───────────────────────────────────────────────────────────────
  const doExport = async (kind) => {
    setBusy('Готовим файл…');
    try {
      const { download, fileSlug, toGlb, toXlsx } = await import('../../plan3d/exporters3d.js');
      const base = fileSlug(project.name);
      const fl = fileSlug(floor.name);
      if (kind === 'svg') download(new Blob([toSvgSheet(project, project.floors.indexOf(floor)).svg], { type: 'image/svg+xml' }), `${base}_${fl}_план.svg`);
      else if (kind === 'dxf') download(new Blob([toDxf(floor)], { type: 'application/dxf' }), `${base}_${fl}.dxf`);
      else if (kind === 'glb') download(await toGlb(project), `${base}.glb`);
      else if (kind === 'xlsx') download(await toXlsx(quantitySheets(project, q)), `${base}_объёмы.xlsx`);
      else if (kind === 'json') download(new Blob([JSON.stringify({ ...project, id: undefined })], { type: 'application/json' }), `${base}.plan3d.json`);
    } catch {
      fail('Не удалось подготовить файл. Попробуйте ещё раз.');
    } finally { setBusy(''); }
  };

  // ── камера ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (tab !== 'ar' || arSupportState !== 'checking') return undefined;
    let alive = true;
    import('../../plan3d/arSession.js').then((m) => m.arSupport()).then((s) => { if (alive) setArSupportState(s); }).catch(() => { if (alive) setArSupportState('none'); });
    return () => { alive = false; };
  }, [tab, arSupportState]);

  const startAr = async (mode) => {
    setAr({ active: false, state: null, error: '' });
    const root = arRoot.current;
    root.dataset.active = '1'; // корень должен быть виден ещё до запроса сеанса
    try {
      const { startArSession } = await import('../../plan3d/arSession.js');
      const controller = await startArSession({
        project, overlayRoot: root, mode,
        onState: (state) => setAr((a) => ({ ...a, active: true, state })),
        onEnd: () => { arController.current = null; setAr((a) => ({ ...a, active: false, state: null })); },
      });
      arController.current = controller;
      setAr({ active: true, state: controller.getState(), error: '' });
    } catch (e) {
      root.dataset.active = '0';
      const denied = e?.name === 'NotAllowedError' || e?.name === 'SecurityError';
      setAr({ active: false, state: null, error: denied ? 'Нет доступа к камере. Разрешите камеру для этого сайта в настройках браузера и попробуйте снова.' : 'Не удалось включить камеру в режиме дополненной реальности. Проверьте, что на телефоне установлены «Сервисы Google Play для AR».' });
    }
  };
  useEffect(() => () => arController.current?.end(), []);

  const openCamera = () => {
    // iPhone спрашивает доступ к датчикам поворота только в ответ на нажатие — спрашиваем прямо здесь
    try {
      const D = window.DeviceOrientationEvent;
      if (D && typeof D.requestPermission === 'function') D.requestPermission().catch(() => {});
    } catch { /* датчиков нет — модель двигают пальцем */ }
    setAr((a) => ({ ...a, error: '' }));
    setCamOpen(true);
  };

  const quickLook = async () => {
    setBusy('Готовим модель для iPhone…');
    try {
      const { toUsdz } = await import('../../plan3d/exporters3d.js');
      const url = URL.createObjectURL(await toUsdz(project));
      const a = document.createElement('a');
      a.rel = 'ar';
      a.href = url;
      a.appendChild(document.createElement('img')); // «Быстрый просмотр» открывается только по ссылке с картинкой внутри
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch {
      setAr((x) => ({ ...x, error: 'Не удалось подготовить модель для «Быстрого просмотра».' }));
    } finally { setBusy(''); }
  };

  const fileInputs = (
    <>
      <input ref={fileRef} className="p3-file" type="file" tabIndex={-1} aria-hidden="true" accept=".dxf,.pdf,.png,.jpg,.jpeg,.webp,application/pdf,image/*" onChange={(e) => handleFile(e.target.files?.[0])} data-testid="p3-file" />
      <input ref={projectFileRef} className="p3-file" type="file" tabIndex={-1} aria-hidden="true" accept=".json,application/json" onChange={(e) => openProjectFile(e.target.files?.[0])} data-testid="p3-project-file" />
    </>
  );

  const noticeBox = notice && (
    <div className="p3-notice" data-kind={notice.kind} role={notice.kind === 'error' ? 'alert' : 'status'}>
      {notice.kind === 'error' ? <AlertTriangle size={18} aria-hidden="true" /> : <Check size={18} aria-hidden="true" />}
      <p>{notice.text}</p>
      <button type="button" className="p3-icon-btn" onClick={() => setNotice(null)} aria-label="Скрыть сообщение"><X size={16} aria-hidden="true" /></button>
    </div>
  );

  const modelsBox = models.open && (
    <section className="p3-panel p3-models-panel" aria-labelledby="p3-models-title">
      <header className="p3-section-head">
        <h2 id="p3-models-title" className="p3-h3">Мои модели</h2>
        <button type="button" className="p3-icon-btn" onClick={() => setModels((m) => ({ ...m, open: false }))} aria-label="Закрыть список моделей"><X size={18} aria-hidden="true" /></button>
      </header>
      <ModelsList items={models.items} loading={models.loading} error={models.error} onOpen={openModel} onDelete={removeModel} serverMode={canUseServer()} />
    </section>
  );

  // ── стартовый экран ────────────────────────────────────────────────────────
  if (!started) {
    return (
      <div className="p3">
        {fileInputs}
        <header className="p3-panel p3-head">
          <div>
            <h2 className="p3-title">План → 3D</h2>
            <p className="p3-sub">Загрузите план этажа — получите 3D-модель здания, объёмы стен и перекрытий, чертёж и модель для камеры телефона.</p>
          </div>
        </header>
        {noticeBox}
        <div className="p3-start">
          <button type="button" className="p3-panel p3-start-card p3-start-card--main" onClick={() => fileRef.current?.click()} disabled={Boolean(busy)}>
            <Upload size={28} aria-hidden="true" />
            <span className="p3-start-title">Загрузить чертёж</span>
            <span className="p3-muted">DXF или PDF из CAD — стены найдём сами. JPG, PNG и сканы станут подложкой для обводки.</span>
          </button>
          <button type="button" className="p3-panel p3-start-card" onClick={startBlank}>
            <PenLine size={28} aria-hidden="true" />
            <span className="p3-start-title">Начертить с нуля</span>
            <span className="p3-muted">Стены по сетке 5 см с привязкой к углам.</span>
          </button>
          <button type="button" className="p3-panel p3-start-card" onClick={startSample}>
            <Shapes size={28} aria-hidden="true" />
            <span className="p3-start-title">Попробовать на примере</span>
            <span className="p3-muted">Дом 10 × 8 м с перегородками, дверями и окнами.</span>
          </button>
        </div>
        <div className="p3-start-more">
          <button type="button" className="p3-btn p3-btn--ghost" onClick={refreshModels}><FolderOpen size={18} aria-hidden="true" />Мои модели</button>
          <button type="button" className="p3-btn p3-btn--ghost" onClick={() => projectFileRef.current?.click()}><FileUp size={18} aria-hidden="true" />Открыть файл проекта</button>
        </div>
        {busy && <p className="p3-muted" role="status">{busy}</p>}
        {modelsBox}
        <p className="p3-note">
          DWG напрямую не читается: сохраните его в AutoCAD или nanoCAD как DXF. Из чертежа берутся стены, двери и окна одного этажа;
          армирование, узлы и инженерные сети в модель не попадают.
        </p>
      </div>
    );
  }

  // ── рабочий экран ──────────────────────────────────────────────────────────
  // Esc в кабинете закрывает инструмент. Здесь им отменяют черчение, поэтому дальше страницы клавишу не пускаем.
  return (
    <div className="p3" onKeyDown={(e) => { if (e.key === 'Escape') e.stopPropagation(); }}>
      {fileInputs}
      <header className="p3-panel p3-head p3-head--work">
        <div className="p3-head-main">
          <div className="p3-name">
            <label htmlFor="p3-name" className="p3-sr">Название объекта</label>
            <input id="p3-name" className="p3-input" type="text" value={project.name} maxLength={LIMITS.name} translate="no"
              onChange={(e) => { setProject({ ...project, name: e.target.value }); setSaved((s) => ({ ...s, dirty: true })); }}
              onBlur={(e) => { if (!e.target.value.trim()) setProject({ ...project, name: 'Объект без названия' }); }} />
          </div>
          <span className="p3-save-state" data-dirty={saved.dirty || undefined} role="status">
            {saved.where && !saved.dirty ? (saved.where === 'server' ? 'Сохранено на сервере' : 'Сохранено в браузере') : hasWalls ? 'Есть несохранённые изменения' : ''}
          </span>
        </div>
        <div className="p3-head-actions">
          <button type="button" className="p3-btn p3-btn--gold" onClick={save} disabled={Boolean(busy)}><Save size={18} aria-hidden="true" />Сохранить</button>
          <button type="button" className="p3-btn p3-btn--ghost" onClick={refreshModels}><FolderOpen size={18} aria-hidden="true" />Мои модели</button>
          <button type="button" className="p3-btn p3-btn--ghost p3-btn--compact" onClick={() => guard('Начать новый проект?', startOver)} aria-label="Новый проект"><Plus size={18} aria-hidden="true" /><span>Новый</span></button>
        </div>
      </header>

      {noticeBox}
      {pending && (
        <div className="p3-notice p3-confirm" data-kind="error" role="alertdialog" aria-labelledby="p3-confirm-text">
          <AlertTriangle size={18} aria-hidden="true" />
          <p id="p3-confirm-text">{pending.text} В текущей модели есть несохранённые изменения — они пропадут.</p>
          <div className="p3-actions">
            <button type="button" className="p3-btn p3-btn--danger" onClick={() => { const { run } = pending; setPending(null); run(); }}>Не сохранять и продолжить</button>
            <button type="button" className="p3-btn p3-btn--ghost" onClick={() => setPending(null)}>Остаться</button>
          </div>
        </div>
      )}
      {busy && <p className="p3-busy" role="status">{busy}</p>}
      {modelsBox}

      <div className="p3-body">
        <div className="p3-main">
          <div className="p3-tabs" role="tablist" aria-label="Разделы">
            {TABS.map((t) => (
              <button key={t.id} type="button" role="tab" id={`p3-tab-${t.id}`} aria-selected={tab === t.id} aria-controls="p3-tabpanel" className="p3-tab" onClick={() => setTab(t.id)}>{t.label}</button>
            ))}
          </div>

          <div id="p3-tabpanel" role="tabpanel" aria-labelledby={`p3-tab-${tab}`} className="p3-tabpanel">
            {tab === 'plan' && (
              <>
                <div className="p3-floors" role="group" aria-label="Этажи">
                  {project.floors.map((f, i) => (
                    <button key={f.id} type="button" className="p3-chip" aria-pressed={f.id === floor.id} onClick={() => { setFloorIndex(i); setSelection(null); setImportSource(null); setFitTick((n) => n + 1); }} translate="no">{f.name}</button>
                  ))}
                  <button type="button" className="p3-chip p3-chip--add" onClick={() => addFloor(true)} disabled={project.floors.length >= LIMITS.floors || !floor.walls.length} title="Новый этаж с теми же стенами"><Copy size={15} aria-hidden="true" />Этаж-копия</button>
                  <button type="button" className="p3-chip p3-chip--add" onClick={() => addFloor(false)} disabled={project.floors.length >= LIMITS.floors}><Plus size={15} aria-hidden="true" />Пустой этаж</button>
                </div>
                {importSource ? (
                  <ImportPanel source={importSource} replacing={floor.walls.length > 0} onApply={applyImport} onCancel={() => setImportSource(null)} onPage={changePdfPage} />
                ) : (
                  <PlanEditor
                    ref={editorRef} floor={floor} onChange={setFloor} tool={tool} onToolChange={setTool}
                    selection={selection} onSelect={setSelection} underlay={underlay} onUnderlayChange={setUnderlay} onCalibrate={calibrate}
                    wallThickness={wallT} onUndo={undo} onRedo={redo} canUndo={history.undo.length > 0} canRedo={history.redo.length > 0}
                    onDelete={deleteSelection} anchors={floorIndex === 0 ? anchors : null}
                  />
                )}
              </>
            )}

            {tab === 'view' && (
              <div className="p3-view">
                {hasWalls ? (
                  <Suspense fallback={<p className="p3-muted" role="status">Загружаем 3D…</p>}>
                    <Model3DView project={project} layers={layers3d} levels={levels} fitKey={fit3dTick} />
                  </Suspense>
                ) : <p className="p3-empty">Модель появится, когда на плане будут стены.</p>}
                <div className="p3-view-controls">
                  <div className="p3-chips" role="group" aria-label="Что показывать">
                    {[['wall', 'Стены'], ['slab', 'Перекрытия'], ['glass', 'Остекление'], ['anchors', 'Точки A и B']].map(([k, label]) => (
                      <button key={k} type="button" className="p3-chip" aria-pressed={layers3d[k]} onClick={() => setLayers3d({ ...layers3d, [k]: !layers3d[k] })}>{label}</button>
                    ))}
                  </div>
                  {project.floors.length > 1 && (
                    <label className="p3-levels">
                      <span>Показать этажей: {levels} из {project.floors.length}</span>
                      <input type="range" min="1" max={project.floors.length} step="1" value={levels} onChange={(e) => setLevels(Number(e.target.value))} />
                    </label>
                  )}
                </div>
                <p className="p3-muted">
                  Высота здания {fmt(q.height)} м. Уберите «Перекрытия» или уменьшите число этажей, чтобы заглянуть внутрь.
                  {layers3d.anchors && anchors ? ` Точка A — золотая вешка, точка B — голубая, между ними ${fmt(anchors.distance)} м.` : ''}
                </p>
              </div>
            )}

            {tab === 'qty' && <QuantitiesPanel q={q} onExport={() => doExport('xlsx')} busy={Boolean(busy)} />}

            {tab === 'ar' && <ArPanel support={arSupportState} anchors={anchors} onOverlay={openCamera} onStart={startAr} onQuickLook={quickLook} busy={Boolean(busy)} hasWalls={hasWalls} error={ar.error} />}

            {tab === 'out' && <ExportPanel floorName={floor.name} onExport={doExport} busy={Boolean(busy)} hasWalls={hasWalls} />}
          </div>
        </div>

        <aside className="p3-aside" aria-label="Параметры">
          {tab === 'plan' && !importSource && (
            <section className="p3-panel p3-card" aria-labelledby="p3-sel-title">
              <h2 id="p3-sel-title" className="p3-h4">{selWall ? 'Стена' : selOpening ? (selOpening.type === 'window' ? 'Окно' : 'Дверь') : 'Новая стена'}</h2>
              {selWall && (
                <>
                  <NumField id="p3-wall-len" label="Длина" unit="м" value={wallLength(selWall)} min={0.05} max={500} onCommit={setWallLength} />
                  <NumField id="p3-wall-t" label="Толщина" unit="мм" digits={0} value={selWall.t * 1000} min={30} max={2000} onCommit={(v) => patchWall({ t: v / 1000 })} />
                  <button type="button" className="p3-btn p3-btn--danger" onClick={deleteSelection}><Trash2 size={18} aria-hidden="true" />Удалить стену</button>
                </>
              )}
              {selOpening && selOpeningWall && (
                <>
                  <div className="p3-chips" role="group" aria-label="Тип проёма">
                    <button type="button" className="p3-chip" aria-pressed={selOpening.type === 'door'} onClick={() => patchOpening({ type: 'door' })}>Дверь</button>
                    <button type="button" className="p3-chip" aria-pressed={selOpening.type === 'window'} onClick={() => patchOpening({ type: 'window' })}>Окно</button>
                  </div>
                  <NumField id="p3-op-w" label="Ширина" unit="м" value={selOpening.w} min={0.3} max={Math.max(0.3, wallLength(selOpeningWall))} onCommit={(v) => patchOpening({ w: v })} />
                  <NumField id="p3-op-h" label="Высота" unit="м" value={selOpening.h} min={0.3} max={6} onCommit={(v) => patchOpening({ h: v })} />
                  <NumField id="p3-op-sill" label="Низ проёма от пола" unit="м" value={selOpening.sill} min={0} max={4} onCommit={(v) => patchOpening({ sill: v })} />
                  <NumField id="p3-op-at" label="Центр от начала стены" unit="м" value={selOpening.at} min={0} max={wallLength(selOpeningWall)} onCommit={(v) => patchOpening({ at: v })} />
                  <button type="button" className="p3-btn p3-btn--danger" onClick={deleteSelection}><Trash2 size={18} aria-hidden="true" />Удалить проём</button>
                </>
              )}
              {!selWall && !selOpening && (
                <>
                  <NumField id="p3-new-t" label="Толщина" unit="мм" digits={0} value={wallT * 1000} min={30} max={2000} onCommit={(v) => setWallT(v / 1000)} />
                  <div className="p3-chips" role="group" aria-label="Частые толщины">
                    {[100, 120, 200, 250, 380, 400].map((t) => <button key={t} type="button" className="p3-chip" aria-pressed={Math.round(wallT * 1000) === t} onClick={() => setWallT(t / 1000)}>{t}</button>)}
                  </div>
                  <p className="p3-muted">Выберите стену или проём на плане, чтобы изменить размеры.</p>
                </>
              )}
            </section>
          )}

          <section className="p3-panel p3-card" aria-labelledby="p3-floor-title">
            <h2 id="p3-floor-title" className="p3-h4">Этаж</h2>
            <div className="p3-field">
              <label htmlFor="p3-floor-name">Название</label>
              <input id="p3-floor-name" className="p3-input" type="text" maxLength={40} value={floor.name} translate="no"
                onChange={(e) => setProject({ ...project, floors: project.floors.map((f) => (f.id === floor.id ? { ...f, name: e.target.value } : f)) })}
                onBlur={(e) => { if (!e.target.value.trim()) setProject({ ...project, floors: project.floors.map((f) => (f.id === floor.id ? { ...f, name: `${floorIndex + 1} этаж` } : f)) }); }} />
            </div>
            <button type="button" className="p3-btn p3-btn--ghost" onClick={() => { setTab('plan'); fileRef.current?.click(); }} disabled={Boolean(busy)}><Upload size={18} aria-hidden="true" />Загрузить чертёж на этот этаж</button>
            {project.floors.length > 1 && <button type="button" className="p3-btn p3-btn--danger" onClick={removeFloor}><Trash2 size={18} aria-hidden="true" />Удалить этаж</button>}
            {underlay && <p className="p3-muted">Подложка видна только сейчас: вместе с моделью она не сохраняется.</p>}
          </section>

          <section className="p3-panel p3-card" aria-labelledby="p3-bld-title">
            <h2 id="p3-bld-title" className="p3-h4">Здание</h2>
            <NumField id="p3-fh" label="Высота этажа, от пола до пола" unit="м" value={project.floorHeight} min={2} max={12} onCommit={(v) => update({ ...project, floorHeight: v, slab: Math.min(project.slab, v - 1.5) })} />
            <NumField id="p3-slab" label="Толщина перекрытия" unit="мм" digits={0} value={project.slab * 1000} min={50} max={Math.min(1000, (project.floorHeight - 1.5) * 1000)} onCommit={(v) => update({ ...project, slab: v / 1000 })} />
            <label className="p3-check">
              <input type="checkbox" checked={project.groundSlab} onChange={(e) => update({ ...project, groundSlab: e.target.checked })} />
              <span className="p3-check-name">Плита пола первого этажа</span>
            </label>
          </section>

          <section className="p3-panel p3-card" aria-labelledby="p3-sum-title">
            <h2 id="p3-sum-title" className="p3-h4">Итого по модели</h2>
            <dl className="p3-sum" data-wall-volume={q.totals.wallVolume} data-slab-volume={q.totals.slabVolume} data-rooms={q.totals.rooms} data-rooms-area={q.totals.roomsNetArea}>
              <div><dt>Стены</dt><dd>{fmt(q.totals.wallVolume)} м³</dd></div>
              <div><dt>Перекрытия</dt><dd>{fmt(q.totals.slabVolume)} м³</dd></div>
              <div><dt>Помещений</dt><dd>{q.totals.rooms}</dd></div>
              <div><dt>Площадь в свету</dt><dd>{fmt(q.totals.roomsNetArea)} м²</dd></div>
              <div><dt>Дверей и окон</dt><dd>{q.totals.doors} и {q.totals.windows}</dd></div>
            </dl>
          </section>
        </aside>
      </div>

      <ArOverlay ref={arRoot} active={ar.active} state={ar.state} controller={arController.current} floors={project.floors.length} />
      {camOpen && (
        <Suspense fallback={null}>
          <CameraOverlay project={project} name={project.name} onClose={() => setCamOpen(false)} />
        </Suspense>
      )}
    </div>
  );
}
