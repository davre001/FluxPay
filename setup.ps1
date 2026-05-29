# FluxPay Setup Script
# Run from: c:\Users\USER\FluxPay

Write-Host ""
Write-Host "=== FluxPay Setup ===" -ForegroundColor Cyan

# 1. Prerequisites
Write-Host ""
Write-Host "[1/6] Checking prerequisites..." -ForegroundColor Yellow

$python = python --version 2>&1
$docker = docker --version 2>&1
$node   = node --version 2>&1
$forge  = forge --version 2>&1

Write-Host "  Python : $python"
Write-Host "  Docker : $docker"
Write-Host "  Node   : $node"
Write-Host "  Forge  : $forge"

if ($python -notmatch "3\.(1[1-9]|[2-9]\d)") {
    Write-Host "  ERROR: Python 3.11+ required." -ForegroundColor Red
    exit 1
}
if ($docker -notmatch "Docker") {
    Write-Host "  ERROR: Docker not found. Install Docker Desktop first." -ForegroundColor Red
    exit 1
}

$forgeAvailable = $forge -match "forge"

# 2. Backend virtual env + packages
Write-Host ""
Write-Host "[2/6] Setting up Python virtual environment..." -ForegroundColor Yellow

Set-Location "$PSScriptRoot\backend"

if (-not (Test-Path ".venv")) {
    python -m venv .venv
    Write-Host "  Virtual env created." -ForegroundColor Green
} else {
    Write-Host "  Virtual env already exists, skipping." -ForegroundColor Gray
}

& ".\.venv\Scripts\pip.exe" install -e ".[dev]" -q
Write-Host "  Python packages installed." -ForegroundColor Green

# 3. .env file
Write-Host ""
Write-Host "[3/6] Setting up .env..." -ForegroundColor Yellow

Set-Location $PSScriptRoot

if (-not (Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
    Write-Host "  .env created from .env.example." -ForegroundColor Green
    Write-Host "  ACTION: Open .env and set SECRET_KEY to any random string." -ForegroundColor Magenta
} else {
    Write-Host "  .env already exists, skipping." -ForegroundColor Gray
}

# 4. Docker: Postgres + Redis
Write-Host ""
Write-Host "[4/6] Starting Postgres and Redis..." -ForegroundColor Yellow

docker compose up postgres redis -d

Write-Host "  Waiting for services to be healthy..."
Start-Sleep -Seconds 8

$pgId    = docker compose ps -q postgres 2>$null
$redisId = docker compose ps -q redis 2>$null

if ($pgId) {
    $pgStatus = docker inspect --format="{{.State.Health.Status}}" $pgId 2>$null
    if ($pgStatus -eq "healthy") {
        Write-Host "  Postgres : healthy" -ForegroundColor Green
    } else {
        Write-Host "  Postgres : $pgStatus (run 'docker compose ps' to check)" -ForegroundColor Yellow
    }
}

if ($redisId) {
    $redisStatus = docker inspect --format="{{.State.Health.Status}}" $redisId 2>$null
    if ($redisStatus -eq "healthy") {
        Write-Host "  Redis    : healthy" -ForegroundColor Green
    } else {
        Write-Host "  Redis    : $redisStatus" -ForegroundColor Yellow
    }
}

# 5. Contracts
Write-Host ""
Write-Host "[5/6] Setting up contracts..." -ForegroundColor Yellow

Set-Location "$PSScriptRoot\contracts"

npm install --silent
Write-Host "  Hardhat packages installed." -ForegroundColor Green

if ($forgeAvailable) {
    if (-not (Test-Path "lib\openzeppelin-contracts")) {
        forge install OpenZeppelin/openzeppelin-contracts --no-commit 2>&1 | Out-Null
        Write-Host "  OpenZeppelin installed." -ForegroundColor Green
    } else {
        Write-Host "  OpenZeppelin already installed." -ForegroundColor Gray
    }

    Write-Host "  Running contract tests..."
    $testResult = forge test 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  All contract tests passed." -ForegroundColor Green
    } else {
        Write-Host "  Some tests failed. Run 'forge test -vvv' in contracts/ to debug." -ForegroundColor Red
    }
} else {
    Write-Host "  Foundry not found, skipping contract tests." -ForegroundColor Gray
}

# 6. Done
Write-Host ""
Write-Host "[6/6] Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "  To start the backend, run:" -ForegroundColor Cyan
Write-Host "    .\start.ps1" -ForegroundColor White
Write-Host ""
Write-Host "  Then open: http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host ""

Set-Location $PSScriptRoot
