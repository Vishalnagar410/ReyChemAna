# Production Deployment Guide

Comprehensive guide for deploying the LIMS in a production environment.

## Pre-Deployment Checklist

- [ ] PostgreSQL installed and configured
- [ ] Server PC has static IP address
- [ ] Firewall rules configured
- [ ] Strong SECRET_KEY generated
- [ ] Default passwords changed
- [ ] Database backup strategy in place
- [ ] SSL/TLS certificates (optional but recommended)

## Server PC Requirements

### Hardware
- **CPU**: 4+ cores recommended
- **RAM**: 8GB minimum, 16GB recommended
- **Storage**: 100GB+ for database and file uploads
- **Network**: Gigabit Ethernet

### Software
- Windows 10/11 or Windows Server 2019+
- Python 3.10+
- PostgreSQL 14+
- Node.js 18+ (for frontend build)

## Step-by-Step Deployment

### 1. Database Setup

```powershell
# Install PostgreSQL from https://www.postgresql.org/download/windows/

# Create database
psql -U postgres
CREATE DATABASE lims_db;
CREATE USER lims_user WITH PASSWORD 'your-secure-password';
GRANT ALL PRIVILEGES ON DATABASE lims_db TO lims_user;
\q
```

### 2. Backend Deployment

```powershell
cd D:\CAAD_Soft\ReyChemAna\backend

# Create virtual environment
python -m venv venv
.\venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt

# Configure environment
copy .env.example .env
```

Edit `.env`:
```ini
DATABASE_URL=postgresql://lims_user:your-secure-password@localhost:5432/lims_db
SECRET_KEY=<run: openssl rand -hex 32>
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=480
DEBUG=False
ALLOWED_ORIGINS=http://your-server-ip:5173,http://your-server-ip
MAX_FILE_SIZE_MB=50
UPLOAD_DIR=uploads
```

```powershell
# Run database migrations
alembic upgrade head

# Seed initial data
python seed_data.py

# Create uploads directory
mkdir uploads

# Test backend
python app/main.py
# Should see: Application startup complete
# Test: http://localhost:8000/api/health
```

### 3. Frontend Deployment

```powershell
cd D:\CAAD_Soft\ReyChemAna\frontend

# Install dependencies
npm install

# Configure environment
copy .env.example .env
```

Edit `.env`:
```ini
VITE_API_URL=http://your-server-ip:8000/api
```

Replace `your-server-ip` with actual server IP (e.g., 192.168.1.100)

```powershell
# Build for production
npm run build

# Test build
npm run preview
```

### 4. Firewall Configuration

```powershell
# Allow backend port
New-NetFirewallRule `
  -DisplayName "LIMS Backend" `
  -Direction Inbound `
  -LocalPort 8000 `
  -Protocol TCP `
  -Action Allow

# Allow frontend port (if serving separately)
New-NetFirewallRule `
  -DisplayName "LIMS Frontend" `
  -Direction Inbound `
  -LocalPort 5173 `
  -Protocol TCP `
  -Action Allow
```

### 5. Running as Windows Service

#### Install NSSM
```powershell
# Download from https://nssm.cc/download
# Extract nssm.exe to C:\Windows\System32
```

#### Create Backend Service
```powershell
$pythonPath = "D:\CAAD_Soft\ReyChemAna\backend\venv\Scripts\python.exe"
$appDir = "D:\CAAD_Soft\ReyChemAna\backend"

nssm install LIMSBackend $pythonPath
nssm set LIMSBackend AppParameters "-m uvicorn app.main:app --host 0.0.0.0 --port 8000"
nssm set LIMSBackend AppDirectory $appDir
nssm set LIMSBackend DisplayName "LIMS Backend Service"
nssm set LIMSBackend Description "Laboratory Request Management System Backend"
nssm set LIMSBackend Start SERVICE_AUTO_START

# Start service
nssm start LIMSBackend

# Check status
nssm status LIMSBackend
```

#### Create Frontend Service (Option 1: Using serve)
```powershell
# Install serve globally
npm install -g serve

$servePath = npm root -g
$servePath = Join-Path $servePath "..\serve.cmd"
$appDir = "D:\CAAD_Soft\ReyChemAna\frontend"

nssm install LIMSFrontend $servePath
nssm set LIMSFrontend AppParameters "-s dist -p 5173 -l tcp://0.0.0.0:5173"
nssm set LIMSFrontend AppDirectory $appDir
nssm set LIMSFrontend DisplayName "LIMS Frontend Service"
nssm set LIMSFrontend Start SERVICE_AUTO_START

nssm start LIMSFrontend
```

#### Alternative: Serve Frontend from Backend
Configure FastAPI to serve static files (simpler for small deployments):

Add to `backend/app/main.py`:
```python
from fastapi.staticfiles import StaticFiles

# After creating app
app.mount("/", StaticFiles(directory="../frontend/dist", html=True), name="static")
```

Then rebuild frontend and only run backend service.

### 6. Client PC Configuration

#### Option A: Browser Bookmarks
- Distribute bookmark URL: `http://server-ip:8000`

#### Option B: Launcher Executable
```powershell
cd D:\CAAD_Soft\ReyChemAna\launcher
.\build_launcher.bat

# Copy to client PCs:
# - dist\LIMS_Launcher.exe
# - launcher_config.ini (with server IP configured)
```

### 7. SSL/TLS Setup (Recommended)

#### Using nginx as Reverse Proxy

