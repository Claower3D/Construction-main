import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Mic, Square, Sparkles, CheckCircle2, ArrowRight, 
  Volume2, AlertCircle, RefreshCw, Send, Check
} from 'lucide-react';

const PRESET_LEADS = [
  {
    id: 'p1',
    label: 'Заливка фундамента',
    client: 'Руслан',
    phone: '+7 (701) 555-43-21',
    location: 'мкр. Акбулак, Алматы',
    budget: 2500000,
    role: 'builder',
    desc: 'Заливка фундамента 180 м²'
  },
  {
    id: 'p2',
    label: 'Монтаж кровли',
    client: 'Ернар',
    phone: '+7 (705) 111-22-33',
    location: 'мкр. Баганашил, Алматы',
    budget: 3000000,
    role: 'builder',
    desc: 'Монтаж металлочерепицы 160 м²'
  },
  {
    id: 'p3',
    label: 'Отделка помещений',
    client: 'Динара',
    phone: '+7 (777) 321-45-67',
    location: 'мкр. Самал, Алматы',
    budget: 1500000,
    role: 'executor',
    desc: 'Чистовая отделка и ремонт 3-комн. квартиры'
  },
  {
    id: 'p4',
    label: 'Экспертиза бетона',
    client: 'Бауыржан',
    phone: '+7 (702) 888-99-00',
    location: 'пр. Аль-Фараби, Алматы',
    budget: 800000,
    role: 'engineer',
    desc: 'Экспертиза дефектов и трещин монолита'
  }
];

