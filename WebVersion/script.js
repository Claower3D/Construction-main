/* ============================================
   QazGost AI – JavaScript
   Complete functionality with i18n, chat bot, image processing
   ============================================ */

// ============================================
// 1. TRANSLATIONS (i18n)
// ============================================
const i18n = {
  ru: {
    // Navigation
    navFeatures: 'Возможности',
    navHow: 'Как работает',
    navPricing: 'Тарифы',

    // Hero
    heroBadge: '🚀 Новая версия 2.0',
    heroTitle1: 'Умная оценка',
    heroTitle2: 'строительных работ',
    heroSubtitle: 'Загрузите фото объекта и получите мгновенную смету: объём работ, материалы, стоимость и готовое коммерческое предложение',
    statProjects: 'Проектов',
    statAccuracy: 'Точность',
    statSpeed: 'Скорость',

    // Upload
    uploadTitle: 'Загрузите фото',
    uploadDesc: 'Перетащите изображение или нажмите для выбора',
    uploadZoneText: 'JPG, PNG до 10 MB',
    analyzeBtn: 'Анализировать',

    // Results
    resultTitle: 'Результаты анализа',
    volumeLabel: 'Объём работ',
    materialsLabel: 'Материалы',
    totalLabel: 'Итого',
    downloadPdf: 'Скачать PDF',
    newAnalysis: 'Новый анализ',

    // Features
    featuresTitle: 'Возможности платформы',
    feature1Title: 'AI-распознавание',
    feature1Desc: 'Нейросеть определяет объекты на фото и рассчитывает объёмы работ',
    feature2Title: 'Точные расчёты',
    feature2Desc: 'Автоматический подбор материалов с учётом запаса и норм расхода',
    feature3Title: 'Готовое КП',
    feature3Desc: 'Формирование коммерческого предложения в PDF за один клик',
    feature4Title: 'Актуальные цены',
    feature4Desc: 'Интеграция с поставщиками для получения реальных цен',

    // Chat
    botName: 'Ассистент',
    botStatus: 'Онлайн',
    chatPlaceholder: 'Введите сообщение...',

    // Loading
    loadingText: 'Анализируем изображение...',

    // Footer
    footerDesc: 'Умные решения для строительной отрасли',
    footerPrivacy: 'Политика конфиденциальности',
    footerTerms: 'Условия использования',
    footerContact: 'Контакты',
    footerRights: 'Все права защищены.',

    // Bot responses
    botWelcome: 'Привет! 👋 Я ваш помощник по оценке строительных работ. Загрузите фото объекта, и я помогу рассчитать объём работ и материалы. Напишите "помощь" для списка команд.',
    botHelp: '📋 Доступные команды:\n• "оценка" – начать новый расчёт\n• "материалы" – информация о материалах\n• "цены" – актуальные цены\n• "язык" – сменить язык\n• "контакты" – связаться с нами',
    botEstimate: 'Для получения оценки загрузите фото объекта в форму слева и нажмите "Анализировать". Я автоматически определю объём работ и рассчитаю необходимые материалы.',
    botMaterials: '🧱 Мы работаем с материалами:\n• Бетон (М100-М500)\n• Арматура (Ø8-Ø32)\n• Кирпич (одинарный, полуторный)\n• Песок, щебень, гравий\n• Утеплители и гидроизоляция',
    botPrices: '💰 Цены обновляются ежедневно из базы поставщиков. Для точного расчёта загрузите фото объекта.',
    botLang: 'Язык переключён на русский 🇷🇺',
    botContact: '📞 Связаться с нами:\n• Email: support@buildestimate.pro\n• Телефон: +7 (800) 123-45-67\n• Telegram: @buildestimate_bot',
    botUnknown: 'Извините, я не понял команду. Напишите "помощь" для списка доступных команд.'
  },

  en: {
    // Navigation
    navFeatures: 'Features',
    navHow: 'How it works',
    navPricing: 'Pricing',

    // Hero
    heroBadge: '🚀 New version 2.0',
    heroTitle1: 'Smart estimation',
    heroTitle2: 'of construction work',
    heroSubtitle: 'Upload a photo and get instant estimates: work volume, materials, costs and a ready commercial proposal',
    statProjects: 'Projects',
    statAccuracy: 'Accuracy',
    statSpeed: 'Speed',

    // Upload
    uploadTitle: 'Upload photo',
    uploadDesc: 'Drag and drop an image or click to select',
    uploadZoneText: 'JPG, PNG up to 10 MB',
    analyzeBtn: 'Analyze',

    // Results
    resultTitle: 'Analysis Results',
    volumeLabel: 'Work Volume',
    materialsLabel: 'Materials',
    totalLabel: 'Total',
    downloadPdf: 'Download PDF',
    newAnalysis: 'New Analysis',

    // Features
    featuresTitle: 'Platform Features',
    feature1Title: 'AI Recognition',
    feature1Desc: 'Neural network identifies objects in photos and calculates work volumes',
    feature2Title: 'Accurate Calculations',
    feature2Desc: 'Automatic material selection with reserves and consumption rates',
    feature3Title: 'Ready Proposal',
    feature3Desc: 'Generate a commercial proposal in PDF with one click',
    feature4Title: 'Current Prices',
    feature4Desc: 'Integration with suppliers for real-time pricing',

    // Chat
    botName: 'Assistant',
    botStatus: 'Online',
    chatPlaceholder: 'Type a message...',

    // Loading
    loadingText: 'Analyzing image...',

    // Footer
    footerDesc: 'Smart solutions for the construction industry',
    footerPrivacy: 'Privacy Policy',
    footerTerms: 'Terms of Service',
    footerContact: 'Contact',
    footerRights: 'All rights reserved.',

    // Bot responses
    botWelcome: 'Hello! 👋 I\'m your construction estimation assistant. Upload a photo and I\'ll help calculate work volume and materials. Type "help" for available commands.',
    botHelp: '📋 Available commands:\n• "estimate" – start new calculation\n• "materials" – material information\n• "prices" – current prices\n• "language" – change language\n• "contact" – contact us',
    botEstimate: 'To get an estimate, upload a photo in the form on the left and click "Analyze". I\'ll automatically determine work volume and calculate required materials.',
    botMaterials: '🧱 We work with materials:\n• Concrete (M100-M500)\n• Rebar (Ø8-Ø32)\n• Brick (single, double)\n• Sand, gravel, crushed stone\n• Insulation and waterproofing',
    botPrices: '💰 Prices are updated daily from supplier databases. For accurate calculation, upload a photo.',
    botLang: 'Language switched to English 🇬🇧',
    botContact: '📞 Contact us:\n• Email: support@buildestimate.pro\n• Phone: +7 (800) 123-45-67\n• Telegram: @buildestimate_bot',
    botUnknown: 'Sorry, I didn\'t understand. Type "help" for available commands.'
  }
};

