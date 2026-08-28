import React, { useState, useRef } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export default function LiDARScanPage({ onBack }) {
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('upload'); // 'upload' | 'results'
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    const ext = f.name.split('.').pop().toLowerCase();
    const allowed = ['las', 'laz', 'ply', 'pcd', 'xyz'];
    if (!allowed.includes(ext)) {
      setError(`Неподдерживаемый формат .${ext}. Допустимо: .las, .laz, .ply, .pcd, .xyz`);
      return;
    }
    setFile(f);
    setFileName(f.name);
    setError(null);
  };

  const handleAnalyze = async () => {
    if (!file) {
      setError('Загрузите файл облака точек');
      return;
    }
    setIsLoading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const resp = await fetch(`${API_URL}/api/v1/lidar/analyze`, {
        method: 'POST',
        body: formData,
      });
      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}));
        throw new Error(errData.detail || `Ошибка ${resp.status}`);
      }
      const data = await resp.json();
      setResult(data);
      setActiveTab('results');
    } catch (e) {
      setError(`Ошибка анализа: ${e.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const formatNum = (n, digits = 2) => typeof n === 'number' ? n.toFixed(digits) : '—';

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0a0a1a 0%, #1a1a3e 100%)', color: '#fff', padding: '20px' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <button onClick={onBack} style={backBtnStyle}>← Назад</button>

        <div style={{ textAlign: 'center', marginBottom: 30 }}>
          <h1 style={{ fontSize: 32, margin: 0 }}>📡 LiDAR Сканер</h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', margin: '8px 0 0' }}>
            QazGost AI — анализ облака точек, обмеры помещений, проверка отклонений
          </p>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          {[
            { id: 'upload', label: '📤 Загрузка' },
            { id: 'results', label: '📊 Результаты' },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
              padding: '10px 24px', borderRadius: 12, border: 'none', cursor: 'pointer',
              fontSize: 14, fontWeight: 600,
              background: activeTab === tab.id ? 'linear-gradient(135deg, #6366f1, #3b82f6)' : 'rgba(255,255,255,0.08)',
              color: '#fff',
            }}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Upload tab */}
        {activeTab === 'upload' && (
          <div style={cardStyle}>
            <h3 style={{ margin: '0 0 16px', fontSize: 18 }}>📁 Загрузите LiDAR скан</h3>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, margin: '0 0 20px' }}>
              Поддерживаемые форматы: .las, .laz, .ply, .pcd, .xyz<br/>
              Источники: iPhone Pro, iPad Pro, Leica BLK360, Matterport
            </p>

            {/* Drop zone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: '2px dashed rgba(99,102,241,0.4)', borderRadius: 16, padding: '40px 20px',
                textAlign: 'center', cursor: 'pointer', transition: 'all 0.3s',
                background: file ? 'rgba(16,185,129,0.08)' : 'rgba(255,255,255,0.02)',
              }}
            >
              <input ref={fileInputRef} type="file" accept=".las,.laz,.ply,.pcd,.xyz"
                onChange={handleFileSelect} style={{ display: 'none' }} />
              {file ? (
                <>
                  <div style={{ fontSize: 48, marginBottom: 8 }}>✅</div>
                  <div style={{ fontSize: 16, fontWeight: 600 }}>{fileName}</div>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>
                    {(file.size / 1024 / 1024).toFixed(1)} МБ
                  </div>
                </>
              ) : (
                <>
                  <div style={{ fontSize: 48, marginBottom: 8 }}>📡</div>
                  <div style={{ fontSize: 16, fontWeight: 600 }}>Нажмите для загрузки</div>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>
                    или перетащите файл сюда
                  </div>
                </>
              )}
            </div>

            {/* Info cards */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginTop: 20 }}>
              {[
                { icon: '📏', label: 'Обмеры', desc: 'Длина, ширина, высота, площадь' },
                { icon: '📐', label: 'Отклонения', desc: 'Проверка по СНиП 3.04.01-87' },
                { icon: '🧊', label: '3D Mesh', desc: 'Экспорт для визуализации' },
              ].map((card, i) => (
                <div key={i} style={{
                  background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 14, textAlign: 'center'
                }}>
                  <div style={{ fontSize: 28 }}>{card.icon}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, marginTop: 4 }}>{card.label}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{card.desc}</div>
                </div>
              ))}
            </div>

            <button onClick={handleAnalyze} disabled={isLoading || !file} style={{
              width: '100%', marginTop: 20, padding: '16px', borderRadius: 14, border: 'none',
              fontSize: 16, fontWeight: 700, cursor: (isLoading || !file) ? 'not-allowed' : 'pointer',
              background: (isLoading || !file) ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg, #6366f1, #3b82f6)',
              color: '#fff', transition: 'all 0.3s', opacity: !file ? 0.5 : 1,
            }}>
              {isLoading ? '⏳ Анализ облака точек...' : '🔍 Анализировать скан'}
            </button>

            {error && (
              <div style={{ marginTop: 12, padding: 12, background: 'rgba(239,68,68,0.15)', borderRadius: 10, color: '#ef4444', fontSize: 14 }}>
                ❌ {error}
              </div>
            )}
          </div>
        )}

        {/* Results tab */}
        {activeTab === 'results' && result && (
          <div>
            {/* Scan info */}
            <div style={cardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ margin: 0, fontSize: 18 }}>📊 Результат анализа</h3>
                <span style={{
                  padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                  background: result.scan_type === 'room' ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.2)',
                  color: result.scan_type === 'room' ? '#10b981' : '#f59e0b',
                }}>
                  {result.scan_type === 'room' ? '🏠 Помещение' : '🕳️ Котлован'}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 13 }}>
                <div style={infoRow}><span style={infoLabel}>Файл:</span> {result.file}</div>
                <div style={infoRow}><span style={infoLabel}>Точки:</span> {(result.n_points || 0).toLocaleString()}</div>
              </div>
            </div>

            {/* Dimensions */}
            {result.dimensions && (
              <div style={{ ...cardStyle, marginTop: 16 }}>
                <h3 style={{ margin: '0 0 16px', fontSize: 18 }}>📏 Размеры</h3>
                {result.scan_type === 'room' ? (
                  <>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                      {[
                        { label: 'Длина', val: `${formatNum(result.dimensions.length_m)} м`, color: '#10b981' },
                        { label: 'Ширина', val: `${formatNum(result.dimensions.width_m)} м`, color: '#3b82f6' },
                        { label: 'Высота', val: `${formatNum(result.dimensions.height_m)} м`, color: '#f59e0b' },
                      ].map((d, i) => (
                        <div key={i} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 16, textAlign: 'center' }}>
                          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>{d.label}</div>
                          <div style={{ fontSize: 24, fontWeight: 700, color: d.color, marginTop: 4 }}>{d.val}</div>
                        </div>
                      ))}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginTop: 14 }}>
                      {[
                        { label: 'Пол', val: `${formatNum(result.dimensions.floor_area_m2)} м²` },
                        { label: 'Стены', val: `${formatNum(result.dimensions.wall_area_m2)} м²` },
                        { label: 'Потолок', val: `${formatNum(result.dimensions.ceiling_area_m2)} м²` },
                        { label: 'Объём', val: `${formatNum(result.dimensions.volume_m3)} м³` },
                      ].map((d, i) => (
                        <div key={i} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: 12, textAlign: 'center' }}>
                          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{d.label}</div>
                          <div style={{ fontSize: 16, fontWeight: 600, marginTop: 2 }}>{d.val}</div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                    {[
                      { label: 'Объём', val: `${formatNum(result.dimensions.volume_m3)} м³`, color: '#f59e0b' },
                      { label: 'Площадь', val: `${formatNum(result.dimensions.area_m2)} м²`, color: '#10b981' },
                      { label: 'Макс глубина', val: `${formatNum(result.dimensions.max_depth_m, 3)} м`, color: '#ef4444' },
                      { label: 'Средн. глубина', val: `${formatNum(result.dimensions.avg_depth_m, 3)} м`, color: '#3b82f6' },
                    ].map((d, i) => (
                      <div key={i} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 16, textAlign: 'center' }}>
                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{d.label}</div>
                        <div style={{ fontSize: 20, fontWeight: 700, color: d.color, marginTop: 4 }}>{d.val}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Deviations */}
            {result.deviations && (
              <div style={{ ...cardStyle, marginTop: 16 }}>
                <h3 style={{ margin: '0 0 16px', fontSize: 18 }}>📐 Отклонения</h3>
                <div style={{
                  padding: 16, borderRadius: 12, textAlign: 'center', marginBottom: 14,
                  background: result.deviations.max_deviation_mm <= 3
                    ? 'rgba(16,185,129,0.12)' : result.deviations.max_deviation_mm <= 5
                    ? 'rgba(245,158,11,0.12)' : 'rgba(239,68,68,0.12)',
                  border: `1px solid ${result.deviations.max_deviation_mm <= 3
                    ? 'rgba(16,185,129,0.3)' : result.deviations.max_deviation_mm <= 5
                    ? 'rgba(245,158,11,0.3)' : 'rgba(239,68,68,0.3)'}`,
                }}>
                  <div style={{ fontSize: 16, fontWeight: 600 }}>{result.deviations.quality}</div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, fontSize: 13 }}>
                  <div style={infoRow}><span style={infoLabel}>Тип:</span> {result.deviations.surface_type === 'horizontal' ? 'Горизонт' : 'Вертикаль'}</div>
                  <div style={infoRow}><span style={infoLabel}>Макс:</span> {formatNum(result.deviations.max_deviation_mm, 1)} мм</div>
                  <div style={infoRow}><span style={infoLabel}>Средн:</span> {formatNum(result.deviations.avg_deviation_mm, 1)} мм</div>
                </div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 10 }}>
                  📋 Норматив: {result.deviations.snip_norm} (допуск {result.deviations.max_allowed_mm} мм/м)
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'results' && !result && (
          <div style={{ ...cardStyle, textAlign: 'center', padding: 60 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📡</div>
            <div style={{ fontSize: 16, color: 'rgba(255,255,255,0.5)' }}>
              Загрузите и проанализируйте скан, чтобы увидеть результаты
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const backBtnStyle = {
  background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff',
  padding: '10px 20px', borderRadius: 12, cursor: 'pointer', fontSize: 14, marginBottom: 20,
};

const cardStyle = {
  background: 'rgba(255,255,255,0.05)', borderRadius: 16, padding: 24,
  border: '1px solid rgba(255,255,255,0.1)',
};

const infoRow = {
  padding: '8px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: 8,
};

const infoLabel = {
  color: 'rgba(255,255,255,0.5)',
};
