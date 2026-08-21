import React, { useState, useMemo } from 'react';
import './RoleHierarchyTreePage.css';

export default function RoleHierarchyTreePage({ onBack, hideHeader = false }) {
  const [selectedCompanyId, setSelectedCompanyId] = useState('qazgost');
  const [activeBranchFilter, setActiveBranchFilter] = useState('all'); // 'all' | 'management' | 'engineering' | 'production' | 'customers'
  const [searchRoleQuery, setSearchRoleQuery] = useState('');
  const [selectedNode, setSelectedNode] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const companies = [
    { id: 'qazgost', name: 'ТОО «QAZGOST Construction Group»', bin: '240140029182', license: 'ГСЛ №00291 (I категория)', city: 'Алматы / Астана', employeesCount: 48 },
    { id: 'bi_group', name: 'ТОО «BI Group Engineering»', bin: '190340011293', license: 'ГСЛ №00184 (I категория)', city: 'Астана', employeesCount: 120 },
    { id: 'bazis_a', name: 'ТОО «Базис-А МонолитСтрой»', bin: '150840003412', license: 'ГСЛ №00921 (I категория)', city: 'Алматы', employeesCount: 85 }
  ];

  const currentCompany = companies.find(c => c.id === selectedCompanyId) || companies[0];

  // Full Org Tree Data Structure for QAZGOST
  const treeData = {
    root: {
      id: 'root-company',
      title: currentCompany.name,
      roleType: 'Генеральная организация (ТОО)',
      icon: '🏢',
      person: 'Аскаров Бауржан Касымович',
      personRole: 'Генеральный директор / CEO',
      bin: currentCompany.bin,
      license: currentCompany.license,
      status: 'active',
      desc: 'Высший орган управления проектами, утверждение генеральных смет, распределение эскроу-бюджетов и аккредитация подрядчиков.',
      permissions: ['Полный административный доступ (ROOT)', 'Утверждение смет свыше 100 млн ₸', 'Подписание договоров и эскроу', 'Назначение ГИП и Прорабов'],
      stats: '48 сотрудников • 12 активных объектов'
    },
    branches: [
      // 1. ВЕТКА РУКОВОДСТВА И УПРАВЛЕНИЯ
      {
        id: 'branch-mgmt',
        category: 'management',
        title: 'Управление проектами & CRM',
        roleType: 'Дирекция управления',
        icon: '💼',
        person: 'Смагулов Данияр',
        personRole: 'Директор по строительству (COO)',
        desc: 'Контроль сроков реализации, управление воронкой заказчиков и координация проектных офисов.',
        permissions: ['Согласование проектных смет', 'Управление CRM-сделками', 'Курирование начальников участков'],
        count: '6 специалистов',
        children: [
          {
            id: 'node-gip',
            title: 'Главный инженер проекта (ГИП)',
            roleType: 'Проектирование и СНиП',
            icon: '👔',
            person: 'Касымов Ербол Серикович',
            personRole: 'ГИП / Сертифицированный эксперт',
            desc: 'Разработка и согласование ПСД, прохождение госэкспертизы, соблюдение СП РК и ГОСТ.',
            permissions: ['Утверждение чертежей КЖ/КМ', 'Выпуск ВВР-документации', 'Авторский надзор'],
            count: '3 проектировщика'
          },
          {
            id: 'node-pm',
            title: 'Менеджер строительных проектов',
            roleType: 'Клиентский сервис и CRM',
            icon: '📱',
            person: 'Алиева Динара',
            personRole: 'Старший CRM-менеджер',
            desc: 'Взаимодействие с заказчиками, выставление коммерческих предложений, сопровождение оплат в Kaspi/Эскроу.',
            permissions: ['Ведение клиентской базы', 'Формирование счетов с НДС', 'Разрешение первичных споров'],
            count: '4 аккаунт-менеджера'
          }
        ]
      },

      // 2. ВЕТКА ТЕХНИЧЕСКОГО НАДЗОРА И ЭКСПЕРТИЗЫ
      {
        id: 'branch-eng',
        category: 'engineering',
        title: 'Инженерно-технический надзор',
        roleType: 'Служба Технадзора (QA/QC)',
        icon: '👷',
        person: 'Нургалиев Талгат',
        personRole: 'Главный инженер технадзора',
        desc: 'Независимый контроль качества СМР, дефектоскопия, освидетельствование скрытых работ и подписание КС-2/КС-3.',
        permissions: ['Остановка работ при нарушениях СНиП', 'Подписание актов скрытых работ', 'Выпуск предписаний об устранении'],
        count: '8 инженеров РК',
        children: [
          {
            id: 'node-inspector-monolith',
            title: 'Инженер технадзора (Монолит и Конструкции)',
            roleType: 'Аудит бетона и арматуры',
            icon: '🔍',
            person: 'Искаков Мурат',
            personRole: 'Ведущий инспектор (Аттестат РК №1402)',
            desc: 'Ультразвуковой контроль прочности бетона, проверка защитного слоя арматуры и геодезический контроль отметок.',
            permissions: ['Приемка фундаментов', 'Испытания контрольных образцов бетона', 'Фотофиксация дефектов в AI'],
            count: '4 объекта'
          },
          {
            id: 'node-inspector-networks',
            title: 'Инженер технадзора (Инженерные сети)',
            roleType: 'Электрика, ОВ, ВК, HVAC',
            icon: '⚡',
            person: 'Сулейменов Ринат',
            personRole: 'Инженер по инженерным системам',
            desc: 'Гидравлические испытания трубопроводов, замеры сопротивления изоляции кабелей, пусконаладка вентиляции.',
            permissions: ['Подписание актов опрессовки', 'Проверка схем электрощитовых', 'Тепловизионный аудит'],
            count: '6 объектов'
          }
        ]
      },

      // 3. ВЕТКА СТРОИТЕЛЬНОГО ПРОИЗВОДСТВА И БРИГАД
      {
        id: 'branch-prod',
        category: 'production',
        title: 'Строительное производство & Прорабы',
        roleType: 'Полевое производство СМР',
        icon: '🔧',
        person: 'Жумабеков Арман',
        personRole: 'Главный прораб / Начальник участка',
        desc: 'Организация строительной площадки, соблюдение графика работ, охрана труда и координация рабочих бригад.',
        permissions: ['Заказ материалов со склада', 'Табелирование рабочих', 'Сдача этапов технадзору'],
        count: '24 строителя (3 бригады)',
        children: [
          {
            id: 'node-brigade-concrete',
            title: 'Бригада монолитных работ (№1)',
            roleType: 'Арматурщики и Бетонщики',
            icon: '🧱',
            person: 'Бригадир: Садыков Нурлан',
            personRole: 'Бригадир (8 специалистов)',
            desc: 'Вязка арматурных каркасов, монтаж опалубки Doka/Peri, приемка и вибрирование товарного бетона.',
            permissions: ['Допуск к высотным работам', 'Отметка выполнения захваток'],
            count: '8 человек'
          },
          {
            id: 'node-brigade-finishing',
            title: 'Бригада чистовой отделки (№2)',
            roleType: 'Штукатуры, Маляры, Плиточники',
            icon: '🎨',
            person: 'Бригадир: Ким Александр',
            personRole: 'Бригадир (6 специалистов)',
            desc: 'Механизированная штукатурка стен по маякам, укладка крупноформатного керамогранита, малярные работы.',
            permissions: ['Приемка сухих смесей', 'Сдача геометрии помещений'],
            count: '6 человек'
          }
        ]
      },

      // 4. ВЕТКА ЗАКАЗЧИКОВ И ИНВЕСТОРОВ
      {
        id: 'branch-cust',
        category: 'customers',
        title: 'Заказчики, Инвесторы & Эскроу',
        roleType: 'Инвестиционный контур',
        icon: '📋',
        person: 'Корпоративные и частные инвесторы',
        personRole: 'Заказчики объектов',
        desc: 'Финансирование строительных объектов через безопасные эскроу-счета QAZGOST, утверждение дизайн-проектов.',
        permissions: ['Приемка готовых этапов', 'Разблокировка эскроу-траншей', 'Вызов независимого аудита'],
        count: '15 активных заказчиков',
        children: [
          {
            id: 'node-general-customer',
            title: 'Генеральный Заказчик / Девелопер',
            roleType: 'Крупный инвестор (ТОО / АО)',
            icon: '🏛️',
            person: 'ТОО «Prime Development KZ»',
            personRole: 'Инвестор ЖК «Nomad Palace»',
            desc: 'Заказчик жилого комплекса на 12 000 м². Ежемесячный траншевый контроль строительного графика.',
            permissions: ['Утверждение генподряда', 'Финансовый аудит'],
            count: 'Бюджет: 850 млн ₸'
          },
          {
            id: 'node-private-customer',
            title: 'Частные заказчики коттеджей и ремонта',
            roleType: 'Физлица (ИИН)',
            icon: '👤',
            person: 'Ахметов Марат и 14 клиентов',
            personRole: 'Индивидуальные застройщики',
            desc: 'Строительство частных домов, капитальный ремонт квартир и коттеджей с гарантией по договору.',
            permissions: ['Оплата через Kaspi QR', 'Просмотр онлайн-камер с объекта'],
            count: '14 договоров'
          }
        ]
      }
    ]
  };

  // Filter branches based on search and branch filter
  const filteredBranches = useMemo(() => {
    return treeData.branches.filter(b => {
      const matchCat = activeBranchFilter === 'all' || b.category === activeBranchFilter;
      const matchSearch = !searchRoleQuery || 
        b.title.toLowerCase().includes(searchRoleQuery.toLowerCase()) || 
        b.person.toLowerCase().includes(searchRoleQuery.toLowerCase()) ||
        b.children.some(c => c.title.toLowerCase().includes(searchRoleQuery.toLowerCase()) || c.person.toLowerCase().includes(searchRoleQuery.toLowerCase()));
      return matchCat && matchSearch;
    });
  }, [treeData.branches, activeBranchFilter, searchRoleQuery]);

  return (
    <div className="rht-wrapper">
      {toastMessage && <div className="mmp-toast">{toastMessage}</div>}

      {/* Header Bar */}
      {!hideHeader && (
        <div className="rht-header-bar">
          <button className="rht-back-btn" onClick={onBack} title="Назад">
            <span>←</span>
            <span>Назад</span>
          </button>
        </div>
      )}

      {/* Hero Banner with Company Selector */}
      <div className="rht-hero-banner">
        <div className="rht-hero-left">
          <h2>
            <span>🌳</span>
            <span>Иерархическое древо ролей и структуры</span>
          </h2>
          <p>
            Интерактивное семейное древо ролей организации. Нажмите на компанию или любого участника структуры для просмотра должностных обязанностей, полномочий и прикрепленных объектов.
          </p>
        </div>

        <div className="rht-company-selector-wrap">
          <span style={{ fontSize: '1.2rem' }}>🏢</span>
          <select 
            className="rht-company-selector"
            value={selectedCompanyId}
            onChange={e => {
              setSelectedCompanyId(e.target.value);
              showToast(`Компания переключена: ${e.target.selectedOptions[0].text}`);
            }}
          >
            {companies.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Toolbar & Quick Filters */}
      <div className="rht-toolbar">
        <div className="rht-filters-left">
          <button 
            className={`rht-branch-pill ${activeBranchFilter === 'all' ? 'active' : ''}`}
            onClick={() => setActiveBranchFilter('all')}
          >
            🌳 Вся структура ({treeData.branches.length} ветви)
          </button>

          <button 
            className={`rht-branch-pill ${activeBranchFilter === 'management' ? 'active' : ''}`}
            onClick={() => setActiveBranchFilter('management')}
          >
            💼 Управление & Проектирование
          </button>

          <button 
            className={`rht-branch-pill ${activeBranchFilter === 'engineering' ? 'active' : ''}`}
            onClick={() => setActiveBranchFilter('engineering')}
          >
            👷 Технадзор & Аудит
          </button>

          <button 
            className={`rht-branch-pill ${activeBranchFilter === 'production' ? 'active' : ''}`}
            onClick={() => setActiveBranchFilter('production')}
          >
            🔧 Прорабы & Бригады
          </button>

          <button 
            className={`rht-branch-pill ${activeBranchFilter === 'customers' ? 'active' : ''}`}
            onClick={() => setActiveBranchFilter('customers')}
          >
            📋 Заказчики & Эскроу
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <input 
            type="text" 
            placeholder="🔎 Поиск роли или сотрудника..." 
            value={searchRoleQuery}
            onChange={e => setSearchRoleQuery(e.target.value)}
            style={{ background: 'rgba(10,14,28,0.85)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', padding: '6px 12px', borderRadius: '8px', fontSize: '0.85rem', outline: 'none' }}
          />

          <div className="rht-zoom-controls">
            <button className="rht-btn-ctrl" onClick={() => setZoomLevel(Math.max(0.7, zoomLevel - 0.1))} title="Уменьшить">-</button>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8', minWidth: '40px', textAlign: 'center' }}>{Math.round(zoomLevel * 100)}%</span>
            <button className="rht-btn-ctrl" onClick={() => setZoomLevel(Math.min(1.3, zoomLevel + 0.1))} title="Увеличить">+</button>
            <button className="rht-btn-ctrl" onClick={() => setZoomLevel(1)} title="Сбросить масштаб">🔄</button>
          </div>
        </div>
      </div>

      {/* Tree Canvas */}
      <div className="rht-tree-canvas">
        <div style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top center', transition: 'transform 0.2s ease', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          
          {/* 1. ROOT COMPANY NODE */}
          <div className="rht-root-section">
            <div 
              className={`rht-node-card root ${selectedNode?.id === treeData.root.id ? 'selected' : ''}`}
              onClick={() => setSelectedNode(treeData.root)}
            >
              <div className="rht-card-head">
                <div className="rht-node-icon" style={{ background: 'rgba(14, 165, 233, 0.25)', borderColor: '#0ea5e9' }}>
                  {treeData.root.icon}
                </div>
                <div className="rht-node-title-wrap">
                  <h3 className="rht-node-title">{treeData.root.title}</h3>
                  <span className="rht-node-role-type">{treeData.root.roleType}</span>
                </div>
              </div>

              <div className="rht-node-person-row">
                <div className="rht-person-avatar">👑</div>
                <div style={{ flex: 1 }}>
                  <div className="rht-person-name">{treeData.root.person}</div>
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{treeData.root.personRole}</div>
                </div>
              </div>

              <div className="rht-card-meta">
                <span>БИН: {treeData.root.bin}</span>
                <span className="rht-badge-count">{treeData.root.stats}</span>
              </div>
            </div>

            {/* Visual Connector Downward */}
            <div className="rht-connector-down"></div>
          </div>

          {/* 2. BRANCHES ROW */}
          <div className="rht-branches-row">
            {filteredBranches.map(branch => (
              <div key={branch.id} className="rht-branch-col">
                {/* Level 1 Node Card */}
                <div 
                  className={`rht-node-card ${selectedNode?.id === branch.id ? 'selected' : ''}`}
                  onClick={() => setSelectedNode(branch)}
                >
                  <div className="rht-card-head">
                    <div className="rht-node-icon">
                      {branch.icon}
                    </div>
                    <div className="rht-node-title-wrap">
                      <h4 className="rht-node-title">{branch.title}</h4>
                      <span className="rht-node-role-type">{branch.roleType}</span>
                    </div>
                  </div>

                  <div className="rht-node-person-row">
                    <div className="rht-person-avatar">👤</div>
                    <div style={{ flex: 1 }}>
                      <div className="rht-person-name">{branch.person}</div>
                      <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{branch.personRole}</div>
                    </div>
                  </div>

                  <div className="rht-card-meta">
                    <span>Подчиненных:</span>
                    <span className="rht-badge-count">{branch.count}</span>
                  </div>
                </div>

                {/* Vertical connector to children */}
                {branch.children && branch.children.length > 0 && (
                  <>
                    <div className="rht-connector-down" style={{ height: '24px' }}></div>
                    <div className="rht-sub-level-list">
                      {branch.children.map(child => (
                        <div 
                          key={child.id} 
                          className={`rht-node-card ${selectedNode?.id === child.id ? 'selected' : ''}`}
                          onClick={() => setSelectedNode(child)}
                          style={{ background: 'rgba(15, 23, 42, 0.75)', borderStyle: 'dashed' }}
                        >
                          <div className="rht-card-head">
                            <div className="rht-node-icon" style={{ width: '32px', height: '32px', fontSize: '1.1rem' }}>
                              {child.icon}
                            </div>
                            <div className="rht-node-title-wrap">
                              <h5 className="rht-node-title" style={{ fontSize: '0.88rem' }}>{child.title}</h5>
                              <span className="rht-node-role-type" style={{ fontSize: '0.68rem' }}>{child.roleType}</span>
                            </div>
                          </div>

                          <div className="rht-node-person-row">
                            <div className="rht-person-avatar" style={{ width: '20px', height: '20px', fontSize: '0.65rem' }}>✓</div>
                            <div style={{ flex: 1 }}>
                              <div className="rht-person-name" style={{ fontSize: '0.78rem' }}>{child.person}</div>
                              <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{child.personRole}</div>
                            </div>
                          </div>

                          <div className="rht-card-meta">
                            <span>Объем:</span>
                            <span style={{ color: '#38bdf8', fontWeight: 700 }}>{child.count}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>

        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* ROLE INSPECTOR MODAL / SLIDE-OVER DRAWER                    */}
      {/* ─────────────────────────────────────────────────────────── */}
      {selectedNode && (
        <div className="rht-modal-backdrop" onClick={() => setSelectedNode(null)}>
          <div className="rht-inspector-drawer" onClick={e => e.stopPropagation()}>
            <div className="rht-inspector-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '1.6rem' }}>{selectedNode.icon}</span>
                <div>
                  <h3 style={{ margin: 0 }}>{selectedNode.title}</h3>
                  <span style={{ fontSize: '0.78rem', color: '#38bdf8', fontWeight: 700 }}>{selectedNode.roleType}</span>
                </div>
              </div>
              <button className="rht-btn-close" onClick={() => setSelectedNode(null)}>✕</button>
            </div>

            <div className="rht-inspector-body">
              {/* Person Card */}
              <div className="rht-info-card" style={{ background: 'rgba(14, 165, 233, 0.1)', borderColor: 'rgba(14, 165, 233, 0.3)' }}>
                <h4>👤 Ответственное лицо</h4>
                <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#fff', marginBottom: '4px' }}>
                  {selectedNode.person}
                </div>
                <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                  {selectedNode.personRole}
                </div>
              </div>

              {/* Description */}
              <div className="rht-info-card">
                <h4>📝 Описание роли и зона ответственности</h4>
                <p style={{ margin: 0, fontSize: '0.88rem', color: '#cbd5e1', lineHeight: 1.5 }}>
                  {selectedNode.desc || 'Осуществляет оперативное руководство и контроль в рамках проектной документации и нормативных регламентов.'}
                </p>
              </div>

              {/* Permissions */}
              {selectedNode.permissions && selectedNode.permissions.length > 0 && (
                <div className="rht-info-card">
                  <h4>🛡️ Права доступа и полномочия в системе</h4>
                  <ul>
                    {selectedNode.permissions.map((perm, i) => (
                      <li key={i}>{perm}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Actions */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' }}>
                <button 
                  className="rht-action-btn-primary"
                  onClick={() => showToast(`⚡ Права доступа для роли «${selectedNode.title}» синхронизированы`)}
                >
                  ⚡ Управление правами доступа
                </button>

                <button 
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', padding: '10px', borderRadius: '10px', fontWeight: 700, cursor: 'pointer' }}
                  onClick={() => showToast(`📬 Уведомление отправлено сотруднику: ${selectedNode.person}`)}
                >
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
