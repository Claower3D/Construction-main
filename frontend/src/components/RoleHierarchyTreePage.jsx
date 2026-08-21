import React, { useState, useMemo } from 'react';
import './RoleHierarchyTreePage.css';

/* ─── TREE DATA ─────────────────────────────────────────────────────── */
const COMPANIES = [
  { id: 'qazgost', name: 'ТОО «QAZGOST AI»', bin: '240140029182', license: 'ГСЛ №00291 (I кат.)', city: 'Алматы / Астана', count: 48 },
  { id: 'bi_group', name: 'ТОО «BI Group Engineering»', bin: '190340011293', license: 'ГСЛ №00184 (I кат.)', city: 'Астана', count: 120 },
  { id: 'bazis_a', name: 'ТОО «Базис-А МонолитСтрой»', bin: '150840003412', license: 'ГСЛ №00921 (I кат.)', city: 'Алматы', count: 85 },
];

const buildTree = (company) => ({
  root: {
    id: 'root',
    title: company.name,
    roleType: 'Генеральная организация (ТОО)',
    icon: '🏢',
    person: 'Аскаров Бауржан Касымович',
    personRole: 'Генеральный директор / CEO',
    avatarColor: 'gold',
    bin: company.bin,
    license: company.license,
    desc: 'Высший орган управления проектами, утверждение генеральных смет, распределение эскроу-бюджетов и аккредитация подрядчиков.',
    permissions: ['Полный административный доступ (ROOT)', 'Утверждение смет свыше 100 млн ₸', 'Подписание договоров и эскроу-соглашений', 'Назначение ГИП и Прорабов на объекты'],
    stats: company.count + ' сотрудников • 12 активных объектов',
  },
  branches: [
    {
      id: 'b-mgmt', category: 'management',
      title: 'Управление проектами & CRM', roleType: 'Дирекция управления', icon: '💼',
      person: 'Смагулов Данияр', personRole: 'Директор по строительству (COO)', avatarColor: 'gold',
      desc: 'Контроль сроков реализации, управление воронкой заказчиков и координация проектных офисов.',
      permissions: ['Согласование проектных смет', 'Управление CRM-сделками', 'Курирование начальников участков'],
      count: '6 специалистов',
      children: [
        { id: 'n-gip', title: 'Главный инженер проекта (ГИП)', roleType: 'Проектирование и СНиП', icon: '👔',
          person: 'Касымов Ербол Серикович', personRole: 'ГИП / Сертифицированный эксперт', avatarColor: 'gold',
          desc: 'Разработка и согласование ПСД, прохождение госэкспертизы, соблюдение СП РК и ГОСТ.',
          permissions: ['Утверждение чертежей КЖ/КМ', 'Выпуск ВВР-документации', 'Авторский надзор'], count: '3 проектировщика' },
        { id: 'n-pm', title: 'Менеджер строительных проектов', roleType: 'Клиентский сервис и CRM', icon: '📱',
          person: 'Алиева Динара', personRole: 'Старший CRM-менеджер', avatarColor: 'gold',
          desc: 'Взаимодействие с заказчиками, выставление КП, сопровождение оплат.',
          permissions: ['Ведение клиентской базы', 'Формирование счетов с НДС', 'Разрешение первичных споров'], count: '4 аккаунт-менеджера' },
      ],
    },
    {
      id: 'b-eng', category: 'engineering',
      title: 'Инженерно-технический надзор', roleType: 'Служба Технадзора (QA/QC)', icon: '🔍',
      person: 'Нургалиев Талгат', personRole: 'Главный инженер технадзора', avatarColor: 'pink',
      desc: 'Независимый контроль качества СМР, дефектоскопия, освидетельствование скрытых работ и подписание КС-2/КС-3.',
      permissions: ['Остановка работ при нарушениях СНиП', 'Подписание актов скрытых работ', 'Выпуск предписаний об устранении'],
      count: '8 инженеров РК',
      children: [
        { id: 'n-insp-m', title: 'Инспектор (Монолит и Конструкции)', roleType: 'Аудит бетона и арматуры', icon: '🔬',
          person: 'Искаков Мурат', personRole: 'Ведущий инспектор (Аттестат РК №1402)', avatarColor: 'pink',
          desc: 'Ультразвуковой контроль прочности бетона, проверка защитного слоя арматуры.',
          permissions: ['Приемка фундаментов', 'Испытания контрольных образцов', 'AI-фотофиксация дефектов'], count: '4 объекта' },
        { id: 'n-insp-n', title: 'Инспектор (Инженерные сети)', roleType: 'Электрика, ОВ, ВК, HVAC', icon: '⚡',
          person: 'Сулейменов Ринат', personRole: 'Инженер по инженерным системам', avatarColor: 'pink',
          desc: 'Гидравлические испытания трубопроводов, замеры сопротивления изоляции кабелей.',
          permissions: ['Подписание актов опрессовки', 'Проверка электрощитовых', 'Тепловизионный аудит'], count: '6 объектов' },
      ],
    },
    {
      id: 'b-prod', category: 'production',
      title: 'Строительное производство & Прорабы', roleType: 'Полевое производство СМР', icon: '🏗️',
      person: 'Жумабеков Арман', personRole: 'Главный прораб / Начальник участка', avatarColor: 'green',
      desc: 'Организация строительной площадки, соблюдение графика работ, охрана труда и координация рабочих бригад.',
      permissions: ['Заказ материалов со склада', 'Табелирование рабочих', 'Сдача этапов технадзору'],
      count: '24 строителя (3 бригады)',
      children: [
        { id: 'n-br1', title: 'Бригада монолитных работ (№1)', roleType: 'Арматурщики и бетонщики', icon: '🧱',
          person: 'Бригадир: Садыков Нурлан', personRole: 'Бригадир (8 специалистов)', avatarColor: 'green',
          desc: 'Вязка арматурных каркасов, монтаж опалубки Doka/Peri, приемка товарного бетона.',
          permissions: ['Допуск к высотным работам', 'Отметка выполнения захваток'], count: '8 человек' },
        { id: 'n-br2', title: 'Бригада чистовой отделки (№2)', roleType: 'Штукатуры, маляры, плиточники', icon: '🎨',
          person: 'Бригадир: Ким Александр', personRole: 'Бригадир (6 специалистов)', avatarColor: 'green',
          desc: 'Механизированная штукатурка по маякам, укладка керамогранита, малярные работы.',
          permissions: ['Приемка сухих смесей', 'Сдача геометрии помещений'], count: '6 человек' },
      ],
    },
    {
      id: 'b-cust', category: 'customers',
      title: 'Заказчики, Инвесторы & Эскроу', roleType: 'Инвестиционный контур', icon: '💎',
      person: 'Корпоративные и частные инвесторы', personRole: 'Заказчики объектов', avatarColor: 'purple',
      desc: 'Финансирование строительных объектов через безопасные эскроу-счета, утверждение дизайн-проектов.',
      permissions: ['Приемка готовых этапов', 'Разблокировка эскроу-траншей', 'Вызов независимого аудита'],
      count: '15 активных заказчиков',
      children: [
        { id: 'n-dev', title: 'Генеральный Заказчик / Девелопер', roleType: 'Крупный инвестор (ТОО / АО)', icon: '🏛️',
          person: 'ТОО «Prime Development KZ»', personRole: 'Инвестор ЖК «Nomad Palace»', avatarColor: 'purple',
          desc: 'Заказчик жилого комплекса на 12 000 м². Ежемесячный траншевый контроль.',
          permissions: ['Утверждение генподряда', 'Финансовый аудит'], count: 'Бюджет: 850 млн ₸' },
        { id: 'n-priv', title: 'Частные заказчики коттеджей', roleType: 'Физлица (ИИН)', icon: '👤',
          person: 'Ахметов Марат и 14 клиентов', personRole: 'Индивидуальные застройщики', avatarColor: 'purple',
          desc: 'Строительство частных домов, капитальный ремонт квартир и коттеджей.',
          permissions: ['Оплата через Kaspi QR', 'Просмотр онлайн-камер'], count: '14 договоров' },
      ],
    },
  ],
});

