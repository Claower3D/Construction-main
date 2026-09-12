"""
Лёгкий сервер распознавания речи для CRM.
Запуск: python speech_server.py
Порт: 8002
"""
import io
import struct
import wave
import json
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.request import Request, urlopen
from urllib.error import URLError

GOOGLE_API_URL = "http://www.google.com/speech-api/v2/recognize?output=json&lang=ru-RU&key=AIzaSyBOti4mM-6x9WDnZIjIeyEU21OpBXqWBgw"

class SpeechHandler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200)
        self._cors()
        self.send_header('Content-Length', '0')
        self.end_headers()

    def do_POST(self):
        if self.path != '/recognize':
            self.send_response(404)
            self.end_headers()
            return

        content_length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(content_length)

        # Определяем content-type аудио
        ct = self.headers.get('Content-Type', '')

        try:
            if 'wav' in ct or body[:4] == b'RIFF':
                # WAV — отправляем как есть
                audio_data = body
                audio_ct = 'audio/l16; rate=16000'
                # Извлекаем PCM из WAV
                with io.BytesIO(body) as wf:
                    with wave.open(wf, 'rb') as w:
                        rate = w.getframerate()
                        frames = w.readframes(w.getnframes())
                audio_ct = f'audio/l16; rate={rate}'
                audio_data = frames
            else:
                # Попробуем как raw PCM 16-bit 16kHz
                audio_data = body
                audio_ct = 'audio/l16; rate=16000'

            # Отправляем в Google Speech API
            req = Request(GOOGLE_API_URL, data=audio_data)
            req.add_header('Content-Type', audio_ct)

            resp = urlopen(req, timeout=10)
            result = resp.read().decode('utf-8')

            # Google возвращает несколько JSON строк, парсим последнюю с результатом
            text = ''
            for line in result.strip().split('\n'):
                line = line.strip()
                if not line:
                    continue
                try:
                    obj = json.loads(line)
                    if 'result' in obj and obj['result']:
                        for r in obj['result']:
                            if 'alternative' in r and r['alternative']:
                                text = r['alternative'][0].get('transcript', '')
                                break
                except json.JSONDecodeError:
                    continue

            self._respond(200, {'text': text or '', 'ok': True})

        except URLError as e:
            # Google API недоступен — пробуем Vosk или возвращаем ошибку
            self._respond(200, {'text': '', 'error': f'Google Speech API недоступен: {e}', 'ok': False})
        except Exception as e:
            self._respond(200, {'text': '', 'error': str(e), 'ok': False})

    def _respond(self, code, data):
        body = json.dumps(data, ensure_ascii=False).encode('utf-8')
        self.send_response(code)
        self._cors()
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _cors(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')

    def log_message(self, format, *args):
        print(f"[SPEECH] {args[0]}")


if __name__ == '__main__':
    port = 8002
    server = HTTPServer(('0.0.0.0', port), SpeechHandler)
    print(f"[SPEECH] Speech server running on http://localhost:{port}")
    print(f"   POST /recognize - send WAV audio for recognition")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n[SPEECH] Server stopped")
