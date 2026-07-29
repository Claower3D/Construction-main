"""
QAZGOST AI Service - OpenAPI Documentation

Enhanced OpenAPI schemas, tags, and documentation.
"""

from typing import Dict, Any

# API Tags configuration
tags_metadata = [
    {
        "name": "Health",
        "description": "🏥 **Health check endpoints** for monitoring service status, readiness, and liveness probes.",
        "externalDocs": {
            "description": "Kubernetes probes documentation",
            "url": "https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/"
        }
    },
    {
        "name": "Analysis",
        "description": """
🔍 **Image analysis endpoints** for construction object detection and volume estimation.

## Features

* **Object Detection** - Detect construction objects (trenches, pipes, foundations)
* **Scale Calibration** - Calculate real-world dimensions using reference objects
* **Depth Estimation** - Monocular depth estimation for volume calculation
* **Auto-Estimation** - Generate cost estimates based on detected objects

## Supported Object Classes

| Class | Description |
|-------|-------------|
| `trench` | Excavated trench for utilities or foundation |
| `pit` | Excavation pit |
| `foundation` | Foundation structure |
| `pipe` | Water/gas/sewer pipes |
| `reinforcement` | Steel reinforcement mesh |
| `formwork` | Concrete formwork |
| `person` | Reference object (1.75m) |
| `measuring_tape` | Reference object (1m) |
| `excavator_bucket` | Reference object (1.2m) |

## Workflow

1. Upload construction photo
2. AI detects objects and calibrates scale
3. System calculates volumes and areas
4. Auto-estimation generates cost breakdown
        """
    },
    {
        "name": "Configuration",
        "description": "⚙️ **Configuration endpoints** for model settings and supported classes."
    }
]


# Custom OpenAPI configuration
def get_openapi_config() -> Dict[str, Any]:
    """Return OpenAPI configuration dictionary."""
    return {
        "title": "QAZGOST AI Service API",
        "version": "1.0.0",
        "description": """
# 🏗️ QAZGOST AI Service

**AI-powered construction object detection and volume estimation API.**

## Overview

This service provides computer vision capabilities for analyzing construction site photos:

- 🔍 **Object Detection** using YOLOv8 trained on construction objects
- 📏 **Scale Calibration** using reference objects (people, measuring tape)
- 📐 **Depth Estimation** using Intel DPT monocular depth model
- 📊 **Volume Calculation** for excavations and materials
- 💰 **Cost Estimation** using regional price databases

## Authentication

Currently, the API is open for development. Production deployments should use API keys:

```
Authorization: Bearer <api_key>
```

## Rate Limits

| Tier | Requests/min | Max image size |
|------|-------------|----------------|
| Free | 10 | 4MB |
| Pro | 100 | 20MB |
| Enterprise | Unlimited | 50MB |

## Quick Start

### Analyze a photo

```bash
curl -X POST "http://localhost:8001/api/v1/analyze" \\
     -F "file=@construction_photo.jpg" \\
     -F "reference_object=person"
```

### Simple detection

```bash
curl -X POST "http://localhost:8001/api/v1/detect" \\
     -F "file=@photo.jpg" \\
     -F "confidence=0.3"
```

## Response Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 400 | Bad request (invalid image, missing params) |
| 422 | Validation error |
| 500 | Internal server error |

## Support

- 📧 Email: support@qazgost.kz
- 📚 Docs: https://docs.qazgost.kz
- 🐛 Issues: https://github.com/qazgost/ai-service/issues
        """,
        "contact": {
            "name": "QAZGOST AI Team",
            "email": "support@qazgost.kz",
            "url": "https://qazgost.kz"
        },
        "license_info": {
            "name": "MIT License",
            "url": "https://opensource.org/licenses/MIT"
        },
        "terms_of_service": "https://qazgost.kz/terms",
        "servers": [
            {
                "url": "http://localhost:8001",
                "description": "Development server"
            },
            {
                "url": "https://api.qazgost.kz",
                "description": "Production server"
            }
        ]
    }


# Response examples
response_examples = {
    "analysis_success": {
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
        "measurements": {
            "trench": {
                "count": 1,
                "total_area_px": 280000,
                "total_area_m2": 15.6,
                "total_volume_m3": 23.4
            }
        },
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
    },
    "health_check": {
        "status": "healthy",
        "service": "QAZGOST AI Service",
        "version": "1.0.0",
        "timestamp": "2026-02-06T15:14:08.000Z"
    },
    "detailed_health": {
        "status": "healthy",
        "service": "QAZGOST AI Service",
        "version": "1.0.0",
        "timestamp": "2026-02-06T15:14:08.000Z",
        "components": {
            "detector": {
                "status": "healthy",
                "model": "yolov8m.pt",
                "device": "cuda",
                "classes": 15
            },
            "depth": {
                "status": "healthy",
                "model": "Intel/dpt-large",
                "device": "cuda"
            },
            "gpu": {
                "status": "healthy",
                "available": True,
                "name": "NVIDIA GeForce RTX 3080",
                "memory_gb": 10.0
            }
        },
        "system": {
            "platform": "Linux",
            "python": "3.11.5",
            "device": "cuda"
        }
    }
}


# Error response schemas
error_responses = {
    400: {
        "description": "Bad Request",
        "content": {
            "application/json": {
                "example": {
                    "error": "bad_request",
                    "message": "File must be an image"
                }
            }
        }
    },
    422: {
        "description": "Validation Error",
        "content": {
            "application/json": {
                "example": {
                    "detail": [
                        {
                            "loc": ["query", "confidence"],
                            "msg": "ensure this value is greater than or equal to 0.1",
                            "type": "value_error.number.not_ge"
                        }
                    ]
                }
            }
        }
    },
    500: {
        "description": "Internal Server Error",
        "content": {
            "application/json": {
                "example": {
                    "error": "internal_server_error",
                    "message": "An unexpected error occurred"
                }
            }
        }
    }
}
