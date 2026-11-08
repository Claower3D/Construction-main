import React, { useState } from 'react';
import EquipmentMarketplace from './EquipmentMarketplace';
import ProfileQuestionnaire from './ProfileQuestionnaire';
import UserWalletPage from './UserWalletPage';
import ContractorsCatalogPage from './ContractorsCatalogPage';
import UserOrdersPage from './UserOrdersPage';
import EngineeringSolutionsPage from './EngineeringSolutionsPage';
import DefectInspectorPage from './DefectInspectorPage';
import BuildingConstructionPage from './BuildingConstructionPage';
import SmartPhotoEstimatePage from './SmartPhotoEstimatePage';

export default function FeatureModuleModal({ moduleId, itemData, onClose, onOpenAdminTab }) {
  // Common states for interactive forms
  const [photoUploaded, setPhotoUploaded] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);

  // Order submission proposal state
  const [appliedOrders, setAppliedOrders] = useState({});

  // Wallet state
  const [balance, setBalance] = useState(485000);
  const [topupAmount, setTopupAmount] = useState('');

  if (!moduleId) return null;

  // Handlers
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
            <SmartPhotoEstimatePage onBack={onClose} hideHeader={true} />
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
