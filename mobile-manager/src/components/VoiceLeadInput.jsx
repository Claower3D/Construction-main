import React, { useState, useEffect, useRef } from 'react';
import { X, Mic, MicOff, Sparkles, Check, RefreshCw } from 'lucide-react';

export default function VoiceLeadInput({ onClose, onSaveLead }) {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [parsedData, setParsedData] = useState(null);
  const [statusMsg, setStatusMsg] = useState('Нажмите на микрофон и продиктуйте данные заявки');
  const recognitionRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.lang = 'ru-RU';
      rec.continuous = true;
      rec.interimResults = true;

      rec.onresult = (event) => {
        let current = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          current += event.results[i][0].transcript;
        }
        setTranscript(current);
        parseVoiceText(current);
      };

      rec.onerror = (err) => {
        console.warn('Speech recognition error:', err);
        setStatusMsg('Ошибка микрофона. Можете использовать пример или ввести текст.');
        setIsRecording(false);
      };

      rec.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = rec;
    }
  }, []);

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      // Simulate voice input demo for testing on device without speech engine
      handleDemoVoice();
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
      setStatusMsg('Запись завершена. Проверьте распознанные поля.');
    } else {
      setTranscript('');
      setParsedData(null);
      try {
        recognitionRef.current.start();
        setIsRecording(true);
        setStatusMsg('Слушаю... Говорите: имя, вид работ, адрес и бюджет.');
      } catch (e) {
        handleDemoVoice();
      }
    }
  };

  const handleDemoVoice = () => {
    setStatusMsg('Демо-распознавание речи:');
    const demo = 'Клиент Руслан заливка фундамента 180 квадратов в микрорайоне Акбулак бюджет два с половиной миллиона телефон 8 701 555 43 21';
    setTranscript(demo);
    parseVoiceText(demo);
  };

  const parseVoiceText = (text) => {
    const lower = text.toLowerCase();

    // Extract client name
    let client = 'Новый клиент';
    const nameMatch = text.match(/(?:клиент|заказчик|зовут)\s+([А-Яа-яA-Za-z]+)/i);
    if (nameMatch) {
      client = nameMatch[1].charAt(0).toUpperCase() + nameMatch[1].slice(1);
    }

    // Extract budget
    let budget = 1500000;
    if (lower.includes('два с половиной миллиона') || lower.includes('2.5 миллиона')) budget = 2500000;
    else if (lower.includes('три миллиона') || lower.includes('3 миллиона')) budget = 3000000;
    else if (lower.includes('миллион')) budget = 1000000;
    else {
      const numMatch = text.match(/(\d+[\d\s]*)\s*(?:тенге|тг|₸|тысяч|млн)/i);
      if (numMatch) {
        budget = parseInt(numMatch[1].replace(/\s/g, ''), 10) || budget;
      }
    }

    // Extract location
    let location = 'г. Алматы';
    const locMatch = text.match(/(?:в|на|мкр|микрорайон|ул|улице)\s+([А-Яа-яA-Za-z0-9\s\-]+?)(?=\s+(?:бюджет|телефон|срок|$))/i);
    if (locMatch) {
      location = locMatch[1].trim();
    }

    // Extract work title
    let title = 'Строительные работы';
    if (lower.includes('фундамент')) title = 'Заливка фундамента';
    else if (lower.includes('кровл') || lower.includes('крыш')) title = 'Монтаж кровли';
    else if (lower.includes('отделк') || lower.includes('ремонт')) title = 'Отделочные работы';
    else if (lower.includes('монолит')) title = 'Монолитные работы';
    else if (lower.includes('экспертиз') || lower.includes('дефект')) title = 'Экспертиза дефектов бетона';

    // Extract phone
    let phone = '+7 (701) 555-43-21';
    const phoneMatch = text.match(/(?:8|\+7)?[\s\-]?\(?[0-9]{3}\)?[\s\-]?[0-9]{3}[\s\-]?[0-9]{2}[\s\-]?[0-9]{2}/);
    if (phoneMatch) {
      phone = phoneMatch[0];
    }

    setParsedData({
      title,
      client,
      location,
      budget,
      phone,
      role: title.includes('Экспертиз') ? 'engineer' : 'executor'
    });
  };

  const handleApply = () => {
    if (!parsedData) return;
    const now = new Date();
    onSaveLead({
      id: `deal-${Date.now().toString().slice(-4)}`,
      leadNum: Math.floor(100 + Math.random() * 900).toString(),
      title: parsedData.title,
      client: parsedData.client,
      phone: parsedData.phone,
      location: parsedData.location,
      budget: parsedData.budget,
      status: 'Новые',
      role: parsedData.role,
      date: now.toISOString().split('T')[0],
      time: '12:00',
      priority: 'normal',
      notes: [
        { text: `Распознано голосом: «${transcript}»`, time: 'Только что', author: 'AI Ассистент' }
      ]
    });
    onClose();
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 120,
      background: 'rgba(0, 0, 0, 0.85)',
      backdropFilter: 'blur(12px)',
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
          borderTop: '1px solid rgba(139, 92, 246, 0.4)',
          borderTopLeftRadius: '24px',
          borderTopRightRadius: '24px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          padding: '20px 20px 30px',
          boxShadow: '0 -10px 40px rgba(139, 92, 246, 0.3)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff'
            }}>
              <Sparkles size={18} />
            </div>
            <div>
              <h3 style={{ color: '#fff', fontSize: '1.05rem', fontWeight: 800 }}>
                Голосовой ввод лида
              </h3>
              <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                AI распознавание параметров сделки
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

        {/* Big Mic Button */}
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <button
            onClick={toggleRecording}
            style={{
              width: '84px',
              height: '84px',
              borderRadius: '50%',
              background: isRecording 
                ? 'radial-gradient(circle, #ef4444 0%, #b91c1c 100%)' 
                : 'radial-gradient(circle, #8b5cf6 0%, #6d28d9 100%)',
              border: 'none',
              color: '#fff',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: isRecording 
                ? '0 0 35px rgba(239, 68, 68, 0.7)' 
                : '0 0 30px rgba(139, 92, 246, 0.5)',
              cursor: 'pointer',
              animation: isRecording ? 'pulse 1.5s infinite' : 'none',
              transition: 'all 0.2s ease',
            }}
          >
            {isRecording ? <MicOff size={36} /> : <Mic size={36} />}
          </button>

          <div style={{ marginTop: '12px', fontSize: '0.82rem', color: isRecording ? '#f87171' : '#94a3b8', fontWeight: 600 }}>
            {statusMsg}
          </div>
        </div>

        {/* Live Transcript */}
        {transcript && (
          <div style={{
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            padding: '12px',
            fontSize: '0.84rem',
            color: '#e2e8f0',
            marginBottom: '16px',
            lineHeight: '1.4',
            fontStyle: 'italic'
          }}>
            «{transcript}»
          </div>
        )}

        {/* Parsed Fields Preview */}
        {parsedData && (
          <div className="glass-panel" style={{ padding: '14px', marginBottom: '18px' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#38bdf8', marginBottom: '8px' }}>
              ✓ AI РАСПОЗНАННЫЕ ДАННЫЕ:
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.8rem' }}>
              <div>
                <span style={{ color: '#64748b', fontSize: '0.7rem' }}>Клиент:</span>
                <div style={{ color: '#fff', fontWeight: 700 }}>{parsedData.client}</div>
              </div>
              <div>
                <span style={{ color: '#64748b', fontSize: '0.7rem' }}>Телефон:</span>
                <div style={{ color: '#fff', fontWeight: 700 }}>{parsedData.phone}</div>
              </div>
              <div>
                <span style={{ color: '#64748b', fontSize: '0.7rem' }}>Работы:</span>
                <div style={{ color: '#fff', fontWeight: 700 }}>{parsedData.title}</div>
              </div>
              <div>
                <span style={{ color: '#64748b', fontSize: '0.7rem' }}>Бюджет:</span>
                <div style={{ color: '#00e5ff', fontWeight: 900 }}>
                  {new Intl.NumberFormat('ru-RU').format(parsedData.budget)} ₸
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action Button */}
        {parsedData ? (
          <button
            onClick={handleApply}
            className="glow-btn"
            style={{ width: '100%', padding: '14px', fontSize: '0.95rem' }}
          >
            <Check size={18} /> Применить и создать сделку
          </button>
        ) : (
          <button
            onClick={handleDemoVoice}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              padding: '12px',
              color: '#cbd5e1',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            Использовать тестовый пример голоса
          </button>
        )}
      </div>
    </div>
  );
}
