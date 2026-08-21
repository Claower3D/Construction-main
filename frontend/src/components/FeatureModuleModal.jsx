import React, { useState } from 'react';
import EquipmentMarketplace from './EquipmentMarketplace';
import ProfileQuestionnaire from './ProfileQuestionnaire';
import UserWalletPage from './UserWalletPage';
import ContractorsCatalogPage from './ContractorsCatalogPage';
import UserOrdersPage from './UserOrdersPage';
import EngineeringSolutionsPage from './EngineeringSolutionsPage';
import DefectInspectorPage from './DefectInspectorPage';
import BuildingConstructionPage from './BuildingConstructionPage';

export default function FeatureModuleModal({ moduleId, itemData, onClose, onOpenAdminTab }) {
  // Common states for interactive forms
  const [photoUploaded, setPhotoUploaded] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);

  // Estimate calculator states
  const [area, setArea] = useState(65);
  const [propertyType, setPropertyType] = useState('квартира');
  const [qualityLevel, setQualityLevel] = useState('комфорт');
  const [calculatedEstimate, setCalculatedEstimate] = useState(null);

  // Order submission proposal state
  const [appliedOrders, setAppliedOrders] = useState({});

  // Wallet state
  const [balance, setBalance] = useState(485000);
  const [topupAmount, setTopupAmount] = useState('');

  if (!moduleId) return null;

  // Handlers
  const handleRunAiEstimate = () => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      const rate = propertyType === 'дом' ? 45000 : qualityLevel === 'премиум' ? 55000 : 32000;
      const total = area * rate;
      setCalculatedEstimate({
        total,
        worksCost: Math.round(total * 0.65),
        materialsCost: Math.round(total * 0.35),
        timelineDays: Math.round(area * 0.8),
      });
    }, 1200);
  };

  const handleRunDefectInspect = () => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      setScanResult({
        defectType: 'Микротрещины несущей штукатурки',
        severity: 'Низкая (Поверхностная)',
        snipCode: 'СНиП РК 3.02-04-2019 (п. 4.12)',
        recommendedFix: 'Армированная шпаклевка стеклохолстом + грунтовка',
        estimatedFixPrice: '14,500 ₸ / м²',
      });
    }, 1500);
  };

  const handleApplyOrder = (orderId) => {
    setAppliedOrders({ ...appliedOrders, [orderId]: true });
  };

  const handleTopupWallet = (e) => {
    e.preventDefault();
    const val = parseFloat(topupAmount);
    if (val && val > 0) {
      setBalance(balance + val);
      setTopupAmount('');
      alert(`🎉 Баланс успешно пополнен на ${val.toLocaleString()} ₸!`);
    }
  };

  return (
    <div className="feature-modal-overlay">
      <div className="feature-modal-container">
        {/* Header */}
        <div className="feature-modal-header">
          <div className="feature-header-left">
            <span className="feature-modal-icon">{itemData?.icon || '⚙️'}</span>
            <div>
              <h2 className="feature-modal-title">{itemData?.name || 'Модуль системы'}</h2>
              <p className="feature-modal-sub">{itemData?.desc || 'Интерактивный инструмент QazGost AI 2.0'}</p>
            </div>
          </div>
          <button className="feature-close-btn" onClick={onClose}>✕</button>
        </div>

        {/* Modal Content Router based on moduleId */}
        <div className="feature-modal-body">
          {/* 1. ESTIMATE CALCULATOR (c-estimate / e-estimate) */}
          {(moduleId === 'c-estimate' || moduleId === 'e-estimate') && (
            <div className="feature-content-box">
              <h3>📸 Умный AI-Калькулятор оценки стоимости сметы</h3>
              <p className="sub-text">Выберите параметры объекта или загрузите фото для автоматического расчёта по ГЭСН-2026 РК.</p>

              <div className="form-grid-2">
                <div className="form-item">
                  <label>Тип объекта:</label>
                  <select value={propertyType} onChange={(e) => setPropertyType(e.target.value)}>
                    <option value="квартира">🏢 Квартира (Вторичка/Новостройка)</option>
                    <option value="дом">🏠 Частный дом / Коттедж</option>
                    <option value="офис">🏬 Офис / Коммерческое помещение</option>
                  </select>
                </div>

                <div className="form-item">
                  <label>Уровень отделки:</label>
                  <select value={qualityLevel} onChange={(e) => setQualityLevel(e.target.value)}>
                    <option value="эконом">Базовый / Эконом</option>
                    <option value="комфорт">Стандарт / Комфорт</option>
                    <option value="премиум">Дизайнерский / Премиум</option>
                  </select>
                </div>
              </div>

              <div className="form-item" style={{ marginTop: '1rem' }}>
                <label>Площадь помещения: <strong>{area} м²</strong></label>
                <input type="range" min="10" max="500" value={area} onChange={(e) => setArea(parseInt(e.target.value))} className="range-slider" />
              </div>

              <div className="photo-upload-dropzone" onClick={() => setPhotoUploaded(true)}>
                <span className="drop-icon">📷</span>
                <div>
                  <strong>{photoUploaded ? '✅ Фото объекта успешно прикреплено' : 'Перетащите сюда фото объекта или нажмите для выбора'}</strong>
                  <div className="small-text">AI автоматически распознает геометрию стен и текущее состояние</div>
                </div>
              </div>

              <button className="btn-action-hero" onClick={handleRunAiEstimate} disabled={isScanning}>
                {isScanning ? '⏳ AI анализирует параметры и базы ГЭСН...' : '🚀 Рассчитать точную смету'}
              </button>

              {calculatedEstimate && (
                <div className="result-card-glow">
                  <h4>📊 Итоговый расчёт стоимости сметы:</h4>
                  <div className="big-price">{calculatedEstimate.total.toLocaleString()} ₸</div>
                  <div className="calc-details-grid">
                    <div><span>Стоимость работ:</span> <strong>{calculatedEstimate.worksCost.toLocaleString()} ₸</strong></div>
                    <div><span>Стоимость материалов:</span> <strong>{calculatedEstimate.materialsCost.toLocaleString()} ₸</strong></div>
                    <div><span>Срок выполнения:</span> <strong>~{calculatedEstimate.timelineDays} дней</strong></div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 2. DEFECT INSPECTOR (c-inspect / e-inspect) */}
          {(moduleId === 'c-inspect' || moduleId === 'e-inspect') && (
            <DefectInspectorPage onBack={onClose} hideHeader={true} />
          )}

          {/* 3. VOLUME CALCULATOR (c-volume / e-volume / e-soil) */}
          {(moduleId === 'c-volume' || moduleId === 'e-volume' || moduleId === 'e-soil') && (
            <div className="feature-content-box">
              <h3>📏 Автоматический расчёт объёмов работ и BOM материалов</h3>
              <div className="calc-inputs-grid">
                <div className="form-item"><label>Длина (м):</label><input type="number" defaultValue="12" /></div>
                <div className="form-item"><label>Ширина (м):</label><input type="number" defaultValue="8" /></div>
                <div className="form-item"><label>Высота / Толщина (м):</label><input type="number" defaultValue="0.2" /></div>
              </div>

              <div className="result-card-glow" style={{ marginTop: '1.25rem' }}>
                <h4>📦 Расчитанные объёмы и расход:</h4>
                <p><strong>Общий объём бетона/грунта:</strong> 19.2 м³</p>
                <p><strong>Площадь поверхности:</strong> 96.0 м²</p>
                <p><strong>Необходимое количество арматуры:</strong> 1.45 тн (A500C 12мм)</p>
                <p><strong>Песчано-щебёночная подушка:</strong> 28.8 м³</p>
              </div>
            </div>
          )}

          {/* 4. ORDERS FEED (c-orders / e-feed / e-works / e-orders) */}
          {(moduleId === 'c-orders' || moduleId === 'e-feed' || moduleId === 'e-works' || moduleId === 'e-orders') && (
            <UserOrdersPage onBack={onClose} />
          )}

          {/* 4b. ENGINEERING SOLUTIONS (c-engineering / e-engineering) */}
          {(moduleId === 'c-engineering' || moduleId === 'e-engineering') && (
            <EngineeringSolutionsPage onBack={onClose} />
          )}

          {/* 5. CONTRACTORS CATALOG (c-catalog / e-catalog) */}
          {(moduleId === 'c-catalog' || moduleId === 'e-catalog') && (
            <ContractorsCatalogPage onBack={onClose} />
          )}

          {/* 6. EQUIPMENT MARKETPLACE (c-equipment / e-equipment) */}
          {(moduleId === 'c-equipment' || moduleId === 'e-equipment') && (
            <div className="feature-content-box">
              <h3>🚜 Маркетплейс аренды спецтехники и закупа стройматериалов</h3>
              <div className="equipment-grid">
                {[
                  { name: 'Экскаватор-погрузчик JCB 3CX', price: '95 000 ₸ / смена', city: 'Алматы', status: 'Свободен' },
                  { name: 'Автокран XCMG 25 тонн (вылет 39м)', price: '140 000 ₸ / смена', city: 'Астана', status: 'Свободен' },
                  { name: 'Самосвал KAMAZ 20 тонн', price: '25 000 ₸ / рейс', city: 'Шымкент', status: 'Свободен' },
                ].map((eq, idx) => (
                  <div className="equip-card" key={idx}>
                    <h4>{eq.name}</h4>
                    <div className="price-tag">{eq.price}</div>
                    <p>📍 {eq.city} • <span style={{ color: '#10b981' }}>{eq.status}</span></p>
                    <button className="admin-primary-btn" style={{ width: '100%', marginTop: '0.75rem' }}>🚜 Забронировать</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 7. WALLET & ESCROW (c-wallet / e-wallet) */}
          {(moduleId === 'c-wallet' || moduleId === 'e-wallet') && (
            <UserWalletPage onBack={onClose} />
          )}

          {/* 8. USER PROFILE (c-profile / e-profile) */}
          {(moduleId === 'c-profile' || moduleId === 'e-profile') && (
            <ProfileQuestionnaire onBack={onClose} />
          )}

          {/* 9. VIP MONOLITHIC CONSTRUCTION (c-vip / e-vip) */}
          {(moduleId === 'c-vip' || moduleId === 'e-vip' || moduleId === 'vip') && (
            <BuildingConstructionPage onBack={onClose} hideHeader={true} />
          )}

          {/* 10. DISPUTES & CONTRACTS (adm-disputes / adm-contracts) */}
          {(moduleId === 'adm-disputes' || moduleId === 'adm-contracts') && (
            <div className="feature-content-box">
              <h3>📄 Реестр договоров подряда и электронный арбитраж (ЭЦП E-Gov)</h3>
              <div className="result-card-glow">
                <h4>📜 Активные договоры подряда:</h4>
                <p>1. Договор № 402/2026 — Капитальный ремонт офиса (ТОО «Алматы Бизнес») • <strong>Подписано ЭЦП</strong></p>
                <p>2. Договор № 405/2026 — Монолитный фундамент (ИП «СтройМастер») • <strong>Подписано ЭЦП</strong></p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
