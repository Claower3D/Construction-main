"""
Pytest configuration for ai-service.

Тесты не должны менять файлы репозитория: SQLite со сметами (app/data/estimates.db отслеживается git)
перенаправляется во временный каталог ДО импорта приложения (settings читаются при импорте).
"""

import os
import sys
import tempfile

_TMP = tempfile.mkdtemp(prefix="qazgost_tests_")
os.environ.setdefault("ESTIMATES_DB_PATH", os.path.join(_TMP, "estimates.db"))
os.environ.setdefault("YOLO_CONFIG_DIR", os.path.join(_TMP, "ultralytics"))

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