1. Install nginx for Windows
2. Configure `nginx.conf`:

```nginx
server {
    listen 80;
    server_name your-server-ip;

    # Frontend
    location / {
        proxy_pass http://localhost:5173;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # WebSocket support (if needed in future)
    location /ws {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

3. Run nginx as service using NSSM

For HTTPS (with self-signed certificate):
```nginx
server {
    listen 443 ssl;
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    # ... same location blocks ...
}
```

## Security Hardening

### 1. Change Default Passwords
```powershell
cd backend
python
```

```python
from app.core.security import get_password_hash
print(get_password_hash("new-secure-password"))
# Update in database or create new admin
```

### 2. Generate Strong SECRET_KEY
```powershell
# Using PowerShell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))

# Or use OpenSSL
openssl rand -hex 32
```

### 3. Database Security
- Use strong password for database user
- Restrict PostgreSQL to localhost only
- Enable SSL for database connections

### 4. File Upload Security
- Limit file types (configured in backend)
- Scan uploads with antivirus (optional)
- Set file size limits (already configured)

### 5. Network Security
- Use firewall to restrict access to specific IP ranges
- Consider VPN for remote access
- Implement rate limiting (add to FastAPI)

## Backup Strategy

### Automated Daily Backup Script

Create `backup_lims.ps1`:
```powershell
$backupDir = "D:\LIMS_Backups"
$date = Get-Date -Format "yyyyMMdd_HHmmss"
$backupFile = Join-Path $backupDir "lims_backup_$date.dump"

# Create backup directory if not exists
if (!(Test-Path $backupDir)) {
    New-Item -ItemType Directory -Path $backupDir
}

# Backup database
& "C:\Program Files\PostgreSQL\14\bin\pg_dump.exe" `
    -U postgres `
    -d lims_db `
    -F c `
    -f $backupFile

# Delete backups older than 30 days
Get-ChildItem $backupDir -Filter "lims_backup_*.dump" |
    Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-30) } |
    Remove-Item

Write-Host "Backup completed: $backupFile"
```

Schedule with Task Scheduler:
```powershell
$action = New-ScheduledTaskAction -Execute "PowerShell.exe" `
    -Argument "-File D:\LIMS_Backups\backup_lims.ps1"
$trigger = New-ScheduledTaskTrigger -Daily -At 2am
Register-ScheduledTask -TaskName "LIMS Daily Backup" -Action $action -Trigger $trigger
```

## Monitoring

### Check Service Status
```powershell
# Backend
nssm status LIMSBackend

# Frontend (if separate)
nssm status LIMSFrontend

# Check if ports are listening
netstat -ano | findstr "8000"
netstat -ano | findstr "5173"
```

### View Service Logs
```powershell
# NSSM stores logs in:
# C:\Users\[user]\AppData\Local\nssm\

# Or configure custom log location
nssm set LIMSBackend AppStdout "D:\LIMS_Logs\backend_stdout.log"
nssm set LIMSBackend AppStderr "D:\LIMS_Logs\backend_stderr.log"
```

### Database Health Check
```powershell
psql -U postgres -d lims_db -c "SELECT COUNT(*) FROM users;"
psql -U postgres -d lims_db -c "SELECT COUNT(*) FROM analysis_requests;"
```

## Troubleshooting

### Service won't start
```powershell
# Check service status
nssm status LIMSBackend

# View logs
Get-Content D:\LIMS_Logs\backend_stderr.log -Tail 50

# Manually run to see errors
cd D:\CAAD_Soft\ReyChemAna\backend
.\venv\Scripts\Activate.ps1
python app/main.py
```

### Database connection errors
- Verify PostgreSQL is running: `Get-Service -Name postgresql*`
- Check DATABASE_URL in .env
- Test connection: `psql -U lims_user -d lims_db -h localhost`

### Clients can't connect
- Verify firewall rules
- Check server IP is correct
- Ping server from client
- Verify services are running

## Scaling Considerations

### For larger deployments (100+ users):

1. **Database Optimization**
   - Add indexes on frequently queried columns
   - Regular VACUUM and ANALYZE
   - Consider read replicas

2. **Caching**
   - Add Redis for session caching
   - Cache frequently accessed data

3. **Load Balancing**
   - Run multiple backend instances
   - Use nginx for load balancing

4. **File Storage**
   - Move to network storage (NAS)
   - Consider cloud storage for files

## Maintenance Schedule

### Daily
- Monitor service status
- Check disk space
- Review error logs

### Weekly
- Database backup verification
- Review audit logs
- Check for updates

### Monthly
- Update dependencies
- Review user accounts
- Database optimization (VACUUM, ANALYZE)
- Review and archive old requests

### Quarterly
- Security audit
- Performance review
- Capacity planning

## Rollback Procedure

If deployment fails:

1. **Stop services**
```powershell
nssm stop LIMSBackend
nssm stop LIMSFrontend
```

2. **Restore database**
```powershell
pg_restore -U postgres -d lims_db lims_backup_YYYYMMDD.dump
```

3. **Revert code**
```powershell
cd backend
git checkout previous-version
.\venv\Scripts\Activate.ps1
alembic downgrade -1  # If migration failed
```

4. **Restart services**
```powershell
nssm start LIMSBackend
nssm start LIMSFrontend
```

## Contact & Support

For technical issues:
1. Check logs first
2. Review troubleshooting section
3. Contact system administrator

---

**Document Version:** 1.0
**Last Updated:** January 2026
