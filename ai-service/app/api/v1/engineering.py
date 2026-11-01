"""
QazGost AI — LiDAR & Engineering API Endpoints

POST /api/v1/lidar/analyze          — Analyze LiDAR point cloud scan
POST /api/v1/lidar/deviations       — Surface flatness (deviation) check
POST /api/v1/engineering/{sewage|water|electrical|full}
POST /api/v1/engineering/report/{pdf|excel}
"""

import os
import re
import tempfile
from typing import Any, Dict, List, Optional
from urllib.parse import quote

from fastapi import APIRouter, File, HTTPException, UploadFile
from fastapi.concurrency import run_in_threadpool
from fastapi.responses import Response
from loguru import logger
from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.api.uploads import copy_upload_limited
from app.config import settings
from app.services.engineering_calc import (
    REGIONAL_COEFF, SEWAGE_NORMS, SUPPORTED_SYSTEMS, normalize_city,
)

router = APIRouter(prefix="/api/v1", tags=["LiDAR & Engineering"])

LIDAR_EXTENSIONS = {".las", ".laz", ".ply", ".pcd", ".xyz"}
SEWAGE_PIPES = tuple(k for k in SEWAGE_NORMS if k.startswith("pipe_"))


# ─────────────────────────────────────────────
# LiDAR endpoints
# ─────────────────────────────────────────────

async def _save_point_cloud(file: UploadFile) -> str:
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in LIDAR_EXTENSIONS:
        raise HTTPException(400, f"Unsupported file format: {ext or '(none)'}. Allowed: {sorted(LIDAR_EXTENSIONS)}")
    tmp = tempfile.NamedTemporaryFile(delete=False, suffix=ext)
    try:
        await copy_upload_limited(file, tmp, settings.MAX_UPLOAD_SIZE, what="Файл облака точек")
    except BaseException:
        tmp.close()
        os.unlink(tmp.name)
        raise
    tmp.close()
    return tmp.name


def _require_lidar():
    from app.services.lidar import get_lidar

    lidar = get_lidar()
    if not lidar.available:
        raise HTTPException(503, "LiDAR module not available. Install: pip install open3d laspy[lazrs]")
    return lidar


@router.post("/lidar/analyze")
async def analyze_lidar_scan(file: UploadFile = File(...)):
    """
    Analyze a LiDAR point cloud file.

    Accepts: .las, .laz, .ply, .pcd, .xyz
    Returns: scan type (room / surface / excavation), dimensions, volume, deviations
    """
    from app.services.lidar import PointCloudError

    lidar = _require_lidar()
    tmp_path = await _save_point_cloud(file)
    try:
        result = await run_in_threadpool(lidar.analyze_scan, tmp_path)
    except PointCloudError as exc:
        raise HTTPException(400, str(exc))
    finally:
        os.unlink(tmp_path)
    result["file"] = os.path.basename(file.filename or "")[:255]  # имя загруженного файла, не временного
    return result


@router.post("/lidar/deviations")
async def check_deviations(file: UploadFile = File(...)):
    """Check surface deviations (RANSAC plane fit) against SNiP tolerances."""
    from app.services.lidar import PointCloudError

    lidar = _require_lidar()
    tmp_path = await _save_point_cloud(file)
    try:
        def _run():
            pcd = lidar.load_point_cloud(tmp_path, strict=True)
            return lidar.check_deviations(pcd)
        return await run_in_threadpool(_run)
    except PointCloudError as exc:
        raise HTTPException(400, str(exc))
    finally:
        os.unlink(tmp_path)


# ─────────────────────────────────────────────
# Engineering Calculator: request models
# ─────────────────────────────────────────────

