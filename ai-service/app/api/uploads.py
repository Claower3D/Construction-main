"""
QAZGOST AI — безопасное чтение загрузок.

- read_upload_limited(): читает UploadFile порциями и прерывает с 413, как только превышен лимит
  (файл целиком в память не попадает).
- decode_image(): декодирует изображение через PIL с проверкой формата (не картинка → 400)
  и лимита пикселей ДО декодирования растра (decompression bomb → 413).
"""

import io
import warnings
from typing import Optional, Tuple

import numpy as np
from fastapi import HTTPException, UploadFile
from PIL import Image

from app.config import settings

_CHUNK = 1024 * 1024

# Глобальный предохранитель PIL: всё, что больше, PIL сам откажется декодировать.
Image.MAX_IMAGE_PIXELS = settings.MAX_IMAGE_PIXELS


def _mb(n: int) -> str:
    return f"{n / (1024 * 1024):.0f}MB"


async def read_upload_limited(file: UploadFile, max_bytes: int, what: str = "Файл") -> bytes:
    """Read an UploadFile in chunks; raise 413 when it exceeds max_bytes, 400 when empty."""
    buf = io.BytesIO()
    total = 0
    while True:
        chunk = await file.read(_CHUNK)
        if not chunk:
            break
        total += len(chunk)
        if total > max_bytes:
            raise HTTPException(413, f"{what} слишком большой (максимум {_mb(max_bytes)})")
        buf.write(chunk)
    if total == 0:
        raise HTTPException(400, f"{what} пустой")
    return buf.getvalue()


async def copy_upload_limited(file: UploadFile, dst, max_bytes: int, what: str = "Файл") -> int:
    """Stream an UploadFile into an open binary file object with a size limit (413)."""
    total = 0
    while True:
        chunk = await file.read(_CHUNK)
        if not chunk:
            break
        total += len(chunk)
        if total > max_bytes:
            raise HTTPException(413, f"{what} слишком большой (максимум {_mb(max_bytes)})")
        dst.write(chunk)
    if total == 0:
        raise HTTPException(400, f"{what} пустой")
    return total


def decode_image(contents: bytes, max_side: Optional[int] = None) -> Image.Image:
    """Decode bytes to an RGB PIL image (see decode_image_with_size)."""
    return decode_image_with_size(contents, max_side=max_side)[0]


def decode_image_with_size(contents: bytes, max_side: Optional[int] = None) -> Tuple[Image.Image, Tuple[int, int]]:
    """
    Decode bytes to an RGB PIL image and return it with the ORIGINAL (width, height).

    400 — не изображение / битый файл; 413 — слишком много пикселей.
    If max_side is given, the image is downscaled so that its longest side <= max_side.
    """
    try:
        with warnings.catch_warnings():
            warnings.simplefilter("error", Image.DecompressionBombWarning)
            img = Image.open(io.BytesIO(contents))
            w, h = img.size  # header only, raster is not decoded yet
            if w <= 0 or h <= 0:
                raise HTTPException(400, "Некорректный размер изображения")
            if w * h > settings.MAX_IMAGE_PIXELS:
                raise HTTPException(
                    413,
                    f"Слишком большое разрешение {w}x{h} (максимум {settings.MAX_IMAGE_PIXELS:,} пикселей)",
                )
            if img.format not in ("JPEG", "PNG", "WEBP", "BMP", "MPO", "TIFF", "HEIF", "AVIF"):
                raise HTTPException(415, f"Неподдерживаемый формат изображения: {img.format}")
            if max_side and max(w, h) > max_side:
                # draft() lets JPEG decode at reduced scale — cheap for big photos
                if img.format in ("JPEG", "MPO"):
                    img.draft("RGB", (max_side, max_side))
            img = img.convert("RGB")
    except HTTPException:
        raise
    except (Image.DecompressionBombError, Image.DecompressionBombWarning) as exc:
        raise HTTPException(413, f"Слишком большое разрешение изображения: {exc}")
    except MemoryError:
        raise HTTPException(413, "Изображение слишком большое для обработки")
    except Exception as exc:
        # UnidentifiedImageError, OSError (truncated), SyntaxError, ValueError, а также ImportError:
        # ultralytics подменяет Image.open и при неизвестном формате пытается импортировать pi_heif.
        raise HTTPException(400, "Файл не является изображением (JPEG/PNG/WebP/HEIC) или повреждён")

    if max_side and max(img.size) > max_side:
        scale = max_side / max(img.size)
        img = img.resize((max(1, int(img.width * scale)), max(1, int(img.height * scale))), Image.LANCZOS)
    return img, (w, h)


async def read_image_upload(file: UploadFile, max_side: Optional[int] = None) -> np.ndarray:
    """Read + validate + decode an uploaded image into an RGB numpy array."""
    contents = await read_upload_limited(file, settings.MAX_UPLOAD_IMAGE_SIZE, what="Изображение")
    return np.array(decode_image(contents, max_side=max_side))


async def read_image_upload_with_size(file: UploadFile, max_side: Optional[int] = None) -> Tuple[np.ndarray, Tuple[int, int]]:
    """Like read_image_upload, but also returns the original (width, height)."""
    contents = await read_upload_limited(file, settings.MAX_UPLOAD_IMAGE_SIZE, what="Изображение")
    img, orig = decode_image_with_size(contents, max_side=max_side)
    return np.array(img), orig
