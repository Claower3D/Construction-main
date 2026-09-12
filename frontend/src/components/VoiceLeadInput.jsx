import React, { useState, useRef, useCallback, useEffect } from 'react';

/**
 * VoiceLeadInput v10 — Голосовое сообщение → Заявка
 * 
 * Гибридный режим:
 *  1) Web Speech API (браузер) — работает везде (Chrome, Edge, Safari)
 *  2) Fallback на Python speech_server.py (порт 8002) — если Web Speech API недоступен
 */

// ═══ ПАРСИНГ ═══
function parseDate(text) {
  const lower = text.toLowerCase();
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  if (lower.includes('сегодня')) return fmt(now);
  if (lower.includes('послезавтра')) { const d = new Date(now); d.setDate(d.getDate()+2); return fmt(d); }
  if (lower.includes('завтра')) { const d = new Date(now); d.setDate(d.getDate()+1); return fmt(d); }
  const numWords = {
    'двадцать перв':21,'двадцать втор':22,'двадцать трет':23,'двадцать четвёрт':24,
    'двадцать четверт':24,'двадцать пят':25,'двадцать шест':26,'двадцать седьм':27,
    'двадцать восьм':28,'двадцать девят':29,'тридцать перв':31,
    'одиннадцат':11,'двенадцат':12,'тринадцат':13,'четырнадцат':14,
    'пятнадцат':15,'шестнадцат':16,'семнадцат':17,'восемнадцат':18,
    'девятнадцат':19,'двадцат':20,'тридцат':30,
    'перв':1,'втор':2,'трет':3,'четвёрт':4,'четверт':4,'пят':5,
    'шест':6,'седьм':7,'восьм':8,'девят':9,'десят':10,
  };
  const months = {'январ':1,'феврал':2,'март':3,'апрел':4,'ма':5,'июн':6,'июл':7,'август':8,'сентябр':9,'октябр':10,'ноябр':11,'декабр':12};
  let day = null;
  for (const [prefix, num] of Object.entries(numWords)) { if (lower.includes(prefix)) { day = num; break; } }
  if (!day) { const m = lower.match(/(\d{1,2})/); if (m) day = parseInt(m[1]); }
  let mo = null;
  for (const [prefix, num] of Object.entries(months)) { if (lower.includes(prefix)) { mo = num; break; } }
  if (day && day >= 1 && day <= 31) return `${year}-${String(mo||(month+1)).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
  return null;
}
function fmt(d) { return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }

const SERVICES = ['Установка септика','Бурение скважины','Монтаж отопления','Электромонтаж','Заливка фундамента','Кровельные работы','Штукатурка','Разработка ПСД','Техническая экспертиза','Аренда спецтехники','Монтаж водопровода','Канализация','Ремонт квартиры','Строительство дома','Отделочные работы','Демонтаж','Выезд на объект'];
function matchService(text) {
  const l = text.toLowerCase();
  for (const s of SERVICES) { if (l.includes(s.toLowerCase().split(' ')[0].substring(0,4))) return s; }
  return null;
}

function parseAllFields(text) {
  const result = {};
  const lower = text.toLowerCase();

  // Дата
  const date = parseDate(text);
  if (date) result.date = date;

  // Телефон — ловим любые форматы: "8 700 093-70-02", "+77001234567", "87001234567"
  const phoneMatch = text.match(/(\+?[78][\s\-]?\d{3}[\s\-]?\d{3}[\s\-]?\d{2}[\s\-]?\d{2})/);
  if (phoneMatch) result.phone = phoneMatch[1].replace(/[\s\-()]/g, '');
  // Также ищем "номер 87001234567"
  if (!result.phone) {
    const phoneMatch2 = lower.match(/номер\s+([\d\s\-+]+)/);
    if (phoneMatch2) {
      const digits = phoneMatch2[1].replace(/[\s\-+]/g, '');
      if (digits.length >= 10) result.phone = digits;
    }
  }

  // Услуга
  const svc = matchService(text);
  if (svc) result.service = svc;

  // Имя клиента — после "зовут", "имя", "клиент", "фамилия"
  const nameMatch = lower.match(/(?:зовут|имя|клиент|фамилия)\s+([а-яё]+(?:\s+[а-яё]+)?)/i);
  if (nameMatch) {
    // Капитализируем
    result.clientName = nameMatch[1].split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  }
  // Если нет — ищем слова с заглавной которые не служебные
  if (!result.clientName) {
    const skip = new Set(['создай','заявку','заявка','лид','новую','новый','клиент','телефон','дата','на','услуга','бюджет','адрес','сделай','число','заказ','запись','смотри','нужно','создать','установка','септика','монтаж','бурение','стоимость','бюджета','номер','город','имя','зовут']);
    const nameWords = text.split(/\s+/).filter(w => !skip.has(w.toLowerCase()) && /^[А-ЯЁ][а-яё]{2,}$/.test(w));
    if (nameWords.length >= 1 && nameWords.length <= 3) result.clientName = nameWords.join(' ');
  }

  // Адрес — после "адрес"
  const addrMatch = lower.match(/адрес\s+(.+?)(?:\s+(?:стоимость|бюджет|номер|телефон|дата|услуга|имя|зовут|$))/);
  if (addrMatch) {
    result.address = addrMatch[1].trim().split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  }
  // Также "город X улица Y дом Z"
  if (!result.address) {
    const cityMatch = lower.match(/город\s+([а-яё]+(?:\s+[а-яё\d]+){0,5}?)(?:\s+(?:стоимость|бюджет|номер|телефон|дата|услуга|имя|зовут)|$)/);
    if (cityMatch) {
      result.address = cityMatch[1].trim().split(/\s+/).map(w => /^\d/.test(w) ? w : w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    }
  }

  // Бюджет — после "бюджет", "стоимость", "цена", "сумма"
  const budgetMatch = lower.match(/(?:бюджет[а]?|стоимость|цена|сумм[а]?)\s+([\d\s.,]+)/);
  if (budgetMatch) {
    // "540.000" → 540000, "1 500 000" → 1500000
    const num = parseInt(budgetMatch[1].replace(/[\s.,]/g, ''));
    if (num > 0) result.budget = num;
  }
  // Если нет — ищем число > 10000 отдельно
  if (!result.budget) {
    const nums = text.match(/\d[\d\s.,]{3,}/g);
    if (nums) {
      for (const n of nums) {
        const val = parseInt(n.replace(/[\s.,]/g, ''));
        if (val >= 10000 && !result.phone?.includes(String(val))) {
          result.budget = val;
          break;
        }
      }
    }
  }

  // Заметки — после "заметка", "примечание", "дополнительно", "информация", "комментарий"
  const notesMatch = lower.match(/(?:заметк[аи]|примечани[ея]|дополнительн[оа]|информаци[яю]|комментари[йя])\s+(.+?)(?:\s+(?:стоимость|бюджет|номер|телефон|дата|услуга|имя|зовут|адрес)|$)/);
  if (notesMatch) {
    result.notes = notesMatch[1].trim();
  }

  // Собираем ВСЁ что не попало в поля — тоже в заметки (доп. информация)
  if (!result.notes) {
    // Убираем из текста то что уже спарсилось
    let remaining = lower;
    // Убираем командные слова
    remaining = remaining.replace(/смотри|нужно|создать|создай|сделай|заявку?|новую?|лид|заказ/g, '');
    // Убираем дату
    if (result.date) remaining = remaining.replace(/(?:на\s+)?\d{1,2}\s*(?:январ[яь]|феврал[яь]|март[а]?|апрел[яь]|ма[яй]|июн[яь]|июл[яь]|август[а]?|сентябр[яь]|октябр[яь]|ноябр[яь]|декабр[яь])/g, '');
    remaining = remaining.replace(/сегодня|завтра|послезавтра/g, '');
    // Убираем телефон
    if (result.phone) remaining = remaining.replace(/номер\s+[\d\s\-+]+/g, '').replace(/[\d\s\-+]{10,}/g, '');
    // Убираем имя
    if (result.clientName) remaining = remaining.replace(new RegExp('(?:зовут|имя|клиент|фамилия)\\s+' + result.clientName.toLowerCase().split(' ').join('\\s+'), 'g'), '');
    // Убираем услугу
    if (result.service) remaining = remaining.replace(new RegExp(result.service.toLowerCase().split(' ')[0].substring(0,5), 'g'), '');
    // Убираем адрес
    if (result.address) remaining = remaining.replace(/адрес\s+.+?(?=\s+(?:стоимость|бюджет|номер)|$)/g, '').replace(/город\s+.+?(?=\s+(?:стоимость|бюджет|номер)|$)/g, '');
    // Убираем бюджет
    remaining = remaining.replace(/(?:бюджет[а]?|стоимость|цена|сумм[а]?)\s+[\d\s.,]+/g, '');
    // Убираем служебные
    remaining = remaining.replace(/(?:зовут|имя|адрес|номер|телефон|бюджет|стоимость|установка|септика|услуга|дата)/g, '');
    // Чистим
    remaining = remaining.replace(/\s+/g, ' ').trim();
    if (remaining.length > 5) {
      result.notes = remaining.charAt(0).toUpperCase() + remaining.slice(1);
    }
  }

  // Если совсем ничего — весь текст в заметки
  if (Object.keys(result).length === 0 && text.trim()) { result.notes = text.trim(); }
  // Всегда ставим дату если нет
  if (!result.date) result.date = fmt(new Date());
  return result;
}

// WAV encoder (для fallback на Python сервер)
function encodeWAV(samples, sampleRate) {
  const buf = new ArrayBuffer(44 + samples.length * 2);
  const v = new DataView(buf);
  const w = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o+i, s.charCodeAt(i)); };
  w(0,'RIFF'); v.setUint32(4,36+samples.length*2,true); w(8,'WAVE'); w(12,'fmt ');
  v.setUint32(16,16,true); v.setUint16(20,1,true); v.setUint16(22,1,true);
  v.setUint32(24,sampleRate,true); v.setUint32(28,sampleRate*2,true);
  v.setUint16(32,2,true); v.setUint16(34,16,true); w(36,'data');
  v.setUint32(40,samples.length*2,true);
  for (let i=0;i<samples.length;i++) { const s=Math.max(-1,Math.min(1,samples[i])); v.setInt16(44+i*2,s<0?s*0x8000:s*0x7FFF,true); }
  return new Blob([buf],{type:'audio/wav'});
}

// ═══ ОПРЕДЕЛЕНИЕ ДОСТУПНОСТИ РЕЖИМОВ ═══
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const HAS_WEB_SPEECH = !!SpeechRecognition;

// Проверка доступности Python speech сервера (асинхронно)
async function checkPythonServer() {
  try {
    const url = `http://${window.location.hostname}:8002/recognize`;
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 1500);
    const resp = await fetch(url, { method: 'HEAD', signal: ctrl.signal }).catch(() => null);
    clearTimeout(timer);
    return resp !== null;
  } catch { return false; }
}

