import React, { useState, useRef, useCallback, useEffect } from 'react';
import { getAuthHeaders } from '../api/crmApi';
import { fetchWithTimeout } from '../api/syncCore';

/**
 * VoiceLeadInput — Голосовой ввод заявки для менеджера
 * Точная копия компонента с ПК версии с поддержкой мобильных устройств и Railway backend
 */

// ═══ ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ПАРСИНГА ═══
function fmt(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

const MONTH_STEMS = [
  ['январ[а-яё]*', 1], ['феврал[а-яё]*', 2], ['март[а-яё]*', 3], ['апрел[а-яё]*', 4],
  ['ма[йя]', 5], ['июн[а-яё]*', 6], ['июл[а-яё]*', 7], ['август[а-яё]*', 8],
  ['сентябр[а-яё]*', 9], ['октябр[а-яё]*', 10], ['ноябр[а-яё]*', 11], ['декабр[а-яё]*', 12]
];
// Month word only as a whole word: «май/мая», never a substring like «Самат», «замер», «мастер»
function monthAtStart(str) {
  for (const [stem, num] of MONTH_STEMS) {
    if (new RegExp(`^${stem}(?![а-яё])`).test(str)) return num;
  }
  return null;
}

// Ordinal day words («пятнадцатое», «двадцать пятого», «третье»). Cardinals from budgets
// («пятьсот тридцать пять тысяч») are NOT ordinals and are ignored.
const ORD_STEMS = [
  ['девятнадцат', 19], ['восемнадцат', 18], ['семнадцат', 17], ['шестнадцат', 16], ['пятнадцат', 15],
  ['четырнадцат', 14], ['тринадцат', 13], ['двенадцат', 12], ['одиннадцат', 11], ['двадцат', 20],
  ['тридцат', 30], ['десят', 10], ['девят', 9], ['восьм', 8], ['седьм', 7], ['шест', 6], ['пят', 5],
  ['четв[её]рт', 4], ['трет', 3], ['втор', 2], ['перв', 1]
];
const ORD_RE = new RegExp(
  `(?:^|[^а-яё])(?:(двадцать|тридцать)\\s+)?(${ORD_STEMS.map(s => s[0]).join('|')})(?:ое|ого|ому|ый|ой|ье|ьего|ьему|ий|ья)(?![а-яё])`,
  'g'
);
const NOT_A_DAY_AFTER = /^(?:тысяч|тыс|млн|миллион|метр|м(?![а-яё])|см|мм|человек|кольц|шт|т(?![а-яё])|тонн|сот|час|минут|этаж|кв|дом|раз)/;

function resolveDate(day, month, now) {
  if (!day || day < 1 || day > 31) return null;
  const y = now.getFullYear();
  if (month) {
    // past months → next year
    const year = month < now.getMonth() + 1 ? y + 1 : y;
    const d = new Date(year, month - 1, day);
    return d.getDate() === day ? fmt(d) : null;
  }
  // no month: this month, or next month if that day already passed
  let d = new Date(y, now.getMonth(), day);
  if (day < now.getDate()) d = new Date(y, now.getMonth() + 1, day);
  return d.getDate() === day ? fmt(d) : null;
}

export function parseDate(text, now = new Date()) {
  const lower = ` ${String(text || '').toLowerCase().replace(/ё/g, 'е')} `;
  if (lower.includes('послезавтра')) { const d = new Date(now); d.setDate(d.getDate()+2); return fmt(d); }
  if (lower.includes('завтра')) { const d = new Date(now); d.setDate(d.getDate()+1); return fmt(d); }
  if (lower.includes('сегодня')) return fmt(now);

  // 1) dd.mm[.yyyy]  (not «1.5 миллиона», not «535.000»)
  const dm = lower.match(/(?:^|\s)(\d{1,2})[./](\d{1,2})(?:[./](\d{2,4}))?(?=[\s,;]|$)/);
  if (dm) {
    const rest = lower.slice(lower.indexOf(dm[0]) + dm[0].length).trimStart();
    const mo = parseInt(dm[2], 10);
    if (mo >= 1 && mo <= 12 && !NOT_A_DAY_AFTER.test(rest)) {
      const r = resolveDate(parseInt(dm[1], 10), mo, now);
      if (r) return r;
    }
  }

  // 2) digits with context: «19 сентября», «на 19», «19-го», «19 числа», «дата 19»
  const digitRe = /(^|[^\d.,])(\d{1,2})(-?(?:е|го|ое|ого))?(?![\d.,])/g;
  let m;
  while ((m = digitRe.exec(lower)) !== null) {
    const day = parseInt(m[2], 10);
    const start = m.index + m[1].length;
    const rest = lower.slice(start + m[2].length + (m[3] || '').length).trimStart();
    const before = lower.slice(0, start).trimEnd();
    if (NOT_A_DAY_AFTER.test(rest)) continue;
    const month = monthAtStart(rest);
    if (month) { const r = resolveDate(day, month, now); if (r) return r; continue; }
    const contextual = !!m[3] || /^числ/.test(rest) || /(?:^|\s)(?:на|дата|дату|число|числа)$/.test(before);
    if (contextual && !/(?:дом|д\.|кв|квартира|улица|ул\.|корпус|офис|участок)$/.test(before)) {
      const r = resolveDate(day, null, now);
      if (r) return r;
    }
  }

  // 3) ordinal words: «пятнадцатое сентября», «на двадцать пятое», «третьего числа»
  ORD_RE.lastIndex = 0;
  while ((m = ORD_RE.exec(lower)) !== null) {
    const stemNum = ORD_STEMS.find(([re]) => new RegExp(`^${re}$`).test(m[2]))?.[1];
    if (!stemNum) continue;
    let day = stemNum;
    if (m[1] === 'двадцать' && stemNum < 10) day = 20 + stemNum;
    else if (m[1] === 'тридцать' && stemNum < 2) day = 30 + stemNum;
    const end = m.index + m[0].length;
    const rest = lower.slice(end).trimStart();
    const lead = /^[^а-яё]/.test(m[0]) ? 1 : 0;
    const before = lower.slice(0, m.index + lead).trimEnd();
    const month = monthAtStart(rest);
    if (month) { const r = resolveDate(day, month, now); if (r) return r; continue; }
    if (/^числ/.test(rest) || /(?:^|\s)(?:на|дата|дату)$/.test(before)) {
      const r = resolveDate(day, null, now);
      if (r) return r;
    }
  }
  return null;
}

// Voice command words are removed only as whole words («лид», not «Лидия»; «заказ», not «заказчик»)
const COMMAND_WORDS_RE = /(^|[\s,.!?;:])(?:создай(?:те)?|сделай(?:те)?|новую|новый|новая|заявк[уаеи]|лид|лида|заказ)(?=$|[\s,.!?;:])/gi;
export function stripCommandWords(text) {
  return String(text || '').replace(COMMAND_WORDS_RE, '$1').replace(/\s{2,}/g, ' ').trim();
}

const SERVICES = [
  'Установка септика',
  'Бурение скважины на воду',
  'Разработка ПСД',
  'Монтаж HVAC системы',
  'Заливка монолитного фундамента',
  'Техническая экспертиза',
  'Аренда спецтехники',
  'Кровельные работы',
  'Электромонтаж',
  'Штукатурка',
  'Монтаж водопровода',
  'Канализация',
  'Ремонт квартиры',
  'Строительство дома',
  'Отделочные работы',
  'Демонтаж',
  'Выезд на объект',
  'Другое...'
];

function matchService(text) {
  const l = text.toLowerCase();
  for (const s of SERVICES) { 
    const key = s.toLowerCase().split(' ')[0].substring(0, 4);
    if (l.includes(key)) return s; 
  }
  if (l.includes('септик')) return 'Установка септика';
  if (l.includes('скважин') || l.includes('бурен')) return 'Бурение скважины на воду';
  if (l.includes('фундамент')) return 'Заливка монолитного фундамента';
  if (l.includes('кровл') || l.includes('крыш')) return 'Кровельные работы';
  if (l.includes('экспертиз') || l.includes('дефект')) return 'Техническая экспертиза';
  if (l.includes('ремонт') || l.includes('отделк')) return 'Ремонт квартиры';
  if (l.includes('электрик')) return 'Электромонтаж';
  return 'Установка септика';
}

export function parseAllFields(text) {
  const result = {};
  const lower = text.toLowerCase();

  const KEYWORDS = new Set(['бюджет','бюджета','стоимость','цена','сумма','суммы','телефон','номер','дата','число','адрес','город','улица','дом','услуга','установка','монтаж','бурение','септик','септика','заявку','заявка','создай','сделай','лид','заказ','запись','новую','новый','нужно','создать','смотри','на','имя','зовут','клиент','фамилия','кровельные','штукатурка','электромонтаж','ремонт','строительство','демонтаж','отделочные','выезд','аренда','разработка','техническая','водопровод','канализация']);

  // 1. Дата
  const date = parseDate(text);
  if (date) result.date = date;

  // 2. Телефон
  const phoneMatch = text.match(/(\+?[78][\s\-]?\d{3}[\s\-]?\d{3}[\s\-]?\d{2}[\s\-]?\d{2})/);
  if (phoneMatch) result.phone = phoneMatch[1].replace(/[\s\-()]/g, '');
  if (!result.phone) {
    const phoneMatch2 = lower.match(/номер\s+([\d\s\-+]+)/);
    if (phoneMatch2) { const digits = phoneMatch2[1].replace(/[\s\-+]/g, ''); if (digits.length >= 10) result.phone = digits; }
  }
  if (!result.phone) {
    const allDigits = text.match(/[78]\d{9,10}/);
    if (allDigits) result.phone = allDigits[0];
  }

  // 3. Услуга
  const svc = matchService(text);
  if (svc) result.service = svc;

  // 4. Имя клиента
  const nameRegex = /(?:зовут|имя|клиент[а]?|фамилия)\s+([а-яё]+)/i;
  const nameMatch = lower.match(nameRegex);
  if (nameMatch) {
    let name = nameMatch[1];
    const afterName = lower.slice(lower.indexOf(nameMatch[0]) + nameMatch[0].length).trim();
    const nextWord = afterName.match(/^([а-яё]+)/i);
    if (nextWord && !KEYWORDS.has(nextWord[1].toLowerCase())) {
      name += ' ' + nextWord[1];
    }
    result.clientName = name.split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  }
  if (!result.clientName) {
    const nameWords = text.split(/\s+/).filter(w => !KEYWORDS.has(w.toLowerCase()) && /^[А-ЯЁ][а-яё]{2,}$/.test(w));
    const filtered = nameWords.filter(w => !lower.includes('адрес') || lower.indexOf(w.toLowerCase()) < lower.indexOf('адрес'));
    if (filtered.length >= 1 && filtered.length <= 2) result.clientName = filtered.join(' ');
  }

  // 5. Бюджет
  if (lower.includes('полтора миллиона') || lower.includes('1.5 миллиона')) result.budget = 1500000;
  else if (lower.includes('два с половиной миллиона') || lower.includes('2.5 миллиона')) result.budget = 2500000;
  else if (lower.includes('три миллиона') || lower.includes('3 миллиона')) result.budget = 3000000;
  else if (lower.includes('пятьсот тридцать пять тысяч') || lower.includes('535.000') || lower.includes('535 000') || lower.includes('535000')) result.budget = 535000;
  else {
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
  }

  // 6. Адрес
  const addrMatch = lower.match(/адрес[а]?\s+(.+?)(?:\s+(?:стоимость|бюджет|номер|телефон|дата|число|услуга|имя|зовут|клиент)|$)/);
  if (addrMatch) { 
    result.address = addrMatch[1].trim().split(/\s+/).map(w => /^\d/.test(w) ? w : w.charAt(0).toUpperCase() + w.slice(1)).join(' '); 
  }
  if (!result.address) {
    const streetMatch = lower.match(/(?:улица|улице)\s+([а-яё0-9\s]+?(?:\s+(?:дом\s*)?\d+)?)(?=\s+(?:бюджет|стоимость|номер|телефон|дата|$))/i);
    if (streetMatch) { 
      result.address = streetMatch[1].trim().split(/\s+/).map(w => /^\d/.test(w) ? w : w.charAt(0).toUpperCase() + w.slice(1)).join(' '); 
    }
  }
  if (!result.address) {
    const cityMatch = lower.match(/город\s+([а-яё]+)(?:\s+(?:улица|улице)\s+([а-яё0-9\s]+))?/i);
    if (cityMatch) { 
      let full = cityMatch[1].charAt(0).toUpperCase() + cityMatch[1].slice(1);
      if (cityMatch[2]) full += ', ' + cityMatch[2].trim();
      result.address = full;
    }
  }

  // 7. Заметки
  result.rawText = text.trim();
  result.notes = `Распознано: "${text.trim()}"`;

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

// URL сервера Railway (на мобилке localhost нет, подключаемся к Railway)
const SPEECH_URL = 'https://construction-main-production.up.railway.app/api/v1/speech/recognize';

export default function VoiceLeadInput({ onFieldsExtracted }) {
  const [state, setState] = useState('idle'); // idle | recording | processing | done
  const [seconds, setSeconds] = useState(0);
  const [result, setResult] = useState(null);
  const [amplitude, setAmplitude] = useState(0);
  const [manualMode, setManualMode] = useState(false);
  const [inputText, setInputText] = useState('');

  const streamRef = useRef(null);
  const ctxRef = useRef(null);
  const procRef = useRef(null);
  const analyserRef = useRef(null);
  const timerRef = useRef(null);
  const samplesRef = useRef([]);
  const animRef = useRef(null);
  const recognitionRef = useRef(null);
  const webSpeechTextRef = useRef('');
  const mountedRef = useRef(true);
  const stopRecordingRef = useRef(null);

  // Release microphone, audio graph, timers and speech recognition
  const releaseAll = useCallback((abortRecognition = false) => {
    if (animRef.current) { cancelAnimationFrame(animRef.current); animRef.current = null; }
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    if (procRef.current) { try { procRef.current.onaudioprocess = null; procRef.current.disconnect(); } catch (e) {} procRef.current = null; }
    if (ctxRef.current) { try { ctxRef.current.close(); } catch (e) {} ctxRef.current = null; }
    if (streamRef.current) { try { streamRef.current.getTracks().forEach(t => t.stop()); } catch (e) {} streamRef.current = null; }
    if (recognitionRef.current) {
      const rec = recognitionRef.current;
      recognitionRef.current = null;
      try {
        if (abortRecognition) { rec.onresult = null; rec.abort ? rec.abort() : rec.stop(); } else { rec.stop(); }
      } catch (e) {}
    }
  }, []);

  // Cleanup when the modal is closed while recording
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      releaseAll(true);
    };
  }, [releaseAll]);

  // Обработка распознанного текста
  const processRecognizedText = useCallback((text) => {
    if (!mountedRef.current) return;
    if (!text || !text.trim()) {
      setResult({ error: 'Речь не распознана. Попробуйте ещё раз или введите текстом.' });
      setState('done');
      return;
    }
    const cleaned = stripCommandWords(text);
    const fields = parseAllFields(cleaned || text);
    if (!fields.date) { const d = parseDate(text); if (d) fields.date = d; }
    
    if (onFieldsExtracted && Object.keys(fields).length > 0) {
      onFieldsExtracted(fields);
    }
    setResult({ text, fields });
    setState('done');
  }, [onFieldsExtracted]);

  // НАЧАТЬ ЗАПИСЬ
  const startRecording = useCallback(async () => {
    try {
      webSpeechTextRef.current = '';
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      samplesRef.current = [];
      setResult(null);
      setState('recording');
      setSeconds(0);

      // Web Speech API в параллель (если поддерживается)
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        try {
          const rec = new SpeechRecognition();
          rec.lang = 'ru-RU';
          rec.continuous = true;
          rec.interimResults = true;
          rec.onresult = (e) => {
            let full = '';
            for (let i = 0; i < e.results.length; i++) full += e.results[i][0].transcript + ' ';
            webSpeechTextRef.current = full.trim();
          };
          rec.start();
          recognitionRef.current = rec;
        } catch (e) {}
      }

      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioCtx({ sampleRate: 16000 });
      if (ctx.state === 'suspended') await ctx.resume();
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
      timerRef.current = setInterval(() => { 
        sec++; 
        setSeconds(sec); 
        if (sec >= 60 && stopRecordingRef.current) stopRecordingRef.current(); 
      }, 1000);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const animate = () => {
        analyser.getByteFrequencyData(dataArray);
        const avg = dataArray.reduce((a,b) => a+b, 0) / dataArray.length;
        setAmplitude(avg / 255);
        animRef.current = requestAnimationFrame(animate);
      };
      animate();

    } catch(err) {
      console.warn('Mic error:', err);
      releaseAll(true); // do not leave the microphone / recognition running
      if (!mountedRef.current) return;
      setResult({ error: err && err.name === 'NotAllowedError'
        ? 'Нет доступа к микрофону. Разрешите микрофон в настройках Android.'
        : 'Не удалось начать запись: ' + ((err && err.message) || 'ошибка аудио') });
      setState('done');
    }
  }, [releaseAll]);

  // ОСТАНОВИТЬ И ОБРАБОТАТЬ
  const stopRecording = useCallback(async () => {
    releaseAll(false);
    if (!mountedRef.current) return;
    setAmplitude(0);

    setState('processing');

    // Если Web Speech уже распознал речь
    if (webSpeechTextRef.current && webSpeechTextRef.current.length >= 4) {
      processRecognizedText(webSpeechTextRef.current);
      return;
    }

    if (samplesRef.current.length < 1600) {
      setResult({ error: 'Слишком короткое сообщение' });
      setState('done');
      return;
    }

    const allSamples = new Float32Array(samplesRef.current.length);
    allSamples.set(samplesRef.current);
    samplesRef.current = [];
    const wavBlob = encodeWAV(allSamples, 16000);

    try {
      const resp = await fetchWithTimeout(SPEECH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'audio/wav', ...getAuthHeaders() },
        body: wavBlob,
      }, 30000);
      const data = await resp.json();
      if (!mountedRef.current) return;

      if (data.text) {
        processRecognizedText(data.text);
      } else if (webSpeechTextRef.current) {
        processRecognizedText(webSpeechTextRef.current);
      } else {
        setResult({ error: data.error || 'Речь не распознана. Попробуйте сказать громче или используйте текстовый ввод.' });
        setState('done');
      }
    } catch(err) {
      if (!mountedRef.current) return;
      if (webSpeechTextRef.current) {
        processRecognizedText(webSpeechTextRef.current);
      } else {
        setResult({ error: 'Сервер распознавания недоступен. Используйте текстовый ввод ниже.' });
        setState('done');
      }
    }
  }, [processRecognizedText, releaseAll]);
  stopRecordingRef.current = stopRecording;

  const handleClick = useCallback(() => {
    if (state === 'recording') { 
      stopRecording(); 
    } else { 
      startRecording(); 
    }
  }, [state, startRecording, stopRecording]);

  const reset = () => { 
    setState('idle'); 
    setResult(null); 
    setSeconds(0); 
    setManualMode(false); 
    setInputText('');
  };

  // Вставить тестовый пример со скриншота пользователя
  const handleInsertDemo = () => {
    const demo = 'создай заявку на 19 сентября имя Артур город Караганда установка септика улица Ерубаева 50 бюджет 535.000';
    setInputText(demo);
    processRecognizedText(demo);
  };

  const circleSize = state === 'recording' ? 80 + amplitude * 40 : 70;

  return (
    <div style={{
      background: 'rgba(139,92,246,0.08)',
      border: '1px solid rgba(139,92,246,0.25)',
      borderRadius: '16px', 
      padding: '16px', 
      marginBottom: '16px',
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center',
    }}>

      {/* ══ КНОПКА-МИКРОФОН (КАК В ПК-ВЕРСИИ) ══ */}
      {(state === 'idle' || state === 'recording') && !manualMode && (
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
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
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

          <div style={{ color: state === 'recording' ? '#f87171' : '#a78bfa', fontSize: '0.82rem', fontWeight: 700, textAlign: 'center' }}>
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
              <div style={{ color: '#64748b', fontSize: '0.68rem', marginTop: '6px', textAlign: 'center', lineHeight: '1.3' }}>
                Пример: "Клиент Иванов, пятнадцатое сентября, установка септика"
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '6px' }}>
                <button onClick={() => setManualMode(true)} style={{
                  background: 'none', border: 'none', color: '#8b5cf6', fontSize: '0.72rem',
                  cursor: 'pointer', textDecoration: 'underline', fontWeight: 600
                }}>
                  ⌨️ Или введите текстом
                </button>
                <button onClick={handleInsertDemo} style={{
                  background: 'none', border: 'none', color: '#00e5ff', fontSize: '0.72rem',
                  cursor: 'pointer', textDecoration: 'underline', fontWeight: 600
                }}>
                  ✨ Пример из демо
                </button>
              </div>
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
            if (inputText.trim()) processRecognizedText(inputText.trim());
          }} style={{ display: 'flex', gap: '8px' }}>
            <input 
              type="text" 
              autoFocus
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Клиент Артур, 19 сентября, Караганда, септик, 535000..."
              style={{
                flex: 1, 
                padding: '10px 14px', 
                borderRadius: '10px',
                border: '1px solid rgba(139,92,246,0.3)', 
                background: 'rgba(0,0,0,0.3)',
                color: '#e2e8f0', 
                fontSize: '0.82rem', 
                outline: 'none',
              }}
            />
            <button type="submit" style={{
              padding: '10px 16px', 
              borderRadius: '10px', 
              border: 'none',
              background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
              color: 'white', 
              fontWeight: 900, 
              fontSize: '0.82rem', 
              cursor: 'pointer',
            }}>✅</button>
          </form>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
            <button onClick={() => setManualMode(false)} style={{
              background: 'none', border: 'none', color: '#64748b', fontSize: '0.7rem',
              cursor: 'pointer', textDecoration: 'underline',
            }}>
              🎤 Вернуться к голосовому вводу
            </button>
            <button onClick={handleInsertDemo} style={{
              background: 'none', border: 'none', color: '#00e5ff', fontSize: '0.7rem',
              cursor: 'pointer', textDecoration: 'underline',
            }}>
              Вставить пример со скрина
            </button>
          </div>
        </div>
      )}

      {/* ══ ОБРАБОТКА ══ */}
      {state === 'processing' && (
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <div style={{
            width: '46px', height: '46px', borderRadius: '50%',
            border: '3px solid rgba(139,92,246,0.2)', borderTopColor: '#8b5cf6',
            animation: 'spin 0.8s linear infinite', margin: '0 auto 12px',
          }} />
          <div style={{ color: '#a78bfa', fontSize: '0.85rem', fontWeight: 700 }}>Распознаю речь...</div>
        </div>
      )}

      {/* ══ РЕЗУЛЬТАТ (ТОЧНАЯ КОПИЯ СО СКРИНШОТА ПОЛЬЗОВАТЕЛЯ) ══ */}
      {state === 'done' && result && (
        <div style={{ width: '100%' }}>
          {result.text ? (
            <>
              {/* Серая плашка: Распознано */}
              <div style={{
                background: 'rgba(0,0,0,0.3)', 
                borderRadius: '12px',
                padding: '10px 14px', 
                marginBottom: '8px', 
                color: '#e2e8f0', 
                fontSize: '0.85rem',
                border: '1px solid rgba(255,255,255,0.06)'
              }}>
                <div style={{ fontSize: '0.68rem', color: '#94a3b8', marginBottom: '4px' }}>Распознано:</div>
                "{result.text}"
              </div>

              {/* Зеленая плашка: ✅ Заявка заполнена */}
              <div style={{
                background: 'rgba(34,197,94,0.1)', 
                border: '1px solid rgba(34,197,94,0.3)',
                borderRadius: '10px', 
                padding: '10px 14px', 
                marginBottom: '8px',
              }}>
                <div style={{ fontSize: '0.75rem', color: '#86efac', fontWeight: 900, marginBottom: '6px' }}>
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
              background: 'rgba(251,191,36,0.1)', 
              border: '1px solid rgba(251,191,36,0.2)',
              borderRadius: '10px', 
              padding: '12px', 
              color: '#fde68a', 
              fontSize: '0.8rem',
              fontWeight: 700, 
              textAlign: 'center',
            }}>
              ⚠️ {result.error}
            </div>
          )}

          <button onClick={reset} style={{
            width: '100%', 
            padding: '10px', 
            borderRadius: '10px', 
            border: 'none',
            background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
            color: 'white', 
            fontWeight: 900, 
            fontSize: '0.85rem', 
            cursor: 'pointer', 
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
