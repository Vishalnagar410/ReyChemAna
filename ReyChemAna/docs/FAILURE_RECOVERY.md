# Failure & Recovery Procedures

Quick response guides for common failure scenarios.

## 🚨 Emergency Response Protocol

**STAY CALM**  
Most failures can be recovered. Follow these procedures step-by-step.

---

## Scenario 1: Backend Service Crash

### Symptoms
- Users cannot log in
- Dashboard won't load  
- Error: "Cannot connect to server"
- Browser spins forever

### Quick Diagnosis

```powershell
# Check if backend is running
Get-Process -Name python -ErrorAction SilentlyContinue

# Or check service
Get-Service LIMSBackend -ErrorAction SilentlyContinue
```

### Recovery Steps

#### If Running as Service

```powershell
# Restart service
Restart-Service LIMSBackend

# Wait 30 seconds, then test
Start-Sleep -Seconds 30
Invoke-WebRequest http://localhost:8000/api/health
```

#### If Running Manually

```powershell
# Stop any stuck processes
Get-Process python | Where-Object {$_.Path -like "*ReyChemAna*"} | Stop-Process -Force

# Navigate to backend
cd D:\CAAD_Soft\ReyChemAna\backend

# Activate environment
.\venv\Scripts\Activate.ps1

# Start backend
python app/main.py
```

### Verification

```powershell
# Should see: Application startup complete
# Test in browser: http://localhost:8000/api/health
# Should return: {"status":"healthy"}
```

### If Still Failing

Check logs:
```powershell
Get-Content D:\LIMS_Data\logs\backend.log -Tail 50
```

Common errors:
- **Database connection failed**: PostgreSQL is down (see Scenario 2)
- **Port 8000 already in use**: Another process using the port
- **Module not found**: Virtual environment issue, reinstall dependencies

---

## Scenario 2: Database Down

### Symptoms
- Backend starts but crashes immediately
- Error: "Could not connect to database"
- Login page loads but login fails

### Quick Diagnosis

```powershell
# Check if PostgreSQL is running
Get-Service postgresql*
```

### Recovery Steps

#### Start PostgreSQL

```powershell
# Find PostgreSQL service name
Get-Service postgresql*

# Start it (replace with actual service name)
Start-Service postgresql-x64-14

# Verify
Get-Service postgresql* | Format-Table -AutoSize
```

#### If Service Won't Start

1. Check Event Viewer:
   ```powershell
   # Open Event Viewer
   eventvwr.msc
   # Look under Windows Logs → Application for PostgreSQL errors
   ```

2. Common causes:
   - **Disk full**: Free up space on C: or D: drive
   - **Corrupted data**: Restore from backup (see Scenario 4)
   - **Port conflict**: Another database using port 5432

#### Test Database Connection

```powershell
# Try to connect
psql -U postgres -d lims_db -c "SELECT COUNT(*) FROM users;"

# Should return number of users
```

### If Database is Corrupted

**STOP IMMEDIATELY** - Do not attempt repairs yourself

1. Stop backend service
2. Contact your IT/database administrator
3. Prepare to restore from backup (Scenario 4)

---

## Scenario 3: Network IP Change

### Symptoms
- Server works locally
- Clients cannot connect over network
- "Cannot reach server" on client PCs

### Diagnosis

Check if server IP changed:
```powershell
# Get current IP
ipconfig | Select-String "IPv4"

# Should be something like: 192.168.1.100
```

### Recovery Steps

#### Update Backend CORS Settings

1. **Edit backend `.env`**:
   ```powershell
   notepad D:\CAAD_Soft\ReyChemAna\backend\.env
   ```

2. **Update ALLOWED_ORIGINS** with new IP:
   ```ini
   ALLOWED_ORIGINS=http://NEW_IP:5173,http://localhost:5173
   ```

3. **Save and restart backend**:
   ```powershell
   Restart-Service LIMSBackend
   ```

#### Update Frontend

1. **Edit frontend `.env`**:
   ```powershell
   notepad D:\CAAD_Soft\ReyChemAna\frontend\.env
   ```

2. **Update API URL** with new IP:
   ```ini
   VITE_API_URL=http://NEW_IP:8000/api
   ```

3. **Rebuild frontend** (if serving static):
   ```powershell
   cd D:\CAAD_Soft\ReyChemAna\frontend
   npm run build
   ```

#### Update Client Launchers

If using .exe launchers:

1. **Edit launcher config on each client**:
   ```powershell
   notepad launcher_config.ini
   ```

2. **Update URL**:
   ```ini
   [Server]
   url = http://NEW_IP:8000
   ```

3. **No rebuild needed** - config is read at runtime

#### Prevent Future IP Changes

Set static IP on server:
1. Open Network Settings
2. Change adapter settings → Properties
3. IPv4 Properties → Use the following IP address
4. Set IP, Subnet, Gateway, DNS

