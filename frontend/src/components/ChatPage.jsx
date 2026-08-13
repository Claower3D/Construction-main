import React, { useState, useEffect, useRef } from 'react';

export default function ChatPage({ viewRole, currentUser }) {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef(null);

  const roleNames = {
    customer: 'Заказчик',
    executor: 'Исполнитель',
    engineer: 'Инженер',
    manager: 'Менеджер',
    admin: 'Админ'
  };

  const currentRoleName = roleNames[viewRole] || 'Пользователь';

  // Локальное хранилище для всех сообщений (симуляция общей комнаты)
  useEffect(() => {
    const saved = localStorage.getItem('qazgost_chat_messages');
    if (saved) {
      try {
        setMessages(JSON.parse(saved));
      } catch(e) {
        console.error('Error parsing chat messages', e);
      }
    } else {
      // Стартовые сообщения
      const initialMsgs = [
        {
          id: 1,
          text: 'Добро пожаловать в чат по объекту! Здесь вы можете обсуждать детали проекта с заказчиком и исполнителем.',
          senderRole: 'system',
          senderName: 'Система',
          timestamp: new Date().toISOString()
        }
      ];
      setMessages(initialMsgs);
      localStorage.setItem('qazgost_chat_messages', JSON.stringify(initialMsgs));
    }
  }, []);

  // Автоскролл вниз при новом сообщении
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const newMsg = {
      id: Date.now(),
      text: inputText.trim(),
      senderRole: viewRole,
      senderName: currentRoleName,
      timestamp: new Date().toISOString()
    };

    const updated = [...messages, newMsg];
    setMessages(updated);
    localStorage.setItem('qazgost_chat_messages', JSON.stringify(updated));
    setInputText('');
  };

  const formatTime = (isoString) => {
    const d = new Date(isoString);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      backgroundColor: '#0a0f18',
      color: '#fff',
      borderRadius: '12px',
      overflow: 'hidden',
      border: '1px solid #1e293b'
    }}>
      {/* HEADER */}
      <div style={{
        padding: '1rem 1.5rem',
        backgroundColor: '#111827',
        borderBottom: '1px solid #1e293b',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem'
      }}>
        <div style={{
          width: '40px', height: '40px', borderRadius: '50%',
          backgroundColor: '#3b82f6', display: 'flex',
          alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem'
        }}>
          💬
        </div>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 600 }}>Общий чат по объекту</h2>
          <span style={{ fontSize: '0.85rem', color: '#22c55e' }}>● Все участники онлайн</span>
        </div>
      </div>

      {/* MESSAGES AREA */}
      <div style={{
        flex: 1,
        padding: '1.5rem',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        backgroundImage: 'radial-gradient(circle at center, rgba(16, 185, 129, 0.03) 0%, transparent 100%)'
      }}>
        {messages.map((msg) => {
          const isMe = msg.senderRole === viewRole;
          const isSystem = msg.senderRole === 'system';

          if (isSystem) {
            return (
              <div key={msg.id} style={{ display: 'flex', justifyContent: 'center', margin: '1rem 0' }}>
                <div style={{ backgroundColor: 'rgba(255,255,255,0.05)', padding: '0.5rem 1rem', borderRadius: '20px', fontSize: '0.8rem', color: '#94a3b8' }}>
                  {msg.text}
                </div>
              </div>
            );
          }

          return (
            <div key={msg.id} style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: isMe ? 'flex-end' : 'flex-start',
              maxWidth: '100%'
            }}>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '4px', marginLeft: '4px', marginRight: '4px' }}>
                {msg.senderName}
              </div>
              <div style={{
                backgroundColor: isMe ? '#3b82f6' : '#1e293b',
                padding: '0.75rem 1rem',
                borderRadius: isMe ? '16px 16px 2px 16px' : '16px 16px 16px 2px',
                maxWidth: '70%',
                wordBreak: 'break-word',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
              }}>
                <span style={{ fontSize: '0.95rem', lineHeight: '1.4' }}>{msg.text}</span>
                <div style={{
                  fontSize: '0.7rem',
                  color: isMe ? 'rgba(255,255,255,0.7)' : '#64748b',
                  textAlign: 'right',
                  marginTop: '4px'
                }}>
                  {formatTime(msg.timestamp)}
                  {isMe && <span style={{ marginLeft: '4px' }}>✓✓</span>}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* INPUT AREA */}
      <form onSubmit={handleSendMessage} style={{
        padding: '1rem',
        backgroundColor: '#111827',
        borderTop: '1px solid #1e293b',
        display: 'flex',
        gap: '0.5rem'
      }}>
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={`Написать сообщение от лица: ${currentRoleName}...`}
          style={{
            flex: 1,
            backgroundColor: '#1e293b',
            border: '1px solid #334155',
            borderRadius: '24px',
            padding: '0.75rem 1.25rem',
            color: '#fff',
            fontSize: '0.95rem',
            outline: 'none'
          }}
        />
        <button
          type="submit"
          disabled={!inputText.trim()}
          style={{
            width: '46px',
            height: '46px',
            borderRadius: '50%',
            backgroundColor: inputText.trim() ? '#10b981' : '#334155',
            color: '#fff',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: inputText.trim() ? 'pointer' : 'not-allowed',
            transition: 'all 0.2s'
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"></line>
            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
          </svg>
        </button>
      </form>
    </div>
  );
}
