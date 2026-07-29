"""
QAZGOST AI - Estimates Storage API

Endpoints for saving, listing, and retrieving estimates.
Uses SQLite for lightweight persistence.
"""

import json
import sqlite3
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import PlainTextResponse
from pydantic import BaseModel, Field
from loguru import logger
from app.api.v1.jwt_auth import get_current_user, get_optional_user

router = APIRouter(prefix="/api/v1/estimates", tags=["estimates"])

# ── Database Setup ────────────────────────────────────────────────────────────
DB_DIR = Path(__file__).parent.parent.parent / "data"
DB_PATH = DB_DIR / "estimates.db"


def _get_db() -> sqlite3.Connection:
    """Get SQLite connection with WAL mode for concurrent reads."""
    DB_DIR.mkdir(parents=True, exist_ok=True)
    _ensure_tables()
    conn = sqlite3.connect(str(DB_PATH), timeout=5)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    return conn


_tables_initialized = False


def _ensure_tables():
    """Create tables if they don't exist (lazy, not on import)."""
    global _tables_initialized
    if _tables_initialized:
        return
    conn = sqlite3.connect(str(DB_PATH), timeout=5)
    try:
        conn.executescript("""
            CREATE TABLE IF NOT EXISTS estimates (
                id TEXT PRIMARY KEY,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                
                -- Client info
                client_name TEXT DEFAULT '',
                client_phone TEXT DEFAULT '',
                client_address TEXT DEFAULT '',
                client_notes TEXT DEFAULT '',
                
                -- Object info
                category TEXT DEFAULT '',
                object_type TEXT DEFAULT '',
                description TEXT DEFAULT '',
                region TEXT DEFAULT 'almaty',
                
                -- AI analysis results
                ai_confidence REAL DEFAULT 0,
                detection_count INTEGER DEFAULT 0,
                defect_count INTEGER DEFAULT 0,
                qwen_scene TEXT DEFAULT '',
                
                -- Estimate data (JSON)
                estimate_items TEXT DEFAULT '[]',
                estimate_total REAL DEFAULT 0,
                estimate_confidence REAL DEFAULT 0,
                
                -- Full pipeline response (JSON)
                pipeline_response TEXT DEFAULT '{}',
                
                -- Status
                status TEXT DEFAULT 'draft',
                scenario TEXT DEFAULT 'standard'
            );
            
            CREATE INDEX IF NOT EXISTS idx_estimates_created ON estimates(created_at);
            CREATE INDEX IF NOT EXISTS idx_estimates_status ON estimates(status);
            CREATE INDEX IF NOT EXISTS idx_estimates_client ON estimates(client_name);
        """)
        _tables_initialized = True
        logger.info(f"[Estimates DB] Initialized at {DB_PATH}")
    finally:
        conn.close()


# ── Pydantic Models ──────────────────────────────────────────────────────────

class EstimateCreate(BaseModel):
    """Request to save a new estimate."""
    client_name: str = ""
    client_phone: str = ""
    client_address: str = ""
    client_notes: str = ""
    category: str = ""
    object_type: str = ""
    description: str = ""
    region: str = "almaty"
    scenario: str = "standard"
    estimate_items: list = Field(default_factory=list)
    estimate_total: float = 0
    estimate_confidence: float = 0
    ai_confidence: float = 0
    detection_count: int = 0
    defect_count: int = 0
    qwen_scene: str = ""
    pipeline_response: dict = Field(default_factory=dict)


class EstimateResponse(BaseModel):
    """Response with estimate data."""
    id: str
    created_at: str
    updated_at: str
    client_name: str
    client_phone: str
    client_address: str
    client_notes: str
    category: str
    object_type: str
    description: str
    region: str
    status: str
    scenario: str
    estimate_items: list
    estimate_total: float
    estimate_confidence: float
    ai_confidence: float
    detection_count: int
    defect_count: int
    qwen_scene: str


class EstimateListResponse(BaseModel):
    """Response for listing estimates."""
    estimates: list
    total: int
    page: int
    per_page: int


class EstimateUpdate(BaseModel):
    """Request to update an estimate."""
    client_name: Optional[str] = None
    client_phone: Optional[str] = None
    client_address: Optional[str] = None
    client_notes: Optional[str] = None
    status: Optional[str] = None
    scenario: Optional[str] = None


# ── Endpoints ────────────────────────────────────────────────────────────────

