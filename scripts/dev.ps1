# Start local infra and dev servers for FormForge monorepo
$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot

Set-Location $Root

Write-Host "Starting Postgres + Redis..."
docker compose up -d db redis

Write-Host "Waiting for Postgres..."
Start-Sleep -Seconds 3

Set-Location "$Root\backend"
if (-not (Test-Path ".venv")) {
    python -m venv .venv
}
& .\.venv\Scripts\Activate.ps1
pip install -q -r requirements.txt
alembic upgrade head

Write-Host ""
Write-Host "Run in separate terminals:"
Write-Host "  Backend:  cd backend && .venv\Scripts\activate && uvicorn app.main:app --reload --port 8000"
Write-Host "  Frontend: cd frontend && npm run dev"
Write-Host "  Or:       vercel dev  (from repo root)"
