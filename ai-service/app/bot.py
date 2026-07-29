"""
QAZGOST AI Telegram Bot — Интерактивный строительный помощник

Функции:
- /start, /help — приветствие и справка
- /estimate — быстрая AI-оценка стоимости по описанию
- /balance — проверка баланса (через привязку к веб-аккаунту)
- /orders — список заказов пользователя
- /tariff — информация о текущем тарифе
- Фото → AI-анализ → смета (через ai-service endpoint)

Запуск: python -m app.bot
"""

import asyncio
import io
import os
import sys

# Load .env file
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

import json
import time
import hashlib
import hmac
import logging
from typing import Optional, Dict, Any

# Telegram Bot API via python-telegram-bot
try:
    from telegram import (
        Update, InlineKeyboardButton, InlineKeyboardMarkup,
        ReplyKeyboardMarkup, KeyboardButton, BotCommand,
        WebAppInfo, InputTextMessageContent,
        InlineQueryResultArticle
    )
    from telegram.ext import (
        Application, CommandHandler, MessageHandler,
        CallbackQueryHandler, InlineQueryHandler,
        filters, ContextTypes
    )
except ImportError:
    print("❌ python-telegram-bot не установлен!")
    print("   pip install python-telegram-bot>=20.0")
    sys.exit(1)

import httpx
from loguru import logger

# ── Config ──────────────────────────────────────────────────────────
BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "")
AI_SERVICE_URL = os.getenv("AI_SERVICE_URL", "http://localhost:8001")
BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:3001")
BOT_API_KEY = os.getenv("BOT_API_KEY", "")
WEB_APP_URL = os.getenv("WEB_APP_URL", "https://qazgost.kz")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "AIzaSyDGGVJ86sfm3guyfn1kgM82W_ZkgJbHh-Q")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")

# HTTP headers для backend API
def _bot_headers():
    h = {"Content-Type": "application/json"}
    if BOT_API_KEY:
        h["X-Bot-API-Key"] = BOT_API_KEY
    return h

# Локальное хранилище привязок tg_id → web_user
USER_DB_FILE = os.path.join(os.path.dirname(__file__), "..", "data", "tg_users.json")

# ── Категории работ ────────────────────────────────────────────────
CATEGORIES = {
    "foundation": {"icon": "🏗️", "name": "Фундамент", "keywords": ["фундамент", "основание", "котлован"]},
    "walls":      {"icon": "🧱", "name": "Стены",     "keywords": ["стен", "кладк", "блок", "кирпич"]},
    "roof":       {"icon": "🏠", "name": "Кровля",    "keywords": ["крыш", "кровл", "скат"]},
    "floor":      {"icon": "🪨", "name": "Полы",      "keywords": ["пол", "стяжк", "плитк"]},
    "plumbing":   {"icon": "🚿", "name": "Сантехника", "keywords": ["ванн", "санузел", "труб", "сантехн"]},
    "electric":   {"icon": "⚡", "name": "Электрика",  "keywords": ["электр", "провод", "розетк"]},
    "renovation": {"icon": "🔧", "name": "Ремонт",    "keywords": ["ремонт", "отделк", "штукатур", "обо"]},
}

