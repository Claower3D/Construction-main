"""
QAZGOST AI — Prometheus Metrics Endpoint

Exposes application metrics for Prometheus scraping:
  - request_count, request_latency
  - ai_inference_duration
  - model_loaded status
  - estimate_total_value
"""

import time
from collections import defaultdict
from typing import Dict

from fastapi import APIRouter, Request
from fastapi.responses import PlainTextResponse

router = APIRouter(tags=["Monitoring"])

# ── In-memory metrics store ──────────────────────────────────────
_metrics: Dict[str, float] = defaultdict(float)
_histograms: Dict[str, list] = defaultdict(list)
_start_time = time.time()


def _esc(v) -> str:
    """Escape a Prometheus label value (backslash, quote, newline)."""
    return str(v).replace("\\", "\\\\").replace('"', '\\"').replace("\n", "\\n")


def labels_of(**kv) -> str:
    return ",".join(f'{k}="{_esc(v)}"' for k, v in kv.items())


def inc(name: str, value: float = 1.0, labels: str = ""):
    """Increment a counter metric."""
    key = f"{name}{{{labels}}}" if labels else name
    _metrics[key] += value


def observe(name: str, value: float, labels: str = ""):
    """Observe a histogram value."""
    key = f"{name}{{{labels}}}" if labels else name
    _histograms[key].append(value)
    # Keep last 1000 observations
    if len(_histograms[key]) > 1000:
        _histograms[key] = _histograms[key][-500:]


def gauge(name: str, value: float, labels: str = ""):
    """Set a gauge metric."""
    key = f"{name}{{{labels}}}" if labels else name
    _metrics[key] = value


# ── Prometheus text format renderer ──────────────────────────────
def _render_metrics() -> str:
    """Render metrics in Prometheus exposition format."""
    lines = []
    
    # Uptime
    uptime = time.time() - _start_time
    lines.append("# HELP qazgost_uptime_seconds Time since service start")
    lines.append("# TYPE qazgost_uptime_seconds gauge")
    lines.append(f"qazgost_uptime_seconds {uptime:.1f}")
    lines.append("")

    # Counters and gauges
    for key, value in sorted(_metrics.items()):
        metric_name = key.split("{")[0] if "{" in key else key
        lines.append(f"# TYPE {metric_name} gauge")
        lines.append(f"{key} {value}")
    lines.append("")

    # Histograms (simplified — sum, count, avg)
    for key, values in sorted(_histograms.items()):
        if not values:
            continue
        metric_name = key.split("{")[0] if "{" in key else key
        total = sum(values)
        count = len(values)
        avg = total / count if count else 0
        lines.append(f"# HELP {metric_name} Duration histogram")
        lines.append(f"# TYPE {metric_name} summary")
        lines.append(f"{key}_sum {total:.3f}")
        lines.append(f"{key}_count {count}")
        lines.append(f"{key}_avg {avg:.3f}")
    
    return "\n".join(lines) + "\n"


# ── Endpoints ────────────────────────────────────────────────────

@router.get("/metrics", response_class=PlainTextResponse)
async def prometheus_metrics():
    """Prometheus-compatible metrics endpoint."""
    return _render_metrics()


@router.get("/api/v1/metrics/json")
async def json_metrics():
    """JSON metrics for dashboard consumption."""
    uptime = time.time() - _start_time
    
    # Aggregate histogram stats
    inference_stats = {}
    for key, values in _histograms.items():
        if values:
            inference_stats[key] = {
                "count": len(values),
                "sum": round(sum(values), 3),
                "avg": round(sum(values) / len(values), 3),
                "min": round(min(values), 3),
                "max": round(max(values), 3),
            }

    return {
        "uptime_seconds": round(uptime, 1),
        "uptime_human": f"{int(uptime//3600)}h {int((uptime%3600)//60)}m",
        "counters": dict(_metrics),
        "histograms": inference_stats,
    }


# ── Simple in-memory rate limiter ────────────────────────────────
# Тяжёлые эндпоинты (ML-инференс) — отдельный лимит. Точное совпадение пути,
# а не подстрока: /lidar/analyze сюда не относится.
HEAVY_PATHS = {
    "/api/v1/analyze",
    "/api/v1/analyze-3d",
    "/api/v1/analyze/intent",
    "/api/v1/defect-scan",
}
_rate_counts: Dict[str, list] = defaultdict(list)


