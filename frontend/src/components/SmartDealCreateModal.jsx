import React, { useState, useRef } from 'react';
import './SmartDealCreateModal.css';

const ESTIMATE_PRESETS = {
  'Водопровод': [
    { id: 1, name: 'Разработка грунта механизированная (траншея)', unit: 'м³', qty: 30, price: 3500 },
    { id: 2, name: 'Труба ПНД Ø32 мм (питьевая водопроводная)', unit: 'м.п.', qty: 25, price: 450 },
    { id: 3, name: 'Устройство песчаной подушки под трубу', unit: 'м³', qty: 5, price: 8000 },
    { id: 4, name: 'Колодец водопроводный сборный ж/б Ø1000', unit: 'компл.', qty: 1, price: 85000 },
    { id: 5, name: 'Врезка под давлением в магистральную сеть', unit: 'компл.', qty: 1, price: 45000 },
    { id: 6, name: 'Обратная засыпка траншеи с уплотнением', unit: 'м³', qty: 25, price: 2000 },
    { id: 7, name: 'Благоустройство и планировка территории', unit: 'м²', qty: 15, price: 1500 }
  ],
  'Канализация': [
    { id: 1, name: 'Копка траншеи под канализационную сеть', unit: 'м³', qty: 20, price: 3500 },
    { id: 2, name: 'Труба ПВХ наружная Ø110 мм (рыжая)', unit: 'м.п.', qty: 18, price: 1200 },
    { id: 3, name: 'Устройство песчаного основания', unit: 'м³', qty: 4, price: 8000 },
    { id: 4, name: 'Смотровой колодец ККС-2 в сборе', unit: 'компл.', qty: 1, price: 95000 },
    { id: 5, name: 'Обратная засыпка и уплотнение грунта', unit: 'м³', qty: 18, price: 2200 }
  ],
  'Септик': [
    { id: 1, name: 'Разработка котлована под септик', unit: 'м³', qty: 12, price: 4000 },
    { id: 2, name: 'Септик 3-камерный энергонезависимый (3.5 м³)', unit: 'шт', qty: 1, price: 280000 },
    { id: 3, name: 'Песчано-гравийная подушка основания', unit: 'м³', qty: 6, price: 8500 },
    { id: 4, name: 'Монтаж, якорное крепление и подключение', unit: 'усл.', qty: 1, price: 60000 },
    { id: 5, name: 'Дренажное поле фильтрации в гравии', unit: 'м.п.', qty: 12, price: 4500 }
  ],
  'Отопление': [
    { id: 1, name: 'Монтаж настенного двухконтурного котла', unit: 'шт', qty: 1, price: 120000 },
    { id: 2, name: 'Установка биметаллических радиаторов', unit: 'секц.', qty: 24, price: 3500 },
    { id: 3, name: 'Прокладка труб PEX / металлопластик Ø20', unit: 'м.п.', qty: 60, price: 950 },
    { id: 4, name: 'Установка коллекторного узла в сборе', unit: 'компл.', qty: 1, price: 75000 },
    { id: 5, name: 'Гидравлические испытания и опрессовка', unit: 'услуга', qty: 1, price: 40000 }
  ],
  'Дренаж': [
    { id: 1, name: 'Разработка дренажных траншей по периметру', unit: 'м³', qty: 25, price: 3800 },
    { id: 2, name: 'Дренажная труба Ø110 в фильтре из геотекстиля', unit: 'м.п.', qty: 40, price: 1800 },
    { id: 3, name: 'Отсыпка мытым щебнем фр. 20-40 мм', unit: 'м³', qty: 15, price: 11000 },
    { id: 4, name: 'Дренажный поворотный колодец Ø315', unit: 'шт', qty: 2, price: 45000 }
  ],
  'Ливнёвка': [
    { id: 1, name: 'Монтаж водоприемных бетонных лотков', unit: 'м.п.', qty: 20, price: 6500 },
    { id: 2, name: 'Установка точечных дождеприемников', unit: 'шт', qty: 4, price: 18000 },
    { id: 3, name: 'Прокладка ливневых труб Ø110 мм', unit: 'м.п.', qty: 30, price: 1400 },
    { id: 4, name: 'Подключение к центральному ливневому колодцу', unit: 'компл.', qty: 1, price: 35000 }
  ],
  'Врезка': [
    { id: 1, name: 'Врезка под давлением в действующую сеть', unit: 'компл.', qty: 1, price: 65000 },
    { id: 2, name: 'Запорная арматура (задвижка Ø50 чугунная)', unit: 'шт', qty: 1, price: 42000 },
    { id: 3, name: 'Испытания и опрессовка узла врезки', unit: 'протокол', qty: 1, price: 25000 }
  ],
  'Инженерно-геологические изыскания': [
    { id: 1, name: 'Бурение изыскательских скважин (до 15 м)', unit: 'пог.м', qty: 45, price: 8500 },
    { id: 2, name: 'Отбор монолитов грунта и проб воды', unit: 'проба', qty: 12, price: 4500 },
    { id: 3, name: 'Лабораторные испытания грунтов по СП РК', unit: 'компл.', qty: 1, price: 140000 },
    { id: 4, name: 'Составление технического отчета ГЕСН', unit: 'экз.', qty: 1, price: 95000 }
  ],
  'Геодезия и топосъемка': [
    { id: 1, name: 'Топографическая съемка М 1:500 с подземкой', unit: 'га', qty: 2, price: 65000 },
    { id: 2, name: 'Вынос главных осей здания в натуру', unit: 'точка', qty: 12, price: 4500 },
    { id: 3, name: 'Камеральная обработка и согласование с АПЗ', unit: 'услуга', qty: 1, price: 50000 }
  ],
  'CPT Зондирование': [
    { id: 1, name: 'Статическое зондирование грунтов (CPT)', unit: 'точка', qty: 4, price: 55000 },
    { id: 2, name: 'Измерение сопротивления конуса и муфты', unit: 'пог.м', qty: 40, price: 3200 },
    { id: 3, name: 'Графическая обработка и отчет геотехника', unit: 'отчет', qty: 1, price: 45000 }
  ],
  'Испытания свай': [
    { id: 1, name: 'Подготовка стенда для испытаний', unit: 'компл.', qty: 1, price: 150000 },
    { id: 2, name: 'Испытание сваи статической нагрузкой до 200т', unit: 'свая', qty: 2, price: 280000 },
    { id: 3, name: 'Оформление протокола испытаний по СНиП', unit: 'док.', qty: 1, price: 35000 }
  ],
  'Штамповые испытания': [
    { id: 1, name: 'Устройство шурфа под плоский штамп', unit: 'шт', qty: 2, price: 35000 },
    { id: 2, name: 'Испытание грунта штампом 600 см²', unit: 'испыт.', qty: 2, price: 120000 },
    { id: 3, name: 'Расчет модуля деформации E (МПа)', unit: 'протокол', qty: 1, price: 40000 }
  ],
  'Лаборатория грунтов': [
    { id: 1, name: 'Определение грансостава и влажности', unit: 'образ.', qty: 10, price: 6500 },
    { id: 2, name: 'Испытания на срезовую и компрессионную прочность', unit: 'образ.', qty: 6, price: 14500 },
    { id: 3, name: 'Паспорт лабораторных испытаний грунтов', unit: 'компл.', qty: 1, price: 50000 }
  ]
};

