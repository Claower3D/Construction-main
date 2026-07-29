# QAZGOST AI - E2E Smoke Test (PowerShell 5 compatible)
param(
    [string]$BaseUrl = "http://localhost:8001",
    [int]$MaxWait = 120
)

$script:passed = 0
$script:failed = 0
$script:total = 0

function Log($msg) { Write-Host "[SMOKE] $msg" -ForegroundColor Cyan }

function Pass($msg) {
    Write-Host "  [PASS] $msg" -ForegroundColor Green
    $script:passed++
    $script:total++
}

function Fail($msg) {
    Write-Host "  [FAIL] $msg" -ForegroundColor Red
    $script:failed++
    $script:total++
}

function Test-Endpoint {
    param(
        [string]$Desc,
        [string]$Method = "GET",
        [string]$Url,
        [int]$Expected,
        [string]$Body = ""
    )
    try {
        $params = @{
            Uri = $Url
            Method = $Method
            TimeoutSec = 15
            UseBasicParsing = $true
        }
        if ($Body -ne "") {
            $params["Body"] = $Body
            $params["ContentType"] = "application/json"
        }
        $resp = Invoke-WebRequest @params -ErrorAction Stop
        if ($resp.StatusCode -eq $Expected) {
            Pass "$Desc (HTTP $($resp.StatusCode))"
            try {
                return ($resp.Content | ConvertFrom-Json)
            } catch {
                return $null
            }
        } else {
            Fail "$Desc - expected $Expected, got $($resp.StatusCode)"
        }
    } catch {
        $code = 0
        if ($_.Exception.Response -ne $null) {
            $code = [int]$_.Exception.Response.StatusCode
        }
        if ($code -eq $Expected) {
            Pass "$Desc (HTTP $code)"
        } else {
            $codeStr = if ($code -gt 0) { "$code" } else { "TIMEOUT" }
            Fail "$Desc - expected $Expected, got $codeStr"
        }
    }
    return $null
}

# Header
Write-Host ""
Write-Host "===================================================" -ForegroundColor White
Write-Host "   QAZGOST AI - E2E Smoke Test" -ForegroundColor White
Write-Host "   Target: $BaseUrl" -ForegroundColor Gray
Write-Host "===================================================" -ForegroundColor White
Write-Host ""

# 0. Wait for service
Log "Waiting for service at $BaseUrl..."
$elapsed = 0
while ($elapsed -lt $MaxWait) {
    try {
        $null = Invoke-WebRequest -Uri "$BaseUrl/" -TimeoutSec 3 -UseBasicParsing -ErrorAction Stop
        Log "Service is UP after ${elapsed}s"
        break
    } catch {
        Start-Sleep 2
        $elapsed += 2
        Write-Host "." -NoNewline
    }
}
if ($elapsed -ge $MaxWait) {
    Fail "Service not ready after ${MaxWait}s"
    exit 1
}
Write-Host ""

# 1. Root
Log "TEST 1: Root endpoint"
$root = Test-Endpoint -Desc "GET /" -Url "$BaseUrl/" -Expected 200
if ($root -and $root.name) {
    Pass "Root has name=$($root.name)"
} else {
    Fail "Root missing name"
}

# 2. Health
Log "TEST 2: Health endpoint"
Test-Endpoint -Desc "GET /health" -Url "$BaseUrl/api/v1/health" -Expected 200 | Out-Null

# 3. Health detail
Log "TEST 3: Health detail"
Test-Endpoint -Desc "GET /health/detailed" -Url "$BaseUrl/api/v1/health/detailed" -Expected 200 | Out-Null

# 4. Docs
Log "TEST 4: API Documentation"
Test-Endpoint -Desc "GET /docs" -Url "$BaseUrl/docs" -Expected 200 | Out-Null
Test-Endpoint -Desc "GET /openapi.json" -Url "$BaseUrl/openapi.json" -Expected 200 | Out-Null

# 5. Metrics
Log "TEST 5: Prometheus Metrics"
Test-Endpoint -Desc "GET /metrics" -Url "$BaseUrl/metrics" -Expected 200 | Out-Null
$jsonMetrics = Test-Endpoint -Desc "GET /metrics/json" -Url "$BaseUrl/api/v1/metrics/json" -Expected 200
if ($jsonMetrics -and $jsonMetrics.uptime_seconds) {
    Pass "Metrics uptime=$($jsonMetrics.uptime_human)"
}

# 6. Estimates CRUD
Log "TEST 6: Estimates API CRUD"
$createBody = '{"client_name":"SmokeTest","object_type":"foundation","estimate_total":100000}'
$created = Test-Endpoint -Desc "POST /estimates" -Method POST -Url "$BaseUrl/api/v1/estimates" -Expected 201 -Body $createBody

$estId = "unknown"
if ($created -and $created.id) { $estId = $created.id }

Test-Endpoint -Desc "GET /estimates" -Url "$BaseUrl/api/v1/estimates" -Expected 200 | Out-Null
Test-Endpoint -Desc "GET /estimates/$estId" -Url "$BaseUrl/api/v1/estimates/$estId" -Expected 200 | Out-Null
Test-Endpoint -Desc "PATCH /estimates/$estId" -Method PATCH -Url "$BaseUrl/api/v1/estimates/$estId" -Expected 200 -Body '{"status":"sent"}' | Out-Null
Test-Endpoint -Desc "GET /stats" -Url "$BaseUrl/api/v1/estimates/stats/summary" -Expected 200 | Out-Null
Test-Endpoint -Desc "DELETE /estimates/$estId" -Method DELETE -Url "$BaseUrl/api/v1/estimates/$estId" -Expected 204 | Out-Null

# Results
Write-Host ""
Write-Host "===================================================" -ForegroundColor White
$color = if ($script:failed -gt 0) { "Red" } else { "Green" }
Write-Host "   RESULTS: $($script:passed) passed, $($script:failed) failed (out of $($script:total))" -ForegroundColor $color
Write-Host "===================================================" -ForegroundColor White
Write-Host ""

if ($script:failed -gt 0) {
    Write-Host "SMOKE TEST FAILED" -ForegroundColor Red
    exit 1
} else {
    Write-Host "ALL SMOKE TESTS PASSED" -ForegroundColor Green
    exit 0
}
