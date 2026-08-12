import React, { useState } from 'react';
import { createVoiceListener, isSpeechSupported } from '../services/voiceController';

export default function VoiceControlWidget() {
  const [isListening, setIsListening] = useState(false);
  const [voiceText, setVoiceText] = useState('');

  const handleToggleVoice = () => {
    if (!isSpeechSupported()) {
      alert('🎙️ Голосовой ввод поддерживается в браузерах Chrome / Edge / Safari!');
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    setIsListening(true);
    const listener = createVoiceListener(
      (transcript) => {
        setVoiceText(transcript);
        setIsListening(false);
        alert(`🎙️ Распознана голосовая команда: "${transcript}"`);
      },
      () => {
        setIsListening(false);
      }
    );

    if (listener) listener.start();
  };

  return (
    <div
      className="voice-control-widget"
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 999,
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        background: '#1e293b',
        border: '1px solid rgba(245, 158, 11, 0.4)',
        padding: '0.65rem 1.25rem',
        borderRadius: '30px',
        boxShadow: '0 8px 25px rgba(0,0,0,0.5)',
      }}
    >
      <button
        onClick={handleToggleVoice}
        style={{
          background: isListening ? '#ef4444' : '#f59e0b',
          border: 'none',
          color: '#fff',
          borderRadius: '50%',
          width: '38px',
          height: '38px',
          cursor: 'pointer',
          fontSize: '1.1rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        🎙️
      </button>
      <span style={{ color: '#fff', fontSize: '0.85rem', fontWeight: 'bold' }}>
        {isListening ? 'Слушаю команду...' : voiceText ? `«${voiceText}»` : 'Голосовой AI Assistant'}
      </span>
    </div>
  );
}