---

## Scenario 4: Corrupted Database - Restore from Backup

### WARNING
This will replace current database with backup. Recent data may be lost.

### Before You Start

1. **Stop backend immediately**:
   ```powershell
   Stop-Service LIMSBackend
   ```

2. **Find latest good backup**:
   ```powershell
   Get-ChildItem D:\LIMS_Data\backups\database\*.dump | 
       Sort-Object LastWriteTime -Descending | 
       Select-Object -First 5
   ```

### Restore Procedure

```powershell
# Set variables (update with your paths)
$backupFile = "D:\LIMS_Data\backups\database\lims_db_YYYYMMDD_HHMMSS.dump"
$pgRestore = "C:\Program Files\PostgreSQL\14\bin\pg_restore.exe"
$psql = "C:\Program Files\PostgreSQL\14\bin\psql.exe"

# Set PostgreSQL password
$env:PGPASSWORD = "your_postgres_password"

# Drop existing database
& $psql -U postgres -c "DROP DATABASE IF EXISTS lims_db;"

# Create fresh database
& $psql -U postgres -c "CREATE DATABASE lims_db;"

# Restore from backup
& $pgRestore -U postgres -d lims_db -v $backupFile

# Clear password
$env:PGPASSWORD = $null

Write-Host "Database restored from backup"
```

### Verify Restore

```powershell
# Check table counts
psql -U postgres -d lims_db
```

```sql
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM analysis_requests;
SELECT MAX(created_at) FROM analysis_requests;
\q
```

### Restart System

```powershell
Start-Service LIMSBackend
```

### Communicate Data Loss

If backup was from yesterday:
- Today's requests may be lost
- Inform users to re-submit recent requests
- Check audit logs for what was lost

---

## Scenario 5: Accidental File Deletion

### Symptoms
- User reports missing result files
- Files visible in database but download fails
- "File not found" error

### Quick Check

```powershell
# Check if uploads directory exists
Test-Path D:\LIMS_Data\uploads

# List recent folders
Get-ChildItem D:\LIMS_Data\uploads | Sort-Object LastWriteTime -Descending | Select-Object -First 10
```

### If Single File Missing

1. **Check Recycle Bin** (if deleted via Windows Explorer)
2. **Restore from backup** (see Files Restore below)

### Files Restore Procedure

```powershell
# Stop backend
Stop-Service LIMSBackend

# Set variables
$backupZip = "D:\LIMS_Data\backups\files\uploads_YYYYMMDD_HHMMSS.zip"
$uploadDir = "D:\LIMS_Data\uploads"
$tempDir = "D:\LIMS_Data\temp_restore"

# Create temp directory
New-Item -ItemType Directory -Path $tempDir -Force

# Extract backup to temp
Expand-Archive -Path $backupZip -DestinationPath $tempDir -Force

# Copy specific request folder (less destructive than full restore)
# Example: Restore only REQ-0042 folder
Copy-Item "$tempDir\REQ-0042" -Destination "$uploadDir\REQ-0042" -Recurse -Force

# Or restore everything (overwrites all!)
# Copy-Item "$tempDir\*" -Destination $uploadDir -Recurse -Force

# Clean up temp
Remove-Item $tempDir -Recurse -Force

# Restart backend
Start-Service LIMSBackend
```

### Prevention

- **Train users**: Don't delete files from `D:\LIMS_Data\uploads` manually
- **Permissions**: Restrict folder access to service account only
- **Backups**: Ensure daily file backups are running

---

## Scenario 6: Forgotten Admin Password

### If You Have Any Working Admin Account

Log in and reset the forgotten user's password via admin dashboard (future feature) or script.

### If You Lost ALL Admin Passwords

**Recovery via Database**:

```powershell
# On server PC
cd D:\CAAD_Soft\ReyChemAna\backend
.\venv\Scripts\Activate.ps1
python
```

```python
from app.database import SessionLocal
from app.models.user import User
from app.core.security import get_password_hash

db = SessionLocal()

# Find admin user
admin = db.query(User).filter(User.username == "admin").first()

# Reset password
admin.password_hash = get_password_hash("NewAdminPassword123")
db.commit()

print("Admin password reset to: NewAdminPassword123")
db.close()
```

### If Python/Virtual Environment is Broken

**Last resort - Direct database modification**:

```powershell
psql -U postgres -d lims_db
```

```sql
-- Generate hash manually  (password = "TempPassword123")
-- Use online bcrypt generator or another system

UPDATE users 
SET password_hash = '$2b$12$hashedpasswordhere'
WHERE username = 'admin';

\q
```

> This requires knowing bcrypt format. Test on a non-admin account first.

---

## Scenario 7: Disk Full

### Symptoms
- Backend crashes
- Backups fail
- File uploads fail with "No space left"
- Slow performance

### Diagnosis

