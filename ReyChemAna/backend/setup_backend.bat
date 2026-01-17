@echo off
REM Helper script to run LIMS backend setup

echo ========================================
echo LIMS Backend Setup
echo ========================================

echo.
echo Step 1: Running database migrations...
python -c "from alembic.config import Config; from alembic import command; alembic_cfg = Config('alembic.ini'); command.upgrade(alembic_cfg, 'head')"

if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Database migration failed!
    pause
    exit /b 1
)

echo SUCCESS: Database migrations completed
echo.

echo Step 2: Loading seed data...
python seed_data.py

if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Seed data loading failed!
    pause
    exit /b 1
)

echo SUCCESS: Seed data loaded
echo.

echo ========================================
echo Setup Complete!
echo ========================================
echo.
echo You can now start the backend server with:
echo python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
echo.
pause