# ── User DB helpers ─────────────────────────────────────────────────
def _load_users() -> Dict:
    try:
        if os.path.exists(USER_DB_FILE):
            with open(USER_DB_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
    except Exception as e:
        logger.debug(f"Failed to load user DB: {e}")
    return {}

def _save_users(data: Dict):
    os.makedirs(os.path.dirname(USER_DB_FILE), exist_ok=True)
    with open(USER_DB_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

def _get_user(tg_id: int) -> Optional[Dict]:
    users = _load_users()
    return users.get(str(tg_id))

def _save_user(tg_id: int, data: Dict):
    users = _load_users()
    users[str(tg_id)] = data
    _save_users(users)


# ══════════════════════════════════════════════════════════════════
# COMMAND HANDLERS
# ══════════════════════════════════════════════════════════════════

async def cmd_start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Приветствие при /start."""
    user = update.effective_user
    name = user.first_name or "Пользователь"

    # Сохраняем базовую инфу
    _save_user(user.id, {
        "tg_id": user.id,
        "name": user.full_name,
        "username": user.username or "",
        "first_seen": time.strftime("%Y-%m-%d %H:%M:%S"),
        "last_active": time.strftime("%Y-%m-%d %H:%M:%S"),
    })

    keyboard = [
        [KeyboardButton("📸 Оценка по фото"), KeyboardButton("📝 Оценка по описанию")],
        [KeyboardButton("💰 Баланс"), KeyboardButton("📋 Мои заказы")],
        [KeyboardButton("📊 Тариф"), KeyboardButton("❓ Помощь")],
    ]

    await update.message.reply_text(
        f"🏗️ *Привет, {name}!*\n\n"
        f"Я — *QazGost AI Bot*, строительный помощник.\n\n"
        f"Что я умею:\n"
        f"📸 Отправь фото объекта — я рассчитаю смету\n"
        f"📝 Опиши работу — я подберу материалы и цены\n"
        f"💰 Проверю баланс и тариф\n"
        f"📋 Покажу твои заказы\n\n"
        f"🔗 [Открыть веб-платформу]({WEB_APP_URL})",
        parse_mode="Markdown",
        reply_markup=ReplyKeyboardMarkup(keyboard, resize_keyboard=True),
    )


async def cmd_help(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Справка /help."""
    await update.message.reply_text(
        "📖 *Справка QazGost AI Bot*\n\n"
        "*Команды:*\n"
        "/start — Главное меню\n"
        "/estimate — Быстрая оценка по описанию\n"
        "/balance — Проверка баланса\n"
        "/orders — Мои заказы\n"
        "/tariff — Информация о тарифе\n"
        "/link — Привязать веб-аккаунт\n\n"
        "*Как получить смету:*\n"
        "1️⃣ Отправь 📸 фото строительного объекта\n"
        "2️⃣ Добавь описание (площадь, тип работ)\n"
        "3️⃣ AI проанализирует и выдаст смету\n\n"
        "*Пример описания:*\n"
        "_Ванная 3×4 м, замена плитки и сантехники, Алматы_\n\n"
        "💡 Чем подробнее описание — тем точнее расчёт!",
        parse_mode="Markdown",
    )


async def cmd_estimate(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Быстрая оценка по описанию /estimate <описание>."""
    text = " ".join(context.args) if context.args else ""

    if not text:
        await update.message.reply_text(
            "📝 *Оценка по описанию*\n\n"
            "Напишите описание работ после команды:\n"
            "`/estimate Ванная 3x4 м, замена плитки, Алматы`\n\n"
            "Или просто отправьте текст — я пойму!",
            parse_mode="Markdown",
        )
        return

    await _process_text_estimate(update, text)


async def cmd_balance(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """/balance — показать баланс."""
    tg_id = update.effective_user.id
    user_data = _get_user(tg_id)
    web_uid = user_data.get("web_uid") if user_data else None

    # Попробовать найти привязку через backend
    if not web_uid:
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                resp = await client.get(
                    f"{BACKEND_URL}/api/telegram/user/by-telegram/{tg_id}",
                    headers=_bot_headers()
                )
                if resp.status_code == 200 and resp.json().get("linked"):
                    web_uid = resp.json()["userId"]
                    # Кешируем
                    ud = user_data or {}
                    ud["web_uid"] = web_uid
                    _save_user(tg_id, ud)
        except Exception as e:
            logger.debug(f"Failed to lookup telegram user: {e}")

    if not web_uid:
        await update.message.reply_text(
            "💰 *Баланс*\n\n"
            "Аккаунт не привязан к веб-платформе.\n"
            "Используйте /link для привязки.\n\n"
            f"🔗 [Войти на платформе]({WEB_APP_URL})",
            parse_mode="Markdown",
        )
        return

    # Запрос баланса через backend API
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(
                f"{BACKEND_URL}/api/telegram/user/{web_uid}/balance",
                headers=_bot_headers()
            )
            if resp.status_code == 200:
                data = resp.json()
                balance = data.get("balance", 0)
                balance_usd = data.get("balanceUsd", 0)
                tariff = data.get("tariff", "FREE")
                text = f"💰 *Ваш баланс:*\n\n🇰🇿 {balance:,.0f} ₸"
                if balance_usd > 0:
                    text += f"\n🇺🇸 {balance_usd:,.2f} $"
                text += f"\n\n📊 Тариф: *{tariff}*"
                await update.message.reply_text(text, parse_mode="Markdown")
                return
    except Exception as e:
        logger.warning(f"Balance API failed: {e}")

    await update.message.reply_text(
        "💰 *Баланс*\n\n"
        "⚠️ Сервер временно недоступен.\n"
        f"Проверьте баланс на [веб-платформе]({WEB_APP_URL}).",
        parse_mode="Markdown",
    )


async def cmd_orders(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """/orders — список заказов."""
    tg_id = update.effective_user.id
    user_data = _get_user(tg_id)
    web_uid = user_data.get("web_uid") if user_data else None

    if not web_uid:
        await update.message.reply_text(
            "📋 *Мои заказы*\n\n"
            "Привяжите аккаунт через /link чтобы видеть заказы.\n"
            f"🔗 [Открыть платформу]({WEB_APP_URL})",
            parse_mode="Markdown",
        )
        return

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(
                f"{BACKEND_URL}/api/telegram/user/{web_uid}/orders",
                headers=_bot_headers()
            )
            if resp.status_code == 200:
                orders = resp.json().get("orders", [])
                if not orders:
                    await update.message.reply_text(
                        "📋 У вас пока нет заказов.\n"
                        f"[Создать смету]({WEB_APP_URL})",
                        parse_mode="Markdown",
                    )
                    return

                status_icons = {
                    "draft": "📝", "published": "📢", "pending": "⏳",
                    "assigned": "👷", "in_progress": "🔄", "completed": "✅",
                    "cancelled": "❌"
                }
                lines = ["📋 *Ваши заказы:*\n"]
                for i, order in enumerate(orders[:10], 1):
                    icon = status_icons.get(order.get("status", ""), "❓")
                    total = order.get("total", 0)
                    lines.append(
                        f"{i}. {icon} {order.get('title', 'Заказ')} — "
                        f"{total:,.0f} ₸"
                    )

                await update.message.reply_text(
                    "\n".join(lines), parse_mode="Markdown"
                )
                return
    except Exception as e:
        logger.warning(f"Orders API failed: {e}")

    await update.message.reply_text(
        "📋 *Заказы*\n\n⚠️ Сервер временно недоступен.",
        parse_mode="Markdown",
    )


async def cmd_tariff(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """/tariff — информация о тарифе."""
    keyboard = InlineKeyboardMarkup([
        [InlineKeyboardButton("🆓 Free", callback_data="tariff_free"),
         InlineKeyboardButton("⭐ Pro", callback_data="tariff_pro")],
        [InlineKeyboardButton("💎 Business", callback_data="tariff_business"),
         InlineKeyboardButton("🏢 Enterprise", callback_data="tariff_enterprise")],
    ])

    await update.message.reply_text(
        "📊 *Тарифы QazGost AI*\n\n"
        "🆓 *Free* — 3 сметы/мес, базовый анализ\n"
        "⭐ *Pro* — 50 смет/мес, AI-детекция, PDF\n"
        "💎 *Business* — ∞ смет, приоритет, API\n"
        "🏢 *Enterprise* — кастом, SLA, интеграция\n\n"
        "Нажмите кнопку для подробностей:",
        parse_mode="Markdown",
        reply_markup=keyboard,
    )


async def cmd_link(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """/link — привязка веб-аккаунта."""
    tg_id = update.effective_user.id
    args = context.args

    # Если передан код — верифицируем через backend
    if args and len(args) > 0:
        link_code = args[0].strip().upper()
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                resp = await client.post(
                    f"{BACKEND_URL}/api/telegram/link/verify",
                    headers=_bot_headers(),
                    json={
                        "linkCode": link_code,
                        "telegramId": tg_id,
                        "telegramUsername": update.effective_user.username or ""
                    }
                )
                data = resp.json()
                if data.get("success"):
                    # Сохраняем привязку локально
                    user_data = _get_user(tg_id) or {}
                    user_data["web_uid"] = data["userId"]
                    user_data["linked_at"] = time.strftime("%Y-%m-%d %H:%M:%S")
                    _save_user(tg_id, user_data)

                    await update.message.reply_text(
                        "✅ *Аккаунт привязан!*\n\n"
                        "Теперь доступны:\n"
                        "💰 /balance — Баланс\n"
                        "📋 /orders — Заказы\n"
                        "🔔 Push-уведомления",
                        parse_mode="Markdown",
                    )
                    return
                else:
                    await update.message.reply_text(
                        f"❌ {data.get('error', 'Ошибка привязки')}",
                    )
                    return
        except Exception as e:
            logger.warning(f"Link verify failed: {e}")
            await update.message.reply_text("⚠️ Сервер недоступен. Попробуйте позже.")
            return

    # Без аргументов — показываем инструкцию
    await update.message.reply_text(
        "🔗 *Привязка аккаунта*\n\n"
        "1️⃣ Откройте [QazGost AI]({url})\n"
        "2️⃣ Войдите → Профиль → Telegram\n"
        "3️⃣ Нажмите \"Получить код\"\n"
        "4️⃣ Введите: `/link ВАШЕ_КОД`\n\n"
        "_Пример:_ `/link A1B2C3D4`".format(url=WEB_APP_URL),
        parse_mode="Markdown",
    )


# ══════════════════════════════════════════════════════════════════
# PHOTO HANDLER — AI Analysis
# ══════════════════════════════════════════════════════════════════

async def handle_photo(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Обработка фото: отправка на AI-сервер для анализа."""
    msg = update.message
    caption = msg.caption or ""

    # Если ждём дополнительное фото для пересчёта
    pending_desc = context.user_data.get("pending_photo_description", "")
    if pending_desc and not caption:
        caption = pending_desc
        context.user_data.pop("pending_photo_description", None)

    # Берём фото лучшего качества
    photo = msg.photo[-1]  # max resolution
    processing_msg = await msg.reply_text(
        "🔄 *Анализирую фото...*\n\n"
        "⏳ AI распознаёт объекты на фото\n"
        "📐 Определяю размеры и материалы\n"
        "💰 Рассчитываю стоимость",
        parse_mode="Markdown",
    )

    try:
        # Скачиваем фото
        file = await photo.get_file()
        photo_bytes = await file.download_as_bytearray()

        # Определяем категорию из подписи
        category = _detect_category(caption)

        # Отправляем на AI-сервер
        async with httpx.AsyncClient(timeout=60) as client:
            files = {"file": ("photo.jpg", bytes(photo_bytes), "image/jpeg")}
            data = {
                "description": caption or "Строительный объект",
                "category": category,
                "region": "almaty",
            }

            resp = await client.post(
                f"{AI_SERVICE_URL}/api/v1/analyze/intent",
                files=files,
                data=data,
            )

            if resp.status_code == 200:
                result = resp.json()
                response_text = _format_estimate_result(result, caption)

                # Сохраняем контекст для пересчёта и PDF
                context.user_data["last_estimate"] = {
                    "result": result,
                    "description": caption,
                    "category": category,
                    "source": "photo",
                    "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
                }

                # Кнопки действий
                keyboard = InlineKeyboardMarkup([
                    [InlineKeyboardButton("📄 Скачать PDF", callback_data="pdf_estimate"),
                     InlineKeyboardButton("🔄 Пересчитать", callback_data="recalculate")],
                    [InlineKeyboardButton("📸 Ещё фото", callback_data="add_photo"),
                     InlineKeyboardButton("💾 Сохранить", callback_data="save_estimate")],
                    [InlineKeyboardButton("🌐 Открыть на сайте", url=WEB_APP_URL)],
                ])

                await processing_msg.edit_text(
                    response_text, parse_mode="Markdown", reply_markup=keyboard
                )

                # Обновляем активность пользователя
                user_data = _get_user(update.effective_user.id) or {}
                user_data["last_active"] = time.strftime("%Y-%m-%d %H:%M:%S")
                user_data["estimates_count"] = user_data.get("estimates_count", 0) + 1
                _save_user(update.effective_user.id, user_data)
            else:
                await processing_msg.edit_text(
                    f"⚠️ AI-сервер вернул ошибку ({resp.status_code}).\n"
                    "Попробуйте позже или добавьте описание к фото.",
                )

    except httpx.ConnectError:
        await processing_msg.edit_text(
            "🔴 *AI-сервер недоступен*\n\n"
            "Сервер распознавания выключен.\n"
            f"Воспользуйтесь [веб-платформой]({WEB_APP_URL}).",
            parse_mode="Markdown",
        )
    except Exception as e:
        logger.error(f"Photo analysis error: {e}")
        await processing_msg.edit_text(
            f"❌ Ошибка при анализе: {str(e)[:100]}\n"
            "Попробуйте другое фото или добавьте описание."
        )


# ══════════════════════════════════════════════════════════════════
# TEXT MESSAGE HANDLER
# ══════════════════════════════════════════════════════════════════

async def handle_text(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Обработка текстовых сообщений."""
    text = update.message.text.strip()

    # Обработка кнопок клавиатуры
    if text == "📸 Оценка по фото":
        await update.message.reply_text(
            "📸 *Оценка по фото*\n\n"
            "Отправьте фото строительного объекта.\n"
            "Добавьте подпись с описанием для точности:\n\n"
            "_Пример: Кирпичная стена 5×3 м, нужна штукатурка_",
            parse_mode="Markdown",
        )
        return

    if text == "📝 Оценка по описанию":
        await update.message.reply_text(
            "📝 *Оценка по описанию*\n\n"
            "Опишите объект и работы:\n\n"
            "✅ Укажите: тип работ, размеры, город\n"
            "_Пример: Ремонт ванной 3×4 м, замена плитки, Алматы_",
            parse_mode="Markdown",
        )
        return

    if text == "💰 Баланс":
        return await cmd_balance(update, context)

    if text == "📋 Мои заказы":
        return await cmd_orders(update, context)

    if text == "📊 Тариф":
        return await cmd_tariff(update, context)

    if text == "❓ Помощь":
        return await cmd_help(update, context)

    # ═══ ПРИОРИТЕТ 1: ВСЕГДА сначала Gemini AI ═══
    # Gemini понимает: человеческую речь, опечатки, сленг, логику диалога.
    # Он сам решит — дать ответ или предложить расчёт сметы.
    gemini_reply = await _ask_gemini_chat(text, update.effective_user.first_name, update.effective_user.id)
    if gemini_reply:
        keyboard = InlineKeyboardMarkup([
            [InlineKeyboardButton("📸 Оценка по фото", callback_data="add_photo"),
             InlineKeyboardButton("📝 Оценка по описанию", callback_data="recalculate")],
            [InlineKeyboardButton("🌐 Открыть платформу", url=WEB_APP_URL)],
        ])
        await update.message.reply_text(
            gemini_reply,
            parse_mode="Markdown",
            reply_markup=keyboard,
        )
        return

    # ═══ ПРИОРИТЕТ 2: Если Gemini недоступен → rule-based fallback ═══
    # Пробуем распознать как описание для сметы
    if len(text) > 10 and any(
        kw in text.lower()
        for cat in CATEGORIES.values()
        for kw in cat["keywords"]
    ):
        await _process_text_estimate(update, text)
    else:
        await update.message.reply_text(
            "🤖 Не совсем понял. Попробуйте:\n\n"
            "• Отправить 📸 *фото* объекта\n"
            "• Написать *описание работ*:\n"
            "  _Ремонт кухни 12 м², штукатурка + плитка_\n"
            "• Использовать /help для справки",
            parse_mode="Markdown",
        )


# ══════════════════════════════════════════════════════════════════
# CALLBACK QUERY HANDLER
# ══════════════════════════════════════════════════════════════════

async def handle_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Обработка inline-кнопок."""
    query = update.callback_query
    await query.answer()

    data = query.data

    # ── Тарифы ──
    if data.startswith("tariff_") and data != "tariff_back":
        tariff = data.replace("tariff_", "")
        tariffs = {
            "free": (
                "🆓 *Тариф Free*\n\n"
                "• 3 AI-сметы в месяц\n"
                "• Базовый анализ фото\n"
                "• Расчёт по Казахстанским нормам\n"
                "• Цена: *Бесплатно*"
            ),
            "pro": (
                "⭐ *Тариф Pro*\n\n"
                "• 50 AI-смет в месяц\n"
                "• RF-DETR + SAM детекция\n"
                "• PDF экспорт смет\n"
                "• Приоритетная обработка\n"
                "• Цена: *4 990 ₸/мес*"
            ),
            "business": (
                "💎 *Тариф Business*\n\n"
                "• Безлимит смет\n"
                "• API доступ\n"
                "• Мультипроект\n"
                "• Telegram-уведомления\n"
                "• Цена: *14 990 ₸/мес*"
            ),
            "enterprise": (
                "🏢 *Тариф Enterprise*\n\n"
                "• Всё из Business\n"
                "• Выделенный сервер\n"
                "• SLA 99.9%\n"
                "• Интеграция с 1С/SAP\n"
                "• Цена: *По запросу*"
            ),
        }

        keyboard = InlineKeyboardMarkup([
            [InlineKeyboardButton(
                "💳 Подключить", url=f"{WEB_APP_URL}/#tariffs"
            )],
            [InlineKeyboardButton("« Назад", callback_data="tariff_back")],
        ])

        await query.edit_message_text(
            tariffs.get(tariff, "Тариф не найден"),
            parse_mode="Markdown",
            reply_markup=keyboard,
        )

    elif data == "tariff_back":
        await cmd_tariff(update, context)

    # ── PDF генерация ──
    elif data == "pdf_estimate":
        last = context.user_data.get("last_estimate")
        if not last:
            await query.answer("Нет данных для PDF. Сделайте новую оценку.", show_alert=True)
            return

        await query.answer("📄 Генерирую PDF...")
        pdf_bytes = _generate_pdf(last)

        await query.message.reply_document(
            document=pdf_bytes,
            filename=f"smeta_qazgost_{time.strftime('%Y%m%d_%H%M')}.pdf",
            caption="📄 Смета QazGost AI\n"
                    f"Категория: {last.get('category', 'renovation')}\n"
                    f"Дата: {last.get('timestamp', '')}",
        )

    # ── Пересчёт ──
    elif data == "recalculate":
        last = context.user_data.get("last_estimate")
        if not last:
            await query.answer("Нет данных для пересчёта.", show_alert=True)
            return

        await query.answer("🔄 Пересчитываю...")
        desc = last.get("description", "")
        category = last.get("category", "renovation")

        # Пересчитываем с вариацией
        try:
            async with httpx.AsyncClient(timeout=30) as client:
                resp = await client.post(
                    f"{AI_SERVICE_URL}/api/v1/analyze/intent",
                    json={
                        "description": desc + " (пересчёт, уточнённая цена)",
                        "category": category,
                        "region": "almaty",
                        "source": "telegram_recalculate",
                    },
                )
                if resp.status_code == 200:
                    result = resp.json()
                    context.user_data["last_estimate"]["result"] = result
                    text = _format_estimate_result(result, desc)
                    text = "🔄 *Пересчёт*\n" + text

                    keyboard = InlineKeyboardMarkup([
                        [InlineKeyboardButton("📄 Скачать PDF", callback_data="pdf_estimate"),
                         InlineKeyboardButton("🔄 Ещё раз", callback_data="recalculate")],
                        [InlineKeyboardButton("💾 Сохранить", callback_data="save_estimate")],
                    ])
                    await query.edit_message_text(text, parse_mode="Markdown", reply_markup=keyboard)
                    return
        except Exception as e:
            logger.warning(f"Recalculate error: {e}")

        # Fallback-пересчёт
        fallback = _fallback_estimate(desc, category)
        await query.edit_message_text("🔄 " + fallback, parse_mode="Markdown")

    # ── Добавить фото ──
    elif data == "add_photo":
        last = context.user_data.get("last_estimate", {})
        desc = last.get("description", "")
        context.user_data["pending_photo_description"] = desc
        await query.answer()
        await query.message.reply_text(
            "📸 *Отправьте фото*\n\n"
            "Я добавлю его к текущей оценке и пересчитаю.\n"
            f"Описание: _{desc[:60]}{'...' if len(desc) > 60 else ''}_",
            parse_mode="Markdown",
        )

    # ── Сохранить смету ──
    elif data == "save_estimate":
        last = context.user_data.get("last_estimate")
        if not last:
            await query.answer("Нет данных для сохранения.", show_alert=True)
            return

        tg_id = update.effective_user.id
        user_data = _get_user(tg_id) or {}
        web_uid = user_data.get("web_uid")

        if not web_uid:
            await query.answer("Привяжите аккаунт через /link для сохранения.", show_alert=True)
            return

        # Отправляем смету в backend
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                resp = await client.post(
                    f"{BACKEND_URL}/api/telegram/estimate/save",
                    headers=_bot_headers(),
                    json={
                        "userId": web_uid,
                        "description": last.get("description", ""),
                        "category": last.get("category", ""),
                        "result": last.get("result", {}),
                    }
                )
                if resp.status_code == 200:
                    await query.answer("✅ Смета сохранена в профиле!", show_alert=True)
                else:
                    await query.answer("⚠️ Не удалось сохранить.", show_alert=True)
        except Exception as e:
            logger.warning(f"Save estimate failed: {e}")
            await query.answer("⚠️ Сервер недоступен.", show_alert=True)

    # ── Выбор города ──
    elif data.startswith("city_"):
        city = data.replace("city_", "")
        context.user_data["selected_city"] = city
        city_names = {
            "almaty": "Алматы", "astana": "Астана", "shymkent": "Шымкент",
            "karaganda": "Караганда", "aktobe": "Актобе", "other": "Другой"
        }
        await query.answer(f"📍 Город: {city_names.get(city, city)}")
        await query.edit_message_text(
            f"📍 Город выбран: *{city_names.get(city, city)}*\n\n"
            "Теперь отправьте фото или описание работ.",
            parse_mode="Markdown",
        )


# ══════════════════════════════════════════════════════════════════
# HELPERS
# ══════════════════════════════════════════════════════════════════

def _detect_category(text: str) -> str:
    """Определить категорию работ по тексту."""
    if not text:
        return "renovation"
    lower = text.lower()
    for cat_id, cat in CATEGORIES.items():
        if any(kw in lower for kw in cat["keywords"]):
            return cat_id
    return "renovation"


async def _process_text_estimate(update: Update, text: str):
    """Обработка текстового описания для расчёта сметы."""
    category = _detect_category(text)
    cat_info = CATEGORIES.get(category, CATEGORIES["renovation"])

    processing_msg = await update.message.reply_text(
        f"🤖 *Анализирую описание...*\n\n"
        f"Категория: {cat_info['icon']} {cat_info['name']}\n"
        f"📝 _{text[:80]}{'...' if len(text) > 80 else ''}_",
        parse_mode="Markdown",
    )

    try:
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(
                f"{AI_SERVICE_URL}/api/v1/analyze/intent",
                json={
                    "description": text,
                    "category": category,
                    "region": context.user_data.get("selected_city", "almaty") if hasattr(context, 'user_data') else "almaty",
                    "source": "telegram",
                },
            )

            if resp.status_code == 200:
                result = resp.json()
                response_text = _format_estimate_result(result, text)

                # Сохраняем контекст
                if hasattr(context, 'user_data'):
                    context.user_data["last_estimate"] = {
                        "result": result,
                        "description": text,
                        "category": category,
                        "source": "text",
                        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
                    }

                keyboard = InlineKeyboardMarkup([
                    [InlineKeyboardButton("📄 Скачать PDF", callback_data="pdf_estimate"),
                     InlineKeyboardButton("🔄 Пересчитать", callback_data="recalculate")],
                    [InlineKeyboardButton("📸 Добавить фото", callback_data="add_photo"),
                     InlineKeyboardButton("💾 Сохранить", callback_data="save_estimate")],
                    [InlineKeyboardButton("🌐 Детали на сайте", url=WEB_APP_URL)],
                ])

                await processing_msg.edit_text(
                    response_text, parse_mode="Markdown", reply_markup=keyboard
                )
                return

    except httpx.ConnectError:
        pass
    except Exception as e:
        logger.warning(f"Text estimate error: {e}")

    # Fallback: локальный расчёт при недоступности сервера
    fallback = _fallback_estimate(text, category)
    keyboard = InlineKeyboardMarkup([
        [InlineKeyboardButton("📸 Добавить фото для точности", callback_data="add_photo")],
        [InlineKeyboardButton("🌐 Точный расчёт на сайте", url=WEB_APP_URL)],
    ])
    await processing_msg.edit_text(fallback, parse_mode="Markdown", reply_markup=keyboard)


def _format_estimate_result(result: Dict[str, Any], description: str) -> str:
    """Форматирование результата AI-анализа для Telegram."""
    lines = ["✅ *Результат AI-анализа*\n"]

    # Описание
    if description:
        lines.append(f"📝 _{description[:80]}_\n")

    # Обнаруженные объекты
    detections = result.get("detections", [])
    if detections:
        lines.append(f"🔍 *Обнаружено объектов:* {len(detections)}")
        for det in detections[:5]:
            conf = det.get("confidence", 0)
            label = det.get("label", det.get("class_name", "Объект"))
            lines.append(f"  • {label} ({conf:.0%})")
        lines.append("")

    # Смета
    estimate_items = result.get("estimate_items", [])
    estimate_total = result.get("estimate_total", 0)

    if estimate_items:
        lines.append("💰 *Смета:*")
        mat_total = 0
        work_total = 0
        for item in estimate_items[:12]:
            category = item.get("category", "")
            name = item.get("name", "")
            total = item.get("total", 0)
            if "материал" in category.lower() or "material" in category.lower():
                mat_total += total
            else:
                work_total += total
            lines.append(f"  • {name}: *{total:,.0f} ₸*")

        lines.append("")
        if mat_total:
            lines.append(f"🧱 Материалы: *{mat_total:,.0f} ₸*")
        if work_total:
            lines.append(f"🔧 Работы: *{work_total:,.0f} ₸*")

    if estimate_total:
        lines.append(f"\n💵 *ИТОГО: {estimate_total:,.0f} ₸*")

    # Уверенность
    confidence = result.get("confidence", 0)
    if confidence:
        level = "🟢 Высокая" if confidence > 0.7 else "🟡 Средняя" if confidence > 0.4 else "🔴 Низкая"
        lines.append(f"\n📊 Точность: {level} ({confidence:.0%})")

    # Регион
    region = result.get("region", "")
    if region:
        lines.append(f"📍 Регион: {region}")

    return "\n".join(lines)


def _fallback_estimate(text: str, category: str) -> str:
    """Упрощённый расчёт при недоступности AI-сервера."""
    import re

    # Извлекаем площадь из текста
    area_match = re.search(r'(\d+)\s*[×xх]\s*(\d+)', text)
    area_m2 = re.search(r'(\d+)\s*м[²2]', text)

    area = 0
    if area_match:
        area = int(area_match.group(1)) * int(area_match.group(2))
    elif area_m2:
        area = int(area_m2.group(1))
    else:
        area = 20  # default

    # Примерные расценки за м² по категориям (₸)
    PRICES = {
        "foundation":  {"mat": 15000, "work": 8000},
        "walls":       {"mat": 8000,  "work": 5000},
        "roof":        {"mat": 12000, "work": 7000},
        "floor":       {"mat": 6000,  "work": 4000},
        "plumbing":    {"mat": 10000, "work": 8000},
        "electric":    {"mat": 5000,  "work": 6000},
        "renovation":  {"mat": 7000,  "work": 5500},
    }

    prices = PRICES.get(category, PRICES["renovation"])
    cat_info = CATEGORIES.get(category, CATEGORIES["renovation"])
    mat_total = area * prices["mat"]
    work_total = area * prices["work"]
    grand = mat_total + work_total

    return (
        f"📊 *Предварительная оценка* (оффлайн)\n\n"
        f"{cat_info['icon']} Категория: {cat_info['name']}\n"
        f"📐 Площадь: ~{area} м²\n\n"
        f"🧱 Материалы: ~*{mat_total:,.0f} ₸*\n"
        f"🔧 Работы: ~*{work_total:,.0f} ₸*\n"
        f"💵 *ИТОГО: ~{grand:,.0f} ₸*\n\n"
        f"⚠️ _Оценка приблизительная (AI-сервер недоступен)._\n"
        f"_Для точного расчёта используйте [платформу]({WEB_APP_URL})._"
    )


# ══════════════════════════════════════════════════════════════════
# GEMINI SMART CHAT — AI-powered responses
# ══════════════════════════════════════════════════════════════════

GEMINI_SYSTEM_PROMPT = """Ты — QAZGOST AI, умный AI-ассистент строительной платформы Казахстана.
Ты общаешься как живой, ПОНИМАЮЩИЙ собеседник — не как робот.

## ТВОЯ ЛИЧНОСТЬ:
- Имя: QazGost AI
- Роль: Старший AI-инженер по строительству
- Характер: Дружелюбный, профессиональный, с чувством юмора
- Языки: Русский (основной), Қазақша, English
- На вопрос «Как дела?» → отвечай живо: «Отлично! Анализирую сметы, помогаю строить Казахстан! А у вас как?»
- На вопрос «Кто ты?» → «Я QazGost AI — ваш умный помощник в строительстве. Знаю всё о ценах, материалах и нормативах РК!»
- На вопрос «Кто тебя создал?» → «Меня создала команда QazGost — казахстанский стартап, который делает строительство прозрачным и доступным с помощью AI.»

## КЛЮЧЕВОЕ: ПОНИМАНИЕ ЧЕЛОВЕЧЕСКОЙ РЕЧИ
Ты ОБЯЗАН понимать:
- Разговорный язык, сленг, сокращения («чё», «ну», «норм», «покажь», «хз», «чёт»)
- Опечатки и ошибки в словах («смтеа» → смета, «кашлёк» → кошелёк, «фундамнт» → фундамент)
- Неполные фразы («а цены?» → пользователь спрашивает о ценах в контексте предыдущего разговора)
- Логику диалога: если спросили «как создать смету?», а потом «а дальше?» — продолжи объяснение
- Эмоции: расстроен («ничего не работает блин!») — будь эмпатичным, помоги
- Контекст: «покажи» без уточнения — посмотри предыдущие сообщения
- Казахский язык: «Сәлем!», «Рақмет!», «Жұмыс қалай?»
- Смешанный язык: «Привет, маган смета керек» (рус+каз)

## О ПЛАТФОРМЕ:
QAZGOST AI — строительная AI-платформа Казахстана:
• 📸 AI-оценка строительных смет по фотографии (RF-DETR + Gemini Vision)
• 👷 Маркетплейс подрядчиков с рейтингом и верификацией eGov
• 🚜 Маркетплейс строительной техники (аренда)
• 💳 Кошелёк с безопасными платежами через эскроу (Stripe, крипто)
• 📋 Управление заказами и контрактами
• 📐 Расчёт объёмов грунта/котлованов по фото
• 🏗️ VIP-модуль для крупных проектов (WBS, тендеры, контроль)
• ⚙️ Каталог инженерных решений
• 📊 Аналитика и KPI
• 🗺️ Карта подрядчиков по городам
• 📅 Календарь строительных работ
• ⚖️ Система разрешения споров
• ✅ Трекер задач

## РАБОЧИЕ ПРОЦЕССЫ:
1. Создать смету: Опишите работы или отправьте фото → AI проанализирует → получите PDF-смету
2. Найти подрядчика: Создайте заказ → подрядчики откликнутся → выберите лучшего
3. Пополнить кошелёк: /wallet → Stripe или крипто → готово
4. Арендовать технику: Маркетплейс техники → фильтры → бронь
5. Верифицировать аккаунт: Профиль → eGov → ЭЦП/SMS

## КОМАНДЫ БОТА:
/start — главное меню
/estimate <описание> — расчёт сметы
/balance — баланс кошелька
/orders — мои заказы
/tariff — тарифы
/link — привязать веб-аккаунт
/city — выбрать город
/webapp — открыть мини-приложение
📸 Отправить фото — AI-анализ объекта

## СТРОИТЕЛЬНАЯ ЭКСПЕРТИЗА (Казахстан 2025):
Работы:
• Фундамент: 15 000 – 25 000 ₸/м²
• Кладка кирпича: 8 000 – 14 000 ₸/м²
• Штукатурка: 3 500 – 6 000 ₸/м²
• Электрика: 4 000 – 8 000 ₸/точка
• Сантехника: 5 000 – 12 000 ₸/точка
• Покраска: 1 500 – 3 000 ₸/м²
• Укладка плитки: 4 000 – 7 000 ₸/м²

Материалы:
• Кирпич М-150: 45–65 ₸/шт
• Цемент М-500: 2 800–3 500 ₸/мешок
• Бетон М-200: 28 000–35 000 ₸/м³
• Арматура d12: 350–450 ₸/м.п.
• Гипсокартон 12мм: 2 500–3 200 ₸/лист

Нормативы: СНиП РК, СП РК, ЕНиР, SnipRK.kz
Города: Алматы, Астана, Шымкент, Караганда, Актобе, Атырау

## ФОРМАТ ОТВЕТА:
1. Отвечай КРАТКО но ПОЛНО (3-8 предложений)
2. Форматируй в Telegram Markdown (*жирный*, _курсив_, `код`)
3. Цены — в тенге (₸)
4. Если не знаешь — честно скажи и предложи /help
5. Не придумывай функции которых нет
6. Будь дружелюбным, живым, конкретным
7. Если пользователь продолжает тему — НЕ повторяй то, что уже сказал
8. Если вопрос не о строительстве — ответь коротко и верни к теме"""


# Простой кэш для истории диалогов (tg_id → последние 5 сообщений)
_gemini_chat_history: Dict[int, list] = {}


async def _ask_gemini_chat(user_message: str, user_name: str = "", tg_id: int = 0) -> Optional[str]:
    """Спросить Gemini AI для умного ответа на произвольный вопрос."""
    if not GEMINI_API_KEY:
        return None

    try:
        # Собираем историю диалога (до 20 сообщений)
        history = _gemini_chat_history.get(tg_id, [])
        history.append({"role": "user", "text": user_message})
        if len(history) > 20:
            history = history[-20:]

        # Формируем контент (отправляем последние 12 сообщений для контекста)
        history_text = "\n".join(
            f"{'Пользователь' if h['role'] == 'user' else 'Бот'}: {h['text']}"
            for h in history[-12:]
        )

        prompt = (
            f"Имя пользователя: {user_name}\n\n"
            f"--- ИСТОРИЯ РАЗГОВОРА (помни весь контекст!) ---\n{history_text}\n\n"
            f"--- НОВОЕ СООБЩЕНИЕ ---\nПользователь: {user_message}\n\n"
            f"Учитывай всю историю. Если пользователь пишет короткую фразу "
            f"('а дальше?', 'и что?', 'ну', 'ок') — это продолжение предыдущей темы. "
            f"Если есть опечатки — пойми что имелось в виду. Ответь кратко и полезно."
        )

        url = f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent?key={GEMINI_API_KEY}"

        request_body = {
            "system_instruction": {"parts": [{"text": GEMINI_SYSTEM_PROMPT}]},
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {
                "temperature": 0.7,
                "maxOutputTokens": 1024,
                "topP": 0.9,
            },
        }

        async with httpx.AsyncClient(timeout=20) as client:
            resp = await client.post(url, json=request_body)

            if resp.status_code != 200:
                logger.warning(f"Gemini API error: {resp.status_code}")
                return None

            data = resp.json()
            text = data.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "")

            if not text:
                return None

            # Сохраняем в историю
            history.append({"role": "bot", "text": text[:200]})
            _gemini_chat_history[tg_id] = history

            # Добавляем лейбл что ответ от AI
            return f"✨ *Ответ QazGost AI:*\n\n{text.strip()}"

    except Exception as e:
        logger.warning(f"Gemini chat error: {e}")
        return None


# ══════════════════════════════════════════════════════════════════
# PDF GENERATOR
# ══════════════════════════════════════════════════════════════════

def _generate_pdf(estimate_data: Dict[str, Any]) -> io.BytesIO:
    """Генерация PDF-сметы из результата анализа."""
    result = estimate_data.get("result", {})
    description = estimate_data.get("description", "")
    category = estimate_data.get("category", "renovation")
    cat_info = CATEGORIES.get(category, CATEGORIES["renovation"])
    timestamp = estimate_data.get("timestamp", time.strftime("%Y-%m-%d %H:%M:%S"))

    # Формируем текстовый PDF (без внешних библиотек)
    lines = []
    lines.append("%PDF-1.4")
    lines.append("% QazGost AI Estimate")

    # Простой текстовый контент
    content_lines = []
    content_lines.append("QAZGOST AI - СМЕТА")
    content_lines.append("=" * 50)
    content_lines.append(f"Дата: {timestamp}")
    content_lines.append(f"Категория: {cat_info['name']}")
    content_lines.append(f"Описание: {description[:200]}")
    content_lines.append("")

    estimate_items = result.get("estimate_items", [])
    estimate_total = result.get("estimate_total", 0)

    if estimate_items:
        content_lines.append("ПОЗИЦИИ СМЕТЫ:")
        content_lines.append("-" * 50)
        mat_total = 0
        work_total = 0
        for i, item in enumerate(estimate_items, 1):
            name = item.get("name", "")
            total = item.get("total", 0)
            cat = item.get("category", "")
            if "материал" in cat.lower() or "material" in cat.lower():
                mat_total += total
            else:
                work_total += total
            content_lines.append(f"{i}. {name}: {total:,.0f} KZT")
        content_lines.append("")
        content_lines.append("-" * 50)
        if mat_total:
            content_lines.append(f"Материалы: {mat_total:,.0f} KZT")
        if work_total:
            content_lines.append(f"Работы: {work_total:,.0f} KZT")
    else:
        # Fallback данные
        import re
        area_match = re.search(r'(\d+)\s*[xхX×]\s*(\d+)', description)
        area_m2 = re.search(r'(\d+)\s*м[²2]', description)
        area = 0
        if area_match:
            area = int(area_match.group(1)) * int(area_match.group(2))
        elif area_m2:
            area = int(area_m2.group(1))
        else:
            area = 20

        PRICES = {
            "foundation": {"mat": 15000, "work": 8000},
            "walls":      {"mat": 8000,  "work": 5000},
            "roof":       {"mat": 12000, "work": 7000},
            "floor":      {"mat": 6000,  "work": 4000},
            "plumbing":   {"mat": 10000, "work": 8000},
            "electric":   {"mat": 5000,  "work": 6000},
            "renovation": {"mat": 7000,  "work": 5500},
        }
        prices = PRICES.get(category, PRICES["renovation"])
        mat_total = area * prices["mat"]
        work_total = area * prices["work"]
        estimate_total = mat_total + work_total

        content_lines.append(f"Площадь: ~{area} m2")
        content_lines.append(f"Материалы: ~{mat_total:,.0f} KZT")
        content_lines.append(f"Работы: ~{work_total:,.0f} KZT")

    if estimate_total:
        content_lines.append(f"\nИТОГО: {estimate_total:,.0f} KZT")

    content_lines.append("\n" + "=" * 50)
    content_lines.append("Сгенерировано QazGost AI Bot")
    content_lines.append(f"Платформа: {WEB_APP_URL}")
    content_lines.append("\n* Данная смета является предварительной.")
    content_lines.append("  Для точного расчета обратитесь к специалисту.")

    # Собираем минимальный PDF
    text_body = "\n".join(content_lines)
    stream_content = f"BT\n/F1 11 Tf\n36 750 Td\n12 TL\n"
    for line in content_lines:
        safe = line.replace("(", "\\(").replace(")", "\\)").replace("\\", "\\\\")
        # Транслитерация кириллицы для базового PDF
        safe_ascii = _transliterate(safe)
        stream_content += f"({safe_ascii}) '\n"
    stream_content += "ET"

    obj1 = "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj"
    obj2 = "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj"
    obj3 = ("3 0 obj\n<< /Type /Page /Parent 2 0 R "
            "/MediaBox [0 0 595 842] "
            "/Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj")
    obj4 = f"4 0 obj\n<< /Length {len(stream_content)} >>\nstream\n{stream_content}\nendstream\nendobj"
    obj5 = "5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>\nendobj"

    pdf_content = f"%PDF-1.4\n{obj1}\n{obj2}\n{obj3}\n{obj4}\n{obj5}\n"
    pdf_content += f"xref\n0 6\ntrailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n0\n%%EOF"

    buf = io.BytesIO(pdf_content.encode("latin-1", errors="replace"))
    buf.name = "smeta.pdf"
    return buf


def _transliterate(text: str) -> str:
    """Простая транслитерация кириллицы для PDF."""
    mapping = {
        'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'G', 'Д': 'D', 'Е': 'E', 'Ё': 'E',
        'Ж': 'Zh', 'З': 'Z', 'И': 'I', 'Й': 'Y', 'К': 'K', 'Л': 'L', 'М': 'M',
        'Н': 'N', 'О': 'O', 'П': 'P', 'Р': 'R', 'С': 'S', 'Т': 'T', 'У': 'U',
        'Ф': 'F', 'Х': 'Kh', 'Ц': 'Ts', 'Ч': 'Ch', 'Ш': 'Sh', 'Щ': 'Sch',
        'Ъ': '', 'Ы': 'Y', 'Ь': '', 'Э': 'E', 'Ю': 'Yu', 'Я': 'Ya',
        'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'e',
        'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
        'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
        'ф': 'f', 'х': 'kh', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'sch',
        'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya',
        '₸': 'KZT', '²': '2', '×': 'x',
    }
    return ''.join(mapping.get(c, c) for c in text)


# ══════════════════════════════════════════════════════════════════
# INLINE MODE — Поиск смет из любого чата
# ══════════════════════════════════════════════════════════════════

async def handle_inline_query(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Inline mode: @QazGostBot <описание> → быстрая оценка."""
    query_text = update.inline_query.query.strip()

    if len(query_text) < 5:
        return  # Слишком короткий запрос

    category = _detect_category(query_text)
    cat_info = CATEGORIES.get(category, CATEGORIES["renovation"])

    # Быстрый fallback расчёт для inline (без задержки API)
    import re
    area_match = re.search(r'(\d+)\s*[×xх]\s*(\d+)', query_text)
    area_m2 = re.search(r'(\d+)\s*м[²2]', query_text)
    area = 0
    if area_match:
        area = int(area_match.group(1)) * int(area_match.group(2))
    elif area_m2:
        area = int(area_m2.group(1))
    else:
        area = 20

    PRICES = {
        "foundation": {"mat": 15000, "work": 8000},
        "walls":      {"mat": 8000,  "work": 5000},
        "roof":       {"mat": 12000, "work": 7000},
        "floor":      {"mat": 6000,  "work": 4000},
        "plumbing":   {"mat": 10000, "work": 8000},
        "electric":   {"mat": 5000,  "work": 6000},
        "renovation": {"mat": 7000,  "work": 5500},
    }
    prices = PRICES.get(category, PRICES["renovation"])
    mat = area * prices["mat"]
    work = area * prices["work"]
    total = mat + work

    result_text = (
        f"{cat_info['icon']} *QazGost AI — Оценка*\n\n"
        f"📝 {query_text[:100]}\n"
        f"📐 Площадь: ~{area} м²\n\n"
        f"🧱 Материалы: ~{mat:,.0f} ₸\n"
        f"🔧 Работы: ~{work:,.0f} ₸\n"
        f"💵 *ИТОГО: ~{total:,.0f} ₸*\n\n"
        f"_Точный расчёт: @QazGostBot_"
    )

    results = [
        InlineQueryResultArticle(
            id="estimate_1",
            title=f"{cat_info['icon']} {cat_info['name']} — ~{total:,.0f} ₸",
            description=f"{query_text[:60]} | ~{area} м²",
            input_message_content=InputTextMessageContent(
                result_text, parse_mode="Markdown"
            ),
        )
    ]

    await update.inline_query.answer(results, cache_time=30)


# ══════════════════════════════════════════════════════════════════
# WEBAPP COMMAND
# ══════════════════════════════════════════════════════════════════

async def cmd_webapp(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """/webapp — открыть мини-приложение."""
    keyboard = InlineKeyboardMarkup([
        [InlineKeyboardButton(
            "🏗️ Открыть QazGost AI",
            web_app=WebAppInfo(url=WEB_APP_URL)
        )],
        [InlineKeyboardButton(
            "📊 Создать смету",
            web_app=WebAppInfo(url=f"{WEB_APP_URL}/#new-estimate")
        )],
        [InlineKeyboardButton(
            "💰 Кошелёк",
            web_app=WebAppInfo(url=f"{WEB_APP_URL}/#wallet")
        )],
    ])

    await update.message.reply_text(
        "🌐 *QazGost AI — Mini App*\n\n"
        "Откройте полную платформу прямо в Telegram:\n\n"
        "🏗️ Все функции\n"
        "📊 Создание смет с AI\n"
        "💰 Управление кошельком\n"
        "📋 Заказы и чаты",
        parse_mode="Markdown",
        reply_markup=keyboard,
    )


# ══════════════════════════════════════════════════════════════════
# CITY COMMAND — Выбор города
# ══════════════════════════════════════════════════════════════════

async def cmd_city(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """/city — выбрать город для расчётов."""
    keyboard = InlineKeyboardMarkup([
        [InlineKeyboardButton("🏙 Алматы", callback_data="city_almaty"),
         InlineKeyboardButton("🏙 Астана", callback_data="city_astana")],
        [InlineKeyboardButton("🏙 Шымкент", callback_data="city_shymkent"),
         InlineKeyboardButton("🏙 Караганда", callback_data="city_karaganda")],
        [InlineKeyboardButton("🏙 Актобе", callback_data="city_aktobe"),
         InlineKeyboardButton("🏙 Другой", callback_data="city_other")],
    ])

    current = context.user_data.get("selected_city", "almaty")
    city_names = {
        "almaty": "Алматы", "astana": "Астана", "shymkent": "Шымкент",
        "karaganda": "Караганда", "aktobe": "Актобе", "other": "Другой"
    }

    await update.message.reply_text(
        f"📍 *Выбор города*\n\n"
        f"Текущий: *{city_names.get(current, current)}*\n\n"
        f"Город влияет на цены материалов и работ.",
        parse_mode="Markdown",
        reply_markup=keyboard,
    )


# ══════════════════════════════════════════════════════════════════
# DOCUMENT HANDLER — Файлы/документы
# ══════════════════════════════════════════════════════════════════

async def handle_document(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Обработка документов (планы, чертежи)."""
    doc = update.message.document
    name = doc.file_name or "file"
    mime = doc.mime_type or ""

    if mime.startswith("image/"):
        # Изображение как документ — обрабатываем как фото
        await update.message.reply_text(
            "📎 Получен файл-изображение.\n"
            "Для AI-анализа, пожалуйста, отправьте как *фото* (не файл).",
            parse_mode="Markdown",
        )
    elif mime == "application/pdf":
        await update.message.reply_text(
            "📄 Получен PDF-документ.\n\n"
            "Анализ PDF-чертежей пока в разработке.\n"
            f"Загрузите документ на [платформу]({WEB_APP_URL}) для обработки.",
            parse_mode="Markdown",
        )
    else:
        await update.message.reply_text(
            f"📎 Файл `{name}` получен.\n\n"
            "Поддерживаемые форматы:\n"
            "• 📸 Фото (JPG, PNG) — AI-анализ\n"
            "• 📄 PDF — скоро\n\n"
            "Отправьте фото объекта для расчёта сметы.",
            parse_mode="Markdown",
        )


# ══════════════════════════════════════════════════════════════════
# BOT SETUP & LAUNCH
# ══════════════════════════════════════════════════════════════════

async def post_init(application: Application):
    """Устанавливаем команды бота в меню Telegram."""
    commands = [
        BotCommand("start", "Главное меню"),
        BotCommand("help", "Справка"),
        BotCommand("estimate", "Оценка по описанию"),
        BotCommand("balance", "Проверка баланса"),
        BotCommand("orders", "Мои заказы"),
        BotCommand("tariff", "Тарифы"),
        BotCommand("link", "Привязать аккаунт"),
        BotCommand("city", "Выбрать город"),
        BotCommand("webapp", "Открыть платформу"),
    ]
    await application.bot.set_my_commands(commands)
    logger.info(f"✅ Bot commands set: {len(commands)}")


def main():
    """Запуск бота."""
    if not BOT_TOKEN:
        logger.error("❌ TELEGRAM_BOT_TOKEN не задан!")
        logger.info("   Установите в .env: TELEGRAM_BOT_TOKEN=ваш_токен")
        logger.info("   Получите токен у @BotFather в Telegram")
        sys.exit(1)

    logger.info(f"🤖 Starting QazGost Telegram Bot...")
    logger.info(f"🌐 AI Service: {AI_SERVICE_URL}")
    logger.info(f"🔗 Backend: {BACKEND_URL}")
    logger.info(f"🔗 Web App: {WEB_APP_URL}")

    # Build application
    app = Application.builder().token(BOT_TOKEN).post_init(post_init).build()

    # Command handlers
    app.add_handler(CommandHandler("start", cmd_start))
    app.add_handler(CommandHandler("help", cmd_help))
    app.add_handler(CommandHandler("estimate", cmd_estimate))
    app.add_handler(CommandHandler("balance", cmd_balance))
    app.add_handler(CommandHandler("orders", cmd_orders))
    app.add_handler(CommandHandler("tariff", cmd_tariff))
    app.add_handler(CommandHandler("link", cmd_link))
    app.add_handler(CommandHandler("city", cmd_city))
    app.add_handler(CommandHandler("webapp", cmd_webapp))

    # Photo handler
    app.add_handler(MessageHandler(filters.PHOTO, handle_photo))

    # Document handler
    app.add_handler(MessageHandler(filters.Document.ALL, handle_document))

    # Text handler (last priority)
    app.add_handler(MessageHandler(
        filters.TEXT & ~filters.COMMAND, handle_text
    ))

    # Callback query handler (inline buttons)
    app.add_handler(CallbackQueryHandler(handle_callback))

    # Inline mode handler
    app.add_handler(InlineQueryHandler(handle_inline_query))

    # Run
    logger.info("✅ QazGost Bot ready — polling...")
    app.run_polling(allowed_updates=Update.ALL_TYPES)


if __name__ == "__main__":
    main()
