"""
Speech-to-Text endpoint for CRM voice assistant.
Uses Google's free speech recognition API (no API key needed).
"""

import tempfile
import os
from fastapi import APIRouter, UploadFile, File
from fastapi.responses import JSONResponse
from loguru import logger

router = APIRouter(prefix="/speech", tags=["Speech"])


@router.post("/recognize")
async def recognize_speech(audio: UploadFile = File(...)):
    """
    Принимает аудио файл (webm/ogg/wav), возвращает распознанный текст.
    Использует Google Speech Recognition (бесплатно, без ключа).
    """
    try:
        import speech_recognition as sr
    except ImportError:
        return JSONResponse(
            status_code=500,
            content={"error": "speech_recognition не установлен. pip install SpeechRecognition pydub"}
        )

    # Сохраняем загруженный файл
    suffix = ".webm"
    if audio.filename:
        suffix = os.path.splitext(audio.filename)[1] or ".webm"

    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        content = await audio.read()
        tmp.write(content)
        tmp_path = tmp.name

    wav_path = tmp_path + ".wav"

    try:
        # Конвертируем в WAV через pydub/ffmpeg
        try:
            from pydub import AudioSegment
            audio_seg = AudioSegment.from_file(tmp_path)
            audio_seg = audio_seg.set_channels(1).set_frame_rate(16000)
            audio_seg.export(wav_path, format="wav")
        except Exception as e:
            logger.warning(f"pydub conversion failed: {e}, trying direct WAV")
            wav_path = tmp_path  # может уже WAV

        # Распознаём
        recognizer = sr.Recognizer()
        with sr.AudioFile(wav_path) as source:
            audio_data = recognizer.record(source)

        # Пробуем Google (бесплатный, без ключа)
        try:
            text = recognizer.recognize_google(audio_data, language="ru-RU")
            logger.info(f"🎤 Speech recognized: {text}")
            return {"text": text, "method": "google"}
        except sr.UnknownValueError:
            return {"text": "", "error": "Речь не распознана", "method": "google"}
        except sr.RequestError as e:
            logger.warning(f"Google STT failed: {e}")
            # Fallback: попробуем Vosk если установлен
            try:
                text = recognizer.recognize_vosk(audio_data, language="ru")
                return {"text": text, "method": "vosk"}
            except Exception:
                return {"text": "", "error": f"Сервис распознавания недоступен: {e}"}

    except Exception as e:
        logger.error(f"Speech recognition error: {e}")
        return JSONResponse(status_code=500, content={"error": str(e)})
    finally:
        try: os.unlink(tmp_path)
        except: pass
        try:
            if wav_path != tmp_path:
                os.unlink(wav_path)
        except: pass
