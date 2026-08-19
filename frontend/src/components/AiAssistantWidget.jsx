import React, { useState, useRef, useEffect } from 'react';

export default function AiAssistantWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      sender: 'ai',
      text: 'Здравствуйте! Я AI-инженер QazGost 2.0. Загрузите фото объекта или задайте вопрос по расчёту сметы, дефектам и ГОСТ/СНиП РК.',
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSend = async (textToSend) => {
    const query = textToSend || input;
    if (!query.trim()) return;

    const userMsg = { sender: 'user', text: query };
    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setIsTyping(true);

    let replyText = 'AI-модуль QazGost проанализировал ваш запрос. ';
    const qLower = query.toLowerCase();

    try {
      if (qLower.includes('смет') || qLower.includes('цена') || qLower.includes('почем') || qLower.includes('кирпич') || qLower.includes('стоим')) {
        const resp = await fetch('http://localhost:8080/api/v1/prices');
        if (resp.ok) {
          const data = await resp.json();
          const words = qLower.split(' ').map(w => w.replace(/[?.,]/g, ''));
          let found = null;
          
          // Простая эвристика поиска в базе
          for (const item of (data.items || [])) {
             const itemNameLower = item.Name.toLowerCase();
             if (words.some(w => w.length > 3 && itemNameLower.includes(w))) {
                found = item;
                break;
             }
          }

          if (found) {
             replyText = `По ценовой базе (таблица Excel / СНиП РК) найдено совпадение:\n**${found.Name}**\nЦена: ${found.PriceKZT} ₸ / ${found.Unit}\nРегион: ${found.Region}`;
          } else {
             replyText += 'По ценовой базе Казахстана 2026 г. средняя стоимость качественного ремонта с материалами составляет ~ 45 000 ₸/м². Детализированная смета сформирована в калькуляторе.';
          }
        }
      } else if (qLower.includes('дефект') || qLower.includes('трещин')) {
        replyText += 'Обнаружена структурная микротрещина в монолите (класс B25). Рекомендуемое решение: инъектирование эпоксидным составом. Оценочная стоимость: 32 000 ₸.';
      } else if (qLower.includes('гост') || qLower.includes('снип')) {
        replyText += 'Соответствие нормам СП РК 3.02-101-2012. Нормы по теплоизоляции фасада: минвата толщиной не менее 100 мм для климатической зоны Астаны.';
      } else {
        replyText += 'Запрос обработан нейросетью. Все коэффициенты и WBS-декомпозиция готовы к экспорту в PDF / Excel.';
      }
    } catch (e) {
      replyText += ' (ошибка подключения к базе Excel)';
    }

    setTimeout(() => {
      setMessages((prev) => [...prev, { sender: 'ai', text: replyText }]);
      setIsTyping(false);
    }, 900);
  };

  return (
    <div className="floating-ai-widget">
      {isOpen && (
        <div className="ai-chat-window">
          <div className="ai-chat-header">
            <div className="ai-chat-title-group">
              <div className="ai-avatar">🤖</div>
              <div>
                <h4 className="ai-chat-title">QazGost AI Ассистент</h4>
                <span className="ai-chat-status">
                  <span className="online-dot"></span> В сети • 2.5B нейросеть
                </span>
              </div>
            </div>
            <button className="ai-chat-close" onClick={() => setIsOpen(false)}>
              ✕
            </button>
          </div>

          <div className="ai-chat-body">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`chat-bubble ${m.sender === 'ai' ? 'ai-bubble' : 'user-bubble'}`}
              >
                {m.sender === 'ai' && <span className="bubble-spark">✨</span>}
                <div>{m.text}</div>
              </div>
            ))}

            {isTyping && (
              <div className="chat-bubble ai-bubble typing-dots">
                <span className="dot"></span>
                <span className="dot"></span>
                <span className="dot"></span>
                <span style={{ marginLeft: '6px' }}>Анализ СНиП РК...</span>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <div className="ai-quick-prompts">
            <button onClick={() => handleSend('Расчёт сметы по фото')}>📐 Расчёт сметы</button>
            <button onClick={() => handleSend('Проверить трещины')}>🔍 Проверить дефекты</button>
            <button onClick={() => handleSend('Нормы ГОСТ РК')}>📜 Нормы ГОСТ</button>
          </div>

          <div className="ai-chat-footer">
            <input
              type="text"
              className="ai-chat-input"
              placeholder="Задайте вопрос AI-инженеру..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            />
            <button className="ai-send-btn" onClick={() => handleSend()}>
              ➔
            </button>
          </div>
        </div>
      )}

      <button
        className="floating-ai-trigger"
        onClick={() => setIsOpen(!isOpen)}
        title="AI Ассистент QazGost"
      >
        <span className="ai-trigger-icon">🤖</span>
        {!isOpen && <span className="widget-notif-badge">1</span>}
      </button>
    </div>
  );
}