def client_id(request: Request) -> str:
    """
    Client key for rate limiting. Behind the Go proxy every request comes from one IP,
    so X-Forwarded-For (first hop) / X-Real-IP are used when TRUST_FORWARDED_FOR is enabled.
    """
    from app.config import settings

    if settings.TRUST_FORWARDED_FOR:
        xff = request.headers.get("x-forwarded-for")
        if xff:
            first = xff.split(",")[0].strip()
            if first:
                return first[:64]
        xri = request.headers.get("x-real-ip")
        if xri:
            return xri.strip()[:64]
    return request.client.host if request.client else "unknown"


def _is_rate_limited(client: str, path: str) -> bool:
    """Check if request should be rate-limited. Returns True if limited."""
    from app.config import settings

    now = time.time()
    heavy = path in HEAVY_PATHS
    limit = settings.RATE_LIMIT_HEAVY_PER_MIN if heavy else settings.RATE_LIMIT_GENERAL_PER_MIN
    key = f"{client}:heavy" if heavy else client

    # Clean old entries (older than 60s)
    _rate_counts[key] = [t for t in _rate_counts[key] if now - t < 60]
    if len(_rate_counts[key]) >= limit:
        return True
    _rate_counts[key].append(now)

    # Prevent memory leak: limit tracked clients
    if len(_rate_counts) > 10000:
        oldest_keys = sorted(_rate_counts.keys(), key=lambda k: _rate_counts[k][-1] if _rate_counts[k] else 0)[:5000]
        for k in oldest_keys:
            del _rate_counts[k]

    return False


def _route_label(request: Request) -> str:
    """Route template (e.g. /api/v1/prices/item/{code}) instead of the raw path → bounded cardinality."""
    route = request.scope.get("route")
    path = getattr(route, "path", None)
    return path if path else "<unmatched>"


# ── Middleware for auto-tracking ─────────────────────────────────
_SKIP_PATHS = ("/metrics", "/health", "/api/v1/health", "/api/v1/health/live", "/api/v1/health/ready",
               "/docs", "/openapi.json", "/redoc")


async def metrics_middleware(request: Request, call_next):
    """Track request count, latency, and enforce rate limits."""
    from fastapi.responses import JSONResponse

    t0 = time.time()
    path = request.url.path

    # Skip metrics/health to avoid noise
    if path in _SKIP_PATHS or request.method == "OPTIONS":
        return await call_next(request)

    # Rate limiting
    if _is_rate_limited(client_id(request), path):
        bucket = "heavy" if path in HEAVY_PATHS else "general"
        inc("qazgost_rate_limited_total", labels=labels_of(bucket=bucket))
        return JSONResponse(
            status_code=429,
            content={"error": "rate_limit_exceeded", "message": "Слишком много запросов. Попробуйте позже."},
            headers={"Retry-After": "60"},
        )

    response = await call_next(request)
    duration = time.time() - t0

    route = _route_label(request)
    inc("qazgost_http_requests_total",
        labels=labels_of(method=request.method, path=route, status=response.status_code))
    observe("qazgost_http_request_duration_seconds", duration, labels=labels_of(path=route))

    return response


# ── Convenience tracking functions ───────────────────────────────

def track_analysis(
    duration_s: float,
    object_count: int = 0,
    defect_count: int = 0,
    scale_method: str = "unknown",
):
    """Track a completed AI analysis."""
    inc("qazgost_analyses_total")
    observe("qazgost_analysis_duration_seconds", duration_s)
    inc("qazgost_objects_detected_total", value=object_count)
    inc("qazgost_defects_detected_total", value=defect_count)
    inc("qazgost_scale_method_total", labels=labels_of(method=scale_method))


def track_defect(defect_type: str, severity: str = "medium"):
    """Track individual defect detection."""
    inc("qazgost_defect_types_total", labels=labels_of(type=defect_type, severity=severity))


def track_estimate(
    total_kzt: float,
    item_count: int = 0,
    scenario: str = "standard",
    region: str = "almaty",
):
    """Track estimate generation."""
    inc("qazgost_estimates_generated_total", labels=labels_of(scenario=scenario, region=region))
    observe("qazgost_estimate_value_kzt", total_kzt, labels=labels_of(scenario=scenario))
    inc("qazgost_estimate_items_total", value=item_count)
