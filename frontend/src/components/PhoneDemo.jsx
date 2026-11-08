import React, { useEffect, useRef, useState } from 'react';
import {
  Camera, FileText, ClipboardList, Home, FolderOpen, User, ChevronLeft, X, Images, RefreshCw,
  Check, MapPin, Send, Download, Minus, Plus, AlertTriangle, Wifi, Signal, BatteryFull, ScanLine,
} from 'lucide-react';
import { startFlow } from '../utils/navigate';
import './PhoneDemo.css';

/*
 * Живое демо мобильного приложения QazGost внутри реалистичного смартфона.
 * Всё кликается: камера → распознавание → смета, ручной расчёт, акт дефектов,
 * вкладки «Сметы», «Акты», «Профиль». Цены — демонстрационные.
 */

const WORKS = {
  plaster: { name: 'Штукатурка стен', work: 2900, mat: 1400 },
  screed: { name: 'Стяжка пола', work: 2800, mat: 1900 },
  tile: { name: 'Укладка плитки', work: 6500, mat: 5200 },
  paint: { name: 'Покраска стен', work: 1800, mat: 900 },
};
const SCEN = [
  { id: 'eco', label: 'Эконом', k: 0.85 },
  { id: 'std', label: 'Стандарт', k: 1 },
  { id: 'pro', label: 'Премиум', k: 1.35 },
];
const fmt = (n) => Math.round(n).toLocaleString('ru-RU').replace(/,/g, ' ');

function useClock() {
  const [t, setT] = useState(() => new Date());
  useEffect(() => { const id = setInterval(() => setT(new Date()), 20000); return () => clearInterval(id); }, []);
  return t.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}

function StatusBar({ dark }) {
  const time = useClock();
  return (
    <div className={`pd-status${dark ? ' is-dark' : ''}`} aria-hidden="true">
      <span>{time}</span>
      <span className="pd-status-r"><Signal size={12} /><Wifi size={12} /><BatteryFull size={15} /></span>
    </div>
  );
}

function Header({ title, onBack }) {
  return (
    <div className="pd-head">
      <button type="button" className="pd-icon-btn" onClick={onBack} aria-label="Назад"><ChevronLeft size={18} /></button>
      <strong>{title}</strong>
      <span className="pd-icon-btn is-ghost" />
    </div>
  );
}