@router.post("", response_model=EstimateResponse, status_code=201)
async def create_estimate(data: EstimateCreate, user: dict = Depends(get_current_user)):
    """Save a new estimate to the database."""
    logger.info(f"[Estimates] Create by user={user.get('uid', '?')}")
    estimate_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()

    conn = _get_db()
    try:
        conn.execute("""
            INSERT INTO estimates (
                id, created_at, updated_at,
                client_name, client_phone, client_address, client_notes,
                category, object_type, description, region,
                ai_confidence, detection_count, defect_count, qwen_scene,
                estimate_items, estimate_total, estimate_confidence,
                pipeline_response, status, scenario
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            estimate_id, now, now,
            data.client_name, data.client_phone, data.client_address, data.client_notes,
            data.category, data.object_type, data.description, data.region,
            data.ai_confidence, data.detection_count, data.defect_count, data.qwen_scene,
            json.dumps(data.estimate_items, ensure_ascii=False),
            data.estimate_total, data.estimate_confidence,
            json.dumps(data.pipeline_response, ensure_ascii=False),
            "draft", data.scenario,
        ))
        conn.commit()
        logger.info(f"[Estimates] Created: {estimate_id} ({data.category}, {data.estimate_total:.0f} KZT)")
    finally:
        conn.close()

    return _get_estimate_by_id(estimate_id)


@router.get("/stats/summary")
async def get_stats():
    """Get statistics summary."""
    conn = _get_db()
    try:
        stats = conn.execute("""
            SELECT 
                COUNT(*) as total_estimates,
                COALESCE(SUM(estimate_total), 0) as total_value,
                COALESCE(AVG(estimate_total), 0) as avg_value,
                COALESCE(AVG(ai_confidence), 0) as avg_confidence,
                COUNT(CASE WHEN status = 'draft' THEN 1 END) as drafts,
                COUNT(CASE WHEN status = 'sent' THEN 1 END) as sent,
                COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved,
                COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed
            FROM estimates
        """).fetchone()

        return {
            "total_estimates": stats["total_estimates"],
            "total_value_kzt": round(stats["total_value"], 2),
            "avg_value_kzt": round(stats["avg_value"], 2),
            "avg_ai_confidence": round(stats["avg_confidence"], 3),
            "by_status": {
                "draft": stats["drafts"],
                "sent": stats["sent"],
                "approved": stats["approved"],
                "completed": stats["completed"],
            }
        }
    finally:
        conn.close()


@router.get("/export/{estimate_id}")
async def export_estimate_csv(estimate_id: str, user: dict = Depends(get_current_user)):
    """Export estimate as CSV file."""
    conn = _get_db()
    try:
        row = conn.execute(
            "SELECT * FROM estimates WHERE id = ?", (estimate_id,)
        ).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Смета не найдена")

        data = dict(row)
        items = json.loads(data.get("estimate_items", "[]"))

        BOM = "\ufeff"
        lines = [
            f'{BOM}"QAZGOST AI — Смета"',
            f'"ID","{data["id"]}"',
            f'"Дата","{data["created_at"]}"',
            f'"Клиент","{data.get("client_name", "")}"',
            f'"Адрес","{data.get("client_address", "")}"',
            f'"Регион","{data.get("region", "almaty")}"',
            f'"Тип объекта","{data.get("object_type", "")}"',
            f'"Сценарий","{data.get("scenario", "standard")}"',
            '',
            '"#","Код","Наименование","Ед.изм","Кол-во","Цена","Сумма","Источник цены"',
        ]

        total = 0
        for idx, item in enumerate(items, 1):
            qty = item.get("qty", item.get("quantity", 0))
            price = item.get("unit_price", 0)
            subtotal = item.get("total_price", item.get("total", qty * price))
            total += subtotal
            name = item.get("work_name", item.get("name", ""))
            code = item.get("work_code", "")
            unit = item.get("unit_label", item.get("unit", ""))
            src = "БД" if item.get("price_source") == "database" else "Базовая"
            lines.append(f'{idx},"{code}","{name}","{unit}",{qty},{price},{subtotal},"{src}"')

        lines.append(f'\n"","","ИТОГО","","","",{total}')
        lines.append(f'"AI уверенность","{data.get("ai_confidence", 0)}"')

        csv_text = "\r\n".join(lines)

        logger.info(f"[Estimates] CSV export: {estimate_id} ({len(items)} items, total={total:.0f} KZT)")

        return PlainTextResponse(
            content=csv_text,
            media_type="text/csv; charset=utf-8",
            headers={
                "Content-Disposition": f'attachment; filename="estimate_{estimate_id}.csv"',
            },
        )
    finally:
        conn.close()


@router.get("", response_model=EstimateListResponse)
async def list_estimates(
    page: int = 1,
    per_page: int = 20,
    status: Optional[str] = None,
    client: Optional[str] = None,
    user: dict = Depends(get_current_user),
):
    """List estimates with pagination and filtering."""
    conn = _get_db()
    try:
        where_clauses = []
        params = []

        if status:
            where_clauses.append("status = ?")
            params.append(status)
        if client:
            where_clauses.append("client_name LIKE ?")
            params.append(f"%{client}%")

        where_sql = " AND ".join(where_clauses) if where_clauses else "1=1"

        # Count total
        total = conn.execute(
            f"SELECT COUNT(*) FROM estimates WHERE {where_sql}", params
        ).fetchone()[0]

        # Fetch page
        offset = (page - 1) * per_page
        rows = conn.execute(
            f"""SELECT id, created_at, updated_at, client_name, client_phone,
                    category, object_type, status, scenario,
                    estimate_total, estimate_confidence, ai_confidence,
                    detection_count, defect_count
                FROM estimates WHERE {where_sql}
                ORDER BY created_at DESC
                LIMIT ? OFFSET ?""",
            params + [per_page, offset]
        ).fetchall()

        estimates = [dict(row) for row in rows]

    finally:
        conn.close()

    return EstimateListResponse(
        estimates=estimates,
        total=total,
        page=page,
        per_page=per_page,
    )


@router.get("/{estimate_id}", response_model=EstimateResponse)
async def get_estimate(estimate_id: str, user: dict = Depends(get_current_user)):
    """Get a single estimate by ID."""
    result = _get_estimate_by_id(estimate_id)
    if not result:
        raise HTTPException(status_code=404, detail="Смета не найдена")
    return result


@router.patch("/{estimate_id}", response_model=EstimateResponse)
async def update_estimate(estimate_id: str, data: EstimateUpdate, user: dict = Depends(get_current_user)):
    """Update estimate fields (client info, status, scenario)."""
    conn = _get_db()
    try:
        existing = conn.execute(
            "SELECT id FROM estimates WHERE id = ?", (estimate_id,)
        ).fetchone()
        if not existing:
            raise HTTPException(status_code=404, detail="Смета не найдена")

        # Whitelist of allowed update fields to prevent SQL injection
        ALLOWED_UPDATE_FIELDS = {
            "client_name", "client_phone", "client_address",
            "client_notes", "status", "scenario"
        }

        updates = []
        params = []
        for field, value in data.dict(exclude_unset=True).items():
            if value is not None and field in ALLOWED_UPDATE_FIELDS:
                updates.append(f"{field} = ?")
                params.append(value)

        if updates:
            updates.append("updated_at = ?")
            params.append(datetime.now(timezone.utc).isoformat())
            params.append(estimate_id)

            conn.execute(
                f"UPDATE estimates SET {', '.join(updates)} WHERE id = ?",
                params
            )
            conn.commit()
            logger.info(f"[Estimates] Updated: {estimate_id}")
    finally:
        conn.close()

    return _get_estimate_by_id(estimate_id)


@router.delete("/{estimate_id}", status_code=204)
async def delete_estimate(estimate_id: str, user: dict = Depends(get_current_user)):
    """Delete an estimate."""
    conn = _get_db()
    try:
        result = conn.execute(
            "DELETE FROM estimates WHERE id = ?", (estimate_id,)
        )
        conn.commit()
        if result.rowcount == 0:
            raise HTTPException(status_code=404, detail="Смета не найдена")
        logger.info(f"[Estimates] Deleted: {estimate_id}")
    finally:
        conn.close()





# ── Helpers ──────────────────────────────────────────────────────────────────

def _get_estimate_by_id(estimate_id: str) -> Optional[dict]:
    """Fetch a single estimate by ID."""
    conn = _get_db()
    try:
        row = conn.execute(
            "SELECT * FROM estimates WHERE id = ?", (estimate_id,)
        ).fetchone()
        if not row:
            return None

        result = dict(row)
        # Parse JSON fields
        result["estimate_items"] = json.loads(result.get("estimate_items", "[]"))
        result.pop("pipeline_response", None)  # Don't return full pipeline data in detail
        return result
    finally:
        conn.close()
