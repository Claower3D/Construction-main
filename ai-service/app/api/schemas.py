"""
QAZGOST AI Service - Pydantic Schemas

Centralized schemas with enhanced documentation for OpenAPI.
"""

from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


# ===== HEALTH SCHEMAS =====

class HealthResponse(BaseModel):
    """Basic health check response."""
    status: str = Field(..., description="Service status: healthy, degraded, or unhealthy", example="healthy")
    service: str = Field(..., description="Service name", example="QAZGOST AI Service")
    version: str = Field(..., description="Service version", example="1.0.0")
    timestamp: datetime = Field(..., description="Current UTC timestamp")
    
    class Config:
        json_schema_extra = {
            "example": {
                "status": "healthy",
                "service": "QAZGOST AI Service",
                "version": "1.0.0",
                "timestamp": "2026-02-06T15:14:08.000Z"
            }
        }


class ComponentStatus(BaseModel):
    """Individual component status."""
    status: str = Field(..., description="Component status", example="healthy")
    model: Optional[str] = Field(None, description="Model name if applicable")
    device: Optional[str] = Field(None, description="Device (cpu/cuda)")
    error: Optional[str] = Field(None, description="Error message if unhealthy")


class GPUStatus(BaseModel):
    """GPU information."""
    status: str = Field(..., description="GPU status")
    available: bool = Field(..., description="Whether GPU is available")
    name: Optional[str] = Field(None, description="GPU name")
    memory_gb: Optional[float] = Field(None, description="GPU memory in GB")


class SystemInfo(BaseModel):
    """System information."""
    platform: str = Field(..., description="Operating system", example="Linux")
    python: str = Field(..., description="Python version", example="3.11.5")
    device: str = Field(..., description="Compute device", example="cuda")


class DetailedHealthResponse(HealthResponse):
    """Detailed health check with component status."""
    components: Dict[str, ComponentStatus] = Field(..., description="Status of each component")
    system: SystemInfo = Field(..., description="System information")


class ReadinessResponse(BaseModel):
    """Kubernetes readiness probe response."""
    ready: bool = Field(..., description="Whether service is ready to accept traffic")
    reason: Optional[str] = Field(None, description="Reason if not ready")


class LivenessResponse(BaseModel):
    """Kubernetes liveness probe response."""
    alive: bool = Field(True, description="Whether service is alive")


# ===== DETECTION SCHEMAS =====

class BoundingBox(BaseModel):
    """Bounding box coordinates."""
    x1: int = Field(..., description="Left coordinate", example=100)
    y1: int = Field(..., description="Top coordinate", example=200)
    x2: int = Field(..., description="Right coordinate", example=800)
    y2: int = Field(..., description="Bottom coordinate", example=600)


class DetectionResult(BaseModel):
    """Single detected object with measurements."""
    class_id: int = Field(..., description="Class ID from model", example=0)
    class_name: str = Field(..., description="Human-readable class name", example="trench")
    confidence: float = Field(..., ge=0, le=1, description="Detection confidence", example=0.87)
    bbox: List[int] = Field(..., min_length=4, max_length=4, description="Bounding box [x1, y1, x2, y2]")
    center: List[int] = Field(..., min_length=2, max_length=2, description="Center point [x, y]")
    width_px: int = Field(..., ge=0, description="Width in pixels")
    height_px: int = Field(..., ge=0, description="Height in pixels")
    area_px: float = Field(..., ge=0, description="Area in pixels²")
    
    # Metric measurements (only if scale calibrated)
    width_m: Optional[float] = Field(None, ge=0, description="Width in meters")
    height_m: Optional[float] = Field(None, ge=0, description="Height in meters")
    depth_m: Optional[float] = Field(None, ge=0, description="Estimated depth in meters")
    area_m2: Optional[float] = Field(None, ge=0, description="Area in m²")
    volume_m3: Optional[float] = Field(None, ge=0, description="Volume in m³")
    
    class Config:
        json_schema_extra = {
            "example": {
                "class_id": 0,
                "class_name": "trench",
                "confidence": 0.87,
                "bbox": [100, 200, 800, 600],
                "center": [450, 400],
                "width_px": 700,
                "height_px": 400,
                "area_px": 280000,
                "width_m": 5.2,
                "height_m": 3.0,
                "depth_m": 1.5,
                "area_m2": 15.6,
                "volume_m3": 23.4
            }
        }


class ClassInfo(BaseModel):
    """Object class information."""
    id: int = Field(..., description="Class ID")
    name: str = Field(..., description="Class name")


class ClassesResponse(BaseModel):
    """List of supported classes."""
    classes: List[ClassInfo] = Field(..., description="All supported classes")
    total: int = Field(..., description="Total number of classes")
    reference_classes: List[str] = Field(..., description="Classes that can be used for scale calibration")


# ===== ESTIMATION SCHEMAS =====