let currentLang = 'ru';

// ============================================
// 2. DOM ELEMENTS
// ============================================
const elements = {
  // Language
  langBtns: document.querySelectorAll('.lang-btn'),

  // Upload
  fileInput: document.getElementById('fileInput'),
  uploadZone: document.getElementById('uploadZone'),
  uploadPlaceholder: document.getElementById('uploadPlaceholder'),
  previewContainer: document.getElementById('previewContainer'),
  previewImg: document.getElementById('previewImg'),
  removeBtn: document.getElementById('removeBtn'),
  analyzeBtn: document.getElementById('analyzeBtn'),

  // Results
  resultCard: document.getElementById('resultCard'),
  resultContent: document.getElementById('resultContent'),

  // Loading
  loadingOverlay: document.getElementById('loadingOverlay'),
  loadingBar: document.getElementById('loadingBar')
};

let selectedFile = null;

// ============================================
// 3. LANGUAGE SWITCHING
// ============================================
function setLanguage(lang) {
  currentLang = lang;

  // Update all data-i18n elements
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    if (i18n[lang][key]) {
      el.textContent = i18n[lang][key];
    }
  });




  // Update active button state
  elements.langBtns.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.lang === lang);
  });
}

// Language button click handlers
if (elements.langBtns) {
  elements.langBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const lang = btn.dataset.lang;
      setLanguage(lang);
    });
  });
}

// ============================================
// 4. FILE UPLOAD HANDLING
// ============================================
function handleFile(file) {
  if (!file || !file.type.startsWith('image/')) return;

  selectedFile = file;
  const reader = new FileReader();

  reader.onload = (e) => {
    if (elements.previewImg) elements.previewImg.src = e.target.result;
    if (elements.uploadPlaceholder) elements.uploadPlaceholder.hidden = true;
    if (elements.previewContainer) elements.previewContainer.hidden = false;
    if (elements.analyzeBtn) elements.analyzeBtn.disabled = false;
  };

  reader.readAsDataURL(file);
}

function clearFile() {
  selectedFile = null;
  if (elements.previewImg) elements.previewImg.src = '';
  if (elements.uploadPlaceholder) elements.uploadPlaceholder.hidden = false;
  if (elements.previewContainer) elements.previewContainer.hidden = true;
  if (elements.analyzeBtn) elements.analyzeBtn.disabled = true;
  if (elements.resultCard) elements.resultCard.hidden = true;
}

