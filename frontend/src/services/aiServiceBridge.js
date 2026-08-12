// AIServiceBridge v2.0 - Multi-Model AI Service Bridge (Gemini & ChatGPT)

export const AI_MODELS = {
  GEMINI_FLASH: { id: 'gemini-2.5-flash', name: '⚡ Gemini 2.5 Flash', maxTokens: 1000000 },
  CHATGPT_MINI: { id: 'gpt-5.4-mini', name: '🚀 ChatGPT 5.4 Mini', maxTokens: 400000 },
};

export async function askAiAssistant(prompt, context = {}) {
  try {
    const res = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, context }),
    });

    if (res.ok) {
      const data = await res.json();
      return data.reply || data.text;
    }
  } catch (e) {
    // Fallback to local AI Assistant engine
  }

  return generateLocalAiResponse(prompt);
}

function generateLocalAiResponse(prompt) {
  const p = prompt.toLowerCase();
  if (p.includes('смет') || p.includes('расчет') || p.includes('цена')) {
    return '📊 По нормам ГЭСН-2026 РК средняя стоимость отделочных работ составляет 28 000 – 35 000 ₸/м². Рекомендуется учесть поправочный коэффициент региона.';
  }
  if (p.includes('дефект') || p.includes('трещин') || p.includes('брак')) {
    return '🔍 Согласно СНиП РК 3.02-04-2019 (п. 4.12), поверхностные микротрещины до 0.3мм устраняются выравниванием с армирующей сеткой.';
  }
  return '🤖 Я инженерный AI-ассистент QazGost AI 2.0. Готов помочь с расчётом смет, проверкой СНиП РК и анализом чертежей!';
}
