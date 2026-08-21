import React, { useState, useMemo, useCallback } from 'react';
import './RoleHierarchyTreePage.css';

/* ═══ DATA ═════════════════════════════════════════════════════════════ */
const COMPANIES_DB = [
  {
    id: 'qazgost', name: 'QAZGOST AI', fullName: 'ТОО «QAZGOST AI»',
    bin: '240140029182', city: 'Алматы', staff: 48, objects: 12, color: '#0ea5e9',
    ceo: { name: 'Аскаров Бауржан', role: 'CEO / Генеральный директор' },
    branches: [
      { id: 'q-mgmt', cat: 'mgmt', icon: '💼', title: 'Управление', sub: 'Дирекция',
        head: 'Смагулов Данияр', headRole: 'COO', count: 6,
        children: [
          { id: 'q-gip', icon: '👔', title: 'ГИП', sub: 'Проектирование', head: 'Касымов Ербол', count: 3 },
          { id: 'q-pm', icon: '📱', title: 'CRM-менеджер', sub: 'Клиенты', head: 'Алиева Динара', count: 4 },
        ]},
      { id: 'q-eng', cat: 'eng', icon: '🔍', title: 'Технадзор', sub: 'QA/QC',
        head: 'Нургалиев Талгат', headRole: 'Гл. инженер', count: 8,
        children: [
          { id: 'q-ins1', icon: '🔬', title: 'Инспектор монолит', sub: 'Бетон', head: 'Искаков Мурат', count: 4 },
          { id: 'q-ins2', icon: '⚡', title: 'Инспектор сети', sub: 'ОВ/ВК/Электрика', head: 'Сулейменов Ринат', count: 6 },
        ]},
      { id: 'q-prod', cat: 'prod', icon: '🏗️', title: 'Производство', sub: 'СМР',
        head: 'Жумабеков Арман', headRole: 'Гл. прораб', count: 24,
        children: [
          { id: 'q-br1', icon: '🧱', title: 'Бригада №1', sub: 'Монолит', head: 'Садыков Нурлан', count: 8 },
          { id: 'q-br2', icon: '🎨', title: 'Бригада №2', sub: 'Отделка', head: 'Ким Александр', count: 6 },
        ]},
      { id: 'q-cust', cat: 'cust', icon: '💎', title: 'Заказчики', sub: 'Инвесторы',
        head: 'Корпоративные клиенты', headRole: '', count: 15,
        children: [
          { id: 'q-dev', icon: '🏛️', title: 'Девелопер', sub: 'ТОО/АО', head: 'Prime Development KZ', count: 850 },
          { id: 'q-priv', icon: '👤', title: 'Частные', sub: 'Физлица', head: 'Ахметов Марат +14', count: 14 },
        ]},
      { id: 'q-anal', cat: 'anal', icon: '📊', title: 'Аналитик', sub: 'Отчётность',
        head: 'Нуркенов Асхат', headRole: 'Аналитик QA', count: 2,
        children: [] },
    ],
  },
  {
    id: 'bi_group', name: 'BI Group', fullName: 'ТОО «BI Group Engineering»',
    bin: '190340011293', city: 'Астана', staff: 1200, objects: 45, color: '#f59e0b',
    ceo: { name: 'Хамитов Айдын', role: 'CEO' },
    branches: [
      { id: 'bi-mgmt', cat: 'mgmt', icon: '💼', title: 'Управление', sub: 'Дирекция',
        head: 'Серикбаев Ерлан', headRole: 'COO', count: 35,
        children: [
          { id: 'bi-pm', icon: '📋', title: 'Проектный офис', sub: 'PMO', head: 'Токтаров Б.', count: 12 },
          { id: 'bi-fin', icon: '💰', title: 'Финансы', sub: 'CFO', head: 'Рахимова А.', count: 8 },
        ]},
      { id: 'bi-eng', cat: 'eng', icon: '🔍', title: 'Технадзор', sub: 'QA/QC',
        head: 'Мустафин Канат', headRole: 'Гл. инженер', count: 42,
        children: [
          { id: 'bi-lab', icon: '🧪', title: 'Лаборатория', sub: 'Испытания', head: 'Жансугуров Т.', count: 15 },
        ]},
      { id: 'bi-prod', cat: 'prod', icon: '🏗️', title: 'Строительство', sub: 'СМР',
        head: 'Кенесов Бекзат', headRole: 'Директор СМР', count: 850,
        children: [
          { id: 'bi-jk1', icon: '🏢', title: 'ЖК «Астана Хаб»', sub: '24 этажа', head: 'Прораб Сатов', count: 120 },
          { id: 'bi-jk2', icon: '🏢', title: 'ЖК «Green City»', sub: '18 этажей', head: 'Прораб Жунусов', count: 95 },
          { id: 'bi-infra', icon: '🛣️', title: 'Инфраструктура', sub: 'Дороги/мосты', head: 'Бекмуратов К.', count: 200 },
        ]},
      { id: 'bi-cust', cat: 'cust', icon: '💎', title: 'Заказчики', sub: 'Инвесторы',
        head: '12 крупных девелоперов', headRole: '', count: 12,
        children: [] },
    ],
  },
  {
    id: 'bazis', name: 'Базис-А', fullName: 'ТОО «Базис-А МонолитСтрой»',
    bin: '150840003412', city: 'Алматы', staff: 85, objects: 8, color: '#10b981',
    ceo: { name: 'Касымбеков Ерболат', role: 'Директор' },
    branches: [
      { id: 'bz-mgmt', cat: 'mgmt', icon: '💼', title: 'Управление', sub: 'Дирекция',
        head: 'Адилов Нурлан', headRole: 'Зам. директора', count: 5,
        children: [
          { id: 'bz-gip', icon: '👔', title: 'ГИП', sub: 'Проектирование', head: 'Утемисов Д.', count: 3 },
        ]},
      { id: 'bz-prod', cat: 'prod', icon: '🏗️', title: 'Производство', sub: 'Монолитные работы',
        head: 'Турсунов Максат', headRole: 'Гл. прораб', count: 60,
        children: [
          { id: 'bz-br1', icon: '🧱', title: 'Бригада монолит', sub: '16 чел.', head: 'Бригадир Алтынбек', count: 16 },
          { id: 'bz-br2', icon: '🎨', title: 'Бригада отделка', sub: '12 чел.', head: 'Бригадир Сагат', count: 12 },
          { id: 'bz-br3', icon: '⚡', title: 'Бригада сети', sub: '8 чел.', head: 'Бригадир Кенже', count: 8 },
        ]},
      { id: 'bz-eng', cat: 'eng', icon: '🔍', title: 'Технадзор', sub: 'Контроль качества',
        head: 'Сабитов Рустам', headRole: 'Инженер ТН', count: 4,
        children: [] },
    ],
  },
  {
    id: 'prime_dev', name: 'Prime Development', fullName: 'ТОО «Prime Development KZ»',
    bin: '180240009871', city: 'Алматы', staff: 35, objects: 3, color: '#8b5cf6',
    ceo: { name: 'Тулеубаев Арман', role: 'Управляющий директор' },
    branches: [
      { id: 'pd-inv', cat: 'cust', icon: '💰', title: 'Инвестиции', sub: 'Финансирование',
        head: 'Жаксылыков Б.', headRole: 'CFO', count: 8,
        children: [
          { id: 'pd-esc', icon: '🛡️', title: 'Эскроу-контроль', sub: '3 объекта', head: 'Мырзабек А.', count: 3 },
        ]},
      { id: 'pd-dev', cat: 'mgmt', icon: '🏢', title: 'Девелопмент', sub: 'Объекты',
        head: 'Кусаинов Т.', headRole: 'Руководитель', count: 15,
        children: [
          { id: 'pd-jk1', icon: '🏙️', title: 'ЖК «Nomad Palace»', sub: '12 000 м²', head: 'Менеджер Асет', count: 1 },
          { id: 'pd-jk2', icon: '🏙️', title: 'ЖК «Green Hills»', sub: '8 500 м²', head: 'Менеджер Алия', count: 1 },
        ]},
    ],
  },
];

