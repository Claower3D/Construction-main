# ================================================================
# QazGost AI — Полный деплой на Cloudflare
# Запускает: D1 + KV + R2 + Worker + Pages
# ================================================================

Write-Host "═══════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  QazGost AI → Cloudflare Full Deploy" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

$ErrorActionPreference = "Stop"
$webDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# ── STEP 0: Login ──────────────────────────────────────────────
Write-Host "STEP 0: Проверка авторизации Wrangler..." -ForegroundColor Yellow
try {
    npx wrangler whoami 2>&1 | Out-Null
    Write-Host "  ✅ Авторизованы" -ForegroundColor Green
} catch {
    Write-Host "  ⚠️ Нужна авторизация. Откроется браузер..." -ForegroundColor Red
    npx wrangler login
}

# ── STEP 1: Create D1 Database ─────────────────────────────────
Write-Host ""
Write-Host "STEP 1: Создание D1 базы данных..." -ForegroundColor Yellow
$d1Output = npx wrangler d1 create iconstrution-db 2>&1 | Out-String

if ($d1Output -match "already exists") {
    Write-Host "  ℹ️ База данных уже существует" -ForegroundColor Cyan
    # Get existing DB ID
    $d1List = npx wrangler d1 list --json 2>&1 | ConvertFrom-Json
    $db = $d1List | Where-Object { $_.name -eq "iconstrution-db" }
    $dbId = $db.uuid
} else {
    # Extract database_id from output
    if ($d1Output -match "database_id\s*=\s*""([a-f0-9-]+)""") {
        $dbId = $matches[1]
    }
}
Write-Host "  ✅ D1 Database ID: $dbId" -ForegroundColor Green

# ── STEP 2: Apply D1 Schema ───────────────────────────────────
Write-Host ""
Write-Host "STEP 2: Применение схемы D1..." -ForegroundColor Yellow
$schemaFile = Join-Path $webDir "d1-schema.sql"
if (Test-Path $schemaFile) {
    npx wrangler d1 execute iconstrution-db --remote --file=$schemaFile 2>&1
    Write-Host "  ✅ Схема применена" -ForegroundColor Green
} else {
    Write-Host "  ⚠️ Файл d1-schema.sql не найден" -ForegroundColor Red
}

# ── STEP 3: Create KV Namespace ────────────────────────────────
Write-Host ""
Write-Host "STEP 3: Создание KV Namespace (сессии)..." -ForegroundColor Yellow
$kvOutput = npx wrangler kv namespace create SESSIONS 2>&1 | Out-String

if ($kvOutput -match "already exists") {
    Write-Host "  ℹ️ KV Namespace уже существует" -ForegroundColor Cyan
    $kvList = npx wrangler kv namespace list --json 2>&1 | ConvertFrom-Json
    $kv = $kvList | Where-Object { $_.title -match "SESSIONS" }
    $kvId = $kv.id
} else {
    if ($kvOutput -match "id\s*=\s*""([a-f0-9]+)""") {
        $kvId = $matches[1]
    }
}
Write-Host "  ✅ KV Namespace ID: $kvId" -ForegroundColor Green

# ── STEP 4: Create R2 Bucket ──────────────────────────────────
Write-Host ""
Write-Host "STEP 4: Создание R2 Bucket (файлы)..." -ForegroundColor Yellow
$r2Output = npx wrangler r2 bucket create iconstrution-files 2>&1 | Out-String
if ($r2Output -match "already exists") {
    Write-Host "  ℹ️ R2 Bucket уже существует" -ForegroundColor Cyan
} else {
    Write-Host "  ✅ R2 Bucket создан" -ForegroundColor Green
}

# ── STEP 5: Update wrangler.toml with IDs ─────────────────────
Write-Host ""
Write-Host "STEP 5: Обновление wrangler.toml с ID..." -ForegroundColor Yellow
$tomlFile = Join-Path $webDir "wrangler.toml"
$tomlContent = Get-Content $tomlFile -Raw

if ($dbId) {
    $tomlContent = $tomlContent -replace 'database_id = ""', "database_id = `"$dbId`""
}
if ($kvId) {
    $tomlContent = $tomlContent -replace '^id = ""', "id = `"$kvId`""
}

Set-Content $tomlFile $tomlContent -NoNewline
Write-Host "  ✅ wrangler.toml обновлён" -ForegroundColor Green

# ── STEP 6: Set Secrets ────────────────────────────────────────
Write-Host ""
Write-Host "STEP 6: Установка секретов..." -ForegroundColor Yellow
Write-Host "  Введите Gemini API Key:" -ForegroundColor White
$geminiKey = Read-Host
if ($geminiKey) {
    $geminiKey | npx wrangler secret put GEMINI_API_KEY 2>&1
    Write-Host "  ✅ GEMINI_API_KEY установлен" -ForegroundColor Green
}

Write-Host "  Введите OpenAI API Key (или Enter для пропуска):" -ForegroundColor White
$openaiKey = Read-Host
if ($openaiKey) {
    $openaiKey | npx wrangler secret put OPENAI_API_KEY 2>&1
    Write-Host "  ✅ OPENAI_API_KEY установлен" -ForegroundColor Green
}

Write-Host "  Введите JWT Secret (или Enter для автогенерации):" -ForegroundColor White
$jwtSecret = Read-Host
if (-not $jwtSecret) {
    $jwtSecret = [System.Guid]::NewGuid().ToString() + "-" + [System.Guid]::NewGuid().ToString()
    Write-Host "  📝 Сгенерирован: $jwtSecret" -ForegroundColor Cyan
}
$jwtSecret | npx wrangler secret put JWT_SECRET 2>&1
Write-Host "  ✅ JWT_SECRET установлен" -ForegroundColor Green

# ── STEP 7: Deploy Worker ──────────────────────────────────────
Write-Host ""
Write-Host "STEP 7: Деплой Worker (API Backend)..." -ForegroundColor Yellow
npx wrangler deploy 2>&1
Write-Host "  ✅ Worker развёрнут: https://construction-api.kmp99.workers.dev" -ForegroundColor Green

# ── STEP 8: Deploy Pages (Frontend) ───────────────────────────
Write-Host ""
Write-Host "STEP 8: Деплой Pages (Frontend)..." -ForegroundColor Yellow
Write-Host "  📁 Загрузка статических файлов..." -ForegroundColor White

# Deploy the WebVersion directory as Pages
npx wrangler pages deploy $webDir --project-name="qazgost-ai" --commit-dirty 2>&1

Write-Host "  ✅ Pages развёрнут!" -ForegroundColor Green

# ── DONE ──────────────────────────────────────────────────────
Write-Host ""
Write-Host "═══════════════════════════════════════════════" -ForegroundColor Green
Write-Host "  ✅ ДЕПЛОЙ ЗАВЕРШЁН!" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""
Write-Host "  🌐 Frontend: https://qazgost-ai.pages.dev" -ForegroundColor Cyan
Write-Host "  🔧 API:      https://construction-api.kmp99.workers.dev" -ForegroundColor Cyan
Write-Host "  📊 Dashboard: https://dash.cloudflare.com" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Далее:" -ForegroundColor Yellow
Write-Host "  1. Добавьте домен iconstrution.com в Pages → Custom Domains" -ForegroundColor White
Write-Host "  2. Проверьте Workers → construction-api → Logs" -ForegroundColor White
Write-Host "  3. Откройте https://qazgost-ai.pages.dev" -ForegroundColor White