/* ─── COMPONENT ─────────────────────────────────────────────────────── */
export default function RoleHierarchyTreePage({ onBack, hideHeader = false }) {
  const [companyId, setCompanyId] = useState('qazgost');
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [toast, setToast] = useState(null);

  const flash = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const company = COMPANIES.find(c => c.id === companyId) || COMPANIES[0];
  const tree = useMemo(() => buildTree(company), [company]);

  const branches = useMemo(() =>
    tree.branches.filter(b => {
      if (filter !== 'all' && b.category !== filter) return false;
      if (!search) return true;
      const q = search.toLowerCase();
      return b.title.toLowerCase().includes(q) || b.person.toLowerCase().includes(q) ||
        b.children?.some(c => c.title.toLowerCase().includes(q) || c.person.toLowerCase().includes(q));
    }),
  [tree.branches, filter, search]);

  const FILTERS = [
    { key: 'all', label: '🌳 Вся структура', extra: `(${tree.branches.length} ветви)` },
    { key: 'management', label: '💼 Управление' },
    { key: 'engineering', label: '🔍 Технадзор' },
    { key: 'production', label: '🏗️ Бригады' },
    { key: 'customers', label: '💎 Заказчики' },
  ];

  /* ---- Node card renderer ---- */
  const NodeCard = ({ node, isRoot, isChild }) => (
    <div
      className={`${isRoot ? 'rht-root-card' : 'rht-node'} ${selected?.id === node.id ? 'sel' : ''}`}
      onClick={(e) => { e.stopPropagation(); setSelected(node); }}
    >
      <div className="rht-node-head">
        <div className="rht-node-icon">{node.icon}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h4 className="rht-node-name" style={isChild ? { fontSize: '.88rem' } : undefined}>{node.title}</h4>
          <span className="rht-role-tag">{node.roleType}</span>
        </div>
      </div>
      <div className="rht-person">
        <div className={`rht-avatar ${node.avatarColor || ''}`}>
          {isRoot ? '👑' : node.person?.charAt(0)?.toUpperCase() || '?'}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="rht-pname">{node.person}</div>
          <div className="rht-prole">{node.personRole}</div>
        </div>
      </div>
      <div className="rht-node-foot">
        {isRoot ? <span>БИН: {node.bin}</span> : <span>Подчинённых:</span>}
        <span className="rht-badge">{isRoot ? node.stats : node.count}</span>
      </div>
    </div>
  );

  return (
    <div className="rht-wrapper">
      {toast && <div className="rht-toast-msg">{toast}</div>}

      {/* ── Hero ────────────────────────────────────────────────── */}
      <div className="rht-hero">
        <div>
          <h2 className="rht-hero-title">
            <span style={{ fontSize: '1.6rem' }}>🌳</span>
            Иерархическое древо ролей и структуры
          </h2>
          <p className="rht-hero-desc">
            Интерактивное семейное древо ролей организации. Нажмите на любого участника структуры для просмотра должностных обязанностей, полномочий и прикреплённых объектов.
          </p>
        </div>
        <div className="rht-company-select-wrap">
          <span style={{ fontSize: '1.3rem' }}>🏢</span>
          <select
            className="rht-company-select"
            value={companyId}
            onChange={e => { setCompanyId(e.target.value); flash('Компания переключена ✓'); }}
          >
            {COMPANIES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      </div>

      {/* ── Toolbar ─────────────────────────────────────────────── */}
      <div className="rht-toolbar">
        <div className="rht-pills">
          {FILTERS.map(f => (
            <button
              key={f.key}
              className={`rht-pill ${filter === f.key ? 'active' : ''}`}
              onClick={() => setFilter(f.key)}
            >
              {f.label} {f.extra || ''}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <input
            className="rht-search-input"
            placeholder="🔎 Поиск роли или сотрудника..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <div className="rht-zoom-row">
            <button className="rht-z-btn" onClick={() => setZoom(Math.max(.6, zoom - .1))}>−</button>
            <span className="rht-z-label">{Math.round(zoom * 100)}%</span>
            <button className="rht-z-btn" onClick={() => setZoom(Math.min(1.4, zoom + .1))}>+</button>
            <button className="rht-z-btn" onClick={() => setZoom(1)}>↺</button>
          </div>
        </div>
      </div>

      {/* ── Tree Canvas ─────────────────────────────────────────── */}
      <div className="rht-canvas">
        <div className="rht-tree-inner" style={{ transform: `scale(${zoom})`, transformOrigin: 'top center' }}>

          {/* ROOT */}
          <div className="rht-root-wrap">
            <NodeCard node={tree.root} isRoot />
            <div className="rht-conn-v" />
          </div>

          {/* Horizontal bar */}
          {branches.length > 1 && (
            <div className="rht-conn-h-bar" style={{ width: `${Math.min(85, branches.length * 22)}%` }} />
          )}

          {/* BRANCHES */}
          <div className="rht-branches">
            {branches.map(branch => (
              <div key={branch.id} className="rht-branch" data-cat={branch.category}>
                <NodeCard node={branch} />

                {branch.children?.length > 0 && (
                  <div className="rht-children">
                    <div className="rht-conn-v" style={{ height: '24px' }} />
                    {branch.children.map(child => (
                      <div key={child.id} className="rht-child-node">
                        <NodeCard node={child} isChild />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Inspector Drawer ────────────────────────────────────── */}
      {selected && (
        <div className="rht-backdrop" onClick={() => setSelected(null)}>
          <div className="rht-drawer" onClick={e => e.stopPropagation()}>
            <div className="rht-drawer-head">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: '1.5rem' }}>{selected.icon}</span>
                <div>
                  <h3>{selected.title}</h3>
                  <span style={{ fontSize: '.76rem', color: '#38bdf8', fontWeight: 700 }}>{selected.roleType}</span>
                </div>
              </div>
              <button className="rht-drawer-close" onClick={() => setSelected(null)}>✕</button>
            </div>

            <div className="rht-drawer-body">
              {/* Person Hero */}
              <div className="rht-info-block highlight" style={{ textAlign: 'center', padding: '1.5rem' }}>
                <div className="rht-drawer-avatar">{selected.icon}</div>
                <p className="rht-drawer-person-name">{selected.person}</p>
                <p className="rht-drawer-person-role">{selected.personRole}</p>
              </div>

              {/* Description */}
              <div className="rht-info-block">
                <h4>📝 Зона ответственности</h4>
                <p>{selected.desc}</p>
              </div>

              {/* Permissions */}
              {selected.permissions?.length > 0 && (
                <div className="rht-info-block">
                  <h4>🛡️ Права доступа и полномочия</h4>
                  <ul>
                    {selected.permissions.map((p, i) => <li key={i}>{p}</li>)}
                  </ul>
                </div>
              )}

              {/* Stats */}
              {(selected.count || selected.stats) && (
                <div className="rht-info-block">
                  <h4>📊 Статистика</h4>
                  <p style={{ fontSize: '1.05rem', fontWeight: 800, color: '#6ee7b7' }}>
                    {selected.stats || selected.count}
                  </p>
                </div>
              )}

              {/* Actions */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '.65rem', marginTop: '.5rem' }}>
                <button className="rht-action-btn primary"
                  onClick={() => flash(`⚡ Права для «${selected.title}» синхронизированы`)}>
                  ⚡ Управление правами доступа
                </button>
                <button className="rht-action-btn secondary"
                  onClick={() => flash(`📬 Уведомление отправлено: ${selected.person}`)}>
                  💬 Написать сотруднику
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
