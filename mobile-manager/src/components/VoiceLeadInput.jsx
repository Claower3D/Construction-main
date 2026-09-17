import React, { useState, useEffect, useRef } from 'react';
import { X, Mic, Square, Sparkles, CheckCircle2, ArrowRight, Volume2, AlertCircle, RefreshCw } from 'lucide-react';

export default function VoiceLeadInput({ onClose, onSaveLead }) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [createdDeal, setCreatedDeal] = useState(null);
  const [recordDuration, setRecordDuration] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState(null);

  const recognitionRef = useRef(null);
  const isRecordingRef = useRef(false);
  const transcriptRef = useRef('');
  const timerRef = useRef(null);

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
            setError(null);
          }
        };

        rec.onerror = (err) => {
          console.warn('SpeechRecognition error:', err);
          if (err.error === 'not-allowed') {
            setError('Доступ к микрофону заблокирован. Разрешите доступ к микрофону в настройках Android.');
          }
        };

        rec.onend = () => {
          // Android WebView auto-stops on silence. Auto-restart if user has not clicked STOP yet
          if (isRecordingRef.current) {
            try {
              rec.start();
            } catch (e) {
              // Ignore if already active
            }
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
    };
  }, []);

  // Timer formatter
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // 1. START RECORDING (Accumulates voice only, does NOT create deal prematurely)
  const handleStartRecording = () => {
    setError(null);
    setTranscript('');
    transcriptRef.current = '';
    setIsCompleted(false);
    setCreatedDeal(null);
    setRecordDuration(0);

    isRecordingRef.current = true;
    setIsRecording(true);

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setRecordDuration((prev) => prev + 1);
    }, 1000);

    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.warn('Speech start error:', e);
      }
    }
  };

  // 2. STOP RECORDING -> ONLY NOW IT PROCESSES AND CREATES THE DEAL!
  const handleStopAndCreate = () => {
    // Stop recording and timer
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

    // Switch to Processing state
    setIsProcessing(true);

    setTimeout(() => {
      const textToProcess = (transcriptRef.current || transcript || '').trim();

      if (!textToProcess || textToProcess.length < 4) {
        setIsProcessing(false);
        setError('Речь не была распознана. Попробуйте сказать громче или используйте тестовый пример.');
        return;
      }

      // Parse fields using AI/heuristic NLP rules
      const parsed = parseVoiceText(textToProcess);
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
            text: `Голосовая запись (${recordDuration || 1} сек): «${textToProcess}»`,
            time: 'Только что',
            author: 'AI Голосовой ассистент'
          }
        ]
      };

      // Create deal in CRM
      onSaveLead(newDeal);
      setCreatedDeal(newDeal);
      setIsProcessing(false);
      setIsCompleted(true);

      // Auto-close after 2.4 seconds so manager sees created deal
      setTimeout(() => {
        onClose();
      }, 2400);
    }, 750);
  };

  // Demo test voice filler
  const handleUseDemo = () => {
    const demo = 'Клиент Руслан заливка фундамента 180 квадратов в микрорайоне Акбулак бюджет два с половиной миллиона телефон 8 701 555 43 21';
    setTranscript(demo);
    transcriptRef.current = demo;
    setError(null);
    setRecordDuration(5);
    isRecordingRef.current = true;
    setIsRecording(true);
  };

  // Voice NLP Parser
  const parseVoiceText = (text) => {
    const lower = text.toLowerCase();

    // 1. Client name
    let client = 'Новый заказчик';
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

    // 2. Budget in Tenge (₸)
    let budget = 1500000;
    if (lower.includes('полтора миллиона') || lower.includes('1.5 миллиона') || lower.includes('1,5 миллиона')) {
      budget = 1500000;
    } else if (lower.includes('два с половиной миллиона') || lower.includes('2.5 миллиона') || lower.includes('2,5 миллиона')) {
      budget = 2500000;
    } else if (lower.includes('три с половиной миллиона') || lower.includes('3.5 миллиона')) {
      budget = 3500000;
    } else if (lower.includes('пять с половиной миллионов') || lower.includes('5.5 миллиона')) {
      budget = 5500000;
    } else {
      const millionWords = {
        'один': 1000000, 'одна': 1000000, 'два': 2000000, 'две': 2000000, 'три': 3000000,
        'четыре': 4000000, 'пять': 5000000, 'шесть': 6000000, 'семь': 7000000, 'восемь': 8000000,
        'девять': 9000000, 'десять': 10000000, '1': 1000000, '2': 2000000, '3': 3000000,
        '4': 4000000, '5': 5000000, '6': 6000000, '7': 7000000, '8': 8000000, '9': 9000000, '10': 10000000
      };
      
      let matchedMillion = false;
      for (const [w, val] of Object.entries(millionWords)) {
        if (new RegExp('\\b' + w + '\\s+(?:млн|миллион)', 'i').test(lower)) {
          budget = val;
          matchedMillion = true;
          const extraThousand = lower.match(/(?:миллион[а-я]*)\s+([а-я0-9\s]+?)\s*(?:тысяч|тыс)/i);
          if (extraThousand) {
            const tWord = extraThousand[1].trim();
            if (tWord.includes('двести') || tWord.includes('200')) budget += 200000;
            else if (tWord.includes('триста') || tWord.includes('300')) budget += 300000;
            else if (tWord.includes('пятьсот') || tWord.includes('500')) budget += 500000;
            else if (tWord.includes('сто') || tWord.includes('100')) budget += 100000;
          }
          break;
        }
      }

      if (!matchedMillion) {
        if (lower.includes('восемьсот тысяч') || lower.includes('800 тысяч')) budget = 800000;
        else if (lower.includes('шестьсот тысяч') || lower.includes('600 тысяч')) budget = 600000;
        else if (lower.includes('пятьсот тысяч') || lower.includes('500 тысяч')) budget = 500000;
        else if (lower.includes('четыреста тысяч') || lower.includes('400 тысяч')) budget = 400000;
        else if (lower.includes('триста тысяч') || lower.includes('300 тысяч')) budget = 300000;
        else if (lower.includes('двести тысяч') || lower.includes('200 тысяч')) budget = 200000;
        else if (lower.includes('сто тысяч') || lower.includes('100 тысяч')) budget = 100000;
        else {
          const numMatch = text.match(/(\d[\d\s]{3,})\s*(?:тенге|тг|₸|тысяч|млн|руб|$)/i);
          if (numMatch) {
            const rawNum = parseInt(numMatch[1].replace(/\s/g, ''), 10);
            if (rawNum > 10000) budget = rawNum;
          }
        }
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

    // 4. Work Title
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
    } else if (lower.includes('забор') || lower.includes('огражден')) {
      title = 'Монтаж ограждения и забора';
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

    // 6. Role & Priority
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
          padding: '20px 20px 28px',
          boxShadow: isRecording 
            ? '0 -10px 50px rgba(239, 68, 68, 0.35)' 
            : '0 -10px 40px rgba(139, 92, 246, 0.25)',
          transition: 'border 0.3s ease, box-shadow 0.3s ease'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
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
                ? '0 0 15px rgba(239, 68, 68, 0.6)' 
                : '0 0 15px rgba(139, 92, 246, 0.4)'
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
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'rgba(16, 185, 129, 0.15)',
              border: '2px solid #10b981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#10b981',
              margin: '0 auto 14px'
            }}>
              <CheckCircle2 size={38} />
            </div>

            <h4 style={{ color: '#fff', fontSize: '1.15rem', fontWeight: 900, marginBottom: '4px' }}>
              ✓ Заявка успешно создана!
            </h4>
            <p style={{ color: '#10b981', fontSize: '0.8rem', fontWeight: 700, marginBottom: '16px' }}>
              Добавлена в воронку сделок (#{createdDeal.leadNum})
            </p>

            <div className="glass-panel" style={{ padding: '14px 16px', textAlign: 'left', marginBottom: '16px' }}>
              <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#fff', marginBottom: '6px' }}>
                📋 {createdDeal.title}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '4px' }}>
                👤 <strong>Клиент:</strong> {createdDeal.client}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '4px' }}>
                💰 <strong>Бюджет:</strong> <span style={{ color: '#00e5ff', fontWeight: 900 }}>{new Intl.NumberFormat('ru-RU').format(createdDeal.budget)} ₸</span>
              </div>
              <div style={{ fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '4px' }}>
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
              Распознавание параметров заявки: имя клиента, виды работ, бюджет, адрес и номер телефона.
            </p>
          </div>
        )}

        {/* 3. STATE: RECORDING OR IDLE */}
        {!isCompleted && !isProcessing && (
          <div>
            {/* Recording Active Status Bar */}
            {isRecording ? (
              <div style={{
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                borderRadius: '14px',
                padding: '12px 16px',
                marginBottom: '16px',
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

            {/* Error banner */}
            {error && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '12px',
                padding: '10px 14px',
                color: '#fca5a5',
                fontSize: '0.8rem',
                marginBottom: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                <span>{error}</span>
              </div>
            )}

            {/* Live Transcript / Speech Bubble */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.04)',
              border: isRecording ? '1px solid rgba(239, 68, 68, 0.35)' : '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '14px',
              padding: '14px',
              minHeight: '84px',
              marginBottom: '18px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center'
            }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 800, color: isRecording ? '#f87171' : '#64748b', marginBottom: '4px', textTransform: 'uppercase' }}>
                {isRecording ? 'Живая речь с микрофона:' : 'Инструкция для диктовки:'}
              </div>

              {transcript ? (
                <div style={{ fontSize: '0.9rem', color: '#fff', fontStyle: 'italic', lineHeight: '1.45' }}>
                  «{transcript}»
                </div>
              ) : (
                <div style={{ fontSize: '0.82rem', color: isRecording ? '#fca5a5' : '#94a3b8', lineHeight: '1.4' }}>
                  {isRecording
                    ? 'Слушаю... Продиктуйте: клиента, вид работ, адрес, бюджет и телефон...'
                    : 'Нажмите кнопку ниже, продиктуйте данные заявки и затем нажмите СТОП.'}
                </div>
              )}
            </div>

            {/* Prompt Cheat Sheet */}
            {!isRecording && (
              <div style={{
                background: 'rgba(139, 92, 246, 0.08)',
                border: '1px dashed rgba(139, 92, 246, 0.3)',
                borderRadius: '12px',
                padding: '10px 12px',
                marginBottom: '18px',
                fontSize: '0.74rem',
                color: '#c4b5fd',
                lineHeight: '1.4'
              }}>
                <strong>💡 Что говорить:</strong> «Клиент <u>Ернар</u>, <u>монтаж кровли</u> 160 квадратов в <u>Баганашиле</u>, бюджет <u>два с половиной миллиона</u>, телефон <u>8 701 555 43 21</u>»
              </div>
            )}

            {/* MAIN ACTION BUTTON */}
            {isRecording ? (
              // BIG RED STOP BUTTON -> ONLY ON CLICK DOES IT PROCESS AND CREATE!
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
                  Нажмите после окончания речи — AI обработает запись и создаст сделку
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
                  <RefreshCw size={13} /> Использовать тестовый пример для быстрой проверки
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
