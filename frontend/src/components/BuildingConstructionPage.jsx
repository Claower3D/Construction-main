import React, { useState, useEffect } from 'react';
import './BuildingConstructionPage.css';

export default function BuildingConstructionPage({ onBack, hideHeader = false }) {
  const [objects, setObjects] = useState(() => {
    const saved = localStorage.getItem('qazgost_vip_objects');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return [
      {
        id: 'OBJ-101',
        title: 'ЖК «Астана Сити» - Блок Б',
        type: 'Жилой комплекс',
        city: 'Астана',
        area: '14 500',
        budget: 480000000,
        spent: 210000000,
        progress: 45,
        currentStage: 'Возведение монолитного каркаса (7 этаж)',
        engineer: 'Касымов Б.А. (ГИП)',
        workers: 42,
        deadline: '15 декабря 2026'
      },
      {
        id: 'OBJ-102',
        title: 'Коттеджный посёлок «Тау-Самал»',
        type: 'Частный коттедж',
        city: 'Алматы',
        area: '480',
        budget: 95000000,
        spent: 82000000,
        progress: 88,
        currentStage: 'Отделка фасада и благоустройство',
        engineer: 'Ахметов С.К. (Инженер)',
        workers: 14,
        deadline: '30 октября 2026'
      }
    ];
  });

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Form State
  const [objTitle, setObjTitle] = useState('');
  const [objType, setObjType] = useState('Жилой комплекс');
  const [objCity, setObjCity] = useState('Алматы');
  const [objArea, setObjArea] = useState('350');
  const [objBudget, setObjBudget] = useState('50000000');
  const [objDeadline, setObjDeadline] = useState('2026-12-31');

  useEffect(() => {
    localStorage.setItem('qazgost_vip_objects', JSON.stringify(objects));
  }, [objects]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleCreateObject = (e) => {
    e.preventDefault();
    if (!objTitle.trim()) {
      showToast('⚠️ Укажите название строительного объекта');
      return;
    }

    const newObj = {
      id: `OBJ-${Math.floor(100 + Math.random() * 900)}`,
      title: objTitle,
      type: objType,
      city: objCity,
      area: objArea,
      budget: parseFloat(objBudget) || 10000000,
      spent: 0,
      progress: 5,
      currentStage: 'Нулевой цикл / Разработка котлована',
      engineer: 'Персональный ГИП назначен',
      workers: 8,
      deadline: objDeadline || '2026-12-31'
    };

    setObjects([newObj, ...objects]);
    setShowCreateModal(false);
    setObjTitle('');
    showToast(`🎉 Объект «${newObj.title}» успешно создан!`);
  };

  const deleteObject = (id) => {
    setObjects(prev => prev.filter(o => o.id !== id));
    showToast('🗑️ Объект удален из списка');
  };

  return (
    <div className="bc-container">
      {toastMessage && <div className="bc-toast">{toastMessage}</div>}

      {/* Header Bar */}
      {!hideHeader && (
        <div className="bc-header-bar">
          <button className="bc-back-btn" onClick={onBack} title="Назад">←</button>
          <div className="bc-title-flex">
            <span className="bc-header-icon">🏗️</span>
            <h2>Строительство зданий и сооружений</h2>
          </div>
        </div>
      )}

      {/* Section Title Row matching user screenshot */}
      <div className="bc-section-title-row">
        <div className="bc-section-title-left">
          <span className="bc-title-icon">🏗️</span>
          <div>
            <h3>Мои объекты</h3>
            <p>Управление строительными проектами</p>
          </div>
        </div>

        <button 
          className="bc-btn-create-glow"
          onClick={() => setShowCreateModal(true)}
        >
          ➕ Создать объект
        </button>
      </div>

      {/* Content Area: Empty State or Active Objects Grid */}
      {objects.length === 0 ? (
        <div className="bc-empty-card">
          <div className="bc-empty-icon">🏗️</div>
          <h3>Нет объектов</h3>
          <p>Создайте первый строительный объект для начала работы</p>
          <button 
            className="bc-btn-empty-create"
            onClick={() => setShowCreateModal(true)}
          >
            Создать объект
          </button>
        </div>
      ) : (
        <div className="bc-objects-grid">
          {objects.map(obj => (
            <div key={obj.id} className="bc-object-card">
              
              {/* Card Header */}
              <div className="bc-ocard-head">
                <div>
                  <h4 className="bc-ocard-title">{obj.title}</h4>
                  <div className="bc-ocard-meta">
                    <span>📍 {obj.city}</span>
                    <span>📐 {obj.area} м²</span>
                    <span className="bc-type-badge">{obj.type}</span>
                  </div>
                </div>
                <button 
                  className="bc-ocard-del" 
                  onClick={() => deleteObject(obj.id)} 
                  title="Удалить объект"
                >
                  ✕
                </button>
              </div>

              {/* Progress Bar */}
              <div className="bc-ocard-progress-box">
                <div className="bc-pro-head">
                  <span>Готовность объекта:</span>
                  <strong className="bc-pro-val">{obj.progress}%</strong>
                </div>
                <div className="bc-pro-bar-track">
                  <div 
                    className="bc-pro-bar-fill" 
                    style={{ width: `${obj.progress}%` }}
                  ></div>
                </div>
                <div className="bc-pro-stage">📍 Текущий этап: <strong>{obj.currentStage}</strong></div>
              </div>

              {/* Financial Stats */}
              <div className="bc-ocard-stats-grid">
                <div className="bc-ostat">
                  <span className="label">Плановый бюджет</span>
                  <strong className="val pink">{obj.budget.toLocaleString()} ₸</strong>
                </div>

                <div className="bc-ostat">
                  <span className="label">Освоено средств</span>
                  <strong className="val green">{obj.spent.toLocaleString()} ₸</strong>
                </div>

                <div className="bc-ostat">
                  <span className="label">Ответственный ГИП</span>
                  <strong className="val">{obj.engineer}</strong>
                </div>

                <div className="bc-ostat">
                  <span className="label">Рабочих на площадке</span>
                  <strong className="val">👷 {obj.workers} чел.</strong>
                </div>
              </div>

              {/* Card Actions */}
              <div className="bc-ocard-actions">
                <button 
                  className="bc-btn-manage"
                  onClick={() => showToast(`🏗️ Панель управления объектом "${obj.title}" открыта`)}
                >
                  👁️ Управление объектом
                </button>

                <button 
                  className="bc-btn-docs"
                  onClick={() => showToast('📄 ПСД файлы и исполнительные акты загружены')}
                >
                  📄 Документы ГАСК
                </button>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* Modal: ➕ Создать строительный объект */}
      {showCreateModal && (
        <div className="bc-modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="bc-modal-card" onClick={e => e.stopPropagation()}>
            <button className="bc-modal-close" onClick={() => setShowCreateModal(false)}>✕</button>

            <div className="bc-m-icon">🏗️</div>
            <h2>Создать новый строительный объект</h2>
            <p className="bc-m-sub">Внесите данные для ведения объекта и подключения ГИП</p>

            <form onSubmit={handleCreateObject} className="bc-m-form">
              <div className="bc-field">
                <label>Название объекта <span>*</span></label>
                <input 
                  type="text"
                  placeholder="Например: ЖК «Панорама Towers» или Коттедж"
                  value={objTitle}
                  onChange={e => setObjTitle(e.target.value)}
                  className="bc-input"
                  required
                />
              </div>

              <div className="bc-form-row">
                <div className="bc-field">
                  <label>Тип объекта:</label>
                  <select 
                    value={objType}
                    onChange={e => setObjType(e.target.value)}
                    className="bc-input"
                  >
                    <option value="Жилой комплекс">🏢 Жилой комплекс</option>
                    <option value="Частный коттедж">🏠 Частный коттедж</option>
                    <option value="Бизнес-центр">🏬 Бизнес-центр</option>
                    <option value="Склад / Цех">🏭 Склад / Цех</option>
                  </select>
                </div>

                <div className="bc-field">
                  <label>Город / Регион:</label>
                  <input 
                    type="text"
                    placeholder="Алматы / Астана"
                    value={objCity}
                    onChange={e => setObjCity(e.target.value)}
                    className="bc-input"
                  />
                </div>
              </div>

              <div className="bc-form-row">
                <div className="bc-field">
                  <label>Площадь (м²):</label>
                  <input 
                    type="number"
                    placeholder="350"
                    value={objArea}
                    onChange={e => setObjArea(e.target.value)}
                    className="bc-input"
                  />
                </div>

                <div className="bc-field">
                  <label>Бюджет проекта (₸):</label>
                  <input 
                    type="number"
                    placeholder="50000000"
                    value={objBudget}
                    onChange={e => setObjBudget(e.target.value)}
                    className="bc-input"
                  />
                </div>
              </div>

              <div className="bc-m-actions">
                <button type="button" className="bc-btn-cancel" onClick={() => setShowCreateModal(false)}>
                  Отмена
                </button>

                <button type="submit" className="bc-btn-save">
                  ✨ Создать объект
                </button>
              </div>
            </form>

          </div>
        </div>
      )}
    </div>
  );
}
