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
_rate_counts: Dict[str, list] = defaultdict(list)
_RATE_LIMIT_GENERAL = 60   # requests per minute (general)
_RATE_LIMIT_ANALYZE = 5    # requests per minute (/analyze — GPU heavy)

def _is_rate_limited(client_ip: str, path: str) -> bool:
    """Check if request should be rate-limited. Returns True if limited."""
    import time as _time
    now = _time.time()
    limit = _RATE_LIMIT_ANALYZE if "/analyze" in path else _RATE_LIMIT_GENERAL
    key = f"{client_ip}:{path}" if "/analyze" in path else client_ip

    # Clean old entries (older than 60s)
    _rate_counts[key] = [t for t in _rate_counts[key] if now - t < 60]
    if len(_rate_counts[key]) >= limit:
        return True
    _rate_counts[key].append(now)

    # Prevent memory leak: limit tracked IPs
    if len(_rate_counts) > 10000:
        oldest_keys = sorted(_rate_counts.keys(), key=lambda k: _rate_counts[k][0] if _rate_counts[k] else 0)[:5000]
        for k in oldest_keys:
            del _rate_counts[k]

    return False


# ── Middleware for auto-tracking ─────────────────────────────────
async def metrics_middleware(request: Request, call_next):
    """Track request count, latency, and enforce rate limits."""
    from fastapi.responses import JSONResponse

    t0 = time.time()
    path = request.url.path

    # Skip metrics/health to avoid noise
    if path in ("/metrics", "/api/v1/health", "/docs", "/openapi.json", "/redoc"):
        return await call_next(request)

    # Rate limiting
    client_ip = request.client.host if request.client else "unknown"
    if _is_rate_limited(client_ip, path):
        inc("qazgost_rate_limited_total", labels=f'path="{path}"')
        return JSONResponse(
            status_code=429,
            content={"error": "rate_limit_exceeded", "message": "Слишком много запросов. Попробуйте позже."},
        )

    response = await call_next(request)
    duration = time.time() - t0

    method = request.method
    status = response.status_code

    labels = f'method="{method}",path="{path}",status="{status}"'
    inc("qazgost_http_requests_total", labels=labels)
    observe("qazgost_http_request_duration_seconds", duration, labels=f'path="{path}"')

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
    inc(f"qazgost_scale_method_total", labels=f'method="{scale_method}"')


def track_defect(defect_type: str, severity: str = "medium"):
    """Track individual defect detection."""
    inc("qazgost_defect_types_total", labels=f'type="{defect_type}",severity="{severity}"')


def track_estimate(
    total_kzt: float,
    item_count: int = 0,
    scenario: str = "standard",
    region: str = "almaty",
):
    """Track estimate generation."""
    inc("qazgost_estimates_generated_total", labels=f'scenario="{scenario}",region="{region}"')
    observe("qazgost_estimate_value_kzt", total_kzt, labels=f'scenario="{scenario}"')
    inc("qazgost_estimate_items_total", value=item_count)
