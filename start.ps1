Set-Location $PSScriptRoot

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host "Docker Desktop is required to start Postgres and Redis. Install Docker Desktop and rerun this script." -ForegroundColor Red
    exit 1
}

Write-Host "Starting local dependencies (Postgres + Redis)..." -ForegroundColor Yellow
docker compose up postgres redis -d
if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to start Docker services. Check 'docker compose ps' and Docker Desktop." -ForegroundColor Red
    exit $LASTEXITCODE
}
Start-Sleep -Seconds 8

Set-Location "$PSScriptRoot\backend"
& ".venv\Scripts\Activate.ps1"
uvicorn app.main:app --reload --port 8000
