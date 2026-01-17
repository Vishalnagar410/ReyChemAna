# Backup & Recovery Strategy

Critical procedures for data safety and disaster recovery.

## 1. Backup Architecture

### What Gets Backed Up

1. **PostgreSQL Database** (Critical)
   - All users, requests, files metadata, audit logs
   - Backup frequency: **Daily**
   - Retention: 30 days

2. **Uploaded Files** (Critical)
   - All result files in `D:\LIMS_Data\uploads\`
   - Backup frequency: **Daily**
   - Retention: 90 days (analytical data may be needed longer)

3. **Configuration Files** (Important)
   - Backend `.env`
   - Frontend `.env`
   - Backup frequency: **After changes**
   - Retention: Keep all versions

### Backup Storage Location

**Primary**: `D:\LIMS_Data\backups\`
**Secondary** (strongly recommended): External USB drive or network share

---

## 2. Automated Daily Backup Script

### Full Backup Script

Save as `D:\LIMS_Data\scripts\backup_lims.ps1`:

```powershell
<#
.SYNOPSIS
    LIMS Daily Backup Script
.DESCRIPTION
    Backs up PostgreSQL database and uploaded files with rotation
.NOTES
    Run daily at 2 AM via Task Scheduler
#>

param(
    [string]$BackupRoot = "D:\LIMS_Data\backups",
    [string]$UploadDir = "D:\LIMS_Data\uploads",
    [string]$PostgresBinPath = "C:\Program Files\PostgreSQL\14\bin",
    [int]$RetentionDays = 30,
    [int]$FileRetentionDays = 90
)

# Configuration
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$date = Get-Date -Format "yyyyMMdd"
$logFile = "$BackupRoot\logs\backup_$date.log"

# Create log directory
$logDir = "$BackupRoot\logs"
if (!(Test-Path $logDir)) {
    New-Item -ItemType Directory -Path $logDir -Force | Out-Null
}

# Logging function
function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logMessage = "[$timestamp] [$Level] $Message"
    Write-Host $logMessage
    Add-Content -Path $logFile -Value $logMessage
}

Write-Log "=== LIMS Backup Started ===" "INFO"

# 1. Database Backup
Write-Log "Starting database backup..." "INFO"
$dbBackupDir = "$BackupRoot\database"
if (!(Test-Path $dbBackupDir)) {
    New-Item -ItemType Directory -Path $dbBackupDir -Force | Out-Null
}

$dbBackupFile = "$dbBackupDir\lims_db_$timestamp.dump"
$pgDumpExe = "$PostgresBinPath\pg_dump.exe"

try {
    # Set PostgreSQL password environment variable
    $env:PGPASSWORD = "your_postgres_password"  # CHANGE THIS
    
    # Run pg_dump
    & $pgDumpExe `
        -U postgres `
        -h localhost `
        -d lims_db `
        -F c `
        -f $dbBackupFile `
        -v 2>&1 | Out-Null
    
    # Clear password
    $env:PGPASSWORD = $null
    
    if (Test-Path $dbBackupFile) {
        $size = (Get-Item $dbBackupFile).Length / 1MB
        Write-Log "Database backup completed: $dbBackupFile ($([math]::Round($size, 2)) MB)" "SUCCESS"
    } else {
        Write-Log "Database backup failed: File not created" "ERROR"
        exit 1
    }
} catch {
    Write-Log "Database backup error: $_" "ERROR"
    exit 1
}

# 2. Files Backup
Write-Log "Starting files backup..." "INFO"
$filesBackupDir = "$BackupRoot\files"
if (!(Test-Path $filesBackupDir)) {
    New-Item -ItemType Directory -Path $filesBackupDir -Force | Out-Null
}

$filesBackupZip = "$filesBackupDir\uploads_$timestamp.zip"