```powershell
# Check disk space
Get-PSDrive | Where-Object {$_.Name -eq 'D'}

# Find largest directories
Get-ChildItem D:\ | 
    Where-Object {$_.PSIsContainer} | 
    ForEach-Object {
        [PSCustomObject]@{
            Folder = $_.FullName
            SizeGB = [math]::Round((Get-ChildItem $_.FullName -Recurse -ErrorAction SilentlyContinue | 
                                     Measure-Object -Property Length -Sum).Sum / 1GB, 2)
        }
    } | Sort-Object SizeGB -Descending | Select-Object -First 10
```

### Recovery Steps

#### Clear Old Backups

```powershell
# Remove database backups older than 30 days
$cutoff = (Get-Date).AddDays(-30)
Get-ChildItem D:\LIMS_Data\backups\database\*.dump | 
    Where-Object {$_.LastWriteTime -lt $cutoff} | 
    Remove-Item -Force

# Remove file backups older than 90 days
$cutoff = (Get-Date).AddDays(-90)
Get-ChildItem D:\LIMS_Data\backups\files\*.zip | 
    Where-Object {$_.LastWriteTime -lt $cutoff} | 
    Remove-Item -Force
```

#### Clear Temp Files

```powershell
# Windows temp
Remove-Item $env:TEMP\* -Recurse -Force -ErrorAction SilentlyContinue

# Clear logs older than 90 days
$cutoff = (Get-Date).AddDays(-90)
Get-ChildItem D:\LIMS_Data\logs\*.log | 
    Where-Object {$_.LastWriteTime -lt $cutoff} | 
    Remove-Item -Force
```

#### Archive Old Data (If Needed)

Move old completed requests to archive:
```powershell
# Move uploads older than 1 year to external drive
$oneYearAgo = (Get-Date).AddYears(-1)
Get-ChildItem D:\LIMS_Data\uploads | 
    Where-Object {$_.LastWriteTime -lt $oneYearAgo} | 
    Move-Item -Destination "E:\LIMS_Archive\uploads\" -Force
```

> Update database to reflect new paths or mark as archived.

---

## Scenario 8: Power Outage / Unexpected Shutdown

### After Power Returns

1. **Wait for server to fully boot** (2-3 minutes)

2. **Check PostgreSQL started automatically**:
   ```powershell
   Get-Service postgresql*
   # If not running:
   Start-Service postgresql-x64-14
   ```

3. **Check backend service**:
   ```powershell
   Get-Service LIMSBackend
   # If not running:
   Start-Service LIMSBackend
   ```

4. **Verify system health**:
   ```powershell
   Invoke-WebRequest http://localhost:8000/api/health
   ```

5. **Check for data corruption**:
   ```powershell
   psql -U postgres -d lims_db -c "SELECT COUNT(*) FROM users;"
   ```

### If Database Corruption Detected

- See Scenario 4 (Database Restore)
- Power outages can corrupt PostgreSQL data
- This is why daily backups are critical!

### Prevention

- **UPS (Uninterruptible Power Supply)** for server PC (highly recommended)
- Set services to start automatically
- Enable Windows "Restart automatically after power failure"

---

## Quick Reference: Who to Call

| Problem | Call | When |
|---------|------|------|
| System completely down | IT Admin | Immediately |
| Database corruption | Database Admin / IT | Immediately |
| User password reset | Admin user | Next business day |
| File upload not working | IT Admin | Same day |
| Slow performance | IT Admin | Next business day |
| User training needed | Lab Manager | Schedule session |

---

## Disaster Recovery Decision Tree

```
Issue occurs
    ↓
Can users log in?
    NO → Backend down (Scenario 1)
    YES → Continue
    ↓
Can they see their requests?
    NO → Database issue (Scenario 2)
    YES → Continue
    ↓
Can they upload files?
    NO → Check disk space (Scenario 7)
    YES → Continue
    ↓
Files missing?
    YES → Restore files (Scenario 5)
    ↓
Network issue from clients?
    YES → Check IP (Scenario 3)
```

---

## Emergency Contact Card

**Print and keep near server:**

```
╔══════════════════════════════════════════╗
║   LIMS EMERGENCY CONTACTS               ║
╠══════════════════════════════════════════╣
║ IT Admin:  _________________________    ║
║ Phone:     _________________________    ║
║                                         ║
║ Database Admin: ____________________    ║
║ Phone:     _________________________    ║
║                                         ║
║ Lab Manager: _______________________    ║
║ Phone:     _________________________    ║
╠══════════════════════════════════════════╣
║ Server IP: _________________________    ║
║                                         ║
║ Backup Location:                        ║
║   D:\LIMS_Data\backups\                ║
║                                         ║
║ PostgreSQL Password: (in password mgr)  ║
╚══════════════════════════════════════════╝
```

---

**Test recovery procedures quarterly**  
**Keep backups current**  
**Document any custom changes to this guide**
