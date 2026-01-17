# LIMS Quick Setup Script
# Run this after activating venv

Write-Host "=== LIMS Backend Quick Setup ===" -ForegroundColor Cyan
Write-Host ""

# Step 1: Create database
Write-Host "Step 1: Creating PostgreSQL database..." -ForegroundColor Yellow
Write-Host "Please enter your PostgreSQL password when prompted" -ForegroundColor Gray
Write-Host ""

$pgPath = "C:\Program Files\PostgreSQL\18\bin\psql.exe"

if (Test-Path $pgPath) {
    & $pgPath -U postgres -c "CREATE DATABASE lims_db;" 2>&1 | Out-Null
    
    # Check if database exists
    $dbCheck = & $pgPath -U postgres -lqt | Select-String -Pattern "lims_db"
    
    if ($dbCheck) {
        Write-Host "✓ Database 'lims_db' created successfully" -ForegroundColor Green
    } else {
        Write-Host "✓ Database 'lims_db' already exists" -ForegroundColor Green
    }
}
 else {
    Write-Host "⚠ PostgreSQL not found at expected location" -ForegroundColor Yellow
    Write-Host "Please create database manually: CREATE DATABASE lims_db;" -ForegroundColor Gray
}

Write-Host ""

# Step 2: Run migrations
Write-Host "Step 2: Running database migrations..." -ForegroundColor Yellow

try {
    python -c "from alembic.config import Config; from alembic import command; cfg = Config('alembic.ini'); command.upgrade(cfg, 'head')"
    
    if ($LAST EXIT_CODE -eq 0) {
        Write-Host "✓ Database migrations completed" -ForegroundColor Green
    } else {
        Write-Host "✗ Migration failed - check your DATABASE_URL in .env" -ForegroundColor Red
        Write-Host "Make sure the password in .env matches your PostgreSQL password" -ForegroundColor Gray
        exit 1
    }
} catch {
    Write-Host "✗ Migration failed: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Step 3: Load seed data
Write-Host "Step 3: Loading initial data..." -ForegroundColor Yellow

try {
    python seed_data.py
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Seed data loaded successfully" -ForegroundColor Green
    } else {
        Write-Host "✗ Seed data loading failed" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "✗ Seed data failed: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "=== Setup Complete! ===" -ForegroundColor Green
Write-Host ""
Write-Host "Default login credentials:" -ForegroundColor Cyan
Write-Host "  Admin:   admin / admin123" -ForegroundColor White
Write-Host "  Chemist: chemist1 / chemist123" -ForegroundColor White
Write-Host "  Analyst: analyst1 / analyst123" -ForegroundColor White
Write-Host ""
Write-Host "To start the backend server, run:" -ForegroundColor Cyan
Write-Host "  python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload" -ForegroundColor White
Write-Host ""
