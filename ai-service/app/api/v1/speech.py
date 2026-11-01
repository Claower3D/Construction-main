"""
Speech-to-Text endpoint for CRM voice assistant.
Uses Google's free speech recognition API (no API key needed).
"""

import tempfile
import os
import re

from fastapi import APIRouter, UploadFile, File
from fastapi.concurrency import run_in_threadpool
from fastapi.responses import JSONResponse
from loguru import logger

from app.api.uploads import copy_upload_limited
from app.config import settings

ALLOWED_AUDIO_EXT = {".webm", ".ogg", ".oga", ".wav", ".mp3", ".m4a", ".mp4", ".aac", ".flac", ".opus"}

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

    # Сохраняем загруженный файл (с лимитом размера; расширение — только из белого списка,
    # чтобы ffmpeg не открыл, например, .m3u8-плейлист со ссылками на локальные файлы/URL)
    suffix = os.path.splitext(audio.filename or "")[1].lower()
    if not re.fullmatch(r"\.[a-z0-9]{1,5}", suffix or "") or suffix not in ALLOWED_AUDIO_EXT:
        suffix = ".webm"

    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp_path = tmp.name
        try:
            await copy_upload_limited(audio, tmp, settings.MAX_UPLOAD_AUDIO_SIZE, what="Аудиофайл")
        except Exception:
            tmp.close()
            os.unlink(tmp_path)
            raise

    wav_path = tmp_path + ".wav"

    try:
        # Конвертируем в WAV через pydub/ffmpeg (в threadpool — не блокируем event loop)
        def _to_wav() -> str:
            try:
                from pydub import AudioSegment
                fmt = suffix.lstrip(".") if suffix not in (".oga", ".opus") else "ogg"
                audio_seg = AudioSegment.from_file(tmp_path, format=fmt)
                audio_seg = audio_seg.set_channels(1).set_frame_rate(16000)
                audio_seg.export(wav_path, format="wav")
                return wav_path
            except Exception as e:
                logger.warning(f"pydub conversion failed: {e}, trying direct WAV")
                return tmp_path  # может уже WAV

        wav_path = await run_in_threadpool(_to_wav)

        # Распознаём
        recognizer = sr.Recognizer()

        def _record():
            with sr.AudioFile(wav_path) as source:
                return recognizer.record(source)

        try:
            audio_data = await run_in_threadpool(_record)
        except Exception as e:
            return JSONResponse(status_code=400, content={"error": f"Не удалось прочитать аудио: {type(e).__name__}"})

        # Пробуем Google (бесплатный, без ключа)
        try:
            text = await run_in_threadpool(recognizer.recognize_google, audio_data, language="ru-RU")
            logger.info(f"🎤 Speech recognized: {len(text)} chars")
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