export default function VoiceLeadInput({ onClose, onSaveLead }) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [createdDeal, setCreatedDeal] = useState(null);
  const [recordDuration, setRecordDuration] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [showFallbackOptions, setShowFallbackOptions] = useState(false);
  const [manualText, setManualText] = useState('');

  const recognitionRef = useRef(null);
  const isRecordingRef = useRef(false);
  const transcriptRef = useRef('');
  const timerRef = useRef(null);
  const mediaStreamRef = useRef(null);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      try {
        const rec = new SpeechRecognition();
        rec.lang = 'ru-RU';
        rec.continuous = true;
        rec.interimResults = true;
        rec.maxAlternatives = 1;

        rec.onresult = (event) => {
          let full = '';
          for (let i = 0; i < event.results.length; i++) {
            full += event.results[i][0].transcript + ' ';
          }
          const clean = full.trim();
          if (clean) {
            setTranscript(clean);
            transcriptRef.current = clean;
          }
        };

        rec.onerror = (err) => {
          console.warn('SpeechRecognition event error:', err);
        };

        rec.onend = () => {
          // If still marked as recording, restart with a safe debounce timeout
          if (isRecordingRef.current) {
            setTimeout(() => {
              if (isRecordingRef.current) {
                try {
                  rec.start();
                } catch (e) {
                  // Ignore already started
                }
              }
            }, 300);
          }
        };

        recognitionRef.current = rec;
      } catch (e) {
        console.warn('SpeechRecognition init error:', e);
      }
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {}
      }
      if (mediaStreamRef.current) {
        try {
          mediaStreamRef.current.getTracks().forEach((t) => t.stop());
        } catch (e) {}
      }
    };
  }, []);

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // 1. START RECORDING (Never resets automatically!)
  const handleStartRecording = async () => {
    setTranscript('');
    transcriptRef.current = '';
    setShowFallbackOptions(false);
    setIsCompleted(false);
    setCreatedDeal(null);
    setRecordDuration(0);

    isRecordingRef.current = true;
    setIsRecording(true);

    // Start timer
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setRecordDuration((prev) => prev + 1);
    }, 1000);

    // Request native microphone stream (ensures Android mic prompt & keep-alive)
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaStreamRef.current = stream;
      } catch (err) {
        console.warn('getUserMedia audio stream error:', err);
      }
    }

    // Start speech recognition
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.warn('Speech start error:', e);
      }
    }
  };

  // 2. STOP RECORDING -> PROCESS AND CREATE DEAL!
  const handleStopAndCreate = () => {
    isRecordingRef.current = false;
    setIsRecording(false);

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }

    if (mediaStreamRef.current) {
      try {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      } catch (e) {}
    }

    const textToProcess = (transcriptRef.current || transcript || '').trim();

    // If text was recognized, process and create deal!
    if (textToProcess && textToProcess.length >= 4) {
      executeCreateDeal(textToProcess);
    } else {
      // If speech recognition didn't capture words (common in Xiaomi WebView):
      // DO NOT RESET! Show smart 1-tap options and manual dictation!
      setShowFallbackOptions(true);
    }
  };

  // Create deal from text
  const executeCreateDeal = (text) => {
    setIsProcessing(true);
    setShowFallbackOptions(false);

    setTimeout(() => {
      const parsed = parseVoiceText(text);
      const now = new Date();
      const pad = (n) => String(n).padStart(2, '0');
      const timeStr = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
      const dateStr = now.toISOString().split('T')[0];

      const newDeal = {
        id: `deal-${Date.now().toString().slice(-4)}`,
        leadNum: Math.floor(100 + Math.random() * 900).toString(),
        title: parsed.title,
        client: parsed.client,
        phone: parsed.phone,
        location: parsed.location,
        budget: parsed.budget,
        status: 'Новые',
        role: parsed.role,
        date: dateStr,
        time: timeStr,
        priority: parsed.priority,
        notes: [
          {
            text: `Голосовая заявка (${recordDuration || 1} сек): «${text}»`,
            time: 'Только что',
            author: 'AI Голосовой ассистент'
          }
        ]
      };

      onSaveLead(newDeal);
      setCreatedDeal(newDeal);
      setIsProcessing(false);
      setIsCompleted(true);

      setTimeout(() => {
        onClose();
      }, 2400);
    }, 600);
  };

  // 1-Tap create preset deal
  const handleSelectPreset = (preset) => {
    setIsProcessing(true);
    setShowFallbackOptions(false);

    setTimeout(() => {
      const now = new Date();
      const pad = (n) => String(n).padStart(2, '0');
      const timeStr = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
      const dateStr = now.toISOString().split('T')[0];

      const newDeal = {
        id: `deal-${Date.now().toString().slice(-4)}`,
        leadNum: Math.floor(100 + Math.random() * 900).toString(),
        title: preset.desc,
        client: preset.client,
        phone: preset.phone,
        location: preset.location,
        budget: preset.budget,
        status: 'Новые',
        role: preset.role,
        date: dateStr,
        time: timeStr,
        priority: preset.budget >= 3000000 ? 'high' : 'normal',
        notes: [
          {
            text: `Создано голосовым помощником: ${preset.desc} (${preset.client})`,
            time: 'Только что',
            author: 'Менеджер'
          }
        ]
      };

      onSaveLead(newDeal);
      setCreatedDeal(newDeal);
      setIsProcessing(false);
      setIsCompleted(true);

      setTimeout(() => {
        onClose();
      }, 2400);
    }, 500);
  };

  // Fast test demo simulation
  const handleUseDemo = () => {
    const demo = 'Клиент Руслан заливка фундамента 180 квадратов в микрорайоне Акбулак бюджет два с половиной миллиона телефон 8 701 555 43 21';
    setTranscript(demo);
    transcriptRef.current = demo;
    executeCreateDeal(demo);
  };

  // NLP Parser
  const parseVoiceText = (text) => {
    const lower = text.toLowerCase();

    // 1. Client
    let client = 'Новый клиент';
    const orgMatch = text.match(/(?:ТОО|ИП)\s+[«"']?([А-Яа-яA-Za-z0-9\s\-]+?)[»"']?(?=\s+(?:монтаж|заливк|ремонт|отделк|строительств|бюджет|номер|телефон|срок|в|на|$))/i);
    if (orgMatch) {
      const prefix = /ИП/i.test(text.slice(orgMatch.index, orgMatch.index + 5)) ? 'ИП' : 'ТОО';
      client = prefix + ' «' + orgMatch[1].trim() + '»';
    } else {
      const nameMatch = text.match(/(?:клиент|клиентка|заказчик|заказчица|зовут|фио|от)\s+([А-Яа-яA-Za-z0-9\-]+)/i);
      if (nameMatch) {
        const raw = nameMatch[1].trim();
        client = raw.charAt(0).toUpperCase() + raw.slice(1);
      } else {
        const commonNames = ['Руслан', 'Серик', 'Арман', 'Кайрат', 'Азамат', 'Бауыржан', 'Ерлан', 'Алишер', 'Динара', 'Айгуль', 'Касым', 'Марат', 'Аскар', 'Даурен', 'Александр', 'Дмитрий', 'Ернар', 'Нурлан'];
        for (const name of commonNames) {
          if (new RegExp('\\b' + name + '\\b', 'i').test(text)) {
            client = name;
            break;
          }
        }
      }
    }

    // 2. Budget
    let budget = 1500000;
    if (lower.includes('полтора миллиона') || lower.includes('1.5 миллиона')) budget = 1500000;
    else if (lower.includes('два с половиной миллиона') || lower.includes('2.5 миллиона')) budget = 2500000;
    else if (lower.includes('три с половиной миллиона') || lower.includes('3.5 миллиона')) budget = 3500000;
    else if (lower.includes('три миллиона') || lower.includes('3 миллиона')) budget = 3000000;
    else if (lower.includes('пять с половиной миллионов') || lower.includes('5.5 миллиона')) budget = 5500000;
    else if (lower.includes('пять миллионов') || lower.includes('5 миллионов')) budget = 5000000;
    else if (lower.includes('восемьсот тысяч') || lower.includes('800 тысяч')) budget = 800000;
    else if (lower.includes('шестьсот тысяч') || lower.includes('600 тысяч')) budget = 600000;
    else if (lower.includes('пятьсот тысяч') || lower.includes('500 тысяч')) budget = 500000;
    else if (lower.includes('четыреста тысяч') || lower.includes('400 тысяч')) budget = 400000;
    else if (lower.includes('триста тысяч') || lower.includes('300 тысяч')) budget = 300000;
    else {
      const numMatch = text.match(/(\d[\d\s]{3,})\s*(?:тенге|тг|₸|тысяч|млн|руб|$)/i);
      if (numMatch) {
        const rawNum = parseInt(numMatch[1].replace(/\s/g, ''), 10);
        if (rawNum > 10000) budget = rawNum;
      }
    }

    // 3. Location
    let location = 'г. Алматы';
    const locMatch = text.match(/(?:в|на|мкр|микрорайон|ул|улице|поселке|пос|пр|проспект|район)\s+([А-Яа-яA-Za-z0-9\s\-]+?)(?=\s+(?:бюджет|телефон|номер|срок|клиент|заказчик|$))/i);
    if (locMatch) {
      location = locMatch[1].trim();
      if (!location.toLowerCase().includes('алматы') && !location.toLowerCase().includes('астана')) {
        location = location + ', Алматы';
      }
    } else if (lower.includes('баганашил')) {
      location = 'мкр. Баганашил, Алматы';
    } else if (lower.includes('самал')) {
      location = 'мкр. Самал, Алматы';
    } else if (lower.includes('акбулак')) {
      location = 'мкр. Акбулак, Алматы';
    }

    // 4. Title
    let title = 'Строительно-монтажные работы';
    if (lower.includes('фундамент')) {
      const sq = text.match(/(\d+)\s*(?:квадрат|кв|м2|соток)/i);
      title = sq ? `Заливка фундамента ${sq[1]} м²` : 'Заливка фундамента';
    } else if (lower.includes('кровл') || lower.includes('крыш')) {
      const sq = text.match(/(\d+)\s*(?:квадрат|кв|м2)/i);
      title = sq ? `Монтаж кровли ${sq[1]} м²` : 'Монтаж кровли';
    } else if (lower.includes('фасад') || lower.includes('утеплен')) {
      title = 'Утепление и отделка фасада';
    } else if (lower.includes('отделк') || lower.includes('ремонт')) {
      title = 'Ремонт и отделка помещений';
    } else if (lower.includes('монолит') || lower.includes('каркас')) {
      title = 'Монолитные бетонные работы';
    } else if (lower.includes('экспертиз') || lower.includes('дефект') || lower.includes('обследован')) {
      title = 'Экспертиза дефектов бетона';
    } else if (lower.includes('электрик') || lower.includes('проводк')) {
      title = 'Электромонтажные работы';
    } else if (lower.includes('сантехник') || lower.includes('отоплен')) {
      title = 'Монтаж сантехники и отопления';
    }

    // 5. Phone
    let phone = '+7 (701) 555-43-21';
    const m1 = text.match(/(?:\+?7|8)[\s\-]?(?:\(?(\d{3})\)?[\s\-]?)(\d{3})[\s\-]?(\d{2})[\s\-]?(\d{2})/);
    if (m1) {
      phone = `+7 (${m1[1]}) ${m1[2]}-${m1[3]}-${m1[4]}`;
    } else {
      const digits = text.replace(/[^0-9]/g, '');
      for (let i = 0; i <= digits.length - 11; i++) {
        if (digits[i] === '7' || digits[i] === '8') {
          const d = digits.slice(i + 1, i + 11);
          phone = `+7 (${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6, 8)}-${d.slice(8, 10)}`;
          break;
        }
      }
    }

    let role = 'builder';
    if (title.includes('Экспертиз') || title.includes('дефект')) role = 'engineer';
    else if (title.includes('отделк') || title.includes('Ремонт') || title.includes('Электро')) role = 'executor';
    else if (title.includes('Строительно')) role = 'lead';

    const priority = budget >= 3000000 ? 'high' : 'normal';

    return { title, client, phone, location, budget, role, priority };
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 120,
      background: 'rgba(3, 7, 18, 0.88)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'flex-end',
      maxWidth: '480px',
      margin: '0 auto',
    }}>
      <div 
        className="bottom-sheet"
        style={{
          background: '#0d1527',
          borderTop: isRecording 
            ? '2px solid #ef4444' 
            : '1px solid rgba(139, 92, 246, 0.4)',
          borderTopLeftRadius: '26px',
          borderTopRightRadius: '26px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          padding: '20px 20px 26px',
          boxShadow: isRecording 
            ? '0 -10px 50px rgba(239, 68, 68, 0.4)' 
            : '0 -10px 40px rgba(139, 92, 246, 0.25)',
          transition: 'all 0.3s ease'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '12px',
              background: isRecording 
                ? 'linear-gradient(135deg, #ef4444, #dc2626)' 
                : 'linear-gradient(135deg, #8b5cf6, #3b82f6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              boxShadow: isRecording 
                ? '0 0 16px rgba(239, 68, 68, 0.7)' 
                : '0 0 16px rgba(139, 92, 246, 0.4)'
            }}>
              {isRecording ? <Volume2 size={20} /> : <Sparkles size={20} />}
            </div>
            <div>
              <h3 style={{ color: '#fff', fontSize: '1.05rem', fontWeight: 800 }}>
                Голосовая запись заявки
              </h3>
              <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                AI распознавание и создание сделки
              </span>
            </div>
          </div>

          <button 
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#cbd5e1',
              cursor: 'pointer',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* 1. STATE: COMPLETED */}
        {isCompleted && createdDeal && (
          <div style={{ padding: '16px 0', textAlign: 'center', animation: 'fadeIn 0.3s ease' }}>
            <div style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              background: 'rgba(16, 185, 129, 0.15)',
              border: '2px solid #10b981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#10b981',
              margin: '0 auto 12px'
            }}>
              <CheckCircle2 size={36} />
            </div>

            <h4 style={{ color: '#fff', fontSize: '1.15rem', fontWeight: 900, marginBottom: '4px' }}>
              ✓ Заявка успешно создана!
            </h4>
            <p style={{ color: '#10b981', fontSize: '0.8rem', fontWeight: 700, marginBottom: '14px' }}>
              Добавлена в воронку менеджера (#{createdDeal.leadNum})
            </p>

            <div className="glass-panel" style={{ padding: '14px 16px', textAlign: 'left', marginBottom: '16px' }}>
              <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#fff', marginBottom: '6px' }}>
                📋 {createdDeal.title}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '3px' }}>
                👤 <strong>Клиент:</strong> {createdDeal.client}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '3px' }}>
                💰 <strong>Бюджет:</strong> <span style={{ color: '#00e5ff', fontWeight: 900 }}>{new Intl.NumberFormat('ru-RU').format(createdDeal.budget)} ₸</span>
              </div>
              <div style={{ fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '3px' }}>
                📍 <strong>Локация:</strong> {createdDeal.location}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>
                📞 <strong>Телефон:</strong> {createdDeal.phone}
              </div>
            </div>

            <button
              onClick={onClose}
              className="glow-btn"
              style={{ width: '100%', padding: '13px', fontSize: '0.92rem' }}
            >
              Перейти в воронку CRM <ArrowRight size={16} />
            </button>
          </div>
        )}

        {/* 2. STATE: PROCESSING */}
        {isProcessing && (
          <div style={{ padding: '36px 10px', textAlign: 'center', animation: 'fadeIn 0.3s ease' }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #8b5cf6, #00e5ff)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              margin: '0 auto 16px',
              boxShadow: '0 0 30px rgba(0, 229, 255, 0.6)',
              animation: 'spin 2s linear infinite'
            }}>
              <Sparkles size={32} />
            </div>

            <h4 style={{ color: '#fff', fontSize: '1.1rem', fontWeight: 900, marginBottom: '6px' }}>
              AI обрабатывает запись...
            </h4>
            <p style={{ color: '#94a3b8', fontSize: '0.82rem', lineHeight: '1.4' }}>
              Извлечение параметров: заказчик, состав работ, адрес, бюджет и телефон.
            </p>
          </div>
        )}

        {/* 3. STATE: FALLBACK OPTIONS (If speech wasn't transcribed by WebView) */}
        {showFallbackOptions && !isProcessing && !isCompleted && (
          <div style={{ animation: 'fadeIn 0.3s ease' }}>
            <div style={{
              background: 'rgba(56, 189, 248, 0.1)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              borderRadius: '12px',
              padding: '10px 14px',
              marginBottom: '14px',
              fontSize: '0.8rem',
              color: '#e0f2fe',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <Sparkles size={18} color="#38bdf8" style={{ flexShrink: 0 }} />
              <div>
                <strong>Запись завершена.</strong> Выберите готовый вариант в 1 клик или введите текст:
              </div>
            </div>

            {/* Quick 1-tap presets */}
            <div style={{ marginBottom: '14px' }}>
              <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 700, marginBottom: '6px', textTransform: 'uppercase' }}>
                Быстрое создание в 1 клик:
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {PRESET_LEADS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handleSelectPreset(p)}
                    style={{
                      background: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '10px',
                      padding: '10px',
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#fff' }}>
                      {p.label}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '2px' }}>
                      {p.client} • {new Intl.NumberFormat('ru-RU').format(p.budget)} ₸
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom text input */}
            <div style={{ marginBottom: '14px' }}>
              <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 700, marginBottom: '4px', textTransform: 'uppercase' }}>
                Или введите/надиктуйте текст заявки:
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  value={manualText}
                  onChange={(e) => setManualText(e.target.value)}
                  placeholder="Клиент Серик, монтаж кровли 140м², 2.5 млн..."
                  style={{
                    flex: 1,
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '10px',
                    padding: '10px 12px',
                    color: '#fff',
                    fontSize: '0.84rem',
                    outline: 'none'
                  }}
                />
                <button
                  type="button"
                  onClick={() => {
                    if (manualText.trim()) executeCreateDeal(manualText.trim());
                  }}
                  disabled={!manualText.trim()}
                  style={{
                    background: manualText.trim() ? '#00e5ff' : 'rgba(255, 255, 255, 0.1)',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '0 14px',
                    color: manualText.trim() ? '#000' : '#64748b',
                    fontWeight: 900,
                    cursor: manualText.trim() ? 'pointer' : 'default'
                  }}
                >
                  <Send size={16} />
                </button>
              </div>
            </div>

            <button
              onClick={handleStartRecording}
              style={{
                width: '100%',
                padding: '11px',
                background: 'rgba(139, 92, 246, 0.15)',
                border: '1px solid rgba(139, 92, 246, 0.35)',
                borderRadius: '12px',
                color: '#c4b5fd',
                fontSize: '0.84rem',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                cursor: 'pointer'
              }}
            >
              <RefreshCw size={15} /> Записать ещё раз голосом
            </button>
          </div>
        )}

        {/* 4. STATE: RECORDING OR IDLE */}
        {!isCompleted && !isProcessing && !showFallbackOptions && (
          <div>
            {/* Recording Active Status Bar */}
            {isRecording ? (
              <div style={{
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                borderRadius: '14px',
                padding: '12px 16px',
                marginBottom: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    background: '#ef4444',
                    boxShadow: '0 0 10px #ef4444',
                    animation: 'pulse 1s infinite'
                  }} />
                  <span style={{ color: '#ef4444', fontSize: '0.82rem', fontWeight: 900, letterSpacing: '0.04em' }}>
                    ИДЁТ ЗАПИСЬ
                  </span>
                </div>

                {/* Animated Equalizer Wave Bars */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '3px', height: '24px' }}>
                  <span style={{ width: '3px', height: '14px', background: '#ef4444', borderRadius: '2px', animation: 'bounce 0.8s infinite 0.1s' }} />
                  <span style={{ width: '3px', height: '22px', background: '#ef4444', borderRadius: '2px', animation: 'bounce 0.8s infinite 0.3s' }} />
                  <span style={{ width: '3px', height: '18px', background: '#ef4444', borderRadius: '2px', animation: 'bounce 0.8s infinite 0.5s' }} />
                  <span style={{ width: '3px', height: '24px', background: '#ef4444', borderRadius: '2px', animation: 'bounce 0.8s infinite 0.2s' }} />
                  <span style={{ width: '3px', height: '16px', background: '#ef4444', borderRadius: '2px', animation: 'bounce 0.8s infinite 0.4s' }} />
                </div>

                <div style={{ color: '#fff', fontSize: '0.95rem', fontWeight: 900, fontFamily: 'monospace' }}>
                  {formatTime(recordDuration)}
                </div>
              </div>
            ) : null}

            {/* Live Transcript / Speech Box */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.04)',
              border: isRecording ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '14px',
              padding: '14px',
              minHeight: '80px',
              marginBottom: '14px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center'
            }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 800, color: isRecording ? '#f87171' : '#64748b', marginBottom: '4px', textTransform: 'uppercase' }}>
                {isRecording ? 'Живой эфир микрофона:' : 'Инструкция для диктовки:'}
              </div>

              {transcript ? (
                <div style={{ fontSize: '0.9rem', color: '#fff', fontStyle: 'italic', lineHeight: '1.45' }}>
                  «{transcript}»
                </div>
              ) : (
                <div style={{ fontSize: '0.82rem', color: isRecording ? '#fca5a5' : '#94a3b8', lineHeight: '1.4' }}>
                  {isRecording
                    ? 'Слушаю речь... Продиктуйте данные и нажмите красную кнопку СТОП.'
                    : 'Нажмите «Начать запись заявки», продиктуйте данные и нажмите СТОП.'}
                </div>
              )}
            </div>

            {/* Quick Chips Selection */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 700, marginBottom: '6px', textTransform: 'uppercase' }}>
                Быстрые шаблоны для заявки:
              </div>
              <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
                {PRESET_LEADS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      const text = `${p.desc}, клиент ${p.client}, ${p.location}, бюджет ${p.budget} тенге, телефон ${p.phone}`;
                      setTranscript(text);
                      transcriptRef.current = text;
                    }}
                    style={{
                      flexShrink: 0,
                      background: 'rgba(139, 92, 246, 0.12)',
                      border: '1px solid rgba(139, 92, 246, 0.3)',
                      borderRadius: '8px',
                      padding: '6px 10px',
                      color: '#c4b5fd',
                      fontSize: '0.74rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    + {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* MAIN ACTION BUTTON */}
            {isRecording ? (
              // BIG RED STOP BUTTON -> STOPS AND PROCESSES
              <div>
                <button
                  type="button"
                  onClick={handleStopAndCreate}
                  style={{
                    width: '100%',
                    padding: '16px',
                    borderRadius: '14px',
                    background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
                    border: 'none',
                    color: '#fff',
                    fontSize: '1rem',
                    fontWeight: 900,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    cursor: 'pointer',
                    boxShadow: '0 0 35px rgba(239, 68, 68, 0.75)',
                    animation: 'pulse 1.5s infinite',
                    letterSpacing: '0.02em'
                  }}
                >
                  <Square size={20} fill="#fff" /> СТОП — СОЗДАТЬ ЗАЯВКУ
                </button>
                <div style={{ textAlign: 'center', fontSize: '0.72rem', color: '#94a3b8', marginTop: '8px' }}>
                  Нажмите после завершения речи для обработки и создания сделки
                </div>
              </div>
            ) : (
              // START RECORDING BUTTON
              <div>
                <button
                  type="button"
                  onClick={handleStartRecording}
                  style={{
                    width: '100%',
                    padding: '16px',
                    borderRadius: '14px',
                    background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
                    border: 'none',
                    color: '#fff',
                    fontSize: '1rem',
                    fontWeight: 900,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    cursor: 'pointer',
                    boxShadow: '0 0 30px rgba(139, 92, 246, 0.5)',
                    letterSpacing: '0.02em'
                  }}
                >
                  <Mic size={22} /> НАЧАТЬ ЗАПИСЬ ЗАЯВКИ
                </button>

                <button
                  type="button"
                  onClick={handleUseDemo}
                  style={{
                    width: '100%',
                    marginTop: '10px',
                    padding: '10px',
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.09)',
                    borderRadius: '12px',
                    color: '#94a3b8',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    cursor: 'pointer'
                  }}
                >
                  <RefreshCw size={13} /> Создать тестовую заявку в 1 клик
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
