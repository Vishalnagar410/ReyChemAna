# Production Operations Summary

Quick reference for day-to-day system operations and monitoring.

## 📊 Daily Operations (5 minutes)

### Morning Check (Automated)

These should happen automatically:
- ✅ Database backup (2 AM daily)
- ✅ Files backup (2 AM daily)
- ✅ Backend service running
- ✅ PostgreSQL service running

### What to Monitor

```powershell
# Quick health check script
# Save as: D:\LIMS_Data\scripts\daily_check.ps1

Write-Host "=== LIMS Daily Health Check ===" -ForegroundColor Cyan

# 1. Check backend is running
$backend = Get-Service LIMSBackend -ErrorAction SilentlyContinue
if ($backend -and $backend.Status -eq "Running") {
    Write-Host "✓ Backend service: Running" -ForegroundColor Green
} else {
    Write-Host "✗ Backend service: NOT RUNNING" -ForegroundColor Red
}

# 2. Check database
$db = Get-Service postgresql* -ErrorAction SilentlyContinue
if ($db -and $db.Status -eq "Running") {
    Write-Host "✓ Database: Running" -ForegroundColor Green
} else {
    Write-Host "✗ Database: NOT RUNNING" -ForegroundColor Red
}

# 3. Check last backup
$latestBackup = Get-ChildItem D:\LIMS_Data\backups\database\*.dump | 
    Sort-Object LastWriteTime -Descending | 
    Select-Object -First 1

$hoursAgo = ((Get-Date) - $latestBackup.LastWriteTime).TotalHours
if ($hoursAgo -lt 26) {
    Write-Host "✓ Backup: OK ($($ [math]::Round($hoursAgo)) hours ago)" -ForegroundColor Green
} else {
    Write-Host "✗ Backup: WARNING ($([math]::Round($hoursAgo)) hours old)" -ForegroundColor Yellow
}

# 4. Check disk space
$drive = Get-PSDrive D
$freeGB = [math]::Round($drive.Free / 1GB, 1)
if ($freeGB -gt 50) {
    Write-Host "✓ Disk space: $freeGB GB free" -ForegroundColor Green
} else {
    Write-Host "⚠ Disk space: $freeGB GB free (LOW!)" -ForegroundColor Yellow
}

Write-Host "`nAll checks complete`n" -ForegroundColor Cyan
```

Run daily:
```powershell
D:\LIMS_Data\scripts\daily_check.ps1
```

---

## 📋 Weekly Tasks (10 minutes)

### Every Monday Morning

1. **Verify Backups**:
   ```powershell
   D:\LIMS_Data\scripts\verify_backups.ps1
   ```

2. **Check System Logs**:
   ```powershell
   Get-Content D:\LIMS_Data\logs\backend.log -Tail 50
   Select-String -Path D:\LIMS_Data\logs\backend.log -Pattern "ERROR" | Select-Object -Last 10
   ```

3. **Review Disk Usage**:
   ```powershell
   Get-PSDrive D | Format-Table Name, Used, Free, @{n='UsedGB';e={[math]::Round($_.Used/1GB,2)}}, @{n='FreeGB';e={[math]::Round($_.Free/1GB,2)}}
   ```

4. **Check User Accounts**:
   - Any new users to create?
   - Any inactive users to deactivate?
   - Any password resets needed?

---

## 🔄 Monthly Tasks (30 minutes)

### First Monday of Each Month

1. **Review System Usage**:
   ```sql
   psql -U postgres -d lims_db
   
   -- How many requests this month?
   SELECT COUNT(*) FROM analysis_requests 
   WHERE created_at >= date_trunc('month', CURRENT_DATE);
   
   -- Most active chemists
   SELECT u.full_name, COUNT(ar.id) as request_count
   FROM users u
   JOIN analysis_requests ar ON u.id = ar.chemist_id
   WHERE ar.created_at >= date_trunc('month', CURRENT_DATE)
   GROUP BY u.full_name
   ORDER BY request_count DESC;
   
   -- Most requested analysis types
   SELECT at.code, COUNT(*) as count
   FROM request_analysis_types rat
   JOIN analysis_types at ON rat.analysis_type_id = at.id
   JOIN analysis_requests ar ON rat.request_id = ar.id
   WHERE ar.created_at >= date_trunc('month', CURRENT_DATE)
   GROUP BY at.code
   ORDER BY count DESC;
   
   \q
   ```

2. **Clean Up Old Logs** (if > 90 days):
   ```powershell
   $cutoff = (Get-Date).AddDays(-90)
   Get-ChildItem D:\LIMS_Data\logs\*.log | 
       Where-Object {$_.LastWriteTime -lt $cutoff} | 
       Remove-Item -Force
   ```

3. **Review Backup Storage**:
   ```powershell
   $dbSize = (Get-ChildItem D:\LIMS_Data\backups\database\*.dump | 
               Measure-Object -Property Length -Sum).Sum / 1GB
   $filesSize = (Get-ChildItem D:\LIMS_Data\backups\files\*.zip | 
                  Measure-Object -Property Length -Sum).Sum / 1GB
   
   Write-Host "Database backups: $([math]::Round($dbSize, 2)) GB"
   Write-Host "Files backups: $([math]::Round($filesSize, 2)) GB"
   ```

4. **Update Passwords**: Remind users to change passwords

---

## 🔍 Quarterly Tasks (1 hour)

### Every 3 Months

1. **Test Backup Restore** (CRITICAL):
   - Create test database
   - Restore latest backup to test database
   - Verify data integrity
   - Document results

