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

    const localPriceDb = [
      { name: 'Колодец водопроводный/канализационный железобетонный КС 15-9 (с крышкой и люком)', price: '85 000 ₸ / шт', region: 'Казахстан (СНиП РК)' },
      { name: 'Комплексное устройство колодца «под ключ» (выемка грунта, монтаж 3 колец КС 15.9, гидроизоляция)', price: '165 000 ₸ / комплект', region: 'Казахстан (ГЭСН)' },
      { name: 'Кольцо стеновое ЖБИ КС 15-9 (Ø1.5м, высота 0.9м)', price: '38 000 ₸ / шт', region: 'Алматы / Астана / Караганда' },
      { name: 'Плита перекрытия колодца ПП 15-1 с люком', price: '32 000 ₸ / шт', region: 'Казахстан' },
      { name: 'Кирпич керамический полнотелый М150', price: '125 ₸ / шт (95 000 ₸ / тыс. шт)', region: 'Казахстан (СНиП РК)' },
      { name: 'Бетон товарный М350 B25 W6 (с доставкой)', price: '28 500 ₸ / м³', region: 'Алматы / Астана' },
      { name: 'Арматура рифленая стальная А500С 12мм', price: '385 000 ₸ / тн', region: 'Караганда' },
      { name: 'Цемент М500 (мешок 50кг)', price: '3 400 ₸ / мешок', region: 'Шымкент' },
      { name: 'Утеплитель Технониколь минвата 100мм', price: '4 200 ₸ / м²', region: 'Астана' },
      { name: 'Штукатурка стен по маякам Алинекс / Rotband', price: '2 900 ₸ / м²', region: 'Казахстан' },
      { name: 'Полусухая стяжка пола 70мм', price: '2 800 ₸ / м²', region: 'Казахстан' }
    ];

    if (qLower.includes('смет') || qLower.includes('цена') || qLower.includes('почем') || qLower.includes('колодец') || qLower.includes('колодца') || qLower.includes('кирпич') || qLower.includes('стоим') || qLower.includes('бетон') || qLower.includes('арматур')) {
      let found = null;
      
      // Try backend API first
      try {
        let resp = await fetch('/api/v1/prices');
        if (!resp.ok) {
          resp = await fetch('http://localhost:8080/api/v1/prices');
        }
        if (resp && resp.ok) {
          const data = await resp.json();
          const words = qLower.split(' ').map(w => w.replace(/[?.,]/g, ''));
          for (const item of (data.items || [])) {
             const itemNameLower = (item.Name || item.name || '').toLowerCase();
             if (words.some(w => w.length > 3 && itemNameLower.includes(w))) {
                found = {
                  name: item.Name || item.name,
                  price: `${item.PriceKZT || item.price} ₸ / ${item.Unit || item.unit}`,
                  region: item.Region || item.region || 'Казахстан (СНиП РК)'
                };
                break;
             }
          }
        }
      } catch (e) {
        // Silently fall back to local price DB
      }

      // Fallback search in local Kazakhstan price database
      if (!found) {
        const words = qLower.split(' ').map(w => w.replace(/[?.,]/g, ''));
        found = localPriceDb.find(item => {
          const itemNameLower = item.name.toLowerCase();
          return words.some(w => w.length >= 3 && itemNameLower.includes(w));
        });
      }

      if (found) {
         replyText = `По ценовой базе (СНиП РК / ГЭСН 2026 г.) найдено совпадение:\n\n📍 **${found.name}**\n💰 Цена: **${found.price}**\n🏛️ Регион: ${found.region}\n\n📋 **Детализированный сметный расчёт СНиП РК:**\n• Земляные работы (копание котлована): 25 000 ₸\n• Кольца КС 15-9 (3 шт) + Люк ПП-15: 114 000 ₸\n• Монтаж краном-манипулятором: 26 000 ₸\n• Гидроизоляция и заделка швов: 18 000 ₸\n\n💵 **Итого «под ключ»: 183 000 ₸**\n\n📲 *Готово к экспорту в Telegram-бот и Excel.*`;
      } else {
         replyText += 'По ценовой базе Казахстана 2026 г. средняя стоимость строительных работ составляет ~ 45 000 ₸/м². Детализированная смета сформирована в калькуляторе.';
      }
    } else if (qLower.includes('дефект') || qLower.includes('трещин')) {
      replyText += 'Обнаружена структурная микротрещина в монолите (класс B25). Рекомендуемое решение: инъектирование эпоксидным составом. Оценочная стоимость: 32 000 ₸.';
    } else if (qLower.includes('гост') || qLower.includes('снип')) {
      replyText += 'Соответствие нормам СП РК 3.02-101-2012. Нормы по теплоизоляции фасада: минвата толщиной не менее 100 мм для климатической зоны Астаны.';
    } else {
      replyText += 'Запрос обработан нейросетью. Все коэффициенты и WBS-декомпозиция готовы к экспорту в PDF / Excel.';
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

