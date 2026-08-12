// VoiceController v1.0 - Web Speech API & Voice Command Router

export function isSpeechSupported() {
  return typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);
}

export function createVoiceListener(onTranscript, onError) {
  if (!isSpeechSupported()) {
    console.warn('Speech Recognition is not supported in this browser.');
    return null;
  }

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = new SpeechRecognition();
  recognition.lang = 'ru-RU';
  recognition.continuous = false;
  recognition.interimResults = false;

  recognition.onresult = (event) => {
    const text = event.results[0][0].transcript;
    if (onTranscript) onTranscript(text);
  };

  recognition.onerror = (err) => {
    if (onError) onError(err);
  };

  return recognition;
}