class _EngBase(BaseModel):
    # NaN / Infinity в JSON (Starlette их принимает) → 422
    model_config = ConfigDict(allow_inf_nan=False, extra="ignore")

    city: str = Field("алматы", max_length=60, description=f"Город: {', '.join(REGIONAL_COEFF)}")

    @field_validator("city")
    @classmethod
    def _check_city(cls, v: str) -> str:
        key = normalize_city(v)
        if key is None:
            raise ValueError(f"Неизвестный город '{v}'. Доступны: {', '.join(REGIONAL_COEFF)}")
        return key


class SewageRequest(_EngBase):
    length_m: float = Field(..., gt=0, le=10_000, description="Длина трассы, м")
    depth_m: float = Field(1.2, gt=0, le=10, description="Глубина заложения, м")
    pipe_type: str = Field("pipe_pvc_110", description=f"Тип трубы: {', '.join(SEWAGE_PIPES)}")
    manholes: int = Field(0, ge=0, le=1_000)

    @field_validator("pipe_type")
    @classmethod
    def _check_pipe(cls, v: str) -> str:
        if v not in SEWAGE_PIPES:
            raise ValueError(f"Неизвестный тип трубы '{v}'. Доступны: {', '.join(SEWAGE_PIPES)}")
        return v


class WaterRequest(_EngBase):
    points_count: int = Field(..., ge=0, le=10_000)
    pipe_length_m: float = Field(..., gt=0, le=100_000)
    hot_water: bool = True


class ElectricalRequest(_EngBase):
    area_m2: float = Field(..., gt=0, le=1_000_000)
    sockets: int = Field(0, ge=0, le=100_000)
    switches: int = Field(0, ge=0, le=100_000)


class FullEstimateRequest(_EngBase):
    area_m2: float = Field(..., gt=0, le=1_000_000)
    systems: Optional[List[str]] = Field(None, description=f"Системы: {', '.join(SUPPORTED_SYSTEMS)} (по умолчанию все)")
    sewage_length_m: Optional[float] = Field(None, gt=0, le=10_000)
    sewage_depth_m: float = Field(1.2, gt=0, le=10)
    pipe_type: str = Field("pipe_pvc_110")
    manholes: Optional[int] = Field(None, ge=0, le=1_000)
    water_points: Optional[int] = Field(None, ge=0, le=10_000)
    water_pipe_m: Optional[float] = Field(None, gt=0, le=100_000)
    hot_water: bool = True
    sockets: int = Field(0, ge=0, le=100_000)
    switches: int = Field(0, ge=0, le=100_000)

    @field_validator("systems")
    @classmethod
    def _check_systems(cls, v: Optional[List[str]]) -> Optional[List[str]]:
        if v is None:
            return v
        if not v:
            raise ValueError(f"Список систем пуст. Доступны: {', '.join(SUPPORTED_SYSTEMS)}")
        unknown = [s for s in v if s not in SUPPORTED_SYSTEMS]
        if unknown:
            raise ValueError(
                f"Неподдерживаемые системы: {', '.join(unknown)}. Доступны: {', '.join(SUPPORTED_SYSTEMS)} "
                "(отопление и вентиляция пока не рассчитываются)"
            )
        return list(dict.fromkeys(v))

    @field_validator("pipe_type")
    @classmethod
    def _check_pipe(cls, v: str) -> str:
        if v not in SEWAGE_PIPES:
            raise ValueError(f"Неизвестный тип трубы '{v}'. Доступны: {', '.join(SEWAGE_PIPES)}")
        return v


def _full_kwargs(req: FullEstimateRequest) -> Dict[str, Any]:
    """Одинаковый набор параметров для /full, /report/pdf и /report/excel."""
    kwargs: Dict[str, Any] = {
        "hot_water": req.hot_water,
        "sockets": req.sockets,
        "switches": req.switches,
        "sewage_depth_m": req.sewage_depth_m,
        "pipe_type": req.pipe_type,
    }
    for field in ("sewage_length_m", "manholes", "water_points", "water_pipe_m"):
        value = getattr(req, field)
        if value is not None:
            kwargs[field] = value
    return kwargs


