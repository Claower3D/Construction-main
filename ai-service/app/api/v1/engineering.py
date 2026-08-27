"""
QazGost AI — LiDAR & Engineering API Endpoints

POST /api/v1/lidar/analyze     — Analyze LiDAR point cloud scan
POST /api/v1/engineering/calc  — Calculate engineering systems cost
"""

from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import tempfile
import os
from loguru import logger

router = APIRouter(prefix="/api/v1", tags=["LiDAR & Engineering"])


# ─────────────────────────────────────────────
# LiDAR endpoints
# ─────────────────────────────────────────────

@router.post("/lidar/analyze")
async def analyze_lidar_scan(
    file: UploadFile = File(...),
):
    """
    Analyze a LiDAR point cloud file.

    Accepts: .las, .laz, .ply, .pcd, .xyz
    Returns: dimensions, volume, deviations
    """
    from app.services.lidar import get_lidar

    lidar = get_lidar()
    if not lidar.available:
        raise HTTPException(
            status_code=503,
            detail="LiDAR module not available. Install: pip install open3d laspy[lazrs]"
        )

    # Validate file extension
    allowed_ext = {".las", ".laz", ".ply", ".pcd", ".xyz"}
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in allowed_ext:
        raise HTTPException(400, f"Unsupported file format: {ext}. Allowed: {allowed_ext}")

    # Save to temp file
    with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as tmp:
        content = await file.read()
        tmp.write(content)
        tmp_path = tmp.name

    try:
        result = lidar.analyze_scan(tmp_path)
        return result
    finally:
        os.unlink(tmp_path)


@router.post("/lidar/deviations")
async def check_deviations(
    file: UploadFile = File(...),
):
    """Check surface deviations against SNiP norms."""
    from app.services.lidar import get_lidar

    lidar = get_lidar()
    if not lidar.available:
        raise HTTPException(503, "LiDAR module not available")

    ext = os.path.splitext(file.filename or "")[1].lower()
    with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as tmp:
        content = await file.read()
        tmp.write(content)
        tmp_path = tmp.name

    try:
        pcd = lidar.load_point_cloud(tmp_path)
        if pcd is None:
            raise HTTPException(400, "Failed to load point cloud")
        return lidar.check_deviations(pcd)
    finally:
        os.unlink(tmp_path)


# ─────────────────────────────────────────────
# Engineering Calculator endpoints
# ─────────────────────────────────────────────

class SewageRequest(BaseModel):
    length_m: float
    depth_m: float = 1.2
    pipe_type: str = "pipe_pvc_110"
    manholes: int = 0
    city: str = "алматы"

class WaterRequest(BaseModel):
    points_count: int
    pipe_length_m: float
    hot_water: bool = True
    city: str = "алматы"

class ElectricalRequest(BaseModel):
    area_m2: float
    sockets: int = 0
    switches: int = 0
    city: str = "алматы"

class FullEstimateRequest(BaseModel):
    area_m2: float
    systems: Optional[List[str]] = None  # ["sewage", "water_supply", "electrical"]
    city: str = "алматы"
    sewage_length_m: Optional[float] = None
    sewage_depth_m: float = 1.2
    manholes: Optional[int] = None
    water_points: Optional[int] = None
    water_pipe_m: Optional[float] = None
    hot_water: bool = True
    sockets: int = 0
    switches: int = 0


@router.post("/engineering/sewage")
async def calc_sewage(req: SewageRequest):
    """Рассчитать стоимость канализации."""
    from app.services.engineering_calc import get_engineering_calculator
    calc = get_engineering_calculator()
    return calc.calculate_sewage(
        length_m=req.length_m,
        depth_m=req.depth_m,
        pipe_diameter=req.pipe_type,
        manholes=req.manholes,
        city=req.city,
    )


@router.post("/engineering/water")
async def calc_water(req: WaterRequest):
    """Рассчитать стоимость водоснабжения."""
    from app.services.engineering_calc import get_engineering_calculator
    calc = get_engineering_calculator()
    return calc.calculate_water_supply(
        points_count=req.points_count,
        pipe_length_m=req.pipe_length_m,
        hot_water=req.hot_water,
        city=req.city,
    )


@router.post("/engineering/electrical")
async def calc_electrical(req: ElectricalRequest):
    """Рассчитать стоимость электрики."""
    from app.services.engineering_calc import get_engineering_calculator
    calc = get_engineering_calculator()
    return calc.calculate_electrical(
        area_m2=req.area_m2,
        sockets=req.sockets,
        switches=req.switches,
        city=req.city,
    )


@router.post("/engineering/full")
async def calc_full_estimate(req: FullEstimateRequest):
    """Полная смета по всем инженерным системам."""
    from app.services.engineering_calc import get_engineering_calculator
    calc = get_engineering_calculator()

    kwargs = {}
    if req.sewage_length_m is not None:
        kwargs["sewage_length_m"] = req.sewage_length_m
    if req.manholes is not None:
        kwargs["manholes"] = req.manholes
    if req.water_points is not None:
        kwargs["water_points"] = req.water_points
    if req.water_pipe_m is not None:
        kwargs["water_pipe_m"] = req.water_pipe_m
    kwargs["hot_water"] = req.hot_water
    kwargs["sockets"] = req.sockets
    kwargs["switches"] = req.switches
    kwargs["sewage_depth_m"] = req.sewage_depth_m

    return calc.calculate_full_estimate(
        area_m2=req.area_m2,
        systems=req.systems,
        city=req.city,
        **kwargs,
    )
