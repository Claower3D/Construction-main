#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════
# QAZGOST AI — Docker E2E Smoke Test
#
# Validates that the AI service starts and responds correctly.
# Can be run locally or in CI/CD pipeline.
#
# Usage:
#   Local (no Docker):  ./scripts/smoke-test.sh --local
#   Docker:             ./scripts/smoke-test.sh
#   CI (with base URL):  AI_BASE_URL=http://ci-host:8001 ./scripts/smoke-test.sh
# ═══════════════════════════════════════════════════════════════════

set -euo pipefail

# Configuration
AI_BASE_URL="${AI_BASE_URL:-http://localhost:8001}"
MAX_WAIT=${MAX_WAIT:-120}
PASSED=0
FAILED=0
TOTAL=0

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

log()   { echo -e "${CYAN}[SMOKE]${NC} $1"; }
pass()  { echo -e "${GREEN}  ✅ PASS${NC}: $1"; ((PASSED++)); ((TOTAL++)); }
fail()  { echo -e "${RED}  ❌ FAIL${NC}: $1"; ((FAILED++)); ((TOTAL++)); }
warn()  { echo -e "${YELLOW}  ⚠️  WARN${NC}: $1"; }

# ── Wait for service ──────────────────────────────────────────────
wait_for_service() {
    log "Waiting for AI service at $AI_BASE_URL (max ${MAX_WAIT}s)..."
    local elapsed=0
    while [ $elapsed -lt $MAX_WAIT ]; do
        if curl -sf "$AI_BASE_URL/" > /dev/null 2>&1; then
            log "Service is UP after ${elapsed}s"
            return 0
        fi
        sleep 2
        elapsed=$((elapsed + 2))
        echo -n "."
    done
    echo ""
    fail "Service did not start within ${MAX_WAIT}s"
    exit 1
}

# ── Test helper ───────────────────────────────────────────────────
assert_status() {
    local desc="$1"
    local method="$2"
    local url="$3"
    local expected_status="$4"
    local data="${5:-}"

    local args=(-s -o /tmp/smoke_response.json -w "%{http_code}" --max-time 10)
    
    if [ "$method" = "POST" ]; then
        if [ -n "$data" ]; then
            args+=(-X POST -H "Content-Type: application/json" -d "$data")
        fi
    elif [ "$method" = "DELETE" ]; then
        args+=(-X DELETE)
    elif [ "$method" = "PATCH" ]; then
        args+=(-X PATCH -H "Content-Type: application/json" -d "$data")
    fi

    local status
    status=$(curl "${args[@]}" "$url" 2>/dev/null || echo "000")
    
    if [ "$status" = "$expected_status" ]; then
        pass "$desc (HTTP $status)"
    else
        fail "$desc — expected $expected_status, got $status"
        if [ -f /tmp/smoke_response.json ]; then
            cat /tmp/smoke_response.json 2>/dev/null | head -3
        fi
    fi
}

assert_json_field() {
    local desc="$1"
    local field="$2"
    
    if [ -f /tmp/smoke_response.json ]; then
        local value
        value=$(python3 -c "import json; d=json.load(open('/tmp/smoke_response.json')); print(d.get('$field','__MISSING__'))" 2>/dev/null || echo "__ERROR__")
        if [ "$value" != "__MISSING__" ] && [ "$value" != "__ERROR__" ]; then
            pass "$desc ($field=$value)"
        else
            fail "$desc ($field missing)"
        fi
    else
        fail "$desc (no response body)"
    fi
}

# ═══════════════════════════════════════════════════════════════════
# TESTS
# ═══════════════════════════════════════════════════════════════════

echo ""
echo "═══════════════════════════════════════════════════════"
echo "   QAZGOST AI — E2E Smoke Test"
echo "   Target: $AI_BASE_URL"
echo "═══════════════════════════════════════════════════════"
echo ""

# 0. Wait for service
wait_for_service

# 1. Root endpoint
log "TEST 1: Root endpoint"
assert_status "GET /" "GET" "$AI_BASE_URL/" "200"
assert_json_field "Root has 'name'" "name"
assert_json_field "Root has 'version'" "version"

# 2. Health check
log "TEST 2: Health endpoint"
assert_status "GET /health" "GET" "$AI_BASE_URL/api/v1/health" "200"
assert_json_field "Health has 'status'" "status"

# 3. Health detail
log "TEST 3: Health detail"
assert_status "GET /health/detailed" "GET" "$AI_BASE_URL/api/v1/health/detailed" "200"

# 4. OpenAPI docs
log "TEST 4: API Documentation"
assert_status "GET /docs" "GET" "$AI_BASE_URL/docs" "200"
assert_status "GET /openapi.json" "GET" "$AI_BASE_URL/openapi.json" "200"

# 5. Estimates CRUD
log "TEST 5: Estimates API CRUD"

# Create
assert_status "POST /estimates" "POST" "$AI_BASE_URL/api/v1/estimates" "201" \
    '{"client_name":"Test","object_type":"foundation","estimate_total":100000}'

# Extract ID
EST_ID=$(python3 -c "import json; print(json.load(open('/tmp/smoke_response.json'))['id'])" 2>/dev/null || echo "unknown")

# List
assert_status "GET /estimates" "GET" "$AI_BASE_URL/api/v1/estimates" "200"

# Get
assert_status "GET /estimates/:id" "GET" "$AI_BASE_URL/api/v1/estimates/$EST_ID" "200"

# Update
assert_status "PATCH /estimates/:id" "PATCH" "$AI_BASE_URL/api/v1/estimates/$EST_ID" "200" \
    '{"status":"sent"}'

# Stats
assert_status "GET /estimates/stats" "GET" "$AI_BASE_URL/api/v1/estimates/stats/summary" "200"

# Delete
assert_status "DELETE /estimates/:id" "DELETE" "$AI_BASE_URL/api/v1/estimates/$EST_ID" "204"

# 6. Analyze endpoint (multipart — test with minimal image)
log "TEST 6: Analyze endpoint (validation)"
# Test missing file returns 422
assert_status "POST /analyze (no file)" "POST" "$AI_BASE_URL/api/v1/analyze" "422"

# ═══════════════════════════════════════════════════════════════════
# RESULTS
# ═══════════════════════════════════════════════════════════════════

echo ""
echo "═══════════════════════════════════════════════════════"
printf "   RESULTS: %d passed, %d failed (out of %d)\n" "$PASSED" "$FAILED" "$TOTAL"
echo "═══════════════════════════════════════════════════════"
echo ""

if [ "$FAILED" -gt 0 ]; then
    echo -e "${RED}SMOKE TEST FAILED${NC}"
    exit 1
else
    echo -e "${GREEN}ALL SMOKE TESTS PASSED ✅${NC}"
    exit 0
fi