export default function VoiceLeadInput({ onFieldsExtracted, onCommand, disabled }) {
  const [state, setState] = useState('idle'); // idle | recording | processing | done
  const [seconds, setSeconds] = useState(0);
  const [result, setResult] = useState(null); // {text, fields} or {error}
  const [amplitude, setAmplitude] = useState(0);
  const [speechMode, setSpeechMode] = useState(HAS_WEB_SPEECH ? 'browser' : 'server'); // browser | server
  const [serverAvailable, setServerAvailable] = useState(false);
  const [liveText, setLiveText] = useState(''); // показ промежуточного текста при записи

  const streamRef = useRef(null);
  const ctxRef = useRef(null);
  const procRef = useRef(null);
  const analyserRef = useRef(null);
  const timerRef = useRef(null);
  const samplesRef = useRef([]);
  const animRef = useRef(null);
  const recognitionRef = useRef(null);
  const finalTranscriptRef = useRef('');
  const interimTranscriptRef = useRef('');

  // При монтировании проверяем Python сервер
  useEffect(() => {
    checkPythonServer().then(ok => {
      setServerAvailable(ok);
      // Если Web Speech API нет, но Python сервер есть — используем сервер
      if (!HAS_WEB_SPEECH && ok) setSpeechMode('server');
      // Если ничего нет — останемся на browser, покажем ошибку при попытке
    });
  }, []);

  // ═══ Обработка распознанного текста ═══
  const processRecognizedText = useCallback((text) => {
    if (!text || !text.trim()) {
      setResult({ error: 'Речь не распознана. Попробуйте ещё раз.' });
      setState('done');
      return;
    }

    const cleaned = text.replace(/создай|сделай|новую?|заявк[уа]?|лид|заказ/gi, '').trim();
    const fields = parseAllFields(cleaned || text);
    if (!fields.date) { const d = parseDate(text); if (d) fields.date = d; }

    // Отправляем в форму
    if (onFieldsExtracted && Object.keys(fields).length > 0) {
      onFieldsExtracted(fields);
    }

    setResult({ text, fields });
    setState('done');
  }, [onFieldsExtracted]);

  // ═══ НАЧАТЬ ЗАПИСЬ (Web Speech API — браузер) ═══
  const startBrowserRecording = useCallback(async () => {
    try {
      // Запрашиваем микрофон для визуализации амплитуды
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      ctxRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);

      // Анализатор для визуализации
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;
      source.connect(analyser);

      // Визуализация амплитуды
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const animate = () => {
        analyser.getByteFrequencyData(dataArray);
        const avg = dataArray.reduce((a,b) => a+b, 0) / dataArray.length;
        setAmplitude(avg / 255);
        animRef.current = requestAnimationFrame(animate);
      };
      animate();

      // Web Speech API
      const recognition = new SpeechRecognition();
      recognition.lang = 'ru-RU';
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;
      recognitionRef.current = recognition;
      finalTranscriptRef.current = '';
      interimTranscriptRef.current = '';
      setLiveText('');

      recognition.onresult = (event) => {
        let finalText = '';
        let interimText = '';
        for (let i = 0; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalText += transcript + ' ';
          } else {
            interimText += transcript;
          }
        }
        finalTranscriptRef.current = finalText.trim();
        interimTranscriptRef.current = interimText.trim();
        // Показываем в реальном времени
        const combined = (finalText + interimText).trim();
        if (combined) setLiveText(combined);
      };

      recognition.onerror = (event) => {
        console.warn('Web Speech error:', event.error);
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          // Останавливаем всё
          if (animRef.current) cancelAnimationFrame(animRef.current);
          if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
          if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
          if (ctxRef.current) { try { ctxRef.current.close(); } catch(e){} ctxRef.current = null; }
          recognitionRef.current = null;
          setAmplitude(0);
          setLiveText('');
          setResult({ error: 'Нет доступа к микрофону. Разрешите в настройках браузера.' });
          setState('done');
        }
        // no-speech, network и другие — текст может всё равно прийти, ждём onend
      };

      // Когда распознавание остановится само (тишина, ошибка сети и т.д.)
      recognition.onend = () => {
        // Если мы ещё в режиме записи, перезапускаем (continuous не всегда работает)
        if (recognitionRef.current === recognition) {
          try {
            recognition.start();
          } catch(e) {
            // Если перезапуск не удался — значит мы остановили вручную, ничего не делаем
          }
        }
      };

      recognition.start();

      setState('recording');
      setResult(null);
      setSeconds(0);

      // Таймер секунд
      let sec = 0;
      timerRef.current = setInterval(() => { sec++; setSeconds(sec); if (sec >= 90) stopRecording(); }, 1000);

    } catch(err) {
      setResult({ error: 'Нет доступа к микрофону. Разрешите в настройках браузера.' });
      setState('done');
    }
  }, []);

  // ═══ НАЧАТЬ ЗАПИСЬ (Python сервер — fallback) ═══
  const startServerRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      samplesRef.current = [];
      setResult(null);
      setState('recording');
      setSeconds(0);

      const ctx = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });
      ctxRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);

      // Анализатор для визуализации
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;
      source.connect(analyser);

      // Запись PCM
      const proc = ctx.createScriptProcessor(4096, 1, 1);
      procRef.current = proc;
      proc.onaudioprocess = (e) => {
        const input = e.inputBuffer.getChannelData(0);
        const copy = new Float32Array(input.length);
        copy.set(input);
        samplesRef.current.push(...copy);
      };
      source.connect(proc);
      proc.connect(ctx.destination);

      // Таймер
      let sec = 0;
      timerRef.current = setInterval(() => { sec++; setSeconds(sec); if (sec >= 90) stopRecording(); }, 1000);

      // Визуализация амплитуды
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const animate = () => {
        analyser.getByteFrequencyData(dataArray);
        const avg = dataArray.reduce((a,b) => a+b, 0) / dataArray.length;
        setAmplitude(avg / 255);
        animRef.current = requestAnimationFrame(animate);
      };
      animate();

    } catch(err) {
      setResult({ error: 'Нет доступа к микрофону. Разрешите в настройках браузера.' });
      setState('done');
    }
  }, []);

  // ═══ ОСТАНОВИТЬ И ОБРАБОТАТЬ ═══
  const stopRecording = useCallback(async () => {
    // Останавливаем визуализацию и таймер
    if (animRef.current) cancelAnimationFrame(animRef.current);
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    setAmplitude(0);

    // Останавливаем аудио
    if (procRef.current) { procRef.current.disconnect(); procRef.current = null; }
    if (ctxRef.current) { try { ctxRef.current.close(); } catch(e){} ctxRef.current = null; }
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }

    setState('processing');
    setLiveText('');

    // ── РЕЖИМ: Web Speech API ──
    if (speechMode === 'browser' && recognitionRef.current) {
      const recognition = recognitionRef.current;
      // Отсоединяем ref СНАЧАЛА, чтобы onend не перезапустил
      recognitionRef.current = null;
      
      // Ждём финализации: recognition.stop() вызывает последний onresult (isFinal) перед onend
      await new Promise(resolve => {
        const originalOnResult = recognition.onresult;
        
        recognition.onresult = (event) => {
          // Пропускаем через оригинальный обработчик
          if (originalOnResult) originalOnResult.call(recognition, event);
        };
        
        recognition.onend = () => {
          resolve();
        };
        
        try {
          recognition.stop();
        } catch(e) {
          resolve();
        }
        
        // Таймаут на случай если onend не придёт
        setTimeout(resolve, 1500);
      });

      // Берём финальный текст (приоритет) + interim как дополнение
      const text = (finalTranscriptRef.current || interimTranscriptRef.current).trim();
      finalTranscriptRef.current = '';
      interimTranscriptRef.current = '';
      processRecognizedText(text);
      return;
    }

    // ── РЕЖИМ: Python сервер ──
    if (samplesRef.current.length < 1600) { // меньше 0.1 сек
      setResult({ error: 'Слишком короткое сообщение' });
      setState('done');
      return;
    }

    // Кодируем WAV
    const allSamples = new Float32Array(samplesRef.current.length);
    allSamples.set(samplesRef.current);
    samplesRef.current = [];
    const wavBlob = encodeWAV(allSamples, 16000);

    // Отправляем на Python сервер
    try {
      const SPEECH_URL = `http://${window.location.hostname}:8002/recognize`;
      const resp = await fetch(SPEECH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'audio/wav' },
        body: wavBlob,
      });
      const data = await resp.json();

      if (data.text) {
        processRecognizedText(data.text);
      } else {
        setResult({ error: data.error || 'Речь не распознана. Попробуйте ещё раз.' });
        setState('done');
      }
    } catch(err) {
      // Python сервер недоступен — переключаемся на браузер
      if (HAS_WEB_SPEECH) {
        setSpeechMode('browser');
        setResult({ error: 'Python сервер недоступен. Переключено на распознавание браузера. Нажмите ещё раз.' });
      } else {
        setResult({ error: 'Распознавание речи недоступно. Используйте Chrome или Edge.' });
      }
      setState('done');
    }
  }, [speechMode, processRecognizedText]);

  // ═══ КЛИК ═══
  const handleClick = useCallback(() => {
    if (state === 'recording') {
      stopRecording();
    } else {
      if (speechMode === 'browser') {
        startBrowserRecording();
      } else {
        startServerRecording();
      }
    }
  }, [state, speechMode, startBrowserRecording, startServerRecording, stopRecording]);

  const reset = () => { setState('idle'); setResult(null); setSeconds(0); setLiveText(''); };

  // ═══ UI ═══
  const circleSize = state === 'recording' ? 80 + amplitude * 40 : 70;

  const modeLabel = speechMode === 'browser' 
    ? '🌐 Распознавание через браузер (Web Speech API)' 
    : '🖥️ Распознавание через сервер (Vosk AI)';

  return (
    <div style={{
      background: 'rgba(139,92,246,0.06)',
      border: '1px solid rgba(139,92,246,0.25)',
      borderRadius: '16px', padding: '16px', marginBottom: '12px',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
    }}>

      {/* ══ ПЕРЕКЛЮЧАТЕЛЬ РЕЖИМА ══ */}
      {state === 'idle' && (HAS_WEB_SPEECH || serverAvailable) && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          marginBottom: '10px', fontSize: '0.68rem', color: '#94a3b8',
        }}>
          <span style={{ color: speechMode === 'browser' ? '#22c55e' : '#38bdf8', fontWeight: 700 }}>
            {modeLabel}
          </span>
          {HAS_WEB_SPEECH && serverAvailable && (
            <button 
              onClick={() => setSpeechMode(prev => prev === 'browser' ? 'server' : 'browser')}
              style={{
                background: 'rgba(139,92,246,0.2)', border: '1px solid rgba(139,92,246,0.3)',
                borderRadius: '6px', padding: '2px 8px', fontSize: '0.65rem',
                color: '#c4b5fd', cursor: 'pointer', fontWeight: 700,
              }}
            >
              Сменить
            </button>
          )}
        </div>
      )}

      {/* ══ КНОПКА-МИКРОФОН ══ */}
      {(state === 'idle' || state === 'recording') && (
        <>
          <div
            onClick={handleClick}
            style={{
              width: circleSize + 'px',
              height: circleSize + 'px',
              borderRadius: '50%',
              background: state === 'recording'
                ? `radial-gradient(circle, #ef4444 30%, rgba(239,68,68,${0.3 + amplitude * 0.5}) 100%)`
                : 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              boxShadow: state === 'recording'
                ? `0 0 ${20 + amplitude * 30}px rgba(239,68,68,${0.3 + amplitude * 0.4})`
                : '0 4px 15px rgba(139,92,246,0.3)',
              marginBottom: '10px',
            }}
          >
            {state === 'recording' ? (
              <div style={{ width:'24px', height:'24px', background:'white', borderRadius:'4px' }} />
            ) : (
              <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
                <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
              </svg>
            )}
          </div>

          <div style={{ color: state === 'recording' ? '#f87171' : '#a78bfa', fontSize: '0.8rem', fontWeight: 700, textAlign: 'center' }}>
            {state === 'recording' ? (
              <>
                <div style={{ fontSize: '1.1rem', marginBottom: '2px' }}>● {seconds}с</div>
                <div>Нажмите чтобы отправить</div>
              </>
            ) : (
              <div>Нажмите и говорите</div>
            )}
          </div>

          {/* Промежуточный текст распознавания */}
          {state === 'recording' && liveText && (
            <div style={{
              background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)',
              borderRadius: '10px', padding: '8px 12px', marginTop: '8px',
              color: '#c4b5fd', fontSize: '0.8rem', fontStyle: 'italic',
              maxWidth: '280px', textAlign: 'center', wordBreak: 'break-word',
            }}>
              🎙️ «{liveText}»
            </div>
          )}

          {state === 'idle' && (
            <div style={{ color: '#64748b', fontSize: '0.65rem', marginTop: '6px', textAlign: 'center' }}>
              Пример: "Клиент Иванов, пятнадцатое сентября, установка септика"
            </div>
          )}
        </>
      )}

      {/* ══ ОБРАБОТКА ══ */}
      {state === 'processing' && (
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <div style={{
            width: '50px', height: '50px', borderRadius: '50%',
            border: '3px solid rgba(139,92,246,0.2)',
            borderTopColor: '#8b5cf6',
            animation: 'spin 0.8s linear infinite',
            margin: '0 auto 12px',
          }} />
          <div style={{ color: '#a78bfa', fontSize: '0.85rem', fontWeight: 700 }}>
            Распознаю речь...
          </div>
        </div>
      )}

      {/* ══ РЕЗУЛЬТАТ ══ */}
      {state === 'done' && result && (
        <div style={{ width: '100%' }}>
          {result.text ? (
            <>
              {/* Распознанный текст */}
              <div style={{
                background: 'rgba(0,0,0,0.2)', borderRadius: '12px 12px 12px 4px',
                padding: '10px 14px', marginBottom: '8px',
                color: '#e2e8f0', fontSize: '0.85rem',
              }}>
                <div style={{ fontSize: '0.65rem', color: '#94a3b8', marginBottom: '4px' }}>Распознано:</div>
                "{result.text}"
              </div>

              {/* Поля */}
              <div style={{
                background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)',
                borderRadius: '10px', padding: '10px 14px', marginBottom: '8px',
              }}>
                <div style={{ fontSize: '0.7rem', color: '#86efac', fontWeight: 900, marginBottom: '6px' }}>
                  ✅ Заявка заполнена:
                </div>
                {result.fields && Object.entries(result.fields).map(([key, val]) => (
                  <div key={key} style={{ display: 'flex', gap: '8px', fontSize: '0.8rem', color: '#d1fae5', marginBottom: '2px' }}>
                    <span style={{ color: '#6ee7b7', fontWeight: 700, minWidth: '70px' }}>
                      {key === 'date' ? 'Дата' : key === 'clientName' ? 'Клиент' : key === 'phone' ? 'Телефон' : key === 'service' ? 'Услуга' : key === 'notes' ? 'Заметка' : key === 'address' ? 'Адрес' : key === 'budget' ? 'Бюджет' : key}:
                    </span>
                    <span>{val}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div style={{
              background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.2)',
              borderRadius: '10px', padding: '12px', color: '#fde68a', fontSize: '0.8rem',
              fontWeight: 700, textAlign: 'center',
            }}>
              ⚠️ {result.error}
            </div>
          )}

          <button onClick={reset} style={{
            width: '100%', padding: '10px', borderRadius: '10px', border: 'none',
            background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
            color: 'white', fontWeight: 900, fontSize: '0.85rem', cursor: 'pointer',
            marginTop: '4px',
          }}>
            🎤 Записать ещё
          </button>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}