2. **Security Audit**:
   - Review active users
   - Deactivate former employees
   - Check for weak passwords
   - Review audit logs for suspicious activity

3. **Performance Review**:
   - Database size growing as expected?
   - Response times acceptable?
   - Any slow queries?

4. **Capacity Planning**:
   - Disk space projections (next 6 months)
   - Database growth rate
   - Consider archiving old data

---

## 🆘 When to Take Action

### Critical (Respond Immediately)

- ❌ Backend service stopped
- ❌ Database down
- ❌ Backups failing for 2+ days
- ❌ Disk space < 10 GB

**Action**: Follow [FAILURE_RECOVERY.md](file:///D:/CAAD_Soft/ReyChemAna/docs/FAILURE_RECOVERY.md)

### Warning (Respond Same Day)

- ⚠️ Backup is 30+ hours old
- ⚠️ Disk space < 50 GB
- ⚠️ Frequent errors in logs
- ⚠️ Multiple user complaints

**Action**: Investigate and resolve

### Informational (Note and Monitor)

- ℹ️ Single error in logs (may be transient)
- ℹ️ User requested password reset
- ℹ️ Slight increase in disk usage

**Action**: Keep an eye on it

---

## 📞 Support Response Times

| Issue Type | Response Time | Who |
|------------|---------------|-----|
| System down | Immediate | IT Admin |
| File upload failing | Within 4 hours | IT Admin |
| Password reset | Within 1 business day | Admin User |
| User training question | Within 1 business day | Lab Manager |
| Feature request | Note for future | Lab Manager |

---

## 🎯 Key Performance Indicators

### System Health

- **Uptime Target**: 99% (36 days/year downtime allowed)
- **Backup Success Rate**: 100% (zero failures acceptable)
- **Average Response Time**: < 2 seconds per page load

### Usage Metrics (Track Monthly)

- Number of requests created
- Number of requests completed
- Average time from create to complete
- Number of files uploaded
- Number of active users

### Data Growth

- Database size (MB)
- Upload directory size (GB)
- Growth rate (GB/month)

---

## 🔧 Maintenance Windows

### Planned Downtime

Schedule these during off-hours:

- **Backups**: 2:00 AM daily (5-10 minutes)
- **Windows Updates**: Schedule for weekends
- **Database Maintenance**: Once monthly, Saturday morning
- **System Upgrades**: Plan with 2-week notice to users

### User Notification Template

```
Subject: LIMS Maintenance - [Date]

Dear Lab Team,

The LIMS will be unavailable for maintenance:

Date: [Date]
Time: [Start] - [End]  (estimated)
Duration: Approximately [X] hours

During this time:
- You will not be able to log in
- Requests cannot be created
- Files cannot be uploaded

Please plan accordingly and submit urgent requests before [Time].

The system will be back online by [Time].

Thank you for your patience.

IT Admin
```

---

## 📝 Logging What Matters

### What to Log

**System Level**:
- Service start/stop
- Service failures/restarts
- Backup success/failure
- Disk space warnings

**Application Level**:
- User logins/logouts (via audit_logs)
- Failed login attempts
- Request creation/updates (via audit_logs)
- File uploads (via audit_logs)
- Errors and exceptions

### Where Logs Are

| Log Type | Location | Retention |
|----------|----------|-----------|
| Backend application | `D:\LIMS_Data\logs\backend.log` | 90 days |
| Backup logs | `D:\LIMS_Data\backups\logs\` | 30 days |
| Windows Event Log | Event Viewer → Application | System managed |
| Audit trail | Database table `audit_logs` | Forever |

### How to Review Logs

```powershell
# Recent errors
Select-String -Path D:\LIMS_Data\logs\backend.log -Pattern "ERROR" | Select-Object -Last 20

# Backup status
Get-Content D:\LIMS_Data\backups\logs\backup_*.log | Select-String "SUCCESS\|ERROR"

# Watch logs in real-time (Ctrl+C to stop)
Get-Content D:\LIMS_Data\logs\backend.log -Wait -Tail 20
```

---

## 🎓 Training Reminders

### New User Onboarding

When new lab member joins:

1. **Week before start**:
   - Create account
   - Send credentials privately

2. **Day 1**:
   - Quick 15-minute walkthrough
   - Give user guide
   - Show where to find help

3. **End of Week 1**:
   - Check in - any questions?
   - Make sure they've used it successfully

### Refreshers (Semi-Annual)

- Email user guides again
- Remind about best practices
- Share any tips or tricks discovered

---

## 📊 Monthly Report Template

```
╔════════════════════════════════════════════╗
║   LIMS MONTHLY REPORT - [Month Year]      ║
╠════════════════════════════════════════════╣
║ SYSTEM HEALTH                              ║
║   Uptime: ____%                           ║
║   Backups: ___/30 successful              ║
║   Incidents: ___                          ║
║                                           ║
║ USAGE STATISTICS                           ║
║   Requests Created: ___                    ║
║   Requests Completed: ___                  ║
║   Files Uploaded: ___                      ║
║   Active Users: ___                        ║
║                                           ║
║ STORAGE                                    ║
║   Database: ___ GB                         ║
║   Files: ___ GB                           ║
║   Backups: ___ GB                         ║
║   Free Space: ___ GB                       ║
║                                           ║
║ ISSUES & RESOLUTIONS                       ║
║   ______________________________          ║
║   ______________________________          ║
║                                           ║
║ NOTES                                      ║
║   ______________________________          ║
║   ______________________________          ║
╚════════════════════════════════════════════╝
```

---

**Keep calm and monitor regularly**  
**Backups are your best friend**  
**Document everything unusual**