const CAT_COLORS = {
  mgmt: { border: '#f59e0b', bg: 'rgba(245,158,11,.08)', text: '#fbbf24' },
  eng:  { border: '#ef4444', bg: 'rgba(239,68,68,.08)', text: '#fb7185' },
  prod: { border: '#10b981', bg: 'rgba(16,185,129,.08)', text: '#34d399' },
  cust: { border: '#8b5cf6', bg: 'rgba(139,92,246,.08)', text: '#a78bfa' },
  anal: { border: '#3b82f6', bg: 'rgba(59,130,246,.08)', text: '#60a5fa' },
};

/* ═══ COMPONENT ════════════════════════════════════════════════════════ */
export default function RoleHierarchyTreePage({ onBack, hideHeader = false }) {
  const [selectedCompanies, setSelectedCompanies] = useState(['qazgost']);
  const [expanded, setExpanded] = useState({});
  const [inspecting, setInspecting] = useState(null);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState(null);

  const flash = (m) => { setToast(m); setTimeout(() => setToast(null), 2500); };

  const toggleCompany = useCallback((id) => {
    setSelectedCompanies(prev => {
      if (prev.includes(id)) {
        if (prev.length === 1) return prev; // at least 1
        return prev.filter(c => c !== id);
      }
      return [...prev, id];
    });
  }, []);

  const toggleExpand = useCallback((nodeId) => {
    setExpanded(prev => ({ ...prev, [nodeId]: !prev[nodeId] }));
  }, []);

  const expandAll = useCallback(() => {
    const all = {};
    COMPANIES_DB.forEach(c => c.branches.forEach(b => { all[b.id] = true; }));
    setExpanded(all);
    flash('🌳 Все ветки развёрнуты');
  }, []);

  const collapseAll = useCallback(() => {
    setExpanded({});
    flash('📁 Все ветки свёрнуты');
  }, []);

  const matchesSearch = (node) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return node.title?.toLowerCase().includes(q) ||
      node.head?.toLowerCase().includes(q) ||
      node.sub?.toLowerCase().includes(q) ||
      node.children?.some(c => c.title?.toLowerCase().includes(q) || c.head?.toLowerCase().includes(q));
  };

  /* ── Render a single company tree ─────────────────────────── */
  const renderCompanyTree = (company) => {
    const filteredBranches = company.branches.filter(matchesSearch);

    return (
      <div key={company.id} className="ogt-company-section">
        {/* Company Root */}
        <div className="ogt-root" style={{ '--cc': company.color }} onClick={() => setInspecting({ type: 'company', data: company })}>
          <div className="ogt-root-glow" />
          <div className="ogt-root-icon">🏢</div>
          <div className="ogt-root-info">
            <div className="ogt-root-name">{company.fullName}</div>
            <div className="ogt-root-meta">
              <span>👤 {company.ceo.name}</span>
              <span className="ogt-dot">•</span>
              <span>{company.ceo.role}</span>
            </div>
            <div className="ogt-root-badges">
              <span className="ogt-rbadge">БИН: {company.bin}</span>
              <span className="ogt-rbadge green">{company.staff} сотр.</span>
              <span className="ogt-rbadge blue">{company.objects} объектов</span>
              <span className="ogt-rbadge">{company.city}</span>
            </div>
          </div>
        </div>

        {/* Connector */}
        <div className="ogt-trunk" style={{ '--cc': company.color }} />

        {/* Branches */}
        <div className="ogt-branches-grid">
          {filteredBranches.map(branch => {
            const catColor = CAT_COLORS[branch.cat] || CAT_COLORS.mgmt;
            const isOpen = expanded[branch.id];
            const hasChildren = branch.children && branch.children.length > 0;

            return (
              <div key={branch.id} className="ogt-branch-col">
                {/* Branch card */}
                <div
                  className={`ogt-bcard ${inspecting?.data?.id === branch.id ? 'sel' : ''}`}
                  style={{ '--bc': catColor.border, '--bbg': catColor.bg }}
                  onClick={() => setInspecting({ type: 'branch', data: branch, company })}
                >
                  <div className="ogt-bcard-top">
                    <span className="ogt-bcard-icon">{branch.icon}</span>
                    <div className="ogt-bcard-titles">
                      <div className="ogt-bcard-name">{branch.title}</div>
                      <div className="ogt-bcard-sub" style={{ color: catColor.text }}>{branch.sub}</div>
                    </div>
                    {hasChildren && (
                      <button className="ogt-expand-btn" onClick={(e) => { e.stopPropagation(); toggleExpand(branch.id); }}>
                        {isOpen ? '▾' : '▸'}
                      </button>
                    )}
                  </div>
                  <div className="ogt-bcard-person">
                    <div className="ogt-mini-avatar" style={{ background: catColor.border }}>{branch.head?.charAt(0)}</div>
                    <div>
                      <div className="ogt-bcard-head-name">{branch.head}</div>
                      {branch.headRole && <div className="ogt-bcard-head-role">{branch.headRole}</div>}
                    </div>
                  </div>
                  <div className="ogt-bcard-footer">
                    <span className="ogt-count-badge" style={{ borderColor: catColor.border, color: catColor.text }}>
                      {branch.count} чел.
                    </span>
                    {hasChildren && (
                      <span style={{ fontSize: '.7rem', color: '#64748b' }}>{branch.children.length} подразд.</span>
                    )}
                  </div>
                </div>

                {/* Children */}
                {hasChildren && isOpen && (
                  <div className="ogt-children">
                    <div className="ogt-child-line" style={{ '--bc': catColor.border }} />
                    {branch.children.map(child => (
                      <div key={child.id}
                        className={`ogt-child-card ${inspecting?.data?.id === child.id ? 'sel' : ''}`}
                        style={{ '--bc': catColor.border, '--bbg': catColor.bg }}
                        onClick={() => setInspecting({ type: 'child', data: child, branch, company })}
                      >
                        <span className="ogt-child-icon">{child.icon}</span>
                        <div className="ogt-child-info">
                          <div className="ogt-child-name">{child.title}</div>
                          <div className="ogt-child-sub">{child.sub}</div>
                          <div className="ogt-child-head">{child.head} <span className="ogt-count-badge sm" style={{ borderColor: catColor.border, color: catColor.text }}>{child.count}</span></div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const activeCompanies = COMPANIES_DB.filter(c => selectedCompanies.includes(c.id));

  return (
    <div className="ogt-wrapper">
      {toast && <div className="ogt-toast">{toast}</div>}

      {/* ── Header ──────────────────────────────────────────── */}
      <div className="ogt-header">
        <div className="ogt-header-left">
          <h2 className="ogt-title">🌳 Организационное древо</h2>
          <p className="ogt-subtitle">Выберите одну или несколько компаний для параллельного просмотра</p>
        </div>
        <div className="ogt-header-controls">
          <button className="ogt-ctrl-btn" onClick={expandAll}>📂 Развернуть</button>
          <button className="ogt-ctrl-btn" onClick={collapseAll}>📁 Свернуть</button>
        </div>
      </div>

      {/* ── Company Selector ────────────────────────────────── */}
      <div className="ogt-company-selector">
        {COMPANIES_DB.map(c => {
          const isActive = selectedCompanies.includes(c.id);
          return (
            <button
              key={c.id}
              className={`ogt-company-chip ${isActive ? 'active' : ''}`}
              style={isActive ? { '--cc': c.color, borderColor: c.color, background: `${c.color}18` } : {}}
              onClick={() => toggleCompany(c.id)}
            >
              <span className="ogt-chip-dot" style={{ background: isActive ? c.color : '#475569' }} />
              <span className="ogt-chip-name">{c.name}</span>
              <span className="ogt-chip-meta">{c.staff} чел. • {c.city}</span>
            </button>
          );
        })}
        <div className="ogt-search-wrap">
          <input
            className="ogt-search"
            placeholder="🔎 Поиск..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* ── Trees ───────────────────────────────────────────── */}
      <div className={`ogt-trees-container ${activeCompanies.length > 1 ? 'multi' : 'single'}`}>
        {activeCompanies.map(renderCompanyTree)}
      </div>

      {/* ── Inspector ───────────────────────────────────────── */}
      {inspecting && (
        <div className="ogt-inspector-backdrop" onClick={() => setInspecting(null)}>
          <div className="ogt-inspector" onClick={e => e.stopPropagation()}>
            <div className="ogt-insp-head">
              <h3>{inspecting.data.icon || '🏢'} {inspecting.data.title || inspecting.data.fullName || inspecting.data.name}</h3>
              <button className="ogt-insp-close" onClick={() => setInspecting(null)}>✕</button>
            </div>
            <div className="ogt-insp-body">
              {inspecting.type === 'company' && (
                <>
                  <div className="ogt-insp-block hl">
                    <h4>👤 Руководитель</h4>
                    <p><strong>{inspecting.data.ceo.name}</strong> — {inspecting.data.ceo.role}</p>
                  </div>
                  <div className="ogt-insp-block">
                    <h4>📋 Реквизиты</h4>
                    <p>БИН: {inspecting.data.bin}<br/>Город: {inspecting.data.city}<br/>Сотрудников: {inspecting.data.staff}<br/>Активных объектов: {inspecting.data.objects}</p>
                  </div>
                  <div className="ogt-insp-block">
                    <h4>🏗️ Структура</h4>
                    <p>{inspecting.data.branches.length} подразделений</p>
                    <ul>{inspecting.data.branches.map(b => <li key={b.id}>{b.icon} {b.title} — {b.head} ({b.count} чел.)</li>)}</ul>
                  </div>
                </>
              )}
              {(inspecting.type === 'branch' || inspecting.type === 'child') && (
                <>
                  <div className="ogt-insp-block hl">
                    <h4>👤 Ответственный</h4>
                    <p><strong>{inspecting.data.head}</strong>{inspecting.data.headRole ? ` — ${inspecting.data.headRole}` : ''}</p>
                  </div>
                  <div className="ogt-insp-block">
                    <h4>📊 Информация</h4>
                    <p>Направление: {inspecting.data.sub}<br/>Численность: {inspecting.data.count} чел.{inspecting.company ? `\nКомпания: ${inspecting.company.name}` : ''}</p>
                  </div>
                  {inspecting.data.children?.length > 0 && (
                    <div className="ogt-insp-block">
                      <h4>📁 Подразделения ({inspecting.data.children.length})</h4>
                      <ul>{inspecting.data.children.map(c => <li key={c.id}>{c.icon} {c.title} — {c.head}</li>)}</ul>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
