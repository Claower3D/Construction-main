"""
QazGost AI — поиск TTF-шрифта с кириллицей (для PDF-отчётов и подписей на изображениях).

Порядок поиска:
  1. settings.PDF_FONT_PATH (env PDF_FONT_PATH)
  2. системные пути DejaVu (пакет fonts-dejavu-core в Docker)
  3. fc-match DejaVuSans
  4. DejaVuSans из matplotlib (ставится вместе с ultralytics)
Если ничего не найдено — возвращается None, вызывающий код использует fallback и пишет warning.
"""

import os
import shutil
import subprocess
from functools import lru_cache
from typing import Optional

from loguru import logger

_SYSTEM_CANDIDATES = {
    False: [
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/usr/share/fonts/dejavu/DejaVuSans.ttf",
        "/usr/share/fonts/TTF/DejaVuSans.ttf",
        "/Library/Fonts/Arial Unicode.ttf",
        "C:/Windows/Fonts/arial.ttf",
    ],
    True: [
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        "/usr/share/fonts/dejavu/DejaVuSans-Bold.ttf",
        "/usr/share/fonts/TTF/DejaVuSans-Bold.ttf",
        "C:/Windows/Fonts/arialbd.ttf",
    ],
}


def _fc_match(bold: bool) -> Optional[str]:
    if not shutil.which("fc-match"):
        return None
    pattern = "DejaVuSans:bold" if bold else "DejaVuSans"
    try:
        out = subprocess.run(
            ["fc-match", "-f", "%{file}", pattern], capture_output=True, text=True, timeout=3
        ).stdout.strip()
        # fc-match always returns *something*; accept only fonts that are DejaVu
        if out and os.path.isfile(out) and "dejavu" in os.path.basename(out).lower():
            return out
    except Exception:
        pass
    return None


def _matplotlib_font(bold: bool) -> Optional[str]:
    try:
        import matplotlib  # noqa: F401
        from pathlib import Path

        p = Path(matplotlib.get_data_path()) / "fonts" / "ttf" / ("DejaVuSans-Bold.ttf" if bold else "DejaVuSans.ttf")
        return str(p) if p.is_file() else None
    except Exception:
        return None


@lru_cache(maxsize=4)
def find_cyrillic_font(bold: bool = False) -> Optional[str]:
    """Return a path to a TTF font that supports Cyrillic, or None."""
    from app.config import settings

    if settings.PDF_FONT_PATH and os.path.isfile(settings.PDF_FONT_PATH) and not bold:
        return settings.PDF_FONT_PATH
    for p in _SYSTEM_CANDIDATES[bold]:
        if os.path.isfile(p):
            return p
    for finder in (_fc_match, _matplotlib_font):
        p = finder(bold)
        if p:
            return p
    if bold:
        return find_cyrillic_font(False)
    logger.warning(
        "[Fonts] Не найден TTF-шрифт с кириллицей (DejaVuSans). Установите fonts-dejavu-core "
        "или задайте PDF_FONT_PATH — иначе кириллица в PDF не отобразится."
    )
    return None