export default function PhoneDemo() {
  const [screen, setScreen] = useState('home');
  const [job, setJob] = useState({ work: 'plaster', area: 42, from: 'photo' });
  const [scen, setScen] = useState('std');
  const [flash, setFlash] = useState(false);
  const [scanStep, setScanStep] = useState(0);
  const [toast, setToast] = useState('');
  const [touched, setTouched] = useState(false);
  const timers = useRef([]);

  const later = (fn, ms) => { const id = setTimeout(fn, ms); timers.current.push(id); };
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const go = (s) => { setTouched(true); setScreen(s); };
  const say = (msg) => { setToast(msg); later(() => setToast(''), 2200); };

  const shoot = () => {
    setFlash(true);
    later(() => { setFlash(false); setScanStep(0); setScreen('scan'); }, 180);
    [1, 2, 3].forEach((s) => later(() => setScanStep(s), 450 + s * 650));
    later(() => { setJob({ work: 'plaster', area: 42, from: 'photo' }); setScreen('estimate'); }, 3100);
  };

  const w = WORKS[job.work];
  const k = SCEN.find((x) => x.id === scen).k;
  const work = w.work * job.area * k;
  const mat = w.mat * job.area * k;
  const trash = 9000 + job.area * 120;
  const total = work + mat + trash;

  const tabs = [
    { id: 'home', label: 'Главная', Icon: Home },
    { id: 'list', label: 'Сметы', Icon: FolderOpen },
    { id: 'acts', label: 'Акты', Icon: ClipboardList },
    { id: 'profile', label: 'Профиль', Icon: User },
  ];
  const showTabs = ['home', 'list', 'acts', 'profile'].includes(screen);
  const darkStatus = screen === 'camera';

  return (
    <div className="pd-wrap">
      <span className="pd-hint" aria-hidden={touched}>{touched ? 'Демо приложения' : 'Нажмите — интерфейс живой'}</span>
      <div className="pd-phone" role="group" aria-label="Демо мобильного приложения QazGost">
        <span className="pd-key pd-key--action" /><span className="pd-key pd-key--vup" /><span className="pd-key pd-key--vdown" /><span className="pd-key pd-key--power" />
        <div className="pd-screen">
          <span className="pd-island" aria-hidden="true"><i /></span>
          <StatusBar dark={darkStatus} />

          <div className="pd-view" key={screen}>
            {screen === 'home' && (
              <div className="pd-page">
                <div className="pd-hello">
                  <div>
                    <small>Добрый день</small>
                    <b>Что делаем сегодня?</b>
                  </div>
                  <span className="pd-city"><MapPin size={11} />Астана</span>
                </div>
                <button type="button" className={`pd-action is-cyan${touched ? '' : ' is-pulse'}`} onClick={() => go('camera')}>
                  <span className="pd-action-ic"><Camera size={18} /></span>
                  <span><b>Сделать фото</b><small>Смета по снимку за минуту</small></span>
                </button>
                <button type="button" className="pd-action is-amber" onClick={() => go('calc')}>
                  <span className="pd-action-ic"><FileText size={18} /></span>
                  <span><b>Создать смету</b><small>Вид работ и площадь</small></span>
                </button>
                <button type="button" className="pd-action is-rose" onClick={() => go('defect')}>
                  <span className="pd-action-ic"><AlertTriangle size={18} /></span>
                  <span><b>Акт дефектов</b><small>Трещины по фото</small></span>
                </button>
                <div className="pd-sec">Мои объекты</div>
                <button type="button" className="pd-row" onClick={() => { setJob({ work: 'plaster', area: 65, from: 'list' }); go('estimate'); }}>
                  <i className="is-mint" /><span><b>Квартира, Сыганак 18</b><small>Смета готова</small></span><em>{fmt(65 * (2900 + 1400) + 9000 + 65 * 120)} ₸</em>
                </button>
                <button type="button" className="pd-row" onClick={() => { setJob({ work: 'tile', area: 24, from: 'list' }); go('estimate'); }}>
                  <i className="is-amber" /><span><b>Санузел, Кенесары 4</b><small>Ждёт бригаду</small></span><em>{fmt(24 * (6500 + 5200) + 9000 + 24 * 120)} ₸</em>
                </button>
              </div>
            )}

            {screen === 'camera' && (
              <div className="pd-cam">
                <img src="/assets/phone/cam-wall.webp" alt="" />
                <span className="pd-cam-grid" />
                <span className="pd-cam-focus" />
                <div className="pd-cam-top">
                  <button type="button" className="pd-icon-btn is-glass" onClick={() => go('home')} aria-label="Закрыть камеру"><X size={16} /></button>
                  <span className="pd-cam-tip">Снимите стену целиком</span>
                </div>
                <div className="pd-cam-bottom">
                  <span className="pd-cam-thumb"><Images size={16} /></span>
                  <button type="button" className="pd-shutter" onClick={shoot} aria-label="Сделать снимок"><i /></button>
                  <span className="pd-cam-thumb"><RefreshCw size={16} /></span>
                </div>
                {flash && <span className="pd-flash" />}
              </div>
            )}

            {screen === 'scan' && (
              <div className="pd-page">
                <Header title="Распознавание" onBack={() => go('home')} />
                <div className="pd-scan">
                  <img src="/assets/phone/cam-wall.webp" alt="" />
                  <span className="pd-scan-line" />
                  {scanStep >= 1 && <span className="pd-box" style={{ left: '62%', top: '8%', width: '35%', height: '82%' }}><b>Стена · 14,2 м²</b></span>}
                  {scanStep >= 2 && <span className="pd-box is-mint" style={{ left: '3%', top: '4%', width: '30%', height: '30%' }}><b>Гипсокартон</b></span>}
                </div>
                <ul className="pd-steps">
                  {['Определяю вид работ', 'Считаю площадь и объёмы', 'Подбираю цены по Астане'].map((t, i) => (
                    <li key={t} className={scanStep > i ? 'is-done' : scanStep === i ? 'is-now' : ''}>
                      <span>{scanStep > i ? <Check size={11} /> : <ScanLine size={11} />}</span>{t}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {screen === 'calc' && (
              <div className="pd-page">
                <Header title="Новая смета" onBack={() => go('home')} />
                <div className="pd-sec">Вид работ</div>
                <div className="pd-chips">
                  {Object.entries(WORKS).map(([id, x]) => (
                    <button key={id} type="button" className={job.work === id ? 'is-on' : ''} onClick={() => setJob((j) => ({ ...j, work: id }))}>{x.name}</button>
                  ))}
                </div>
                <div className="pd-sec">Площадь</div>
                <div className="pd-stepper">
                  <button type="button" onClick={() => setJob((j) => ({ ...j, area: Math.max(5, j.area - 5) }))} aria-label="Меньше"><Minus size={16} /></button>
                  <b>{job.area} м²</b>
                  <button type="button" onClick={() => setJob((j) => ({ ...j, area: Math.min(500, j.area + 5) }))} aria-label="Больше"><Plus size={16} /></button>
                </div>
                <div className="pd-note">Работа {fmt(w.work)} ₸/м² · материалы {fmt(w.mat)} ₸/м²</div>
                <button type="button" className="pd-cta" onClick={() => { setJob((j) => ({ ...j, from: 'calc' })); setScen('std'); go('estimate'); }}>Рассчитать</button>
              </div>
            )}

            {screen === 'estimate' && (
              <div className="pd-page">
                <Header title="Смета" onBack={() => go(job.from === 'list' ? 'home' : job.from === 'calc' ? 'calc' : 'home')} />
                <div className="pd-est-title"><b>{w.name}</b><small>{job.area} м² · Астана · цены 2026</small></div>
                <div className="pd-seg" role="tablist">
                  {SCEN.map((x) => (
                    <button key={x.id} type="button" role="tab" aria-selected={scen === x.id} className={scen === x.id ? 'is-on' : ''} onClick={() => setScen(x.id)}>{x.label}</button>
                  ))}
                </div>
                <ul className="pd-lines">
                  <li><span>Работа</span><b>{fmt(work)} ₸</b></li>
                  <li><span>Материалы</span><b>{fmt(mat)} ₸</b></li>
                  <li><span>Вывоз мусора</span><b>{fmt(trash)} ₸</b></li>
                </ul>
                <div className="pd-total"><span>Итого</span><b>{fmt(total)} ₸</b></div>
                <div className="pd-btns">
                  <button type="button" className="pd-ghost" onClick={() => say('Смета PDF сохранена')}><Download size={14} />PDF</button>
                  <button type="button" className="pd-cta" onClick={() => say('Отправлено 3 бригадам в Астане')}><Send size={14} />Найти бригаду</button>
                </div>
                <small className="pd-demo">Демо-расчёт для примера</small>
              </div>
            )}

            {screen === 'defect' && (
              <div className="pd-page">
                <Header title="Акт дефектов" onBack={() => go('home')} />
                <div className="pd-scan is-tall">
                  <img src="/assets/phone/crack.webp" alt="" />
                  <span className="pd-scan-line is-rose" />
                  <span className="pd-box is-rose is-draw" style={{ left: '25%', top: '3%', width: '41%', height: '87%' }}><b>Трещина · 91%</b></span>
                </div>
                <ul className="pd-lines is-compact">
                  <li><span>Ширина раскрытия</span><b className="is-rose">0,4 мм</b></li>
                  <li><span>Длина</span><b>1,2 м</b></li>
                  <li><span>Ремонт</span><b>≈ 18 000 ₸</b></li>
                </ul>
                <button type="button" className="pd-cta is-rose" onClick={() => say('Акт PDF готов и сохранён')}><ClipboardList size={14} />Сформировать акт</button>
              </div>
            )}

            {screen === 'list' && (
              <div className="pd-page">
                <div className="pd-title">Сметы</div>
                {[['plaster', 65, 'Квартира, Сыганак 18', 'is-mint', 'Готова'], ['tile', 24, 'Санузел, Кенесары 4', 'is-amber', 'Ждёт бригаду'], ['screed', 80, 'Офис, Туран 37', 'is-cyan', 'Черновик']].map(([wk, ar, nm, c, st]) => (
                  <button key={nm} type="button" className="pd-row" onClick={() => { setJob({ work: wk, area: ar, from: 'list' }); go('estimate'); }}>
                    <i className={c} /><span><b>{nm}</b><small>{WORKS[wk].name} · {ar} м² · {st}</small></span><em>{fmt(ar * (WORKS[wk].work + WORKS[wk].mat) + 9000 + ar * 120)} ₸</em>
                  </button>
                ))}
                <button type="button" className="pd-cta is-outline" onClick={() => go('calc')}><Plus size={14} />Новая смета</button>
              </div>
            )}

            {screen === 'acts' && (
              <div className="pd-page">
                <div className="pd-title">Акты дефектов</div>
                {[['Трещина в штукатурке', 'Сыганак 18 · 0,4 мм', 'is-rose'], ['Протечка у стояка', 'Кенесары 4 · на осмотре', 'is-amber']].map(([nm, sub, c]) => (
                  <button key={nm} type="button" className="pd-row" onClick={() => go('defect')}>
                    <i className={c} /><span><b>{nm}</b><small>{sub}</small></span><em>PDF</em>
                  </button>
                ))}
                <button type="button" className="pd-cta is-outline is-rose" onClick={() => go('defect')}><Camera size={14} />Проверить фото</button>
              </div>
            )}

            {screen === 'profile' && (
              <div className="pd-page">
                <div className="pd-title">Профиль</div>
                <div className="pd-profile"><span>Г</span><div><b>Гость</b><small>Войдите, чтобы сохранять сметы</small></div></div>
                <ul className="pd-lines is-compact">
                  <li><span>Город</span><b>Астана</b></li>
                  <li><span>Язык</span><b>Русский</b></li>
                  <li><span>Уведомления</span><b className="is-mint">Вкл</b></li>
                </ul>
                <button type="button" className="pd-cta" onClick={() => startFlow('register')}>Зарегистрироваться</button>
              </div>
            )}
          </div>

          {showTabs && (
            <nav className="pd-tabs" aria-label="Разделы приложения">
              {tabs.map(({ id, label, Icon }) => (
                <button key={id} type="button" className={screen === id ? 'is-on' : ''} onClick={() => go(id)} aria-current={screen === id ? 'page' : undefined}>
                  <Icon size={17} /><span>{label}</span>
                </button>
              ))}
            </nav>
          )}
          {toast && <div className="pd-toast" role="status"><Check size={14} />{toast}</div>}
          <span className="pd-homebar" aria-hidden="true" />
          <span className="pd-glare" aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}