export default function SmartDealCreateModal({ onClose, onSave, defaultDate }) {
  const [step, setStep] = useState(1);
  const fileInputRef = useRef(null);

  // File Upload State
  const [uploadedFiles, setUploadedFiles] = useState([
    { id: 'default_1', name: 'design_sketch.jpg', preview: '📸', url: 'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b3?auto=format&fit=crop&w=300&q=80', isImg: true }
  ]);
  const [isDragOver, setIsDragOver] = useState(false);

  // Step 2 State (Full Application & Object Data)
  const [clientName, setClientName] = useState('Иван Петров');
  const [clientPhone, setClientPhone] = useState('+7 701 555 1234');
  const [address, setAddress] = useState('Караганда, ул. Ленина 42');
  const [jobType, setJobType] = useState('Водопровод');
  const [contractor, setContractor] = useState('ТОО «QazGost»');
  const [timeSlot, setTimeSlot] = useState('09:00 - 18:00');
  const [notes, setNotes] = useState('Необходимо согласование с эксплуатирующей организацией перед началом земляных работ.');

  // Step 3 State (Estimate Table)
  const [estimateItems, setEstimateItems] = useState(() => {
    const preset = ESTIMATE_PRESETS['Водопровод'];
    return preset.map(item => ({ ...item, sum: item.qty * item.price }));
  });

  const totalSum = estimateItems.reduce((acc, curr) => acc + (curr.sum || 0), 0);

  // File Handlers
  const handleFilesSelect = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const newItems = files.map(file => {
      const isImg = file.type.startsWith('image/');
      return {
        id: `f_${Date.now()}_${Math.random()}`,
        name: file.name,
        isImg,
        preview: isImg ? '📸' : '📄',
        url: isImg ? URL.createObjectURL(file) : null
      };
    });

    setUploadedFiles(prev => [...prev, ...newItems]);
  };

  const handleRemoveFile = (id) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== id));
  };

  // Job Type & Estimate Preset Switch
  const handleJobTypeChange = (newType) => {
    setJobType(newType);
    const preset = ESTIMATE_PRESETS[newType] || ESTIMATE_PRESETS['Водопровод'];
    setEstimateItems(preset.map(item => ({ ...item, sum: item.qty * item.price })));
  };

  // Interactive Estimate Table Handlers
  const handleItemChange = (id, field, value) => {
    setEstimateItems(prev => prev.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        if (field === 'qty' || field === 'price') {
          const q = field === 'qty' ? parseFloat(value) || 0 : item.qty;
          const p = field === 'price' ? parseFloat(value) || 0 : item.price;
          updated.sum = Math.round(q * p);
        }
        return updated;
      }
      return item;
    }));
  };

  const handleRemoveRow = (id) => {
    setEstimateItems(prev => prev.filter(item => item.id !== id));
  };

  const handleAddRow = () => {
    const newItem = {
      id: Date.now(),
      name: 'Новая позиция работ / материалов',
      unit: 'шт',
      qty: 1,
      price: 10000,
      sum: 10000
    };
    setEstimateItems(prev => [...prev, newItem]);
  };

  const handleFinish = () => {
    // Construct complete calendar event payload
    const eventPayload = {
      title: `${jobType} - ${clientName}`,
      location: address,
      time: timeSlot,
      type: 'object',
      contractor: contractor,
      status: 'Запланировано',
      deadline: defaultDate || new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' }),
      jobType: jobType,
      clientName: clientName,
      clientPhone: clientPhone,
      notes: notes,
      estimateItems: estimateItems,
      totalSum: totalSum,
      stages: [
        { id: 's1', title: '1. Подготовительные и изыскательские работы', deadline: defaultDate || '12 Авг', status: 'Запланировано', description: '', photos: [], documents: [] },
        { id: 's2', title: '2. Основные строительно-монтажные работы', deadline: defaultDate || '18 Авг', status: 'Запланировано', description: '', photos: [], documents: [] },
        { id: 's3', title: '3. Приёмка технадзора и оформление акта КС-2', deadline: defaultDate || '25 Авг', status: 'Запланировано', description: '', photos: [], documents: [] },
      ],
      photos: uploadedFiles,
      createdBy: 'admin'
    };

    onSave(eventPayload);
  };

  return (
    <div className="sd-modal-overlay" onClick={onClose}>
      <div className="sd-modal-container" onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="sd-modal-header">
          <h3>
            {step === 1 && '📸 Шаг 1: Прикрепление снимков & схем объекта'}
            {step === 2 && '🤖 Шаг 2: Данные заявки и заказчика'}
            {step === 3 && '📊 Шаг 3: Расчёт реальной сметы объекта'}
          </h3>
          <button className="sd-close-btn" onClick={onClose}>✕</button>
        </div>

        {/* Progress Bar */}
        <div className="sd-progress-bar">
          <div className={`sd-progress-segment ${step >= 1 ? 'active' : ''}`}></div>
          <div className={`sd-progress-segment ${step >= 2 ? 'active' : ''}`}></div>
          <div className={`sd-progress-segment ${step >= 3 ? 'active' : ''}`}></div>
        </div>

        {/* STEP 1: Interactive File Upload with Previews */}
        {step === 1 && (
          <div className="sd-step-content">
            <input
              type="file"
              ref={fileInputRef}
              multiple
              accept="image/*,application/pdf"
              style={{ display: 'none' }}
              onChange={handleFilesSelect}
            />

            <div
              className={`sd-dropzone ${isDragOver ? 'drag-over' : ''}`}
              onClick={() => fileInputRef.current && fileInputRef.current.click()}
              onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragOver(false);
                if (e.dataTransfer.files) {
                  handleFilesSelect({ target: { files: e.dataTransfer.files } });
                }
              }}
            >
              <div className="sd-dropzone-icon">📁</div>
              <p>Перетащите файлы сюда или <span className="sd-link">выберите с компьютера</span></p>
              <span className="sd-hint">Поддерживаются снимки объектов (JPG, PNG) и чертежи/сметы (PDF)</span>
            </div>

            {/* Display list of uploaded file chips */}
            {uploadedFiles.length > 0 && (
              <div>
                <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.5rem', fontWeight: 600 }}>
                  Прикреплённые файлы ({uploadedFiles.length} шт):
                </div>
                <div className="sd-files-grid">
                  {uploadedFiles.map(file => (
                    <div key={file.id} className="sd-file-chip">
                      <button
                        type="button"
                        className="sd-file-remove-btn"
                        onClick={(e) => { e.stopPropagation(); handleRemoveFile(file.id); }}
                        title="Удалить файл"
                      >
                        ✕
                      </button>
                      <div className="sd-file-thumb">
                        {file.isImg && file.url ? (
                          <img src={file.url} alt={file.name} />
                        ) : (
                          <span style={{ fontSize: '1.5rem' }}>{file.preview || '📄'}</span>
                        )}
                      </div>
                      <span style={{ width: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'center' }}>
                        {file.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <button className="sd-btn-orange-gradient w-100 mt-2" onClick={() => setStep(2)}>
              Далее → Данные объекта и AI-анализ 🤖
            </button>
          </div>
        )}

        {/* STEP 2: Expanded Application Data */}
        {step === 2 && (
          <div className="sd-step-content">
            <div className="sd-ai-success-banner">
              <div className="sd-ai-header">
                <span>✅ AI-анализ профиля объекта подготовлен</span>
                <span>100%</span>
              </div>
              <div className="sd-ai-type">Выбранный профиль сметы: <strong>{jobType}</strong></div>
            </div>

            <div className="sd-form-grid">
              <div className="sd-form-group">
                <label>Имя клиента / Заказчик *</label>
                <input type="text" value={clientName} onChange={e => setClientName(e.target.value)} className="sd-input" placeholder="ФИО Заказчика" />
              </div>
              <div className="sd-form-group">
                <label>Телефон для связи *</label>
                <input type="text" value={clientPhone} onChange={e => setClientPhone(e.target.value)} className="sd-input" placeholder="+7 701 000 0000" />
              </div>
            </div>

            <div className="sd-form-grid">
              <div className="sd-form-group">
                <label>Адрес объекта *</label>
                <input type="text" value={address} onChange={e => setAddress(e.target.value)} className="sd-input" placeholder="Город, улица, дом" />
              </div>
              <div className="sd-form-group">
                <label>Тип работ (авто-смета ГЭСН РК)</label>
                <select value={jobType} onChange={e => handleJobTypeChange(e.target.value)} className="sd-input sd-select">
                  <option value="Водопровод">Водопровод</option>
                  <option value="Канализация">Канализация</option>
                  <option value="Септик">Септик</option>
                  <option value="Отопление">Отопление</option>
                  <option value="Дренаж">Дренаж</option>
                  <option value="Ливнёвка">Ливнёвка</option>
                  <option value="Врезка">Врезка</option>
                  <option value="Инженерно-геологические изыскания">Инженерно-геологические изыскания</option>
                  <option value="Геодезия и топосъемка">Геодезия и топосъемка</option>
                  <option value="CPT Зондирование">CPT Зондирование</option>
                  <option value="Испытания свай">Испытания свай</option>
                  <option value="Штамповые испытания">Штамповые испытания</option>
                  <option value="Лаборатория грунтов">Лаборатория грунтов</option>
                </select>
              </div>
            </div>

            <div className="sd-form-grid">
              <div className="sd-form-group">
                <label>Ответственный подрядчик / Эксперт</label>
                <select value={contractor} onChange={e => setContractor(e.target.value)} className="sd-input sd-select">
                  <option value="Не назначен">Не назначен</option>
                  <option value="ТОО «QazGost»">ТОО «QazGost»</option>
                  <option value="ТОО «Алматы Сити»">ТОО «Алматы Сити»</option>
                  <option value="ИП «Мастер Сервис»">ИП «Мастер Сервис»</option>
                  <option value="ТОО «Инжен-Строй»">ТОО «Инжен-Строй»</option>
                  <option value="ИП «Сатов А.В.»">ИП «Сатов А.В.»</option>
                  <option value="Куаныш Жумагулов (Геология)">Куаныш Жумагулов (Геология)</option>
                  <option value="Алексей Мельников (Геодезия)">Алексей Мельников (Геодезия)</option>
                  <option value="Данияр Айтжанов (Испытания свай)">Данияр Айтжанов (Испытания свай)</option>
                </select>
              </div>
              <div className="sd-form-group">
                <label>Время проведения работ</label>
                <input type="text" value={timeSlot} onChange={e => setTimeSlot(e.target.value)} className="sd-input" placeholder="09:00 - 18:00" />
              </div>
            </div>

            <div className="sd-form-group">
              <label>Комментарий / Техническое задание</label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="sd-input"
                style={{ height: '60px', resize: 'vertical' }}
                placeholder="Особые пожелания или согласования с технической службой..."
              />
            </div>

            <div className="sd-actions-row mt-2">
              <button className="sd-btn-dark" onClick={() => setStep(1)}>← Назад к фото</button>
              <button className="sd-btn-orange-gradient flex-1" onClick={() => setStep(3)}>Далее → Расчёт сметы 📊</button>
            </div>
          </div>
        )}

        {/* STEP 3: Convenient Wide Estimate Table */}
        {step === 3 && (
          <div className="sd-step-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.9rem', color: '#94a3b8', fontWeight: 600 }}>
                Позиции работ и материалов по нормам РК:
              </span>
              <span style={{ fontSize: '0.85rem', color: '#10b981', fontWeight: 700 }}>
                Позиций: {estimateItems.length} шт
              </span>
            </div>

            <div className="sd-table-container" style={{ maxHeight: '300px' }}>
              <table className="sd-estimate-table">
                <thead>
                  <tr>
                    <th style={{ width: '28px' }}>№</th>
                    <th>Наименование работ / материалов</th>
                    <th style={{ width: '55px' }}>Ед.</th>
                    <th style={{ width: '75px' }}>Кол-во</th>
                    <th style={{ width: '105px' }}>Цена (₸)</th>
                    <th style={{ width: '115px' }}>Сумма (₸)</th>
                    <th style={{ width: '30px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {estimateItems.map((item, idx) => (
                    <tr key={item.id}>
                      <td style={{ color: '#64748b', fontSize: '0.8rem', textAlign: 'center' }}>{idx + 1}</td>
                      <td>
                        <input
                          type="text"
                          className="sd-table-input"
                          value={item.name}
                          onChange={e => handleItemChange(item.id, 'name', e.target.value)}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          className="sd-table-input sd-center-text"
                          style={{ width: '48px' }}
                          value={item.unit}
                          onChange={e => handleItemChange(item.id, 'unit', e.target.value)}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          min="0"
                          step="any"
                          className="sd-table-input sd-center-text"
                          value={item.qty}
                          onChange={e => handleItemChange(item.id, 'qty', e.target.value)}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          min="0"
                          step="any"
                          className="sd-table-input sd-right-text"
                          value={item.price}
                          onChange={e => handleItemChange(item.id, 'price', e.target.value)}
                        />
                      </td>
                      <td className="sd-text-orange font-bold text-right" style={{ paddingRight: '6px' }}>
                        {(item.sum || 0).toLocaleString()} ₸
                      </td>
                      <td>
                        <button
                          type="button"
                          className="sd-row-del-btn"
                          onClick={() => handleRemoveRow(item.id)}
                          title="Удалить позицию"
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="sd-total-row">
              <div className="sd-total-info">
                <span className="sd-total-label">Итоговая расчитанная смета:</span>
                <span className="sd-total-subtext">Сумма включает ГЭСН РК и материалы</span>
              </div>
              <span className="sd-total-sum">{totalSum.toLocaleString()} ₸</span>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem', marginBottom: '1rem' }}>
              <button type="button" className="sd-btn-dark-outline flex-1" onClick={handleAddRow}>
                + Добавить строку в смету
              </button>
            </div>

            <div className="sd-actions-row mt-2">
              <button className="sd-btn-dark" onClick={() => setStep(2)}>← Назад к данным</button>
              <button className="sd-btn-orange-gradient flex-1" onClick={handleFinish}>
                Сохранить заявку со сметой 👷
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