// Click to upload
if (elements.uploadZone) {
  elements.uploadZone.addEventListener('click', () => {
    if (elements.fileInput) elements.fileInput.click();
  });
}

if (elements.fileInput) {
  elements.fileInput.addEventListener('change', (e) => {
    handleFile(e.target.files[0]);
  });
}

// Remove button
if (elements.removeBtn) {
  elements.removeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    clearFile();
  });
}

// Drag and drop
if (elements.uploadZone) {
  elements.uploadZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    elements.uploadZone.classList.add('dragover');
  });

  elements.uploadZone.addEventListener('dragleave', () => {
    elements.uploadZone.classList.remove('dragover');
  });

  elements.uploadZone.addEventListener('drop', (e) => {
    e.preventDefault();
    elements.uploadZone.classList.remove('dragover');
    handleFile(e.dataTransfer.files[0]);
  });
}

// ============================================
// 5. ANALYSIS & RESULTS
// ============================================
async function analyzeImage() {
  if (!selectedFile) return;

  // Show loading
  if (elements.loadingOverlay) elements.loadingOverlay.hidden = false;
  if (elements.loadingBar) elements.loadingBar.style.width = '0%';

  // Animate progress bar
  let progress = 0;
  const progressInterval = setInterval(() => {
    progress += Math.random() * 10;
    if (progress > 90) progress = 90;
    if (elements.loadingBar) elements.loadingBar.style.width = progress + '%';
  }, 300);

  try {
    // Determine API base URL
    const config = window.QAZGOST_CONFIG || {};
    const aiBase = config.aiBase || 'http://localhost:8001';

    // Send photo to AI service
    const formData = new FormData();
    formData.append('file', selectedFile);

    // Get auth token from localStorage (set by Telegram auth flow)
    const token = localStorage.getItem('accessToken') || '';
    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${aiBase}/api/v1/analyze`, {
      method: 'POST',
      headers,
      body: formData,
    });

    // Complete progress
    clearInterval(progressInterval);
    if (elements.loadingBar) elements.loadingBar.style.width = '100%';
    await new Promise(r => setTimeout(r, 300));

    if (!response.ok) {
      throw new Error(`Сервер вернул ошибку: ${response.status}`);
    }

    const apiResult = await response.json();

    // Transform API result for display
    const results = transformApiResult(apiResult);
    displayResults(results);

  } catch (error) {
    console.error('[Analyze] Error:', error);
    clearInterval(progressInterval);

    // Show user-friendly error
    const fallbackResults = {
      detected: 'Не удалось подключиться к AI-серверу',
      dimensions: { length: 0, width: 0, depth: 0 },
      volume: 0,
      materials: [],
      laborCost: 0,
      totalMaterials: 0,
      total: 0,
      error: error.message,
    };
    displayResults(fallbackResults);

  } finally {
    if (elements.loadingOverlay) elements.loadingOverlay.hidden = true;
  }
}

/**
 * Transform pipeline API result into display format.
 */
function transformApiResult(api) {
  const objectType = api.qwen_result?.objectType || api.intent?.objectType || 'Объект';
  const items = api.estimate_items || [];

  const materials = items.slice(0, 8).map(item => ({
    icon: item.unit === 'm3' ? '🧱' : item.unit === 'm2' ? '📐' : item.unit === 'kg' ? '🔩' : '📦',
    name: item.work_name || item.name || '',
    qty: `${item.quantity} ${item.unit || ''}`,
    price: Math.round(item.total_price || 0),
    unit: 'тг',
  }));

  return {
    detected: objectType,
    dimensions: api.qwen_result?.dimensions_estimate || { length: 0, width: 0, depth: 0 },
    volume: api.measurements ? Object.values(api.measurements).reduce((s, m) => s + (m.total_volume_m3 || 0), 0) : 0,
    materials,
    laborCost: Math.round((api.estimate_total || 0) * 0.35),
    totalMaterials: Math.round((api.estimate_total || 0) * 0.65),
    total: Math.round(api.estimate_total || 0),
    confidence: api.accuracy?.overallConfidence || 0,
    sessionStatus: api.sessionStatus,
  };
}

function generateMockResults() {
  return {
    detected: 'Фундамент ленточный',
    dimensions: { length: 42, width: 0.4, depth: 0.8 },
    volume: 13.44,
    materials: [
      { icon: '🧱', name: 'Бетон М300', qty: '15 м³', price: 67500, unit: 'тг' },
      { icon: '🔩', name: 'Арматура Ø12', qty: '320 м', price: 28800, unit: 'тг' },
      { icon: '📦', name: 'Опалубка', qty: '84 м²', price: 42000, unit: 'тг' },
      { icon: '🪨', name: 'Песок', qty: '8 м³', price: 12000, unit: 'тг' },
      { icon: '🪨', name: 'Щебень', qty: '6 м³', price: 15000, unit: 'тг' },
      { icon: '🧵', name: 'Вязальная проволока', qty: '15 кг', price: 1500, unit: 'тг' }
    ],
    laborCost: 85000,
    totalMaterials: 166800,
    total: 251800
  };
}

function displayResults(data) {
  const t = i18n[currentLang];

  const html = `
    <div class="result-detected">
      <span class="detected-label">Обнаружено:</span>
      <span class="detected-value">${data.detected}</span>
    </div>
    
    <div class="result-summary">
      <div class="summary-item">
        <span class="summary-value">${data.volume} м³</span>
        <span class="summary-label">${t.volumeLabel}</span>
      </div>
      <div class="summary-item">
        <span class="summary-value">${data.materials.length}</span>
        <span class="summary-label">Позиций</span>
      </div>
      <div class="summary-item">
        <span class="summary-value">2-3 дня</span>
        <span class="summary-label">Срок работ</span>
      </div>
    </div>
    
    <div class="material-section">
      <h3>📦 ${t.materialsLabel}</h3>
      <div class="material-list">
        ${data.materials.map(m => `
          <div class="material-item">
            <div class="material-info">
              <div class="material-icon">${m.icon}</div>
              <div>
                <div class="material-name">${m.name}</div>
                <div class="material-qty">${m.qty}</div>
              </div>
            </div>
            <div class="material-price">${m.price.toLocaleString()} ${m.unit}</div>
          </div>
        `).join('')}
      </div>
    </div>
    
    <div class="result-total">
      <span class="total-label">${t.totalLabel}:</span>
      <span class="total-value">${data.total.toLocaleString()} ₸</span>
    </div>
    
    <div class="result-actions">
      <button class="btn btn-primary" onclick="downloadPDF()">
        <span class="btn-icon">📄</span>
        <span>${t.downloadPdf}</span>
      </button>
      <button class="btn btn-secondary" onclick="newAnalysis()">
        <span>${t.newAnalysis}</span>
      </button>
    </div>
  `;

  if (elements.resultContent) elements.resultContent.innerHTML = html;
  if (elements.resultCard) elements.resultCard.hidden = false;
}

function downloadPDF() {
  (window.QazUI?.alert || window.alert)('📄 Генерация PDF', 'PDF-документ будет сгенерирован и загружен.\n\nВ реальной версии здесь будет API для генерации PDF.', { icon: '📄' });
}

function newAnalysis() {
  clearFile();
  elements.resultCard.hidden = true;
}

// Analyze button click
if (elements.analyzeBtn) elements.analyzeBtn.addEventListener('click', analyzeImage);

// ============================================
// 6. CHAT BOT — removed, now handled by aiAssistant.js
// ============================================

// ============================================
// 7. PARTICLES ANIMATION (Background)
// ============================================
function createParticles() {
  const container = document.getElementById('particles');
  if (!container) return;

  for (let i = 0; i < 50; i++) {
    const particle = document.createElement('div');
    particle.className = 'particle';
    particle.style.cssText = `
      position: absolute;
      width: ${Math.random() * 4 + 1}px;
      height: ${Math.random() * 4 + 1}px;
      background: rgba(99, 102, 241, ${Math.random() * 0.3});
      border-radius: 50%;
      left: ${Math.random() * 100}%;
      top: ${Math.random() * 100}%;
      animation: float ${Math.random() * 10 + 10}s linear infinite;
    `;
    container.appendChild(particle);
  }
}

// Add float animation
const style = document.createElement('style');
style.textContent = `
  @keyframes float {
    0%, 100% { transform: translateY(0) translateX(0); opacity: 0; }
    10% { opacity: 1; }
    90% { opacity: 1; }
    100% { transform: translateY(-100vh) translateX(50px); opacity: 0; }
  }
  
  .result-detected {
    background: linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(168, 85, 247, 0.1));
    border: 1px solid rgba(99, 102, 241, 0.3);
    border-radius: 12px;
    padding: 1rem 1.5rem;
    margin-bottom: 1.5rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .detected-label {
    color: var(--text-secondary);
    font-size: 0.875rem;
  }
  
  .detected-value {
    font-weight: 600;
    color: var(--primary-light);
  }
`;
document.head.appendChild(style);

// ============================================
// 8. INITIALIZATION
// ============================================
function init() {
  setLanguage(currentLang);
  createParticles();

  // Smooth scroll for navigation links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      e.preventDefault();
      const target = document.querySelector(anchor.getAttribute('href'));
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
}

// Run on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// Make functions globally available
window.downloadPDF = downloadPDF;
window.newAnalysis = newAnalysis;
