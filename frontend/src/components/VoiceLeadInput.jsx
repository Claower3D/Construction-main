import React, { useState, useRef, useCallback } from 'react';

/**
 * VoiceLeadInput v11 — Голосовое сообщение → Заявка
 * 
 * Записывает аудио → отправляет WAV на /api/v1/speech/recognize (Go backend)
 * Работает одинаково на localhost и на Railway (production)
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
  
  // "через X дней"
  const throughMatch = lower.match(/через\s+(\d+)\s+дн/);
  if (throughMatch) { const d = new Date(now); d.setDate(d.getDate()+parseInt(throughMatch[1])); return fmt(d); }

  // Словесные числа — проверяем от больших к маленьким
  // Составные: "двадцать пятое", "тридцать первое"
  const compoundNums = [
    [/тридцать\s*перв/, 31],
    [/тридцат/, 30],
    [/двадцать\s*девят/, 29], [/двадцать\s*восьм/, 28], [/двадцать\s*седьм/, 27],
    [/двадцать\s*шест/, 26], [/двадцать\s*пят/, 25], [/двадцать\s*четв[её]рт/, 24],
    [/двадцать\s*трет/, 23], [/двадцать\s*втор/, 22], [/двадцать\s*перв/, 21],
    [/двадцат/, 20],
    [/девятнадцат/, 19], [/восемнадцат/, 18], [/семнадцат/, 17],
    [/шестнадцат/, 16], [/пятнадцат/, 15], [/четырнадцат/, 14],
    [/тринадцат/, 13], [/двенадцат/, 12], [/одиннадцат/, 11],
  ];
  // Простые: "пятое", "десятое" — с обязательной границей слова (не путать с "пятьсот")
  const simpleNums = [
    [/(?:^|\s)десят(?:ое|ого|ый|ому|е|\s|$)/, 10],
    [/(?:^|\s)девят(?:ое|ого|ый|ому|е|\s|$)/, 9],
    [/(?:^|\s)восьм(?:ое|ого|ой|ому|е|\s|$)/, 8],
    [/(?:^|\s)седьм(?:ое|ого|ой|ому|е|\s|$)/, 7],
    [/(?:^|\s)шест(?:ое|ого|ой|ому|е|\s|$)/, 6],
    [/(?:^|\s)пят(?:ое|ого|ый|ому|е|\s|$)/, 5],
    [/(?:^|\s)четв[её]рт(?:ое|ого|ый|ому|е|\s|$)/, 4],
    [/(?:^|\s)трет(?:ье|ьего|ий|ьему|ей|\s|$)/, 3],
    [/(?:^|\s)втор(?:ое|ого|ой|ому|е|\s|$)/, 2],
    [/(?:^|\s)перв(?:ое|ого|ый|ому|е|\s|$)/, 1],
  ];

  let day = null;
  // Сначала составные (двадцать пятое)
  for (const [re, num] of compoundNums) { if (re.test(lower)) { day = num; break; } }
  // Потом простые (пятое) — только если не нашли составных
  if (!day) {
    for (const [re, num] of simpleNums) { if (re.test(lower)) { day = num; break; } }
  }

  const months = {'январ':1,'феврал':2,'март':3,'апрел':4,'ма':5,'июн':6,'июл':7,'август':8,'сентябр':9,'октябр':10,'ноябр':11,'декабр':12};

  // Цифровые даты: "15 сентября", "дата 15", "число 25", "на 20-е"
  if (!day) {
    const digitDateMatch = lower.match(/(?:дат[ау]|числ[оа]|на)\s+(\d{1,2})/);
    if (digitDateMatch) { const d = parseInt(digitDateMatch[1]); if (d >= 1 && d <= 31) day = d; }
  }
  if (!day) {
    const beforeMonth = lower.match(/(\d{1,2})\s*(?:январ|феврал|март|апрел|ма[яй]|июн|июл|август|сентябр|октябр|ноябр|декабр)/);
    if (beforeMonth) { const d = parseInt(beforeMonth[1]); if (d >= 1 && d <= 31) day = d; }
  }
  if (!day) {
    // Число с суффиксом: "15-е", "20-го", "25 число"
    const m = lower.match(/(?:^|\s)(\d{1,2})(?:-[ео]е?|-го|(?:\s+числ)|\s|$)/);
    if (m) { const d = parseInt(m[1]); if (d >= 1 && d <= 31) day = d; }
  }
  
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

  // ═══ Ключевые слова-разделители — имя клиента НЕ может содержать эти слова ═══
  const KEYWORDS = new Set(['бюджет','бюджета','стоимость','цена','сумма','суммы','телефон','номер','дата','число','адрес','город','улица','дом','услуга','установка','монтаж','бурение','септик','септика','заявку','заявка','создай','сделай','лид','заказ','запись','новую','новый','нужно','создать','смотри','на','имя','зовут','клиент','фамилия','кровельные','штукатурка','электромонтаж','ремонт','строительство','демонтаж','отделочные','выезд','аренда','разработка','техническая','водопровод','канализация']);

  // ═══ ДАТА ═══
  const date = parseDate(text);
  if (date) result.date = date;

  // ═══ ТЕЛЕФОН ═══
  const phoneMatch = text.match(/(\+?[78][\s\-]?\d{3}[\s\-]?\d{3}[\s\-]?\d{2}[\s\-]?\d{2})/);
  if (phoneMatch) result.phone = phoneMatch[1].replace(/[\s\-()]/g, '');
  if (!result.phone) {
    const phoneMatch2 = lower.match(/номер\s+([\d\s\-+]+)/);
    if (phoneMatch2) { const digits = phoneMatch2[1].replace(/[\s\-+]/g, ''); if (digits.length >= 10) result.phone = digits; }
  }
  // Ещё формат: просто 11 цифр подряд
  if (!result.phone) {
    const allDigits = text.match(/[78]\d{9,10}/);
    if (allDigits) result.phone = allDigits[0];
  }

  // ═══ УСЛУГА ═══
  const svc = matchService(text);
  if (svc) result.service = svc;

  // ═══ ИМЯ КЛИЕНТА ═══
  // Паттерн 1: "клиент Артур", "зовут Артур Иванов", "имя Серик"
  const nameRegex = /(?:зовут|имя|клиент[а]?|фамилия)\s+([а-яё]+)/i;
  const nameMatch = lower.match(nameRegex);
  if (nameMatch) {
    let name = nameMatch[1];
    // Проверяем следующее слово — если не ключевое, добавляем (фамилия)
    const afterName = lower.slice(lower.indexOf(nameMatch[0]) + nameMatch[0].length).trim();
    const nextWord = afterName.match(/^([а-яё]+)/i);
    if (nextWord && !KEYWORDS.has(nextWord[1].toLowerCase())) {
      name += ' ' + nextWord[1];
    }
    result.clientName = name.split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  }
  // Паттерн 2: Слова с заглавной буквы (не ключевые, не адрес)
  if (!result.clientName) {
    const nameWords = text.split(/\s+/).filter(w => !KEYWORDS.has(w.toLowerCase()) && /^[А-ЯЁ][а-яё]{2,}$/.test(w));
    // Убираем слова которые могут быть частью адреса (города, улицы)
    const filtered = nameWords.filter(w => !lower.includes('адрес') || lower.indexOf(w.toLowerCase()) < lower.indexOf('адрес'));
    if (filtered.length >= 1 && filtered.length <= 2) result.clientName = filtered.join(' ');
  }

  // ═══ БЮДЖЕТ (парсим ДО адреса, чтобы не перепутать число с адресом) ═══
  const budgetMatch = lower.match(/(?:бюджет[а]?|стоимость[ю]?|цен[а]?|сумм[а]?)\s+([\d\s.,]+)/);
  if (budgetMatch) { const num = parseInt(budgetMatch[1].replace(/[\s.,]/g, '')); if (num > 0) result.budget = num; }
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

  // ═══ АДРЕС ═══
  // Паттерн 1: "адрес Ерубаева 50"
  const addrMatch = lower.match(/адрес[а]?\s+(.+?)(?:\s+(?:стоимость|бюджет|номер|телефон|дата|число|услуга|имя|зовут|клиент)|$)/);
  if (addrMatch) { result.address = addrMatch[1].trim().split(/\s+/).map(w => /^\d/.test(w) ? w : w.charAt(0).toUpperCase() + w.slice(1)).join(' '); }
  // Паттерн 2: "улица X дом Y" или "город X"
  if (!result.address) {
    const streetMatch = lower.match(/(?:улица|улице)\s+([а-яё]+(?:\s+(?:дом\s*)?\d+)?)/i);
    if (streetMatch) { result.address = streetMatch[1].trim().split(/\s+/).map(w => /^\d/.test(w) ? w : w.charAt(0).toUpperCase() + w.slice(1)).join(' '); }
  }
  if (!result.address) {
    const cityMatch = lower.match(/город\s+([а-яё]+(?:\s+[а-яё\d]+){0,5}?)(?:\s+(?:стоимость|бюджет|номер|телефон|дата|услуга|имя|зовут)|$)/);
    if (cityMatch) { result.address = cityMatch[1].trim().split(/\s+/).map(w => /^\d/.test(w) ? w : w.charAt(0).toUpperCase() + w.slice(1)).join(' '); }
  }

  // ═══ ЗАМЕТКИ — всегда дублируем полный распознанный текст ═══
  const notesMatch = lower.match(/(?:заметк[аи]|примечани[ея]|дополнительн[оа]|информаци[яю]|комментари[йя])\s+(.+?)(?:\s+(?:стоимость|бюджет|номер|телефон|дата|услуга|имя|зовут|адрес)|$)/);
  if (notesMatch) {
    result.notes = notesMatch[1].trim();
  }
  // Всегда добавляем полный текст в заметки (для инженера)
  result.rawText = text.trim();

  if (Object.keys(result).length <= 1 && text.trim()) { result.notes = text.trim(); }
  if (!result.date) result.date = fmt(new Date());
  return result;
}

// WAV encoder
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

// ═══ API URL — работает и локально и на Railway ═══
function getSpeechURL() {
  return `${window.location.origin}/api/v1/speech/recognize`;
}

export default function VoiceLeadInput({ onFieldsExtracted, onCommand, disabled }) {
  const [state, setState] = useState('idle'); // idle | recording | processing | done
  const [seconds, setSeconds] = useState(0);
  const [result, setResult] = useState(null);
  const [amplitude, setAmplitude] = useState(0);
  const [manualMode, setManualMode] = useState(false);

  const streamRef = useRef(null);
  const ctxRef = useRef(null);
  const procRef = useRef(null);
  const analyserRef = useRef(null);
  const timerRef = useRef(null);
  const samplesRef = useRef([]);
  const animRef = useRef(null);

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
    if (onFieldsExtracted && Object.keys(fields).length > 0) {
      onFieldsExtracted(fields);
    }
    setResult({ text, fields });
    setState('done');
  }, [onFieldsExtracted]);

  // ═══ НАЧАТЬ ЗАПИСЬ ═══
  const startRecording = useCallback(async () => {
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

      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;
      source.connect(analyser);

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

      let sec = 0;
      timerRef.current = setInterval(() => { sec++; setSeconds(sec); if (sec >= 90) stopRecording(); }, 1000);

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
    if (animRef.current) cancelAnimationFrame(animRef.current);
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    if (procRef.current) { procRef.current.disconnect(); procRef.current = null; }
    if (ctxRef.current) { try { ctxRef.current.close(); } catch(e){} ctxRef.current = null; }
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
    setAmplitude(0);

    if (samplesRef.current.length < 1600) {
      setResult({ error: 'Слишком короткое сообщение' });
      setState('done');
      return;
    }

    setState('processing');

    const allSamples = new Float32Array(samplesRef.current.length);
    allSamples.set(samplesRef.current);
    samplesRef.current = [];
    const wavBlob = encodeWAV(allSamples, 16000);

    try {
      const resp = await fetch(getSpeechURL(), {
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
      setResult({ error: 'Сервер распознавания недоступен. Попробуйте текстовый ввод.' });
      setState('done');
    }
  }, [processRecognizedText]);

  const handleClick = useCallback(() => {
    if (state === 'recording') { stopRecording(); } else { startRecording(); }
  }, [state, startRecording, stopRecording]);

  const reset = () => { setState('idle'); setResult(null); setSeconds(0); setManualMode(false); };

  const circleSize = state === 'recording' ? 80 + amplitude * 40 : 70;

  return (
    <div style={{
      background: 'rgba(139,92,246,0.06)',
      border: '1px solid rgba(139,92,246,0.25)',
      borderRadius: '16px', padding: '16px', marginBottom: '12px',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
    }}>

      {/* ══ КНОПКА-МИКРОФОН ══ */}
      {(state === 'idle' || state === 'recording') && !manualMode && (
        <>
          <div
            onClick={handleClick}
            style={{
              width: circleSize + 'px', height: circleSize + 'px', borderRadius: '50%',
              background: state === 'recording'
                ? `radial-gradient(circle, #ef4444 30%, rgba(239,68,68,${0.3 + amplitude * 0.5}) 100%)`
                : 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', transition: 'all 0.15s ease',
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

          {state === 'idle' && (
            <>
              <div style={{ color: '#64748b', fontSize: '0.65rem', marginTop: '6px', textAlign: 'center' }}>
                Пример: "Клиент Иванов, пятнадцатое сентября, установка септика"
              </div>
              <button onClick={() => setManualMode(true)} style={{
                background: 'none', border: 'none', color: '#64748b', fontSize: '0.65rem',
                cursor: 'pointer', marginTop: '6px', textDecoration: 'underline',
              }}>
                ⌨️ Или введите текстом
              </button>
            </>
          )}
        </>
      )}

      {/* ══ РУЧНОЙ ВВОД ══ */}
      {state === 'idle' && manualMode && (
        <div style={{ width: '100%' }}>
          <div style={{ color: '#c4b5fd', fontSize: '0.82rem', fontWeight: 700, marginBottom: '10px', textAlign: 'center' }}>
            ⌨️ Текстовый ввод заявки
          </div>
          <form onSubmit={(e) => {
            e.preventDefault();
            const input = e.target.elements.voiceText;
            const text = input?.value?.trim();
            if (text) processRecognizedText(text);
          }} style={{ display: 'flex', gap: '8px' }}>
            <input name="voiceText" type="text" autoFocus
              placeholder="Клиент Иванов, 15 сентября, септик, 540000..."
              style={{
                flex: 1, padding: '10px 14px', borderRadius: '10px',
                border: '1px solid rgba(139,92,246,0.3)', background: 'rgba(0,0,0,0.3)',
                color: '#e2e8f0', fontSize: '0.82rem', outline: 'none',
              }}
            />
            <button type="submit" style={{
              padding: '10px 16px', borderRadius: '10px', border: 'none',
              background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
              color: 'white', fontWeight: 900, fontSize: '0.82rem', cursor: 'pointer',
            }}>✅</button>
          </form>
          <button onClick={() => setManualMode(false)} style={{
            background: 'none', border: 'none', color: '#64748b', fontSize: '0.65rem',
            cursor: 'pointer', marginTop: '8px', textDecoration: 'underline', width: '100%',
          }}>
            🎤 Вернуться к голосовому вводу
          </button>
        </div>
      )}

      {/* ══ ОБРАБОТКА ══ */}
      {state === 'processing' && (
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <div style={{
            width: '50px', height: '50px', borderRadius: '50%',
            border: '3px solid rgba(139,92,246,0.2)', borderTopColor: '#8b5cf6',
            animation: 'spin 0.8s linear infinite', margin: '0 auto 12px',
          }} />
          <div style={{ color: '#a78bfa', fontSize: '0.85rem', fontWeight: 700 }}>Распознаю речь...</div>
        </div>
      )}

      {/* ══ РЕЗУЛЬТАТ ══ */}
      {state === 'done' && result && (
        <div style={{ width: '100%' }}>
          {result.text ? (
            <>
              <div style={{
                background: 'rgba(0,0,0,0.2)', borderRadius: '12px 12px 12px 4px',
                padding: '10px 14px', marginBottom: '8px', color: '#e2e8f0', fontSize: '0.85rem',
              }}>
                <div style={{ fontSize: '0.65rem', color: '#94a3b8', marginBottom: '4px' }}>Распознано:</div>
                "{result.text}"
              </div>
              <div style={{
                background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)',
                borderRadius: '10px', padding: '10px 14px', marginBottom: '8px',
              }}>
                <div style={{ fontSize: '0.7rem', color: '#86efac', fontWeight: 900, marginBottom: '6px' }}>
                  ✅ Заявка заполнена:
                </div>
                {result.fields && Object.entries(result.fields).filter(([key]) => key !== 'rawText').map(([key, val]) => (
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
            color: 'white', fontWeight: 900, fontSize: '0.85rem', cursor: 'pointer', marginTop: '4px',
          }}>
            🎤 Записать ещё
          </button>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}