try {
    if (Test-Path $UploadDir) {
        # Count files before backup
        $fileCount = (Get-ChildItem -Path $UploadDir -Recurse -File).Count
        
        # Create zip archive
        Compress-Archive `
            -Path "$UploadDir\*" `
            -DestinationPath $filesBackupZip `
            -Force
        
        if (Test-Path $filesBackupZip) {
            $size = (Get-Item $filesBackupZip).Length / 1MB
            Write-Log "Files backup completed: $filesBackupZip ($fileCount files, $([math]::Round($size, 2)) MB)" "SUCCESS"
        } else {
            Write-Log "Files backup failed: Archive not created" "ERROR"
        }
    } else {
        Write-Log "Upload directory not found: $UploadDir" "WARNING"
    }
} catch {
    Write-Log "Files backup error: $_" "ERROR"
}

# 3. Configuration Backup
Write-Log "Backing up configuration files..." "INFO"
$configBackupDir = "$BackupRoot\config"
if (!(Test-Path $configBackupDir)) {
    New-Item -ItemType Directory -Path $configBackupDir -Force | Out-Null
}

try {
    # Backend .env
    $backendEnv = "D:\CAAD_Soft\ReyChemAna\backend\.env"
    if (Test-Path $backendEnv) {
        Copy-Item $backendEnv "$configBackupDir\backend_env_$timestamp.txt" -Force
        Write-Log "Backed up backend .env" "SUCCESS"
    }
    
    # Frontend .env
    $frontendEnv = "D:\CAAD_Soft\ReyChemAna\frontend\.env"
    if (Test-Path $frontendEnv) {
        Copy-Item $frontendEnv "$configBackupDir\frontend_env_$timestamp.txt" -Force
        Write-Log "Backed up frontend .env" "SUCCESS"
    }
} catch {
    Write-Log "Config backup error: $_" "WARNING"
}

# 4. Cleanup Old Backups
Write-Log "Cleaning up old backups..." "INFO"

# Database backups (30 days)
$dbOldDate = (Get-Date).AddDays(-$RetentionDays)
Get-ChildItem "$dbBackupDir\*.dump" | 
    Where-Object { $_.LastWriteTime -lt $dbOldDate } | 
    ForEach-Object {
        Remove-Item $_.FullName -Force
        Write-Log "Removed old database backup: $($_.Name)" "INFO"
    }

# File backups (90 days)
$filesOldDate = (Get-Date).AddDays(-$FileRetentionDays)
Get-ChildItem "$filesBackupDir\*.zip" | 
    Where-Object { $_.LastWriteTime -lt $filesOldDate } | 
    ForEach-Object {
        Remove-Item $_.FullName -Force
        Write-Log "Removed old files backup: $($_.Name)" "INFO"
    }

# Config backups (keep last 10)
Get-ChildItem "$configBackupDir\backend_env_*.txt" | 
    Sort-Object LastWriteTime -Descending | 
    Select-Object -Skip 10 | 
    Remove-Item -Force

Get-ChildItem "$configBackupDir\frontend_env_*.txt" | 
    Sort-Object LastWriteTime -Descending | 
    Select-Object -Skip 10 | 
    Remove-Item -Force

# 5. Backup Summary
Write-Log "=== Backup Summary ===" "INFO"
$dbBackupCount = (Get-ChildItem "$dbBackupDir\*.dump").Count
$filesBackupCount = (Get-ChildItem "$filesBackupDir\*.zip").Count
$dbTotalSize = ((Get-ChildItem "$dbBackupDir\*.dump" | Measure-Object -Property Length -Sum).Sum / 1GB)
$filesTotalSize = ((Get-ChildItem "$filesBackupDir\*.zip" | Measure-Object -Property Length -Sum).Sum / 1GB)

Write-Log "Database backups: $dbBackupCount files ($([math]::Round($dbTotalSize, 2)) GB)" "INFO"
Write-Log "Files backups: $filesBackupCount files ($([math]::Round($filesTotalSize, 2)) GB)" "INFO"

Write-Log "=== LIMS Backup Completed ===" "SUCCESS"

# 6. Optional: Copy to secondary location
$secondaryBackup = "E:\LIMS_Backups"  # Change to your external drive
if (Test-Path $secondaryBackup) {
    Write-Log "Copying to secondary backup location..." "INFO"
    try {
        Copy-Item $dbBackupFile "$secondaryBackup\latest_db.dump" -Force
        Copy-Item $filesBackupZip "$secondaryBackup\latest_files.zip" -Force
        Write-Log "Secondary backup completed" "SUCCESS"
    } catch {
        Write-Log "Secondary backup failed: $_" "WARNING"
    }
}

exit 0
```

**IMPORTANT**: Edit the script and change:
- `$env:PGPASSWORD = "your_postgres_password"` to your actual password
- Paths if different
- Secondary backup location if available

---

## 3. Schedule Automated Backups

### Create Scheduled Task

```powershell
# Create backup directory and script location
$scriptPath = "D:\LIMS_Data\scripts"
New-Item -ItemType Directory -Path $scriptPath -Force

# Register scheduled task
$action = New-ScheduledTaskAction `
    -Execute "PowerShell.exe" `
    -Argument "-ExecutionPolicy Bypass -File D:\LIMS_Data\scripts\backup_lims.ps1"

$trigger = New-ScheduledTaskTrigger -Daily -At 2:00AM

$settings = New-ScheduledTaskSettingsSet `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -StartWhenAvailable

$principal = New-ScheduledTaskPrincipal `
    -UserId "SYSTEM" `
    -LogonType ServiceAccount `
    -RunLevel Highest

Register-ScheduledTask `
    -TaskName "LIMS Daily Backup" `
    -Action $action `
    -Trigger $trigger `
    -Settings $settings `
    -Principal $principal `
    -Description "Daily backup of LIMS database and files"

Write-Host "Scheduled task created: LIMS Daily Backup (runs at 2:00 AM daily)"
```

### Verify Scheduled Task

```powershell
Get-ScheduledTask -TaskName "LIMS Daily Backup"
```

### Test Backup Manually

```powershell
# Run backup script
cd D:\LIMS_Data\scripts
.\backup_lims.ps1

# Check backup files
Get-ChildItem D:\LIMS_Data\backups\database\ | Sort-Object LastWriteTime -Descending | Select-Object -First 5
Get-ChildItem D:\LIMS_Data\backups\files\ | Sort-Object LastWriteTime -Descending | Select-Object -First 5
```

---

## 4. Database Restore Procedure

### Restore from Backup

```powershell
# Stop backend service first (if running as service)
Stop-Service LIMSBackend -ErrorAction SilentlyContinue

# Set variables
$backupFile = "D:\LIMS_Data\backups\database\lims_db_20260115_020000.dump"
$pgRestoreExe = "C:\Program Files\PostgreSQL\14\bin\pg_restore.exe"
$psqlExe = "C:\Program Files\PostgreSQL\14\bin\psql.exe"

# Set password
$env:PGPASSWORD = "your_postgres_password"

# Drop existing database (CAUTION!)
& $psqlExe -U postgres -c "DROP DATABASE IF EXISTS lims_db;"

# Create fresh database
& $psqlExe -U postgres -c "CREATE DATABASE lims_db;"

# Restore from backup
& $pgRestoreExe `
    -U postgres `
    -d lims_db `
    -v `
    $backupFile

# Clear password
$env:PGPASSWORD = $null

# Verify restore
& $psqlExe -U postgres -d lims_db -c "SELECT COUNT(*) FROM users;"
& $psqlExe -U postgres -d lims_db -c "SELECT COUNT(*) FROM analysis_requests;"

Write-Host "Database restored successfully"

# Restart backend
Start-Service LIMSBackend -ErrorAction SilentlyContinue
```

---

## 5. Files Restore Procedure

### Restore Uploaded Files

```powershell
# Stop backend service
Stop-Service LIMSBackend -ErrorAction SilentlyContinue

# Set variables
$backupZip = "D:\LIMS_Data\backups\files\uploads_20260115_020000.zip"
$uploadDir = "D:\LIMS_Data\uploads"

# Backup current uploads (just in case)
if (Test-Path $uploadDir) {
    $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
    Rename-Item $uploadDir "$uploadDir`_before_restore_$timestamp"
    Write-Host "Current uploads backed up to: $uploadDir`_before_restore_$timestamp"
}

# Create fresh upload directory
New-Item -ItemType Directory -Path $uploadDir -Force

# Extract backup
Expand-Archive -Path $backupZip -DestinationPath $uploadDir -Force

Write-Host "Files restored successfully"

# Restart backend
Start-Service LIMSBackend -ErrorAction SilentlyContinue
```

---

## 6. Weekly Backup Verification

### Create Verification Script

Save as `verify_backups.ps1`:

```powershell
# LIMS Backup Verification Script
$backupRoot = "D:\LIMS_Data\backups"
$today = Get-Date

Write-Host "=== LIMS Backup Verification ===" -ForegroundColor Cyan

# Check daily database backup exists
$dbBackups = Get-ChildItem "$backupRoot\database\*.dump" | Sort-Object LastWriteTime -Descending
$latestDbBackup = $dbBackups | Select-Object -First 1

if ($latestDbBackup) {
    $age = ($today - $latestDbBackup.LastWriteTime).TotalHours
    if ($age -lt 26) {
        Write-Host "✓ Database backup: OK ($($ latestDbBackup.Name), $([math]::Round($age, 1)) hours old)" -ForegroundColor Green
    } else {
        Write-Host "✗ Database backup: WARNING (Last backup is $([math]::Round($age, 1)) hours old)" -ForegroundColor Yellow
    }
} else {
    Write-Host "✗ Database backup: MISSING" -ForegroundColor Red
}

# Check files backup
$filesBackups = Get-ChildItem "$backupRoot\files\*.zip" | Sort-Object LastWriteTime -Descending
$latestFilesBackup = $filesBackups | Select-Object -First 1

if ($latestFilesBackup) {
    $age = ($today - $latestFilesBackup.LastWriteTime).TotalHours
    if ($age -lt 26) {
        Write-Host "✓ Files backup: OK ($($latestFilesBackup.Name), $([math]::Round($age, 1)) hours old)" -ForegroundColor Green
    } else {
        Write-Host "✗ Files backup: WARNING (Last backup is $([math]::Round($age, 1)) hours old)" -ForegroundColor Yellow
    }
} else {
    Write-Host "✗ Files backup: MISSING" -ForegroundColor Red
}

# Check total backup sizes
$dbTotalSize = ($dbBackups | Measure-Object -Property Length -Sum).Sum / 1GB
$filesTotalSize = ($filesBackups | Measure-Object -Property Length -Sum).Sum / 1GB

Write-Host "`nBackup storage:" -ForegroundColor Cyan
Write-Host "  Database: $([math]::Round($dbTotalSize, 2)) GB ($($dbBackups.Count) files)"
Write-Host "  Files: $([math]::Round($filesTotalSize, 2)) GB ($($filesBackups.Count) files)"

# Check disk space
$drive = Get-PSDrive D
$freeSpaceGB = $drive.Free / 1GB
Write-Host "`nDisk D: free space: $([math]::Round($freeSpaceGB, 2)) GB" -ForegroundColor Cyan

if ($freeSpaceGB -lt 10) {
    Write-Host "⚠ WARNING: Low disk space!" -ForegroundColor Yellow
}
```

Run weekly:
```powershell
.\verify_backups.ps1
```

---

## 7. Backup Retention Policy

### Recommended Schedule

| Backup Type | Frequency | Retention | Location |
|-------------|-----------|-----------|----------|
| Database | Daily @ 2 AM | 30 days | D:\LIMS_Data\backups\database |
| Files | Daily @ 2 AM | 90 days | D:\LIMS_Data\backups\files |
| Config | On change | Last 10 | D:\LIMS_Data\backups\config |
| **Secondary** | Daily | 7 days | External USB/Network |

### Disk Space Calculation

Typical sizes:
- Database dump: 50-500 MB (depends on # of requests)
- Files backup: Varies widely (could be 1-10 GB+)

**Example**: 30 days db + 90 days files
- Database: 30 × 200 MB = 6 GB
- Files: 90 × 2 GB = 180 GB
- **Total**: ~200 GB needed

Ensure D: drive has adequate space (recommend 500 GB minimum).

---

## 8. Disaster Recovery Scenarios

### Complete System Loss

1. **Reinstall Windows and software**
   - PostgreSQL, Python, Node.js

2. **Restore code from repository or backup**
   ```powershell
   # If using git
   git clone <repository> D:\CAAD_Soft\ReyChemAna
   
   # Or restore from backup
   ```

3. **Restore configuration**
   ```powershell
   Copy-Item "D:\LIMS_Data\backups\config\backend_env_*.txt" "D:\CAAD_Soft\ReyChemAna\backend\.env"
   Copy-Item "D:\LIMS_Data\backups\config\frontend_env_*.txt" "D:\CAAD_Soft\ReyChemAna\frontend\.env"
   ```

4. **Restore database** (see section 4)

5. **Restore files** (see section 5)

6. **Rebuild frontend**
   ```powershell
   cd frontend
   npm install
   npm run build
   ```

7. **Restart services**

Total recovery time: **1-2 hours**

---

## 9. Emergency Contact Info

**Keep this info updated and printed:**

```
=================================
LIMS Emergency Recovery Info
=================================

Server IP: _________________

Database:
  Name: lims_db
  User: lims_user
  Password: (in password manager)

Backup Location: D:\LIMS_Data\backups

PostgreSQL Bin: C:\Program Files\PostgreSQL\14\bin

Restore Command:
  pg_restore -U postgres -d lims_db -v [backup_file]

Admin Username: admin
Admin Password: (in password manager)

Last Backup: (check D:\LIMS_Data\backups\logs)

IT Contact: _________________
Phone: _________________
```

---

**Review backup logs weekly**  
**Test restore quarterly**  
**Keep secondary backup offsite**