def _full_estimate(req: FullEstimateRequest) -> Dict[str, Any]:
    from app.services.engineering_calc import get_engineering_calculator

    return get_engineering_calculator().calculate_full_estimate(
        area_m2=req.area_m2, systems=req.systems, city=req.city, **_full_kwargs(req),
    )


# ─────────────────────────────────────────────
# Engineering Calculator endpoints
# ─────────────────────────────────────────────

@router.post("/engineering/sewage")
async def calc_sewage(req: SewageRequest):
    """Рассчитать стоимость канализации."""
    from app.services.engineering_calc import get_engineering_calculator
    return get_engineering_calculator().calculate_sewage(
        length_m=req.length_m, depth_m=req.depth_m, pipe_diameter=req.pipe_type,
        manholes=req.manholes, city=req.city,
    )


@router.post("/engineering/water")
async def calc_water(req: WaterRequest):
    """Рассчитать стоимость водоснабжения."""
    from app.services.engineering_calc import get_engineering_calculator
    return get_engineering_calculator().calculate_water_supply(
        points_count=req.points_count, pipe_length_m=req.pipe_length_m,
        hot_water=req.hot_water, city=req.city,
    )


@router.post("/engineering/electrical")
async def calc_electrical(req: ElectricalRequest):
    """Рассчитать стоимость электрики."""
    from app.services.engineering_calc import get_engineering_calculator
    return get_engineering_calculator().calculate_electrical(
        area_m2=req.area_m2, sockets=req.sockets, switches=req.switches, city=req.city,
    )


@router.post("/engineering/full")
async def calc_full_estimate(req: FullEstimateRequest):
    """Полная смета по всем инженерным системам."""
    return _full_estimate(req)


# ─────────────────────────────────────────────
# Report download endpoints
# ─────────────────────────────────────────────

_TRANSLIT = str.maketrans({
    "а": "a", "б": "b", "в": "v", "г": "g", "д": "d", "е": "e", "ё": "e", "ж": "zh", "з": "z", "и": "i",
    "й": "y", "к": "k", "л": "l", "м": "m", "н": "n", "о": "o", "п": "p", "р": "r", "с": "s", "т": "t",
    "у": "u", "ф": "f", "х": "kh", "ц": "ts", "ч": "ch", "ш": "sh", "щ": "sch", "ъ": "", "ы": "y", "ь": "",
    "э": "e", "ю": "yu", "я": "ya",
})


def content_disposition(filename: str) -> str:
    """
    RFC 6266 / RFC 5987: ASCII fallback in filename="…" (no quotes/CRLF possible) +
    filename*=UTF-8''… with the original (Cyrillic) name. Latin-1 safe header.
    """
    ascii_name = re.sub(r"[^A-Za-z0-9._-]+", "_", filename.lower().translate(_TRANSLIT)).strip("_") or "report"
    return f"attachment; filename=\"{ascii_name}\"; filename*=UTF-8''{quote(filename, safe='')}"


def _report_filename(req: FullEstimateRequest, ext: str) -> str:
    area = f"{req.area_m2:g}".replace(".", "_")
    return f"smeta_qazgost_{req.city}_{area}m2.{ext}"


@router.post("/engineering/report/pdf")
async def download_pdf_report(req: FullEstimateRequest):
    """Calculate estimate and return as downloadable PDF."""
    from app.services.report_generator import generate_pdf

    estimate = _full_estimate(req)
    pdf_bytes = await run_in_threadpool(generate_pdf, estimate)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": content_disposition(_report_filename(req, "pdf"))},
    )


@router.post("/engineering/report/excel")
async def download_excel_report(req: FullEstimateRequest):
    """Calculate estimate and return as downloadable Excel (.xlsx)."""
    from app.services.report_generator import generate_excel

    estimate = _full_estimate(req)
    xlsx_bytes = await run_in_threadpool(generate_excel, estimate)
    return Response(
        content=xlsx_bytes,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": content_disposition(_report_filename(req, "xlsx"))},
    )
