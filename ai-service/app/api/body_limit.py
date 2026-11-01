"""
QAZGOST AI — ограничение размера тела запроса (ASGI middleware).

FastAPI/Starlette разбирает multipart целиком ДО вызова обработчика (файлы спулятся на диск),
поэтому лимиты внутри эндпоинтов срабатывают поздно. Этот middleware:
  - отклоняет запрос с 413 по заголовку Content-Length сразу;
  - при chunked-передаче считает байты и прерывает чтение с 413.
Лимиты по префиксу пути — см. limit_for_path().
"""

from typing import Callable

from starlette.responses import JSONResponse
from starlette.types import ASGIApp, Message, Receive, Scope, Send

from app.config import settings

_MULTIPART_OVERHEAD = 1024 * 1024  # заголовки частей, поля формы


class BodyTooLarge(Exception):
    def __init__(self, limit: int):
        self.limit = limit


def limit_for_path(path: str) -> int:
    if path.startswith("/api/v1/lidar/"):
        return settings.MAX_UPLOAD_SIZE + _MULTIPART_OVERHEAD
    if path.startswith("/api/v1/analyze-3d"):
        return 15 * settings.MAX_UPLOAD_IMAGE_SIZE + _MULTIPART_OVERHEAD
    if path.startswith("/api/v1/speech/"):
        return settings.MAX_UPLOAD_AUDIO_SIZE + _MULTIPART_OVERHEAD
    if path.startswith("/api/v1/estimates"):
        return 5 * 1024 * 1024  # JSON со сметой и pipeline_response
    # изображения (/analyze, /defect-scan, /detect, /analyze/intent) и всё остальное
    return settings.MAX_UPLOAD_IMAGE_SIZE + _MULTIPART_OVERHEAD


def _too_large(limit: int) -> JSONResponse:
    return JSONResponse(
        status_code=413,
        content={"detail": f"Тело запроса слишком большое (максимум {limit // (1024 * 1024)}MB)"},
    )


class BodySizeLimitMiddleware:
    def __init__(self, app: ASGIApp, limit_fn: Callable[[str], int] = limit_for_path) -> None:
        self.app = app
        self.limit_fn = limit_fn

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http" or scope.get("method") in ("GET", "HEAD", "OPTIONS"):
            await self.app(scope, receive, send)
            return

        limit = self.limit_fn(scope.get("path", ""))
        for name, value in scope.get("headers", []):
            if name == b"content-length":
                try:
                    if int(value) > limit:
                        await _too_large(limit)(scope, receive, send)
                        return
                except ValueError:
                    await JSONResponse({"detail": "Invalid Content-Length"}, status_code=400)(scope, receive, send)
                    return

        received = 0

        async def limited_receive() -> Message:
            nonlocal received
            message = await receive()
            if message["type"] == "http.request":
                received += len(message.get("body", b""))
                if received > limit:
                    raise BodyTooLarge(limit)
            return message

        try:
            await self.app(scope, limited_receive, send)
        except BodyTooLarge as exc:
            # Если ответ ещё не начат — отдаём 413 (иначе соединение просто закроется)
            try:
                await _too_large(exc.limit)(scope, receive, send)
            except Exception:
                pass
