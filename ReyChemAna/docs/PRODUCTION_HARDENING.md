# Production Hardening Guide

Critical security and stability configurations for production deployment.

## 1. Production Environment Configuration

### Backend `.env` File (PRODUCTION)

**Location**: `D:\CAAD_Soft\ReyChemAna\backend\.env`

```ini
# === DATABASE CONFIGURATION ===
DATABASE_URL=postgresql://lims_user:CHANGE_THIS_PASSWORD@localhost:5432/lims_db

# === SECURITY CONFIGURATION ===
# Generate with: python -c "import secrets; print(secrets.token_hex(32))"
SECRET_KEY=REPLACE_WITH_64_CHARACTER_HEX_STRING
ALGORITHM=HS256

# === JWT TOKEN SETTINGS ===
# 8 hours = 480 minutes (suitable for 1 work day)
# Users will need to re-login next day
ACCESS_TOKEN_EXPIRE_MINUTES=480

# === APPLICATION SETTINGS ===
APP_NAME=Laboratory Request Management System
DEBUG=False

# === CORS SETTINGS ===
# Only allow your server IP and localhost
# Example: http://192.168.1.100:5173,http://localhost:5173
ALLOWED_ORIGINS=http://YOUR_SERVER_IP:5173

# === FILE UPLOAD SETTINGS ===
# 50MB limit for analytical data files
MAX_FILE_SIZE_MB=50

# CRITICAL: Upload directory should be OUTSIDE backend code directory
UPLOAD_DIR=D:\LIMS_Data\uploads
```

### Frontend `.env` File (PRODUCTION)

**Location**: `D:\CAAD_Soft\ReyChemAna\frontend\.env`

```ini
# Backend API URL - use server's actual IP address
VITE_API_URL=http://YOUR_SERVER_IP:8000/api
```

---

## 2. Generate Secure SECRET_KEY

**CRITICAL**: Never use the example key. Generate a unique one.

```powershell
# Method 1: Using Python (recommended)
python -c "import secrets; print(secrets.token_hex(32))"

# Method 2: Using PowerShell
$bytes = New-Object byte[] 32
[System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
[System.BitConverter]::ToString($bytes).Replace('-','').ToLower()
```

Copy the output (64 characters) to `SECRET_KEY` in `.env`.

---

## 3. Database User Security

### Create Dedicated Database User

Do NOT use `postgres` superuser in production.

```powershell
psql -U postgres
```

```sql
-- Create dedicated user
CREATE USER lims_user WITH PASSWORD 'STRONG_RANDOM_PASSWORD';

-- Grant only necessary privileges
GRANT ALL PRIVILEGES ON DATABASE lims_db TO lims_user;

-- Connect to database
\c lims_db

-- Grant schema privileges
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO lims_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO lims_user;

-- For future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public
GRANT ALL PRIVILEGES ON TABLES TO lims_user;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
GRANT ALL PRIVILEGES ON SEQUENCES TO lims_user;

\q
```

Update `DATABASE_URL` in `.env` with the new user credentials.

---

## 4. Change All Default Passwords

### Option A: Update Directly in Database

```powershell
cd D:\CAAD_Soft\ReyChemAna\backend
.\venv\Scripts\Activate.ps1
python
```

```python
from app.database import SessionLocal
from app.models.user import User
from app.core.security import get_password_hash

db = SessionLocal()

# Update admin password
admin = db.query(User).filter(User.username == "admin").first()
admin.password_hash = get_password_hash("NEW_SECURE_PASSWORD")

# Update chemist1 password
chemist = db.query(User).filter(User.username == "chemist1").first()
chemist.password_hash = get_password_hash("NEW_SECURE_PASSWORD")

# Update analyst1 password
analyst = db.query(User).filter(User.username == "analyst1").first()
analyst.password_hash = get_password_hash("NEW_SECURE_PASSWORD")

db.commit()
print("Passwords updated successfully")
db.close()
```

### Option B: Create Password Update Script

Create `reset_password.py` in backend folder:

```python
"""Password reset script for LIMS users"""
import sys
from getpass import getpass
from app.database import SessionLocal
from app.models.user import User
from app.core.security import get_password_hash

def reset_password(username):
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.username == username).first()
        if not user:
            print(f"User '{username}' not found")
            return
        
        password = getpass(f"New password for {username}: ")
        confirm = getpass("Confirm password: ")
        
        if password != confirm:
            print("Passwords do not match")
            return
        
        if len(password) < 8:
            print("Password must be at least 8 characters")
            return
        
        user.password_hash = get_password_hash(password)
        db.commit()
        print(f"Password updated for {username}")
    finally:
        db.close()

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python reset_password.py <username>")
        sys.exit(1)
    
    reset_password(sys.argv[1])
```

Usage:
```powershell
python reset_password.py admin
```

---

## 5. CORS Security for LAN-Only Usage

The system should ONLY accept connections from:
1. The server itself (localhost)
2. Client PCs on your LAN

### Determine Your Server IP

```powershell
ipconfig | Select-String -Pattern "IPv4"
```

Example output: `192.168.1.100`

### Update ALLOWED_ORIGINS

In `backend/.env`:
```ini
# Allow only your internal network
ALLOWED_ORIGINS=http://192.168.1.100:5173,http://localhost:5173,http://127.0.0.1:5173
```

### Block External Access (Firewall)

```powershell
# Remove any public firewall rules
Remove-NetFirewallRule -DisplayName "LIMS Backend" -ErrorAction SilentlyContinue

# Add rule for private network only
New-NetFirewallRule `
    -DisplayName "LIMS Backend (LAN Only)" `
    -Direction Inbound `
    -LocalPort 8000 `
    -Protocol TCP `
    -Action Allow `
    -Profile Private

# Block from public networks
New-NetFirewallRule `
    -DisplayName "LIMS Backend (Block Public)" `
    -Direction Inbound `
    -LocalPort 8000 `
    -Protocol TCP `
    -Action Block `
    -Profile Public
```

---

## 6. JWT Token Expiry Best Practices

### Current Configuration (8 hours)
- **Pros**: Full work day without re-login
- **Cons**: If token stolen, valid until expiry

### Recommended Settings

**For normal lab use** (current setting):
```ini
ACCESS_TOKEN_EXPIRE_MINUTES=480  # 8 hours
```

**For high-security labs**:
```ini
ACCESS_TOKEN_EXPIRE_MINUTES=240  # 4 hours (half-day)
```

**For low-security, convenience**:
```ini
ACCESS_TOKEN_EXPIRE_MINUTES=720  # 12 hours
```

**Do NOT use**:
- Less than 60 minutes (too annoying)
- More than 24 hours (security risk)

---

## 7. File Upload Directory Safety

### Move Upload Directory Outside Code

**Current**: `backend/uploads/` (inside code directory)
**Production**: External dedicated directory

```powershell
# Create dedicated data directory
New-Item -ItemType Directory -Path "D:\LIMS_Data"
New-Item -ItemType Directory -Path "D:\LIMS_Data\uploads"

# Set permissions (restrict to service account if running as service)
# For now, ensure SYSTEM and Administrators have full control
```

Update `backend/.env`:
```ini
UPLOAD_DIR=D:\LIMS_Data\uploads
```

### Benefits:
- ✅ Survives code updates
- ✅ Easier to backup separately
- ✅ Can be on different drive
- ✅ Clearer separation of code vs data

---

## 8. Disable Debug Mode

### Backend

In `backend/.env`:
```ini
DEBUG=False
```

Verify in `backend/app/database.py`:
```python
engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,
    echo=settings.DEBUG  # Will be False in production
)
```

### Frontend

In `frontend/vite.config.js`, production build automatically disables debug:
```javascript
// No changes needed - npm run build handles this
```

---

## 9. Log File Configuration

### Backend Logs

Update `backend/app/main.py` to add file logging:

```python
import logging
from logging.handlers import RotatingFileHandler
import os

# Create logs directory
os.makedirs("D:/LIMS_Data/logs", exist_ok=True)

# Configure logging
logger = logging.getLogger("uvicorn.error")
handler = RotatingFileHandler(
    "D:/LIMS_Data/logs/backend.log",
    maxBytes=10*1024*1024,  # 10MB
    backupCount=10
)
formatter = logging.Formatter(
    '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
handler.setFormatter(formatter)
logger.addHandler(handler)
```

---

## 10. Pre-Production Verification Checklist

Run these checks before going live:

```powershell
# 1. Check .env files exist and have production values
Test-Path D:\CAAD_Soft\ReyChemAna\backend\.env
Test-Path D:\CAAD_Soft\ReyChemAna\frontend\.env

# 2. Verify DEBUG is False
Select-String -Path D:\CAAD_Soft\ReyChemAna\backend\.env -Pattern "DEBUG=False"

# 3. Check SECRET_KEY is not default
Select-String -Path D:\CAAD_Soft\ReyChemAna\backend\.env -Pattern "SECRET_KEY"

# 4. Verify upload directory exists
Test-Path D:\LIMS_Data\uploads

# 5. Check database connection
cd D:\CAAD_Soft\ReyChemAna\backend
.\venv\Scripts\Activate.ps1
python -c "from app.database import engine; engine.connect(); print('DB OK')"

# 6. Verify firewall rules
Get-NetFirewallRule -DisplayName "*LIMS*"

# 7. Test backend startup
python app/main.py
# Should see: "Application startup complete"
# Ctrl+C to stop
```

---

## 11. Security Hardening Summary

| Item | Status | Action |
|------|--------|--------|
| SECRET_KEY | ⚠️ | Generate unique 64-char hex |
| DEBUG | ⚠️ | Set to False |
| Database password | ⚠️ | Use strong password |
| Default user passwords | ⚠️ | Change all |
| CORS origins | ⚠️ | Set to server IP only |
| Upload directory | ⚠️ | Move to D:\LIMS_Data |
| Firewall rules | ⚠️ | Private network only |
| JWT expiry | ✅ | 8 hours (reasonable) |

---

## 12. Quick Production Setup Script

Save as `production_setup.ps1`:

```powershell
# LIMS Production Setup Script
Write-Host "=== LIMS Production Setup ===" -ForegroundColor Cyan

# 1. Create data directories
Write-Host "`n1. Creating data directories..." -ForegroundColor Yellow
New-Item -ItemType Directory -Path "D:\LIMS_Data" -Force | Out-Null
New-Item -ItemType Directory -Path "D:\LIMS_Data\uploads" -Force | Out-Null
New-Item -ItemType Directory -Path "D:\LIMS_Data\backups" -Force | Out-Null
New-Item -ItemType Directory -Path "D:\LIMS_Data\logs" -Force | Out-Null
Write-Host "✓ Directories created" -ForegroundColor Green

# 2. Generate SECRET_KEY
Write-Host "`n2. Generating SECRET_KEY..." -ForegroundColor Yellow
$secretKey = python -c "import secrets; print(secrets.token_hex(32))"
Write-Host "✓ Generated: $secretKey" -ForegroundColor Green
Write-Host "  Add this to backend/.env as SECRET_KEY" -ForegroundColor Cyan

# 3. Get server IP
Write-Host "`n3. Server IP address:" -ForegroundColor Yellow
$ip = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.IPAddress -like "192.168.*"}).IPAddress
Write-Host "✓ Server IP: $ip" -ForegroundColor Green
Write-Host "  Update ALLOWED_ORIGINS and VITE_API_URL with this IP" -ForegroundColor Cyan

# 4. Configure firewall
Write-Host "`n4. Configuring firewall..." -ForegroundColor Yellow
Remove-NetFirewallRule -DisplayName "LIMS*" -ErrorAction SilentlyContinue
New-NetFirewallRule -DisplayName "LIMS Backend (LAN Only)" -Direction Inbound -LocalPort 8000 -Protocol TCP -Action Allow -Profile Private | Out-Null
Write-Host "✓ Firewall configured for private network only" -ForegroundColor Green

Write-Host "`n=== Setup Complete ===" -ForegroundColor Cyan
Write-Host "`nNext steps:" -ForegroundColor Yellow
Write-Host "1. Update backend/.env with SECRET_KEY above"
Write-Host "2. Set DEBUG=False in backend/.env"
Write-Host "3. Update ALLOWED_ORIGINS with server IP: http://$ip:5173"
Write-Host "4. Update UPLOAD_DIR=D:\LIMS_Data\uploads in backend/.env"
Write-Host "5. Change all default passwords"
Write-Host "6. Run database migrations: alembic upgrade head"
```

Run with:
```powershell
.\production_setup.ps1
```

---

**Last Updated**: January 2026  
**Review**: Before every production deployment