class EstimateItem(BaseModel):
    """Single estimate line item."""
    work_code: str = Field(..., description="Work code from price database", example="01-01-001")
    work_name: str = Field(..., description="Work description", example="Разработка грунта вручную")
    unit: str = Field(..., description="Unit of measurement", example="м³")
    quantity: float = Field(..., ge=0, description="Quantity", example=23.4)
    unit_price: float = Field(..., ge=0, description="Price per unit in KZT", example=3500)
    total_price: float = Field(..., ge=0, description="Total price in KZT", example=81900)
    confidence: float = Field(..., ge=0, le=1, description="Estimation confidence", example=0.85)
    
    class Config:
        json_schema_extra = {
            "example": {
                "work_code": "01-01-001",
                "work_name": "Разработка грунта вручную",
                "unit": "м³",
                "quantity": 23.4,
                "unit_price": 3500,
                "total_price": 81900,
                "confidence": 0.85
            }
        }


class MeasurementSummary(BaseModel):
    """Aggregated measurements for object class."""
    count: int = Field(..., ge=0, description="Number of objects detected")
    total_area_px: float = Field(..., ge=0, description="Total area in pixels")
    total_area_m2: float = Field(0, ge=0, description="Total area in m²")
    total_volume_m3: float = Field(0, ge=0, description="Total volume in m³")


# ===== ANALYSIS RESPONSE =====

class AnalysisResponse(BaseModel):
    """Complete analysis response."""
    success: bool = Field(..., description="Whether analysis completed successfully")
    image_id: str = Field(..., description="Unique image identifier (UUID)")
    
    # Image info
    image_width: int = Field(..., ge=0, description="Image width in pixels")
    image_height: int = Field(..., ge=0, description="Image height in pixels")
    
    # Detections
    detected_objects: List[DetectionResult] = Field(..., description="List of detected objects")
    object_count: int = Field(..., ge=0, description="Total number of detected objects")
    
    # Scale calibration
    scale_calibrated: bool = Field(..., description="Whether scale was successfully calibrated")
    scale_factor: Optional[float] = Field(None, description="Meters per pixel ratio")
    reference_object: Optional[str] = Field(None, description="Reference object used for calibration")
    
    # Measurements
    measurements: Optional[Dict[str, MeasurementSummary]] = Field(None, description="Aggregated measurements by class")
    
    # Estimation
    estimate_items: Optional[List[EstimateItem]] = Field(None, description="Generated estimate items")
    estimate_total: Optional[float] = Field(None, description="Total estimated cost in KZT")
    estimate_confidence: Optional[float] = Field(None, description="Overall estimation confidence")
    
    # Performance
    processing_time_ms: int = Field(..., ge=0, description="Processing time in milliseconds")
    
    # Warnings
    warnings: List[str] = Field(default=[], description="Any warnings during processing")
    
    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "image_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
                "image_width": 1920,
                "image_height": 1080,
                "detected_objects": [
                    {
                        "class_id": 0,
                        "class_name": "trench",
                        "confidence": 0.87,
                        "bbox": [100, 200, 800, 600],
                        "center": [450, 400],
                        "width_px": 700,
                        "height_px": 400,
                        "area_px": 280000,
                        "width_m": 5.2,
                        "height_m": 3.0,
                        "depth_m": 1.5,
                        "area_m2": 15.6,
                        "volume_m3": 23.4
                    }
                ],
                "object_count": 1,
                "scale_calibrated": True,
                "scale_factor": 0.00743,
                "reference_object": "person",
                "estimate_items": [
                    {
                        "work_code": "01-01-001",
                        "work_name": "Разработка грунта вручную",
                        "unit": "м³",
                        "quantity": 23.4,
                        "unit_price": 3500,
                        "total_price": 81900,
                        "confidence": 0.85
                    }
                ],
                "estimate_total": 81900,
                "estimate_confidence": 0.82,
                "processing_time_ms": 1250,
                "warnings": []
            }
        }


class SimpleDetectionResponse(BaseModel):
    """Simple detection response (without estimation)."""
    success: bool = Field(True, description="Whether detection completed")
    objects: List[Dict[str, Any]] = Field(..., description="Detected objects")
    count: int = Field(..., ge=0, description="Number of objects")
    processing_time_ms: int = Field(..., ge=0, description="Processing time in ms")


# ===== ERROR SCHEMAS =====

class ErrorResponse(BaseModel):
    """Standard error response."""
    error: str = Field(..., description="Error code", example="bad_request")
    message: str = Field(..., description="Human-readable error message")
    
    class Config:
        json_schema_extra = {
            "example": {
                "error": "bad_request",
                "message": "File must be an image"
            }
        }


class ValidationErrorDetail(BaseModel):
    """Validation error detail."""
    loc: List[str] = Field(..., description="Location of error")
    msg: str = Field(..., description="Error message")
    type: str = Field(..., description="Error type")


class ValidationErrorResponse(BaseModel):
    """Validation error response."""
    detail: List[ValidationErrorDetail] = Field(..., description="Validation errors")
