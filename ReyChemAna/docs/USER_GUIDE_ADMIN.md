# LIMS Admin Guide

System administration guide for user management and system maintenance.

## Your Admin Responsibilities

As an admin, you are responsible for:
- Creating new user accounts
- Activating and deactivating users
- Resetting forgotten passwords
- Monitoring system health
- Ensuring backups are running

---

## Logging In

1. Open browser
2. Go to: `http://[SERVER_IP]:8000`
3. Log in with admin credentials
4. You'll see the **Admin Dashboard** (user management)

---

## Creating New Users

### When to Create Users

- New chemist joins the lab
- New analyst hired
- Need another admin

### Step-by-Step

1. Click **+ New User** button (top right)
2. Fill in the form:

   **Username**: 
   - Unique identifier
   - No spaces, lowercase recommended
   - Example: `jsmith`, `john.smith`, `chemist3`

   **Email**:
   - User's work email
   - Must be unique
   - Example: `john.smith@company.com`

   **Full Name**:
   - Display name
   - Example: `John Smith`

   **Password**:
   - Initial password for the user
   - **Give this to the user privately**
   - They should change it later (see Password Reset section)
   - Minimum 6 characters
   - Recommendation: Use format like `Welcome2024!`

   **Role**:
   - **Chemist**: Can create and view own requests
   - **Analyst**: Can process all requests, upload results
   - **Admin**: Can manage users (like you)

3. Click **Create User**
4. User is created and active immediately

### After Creating User

1. Give the new user these details privately:
   - LIMS URL: `http://[SERVER_IP]:8000`
   - Their username
   - Their initial password
   - Which role they have

2. Tell them to log in and verify it works

---

## Viewing All Users

### User Table

Your dashboard shows all users:
- **Username**: Login name
- **Full Name**: Display name
- **Email**: Contact email
- **Role**: Chemist/Analyst/Admin
- **Status**: Active (green) or Inactive (red)
- **Created**: When account was created

---

## Deactivating Users

### When to Deactivate

- Employee leaves the company
- Account compromised
- Temporary suspension

### How to Deactivate

1. Find the user in the table
2. Click **Deactivate** button in the Actions column
3. Confirm if prompted

**Result**: User cannot log in anymore, but their data stays in the system.

> Their past requests and audit logs are preserved.

---

## Reactivating Users

### When to Reactivate

- Employee returns from leave
- Resolved security issue
- Temporary suspension lifted

### How to Reactivate

1. Find the inactive user (marked with red "Inactive")
2. Click **Activate** button
3. Confirm if prompted

**Result**: User can log in again with their existing password.

---

## Resetting Forgotten Passwords

Users will forget passwords. Here's how to help them:

### Method 1: Using the Reset Script (Recommended)

1. Log into the server PC
2. Open PowerShell
3. Navigate to backend:
   ```powershell
   cd D:\CAAD_Soft\ReyChemAna\backend
   .\venv\Scripts\Activate.ps1
   ```

4. Run password reset script:
   ```powershell
   python reset_password.py username_here
   ```

5. Enter new password (twice for confirmation)
6. Give new password to the user privately

### Method 2: Create New Password via Python (Alternative)

1. Log into server PC
2. Open PowerShell:
   ```powershell
   cd D:\CAAD_Soft\ReyChemAna\backend
   .\venv\Scripts\Activate.ps1
   python
   ```

3. In Python:
   ```python
   from app.database import SessionLocal
   from app.models.user import User
   from app.core.security import get_password_hash
   
   db = SessionLocal()
   user = db.query(User).filter(User.username == "username_here").first()
   user.password_hash = get_password_hash("NewPassword123")
   db.commit()
   print("Password reset successfully")
   db.close()
   ```

4. Give the new password to the user

### Method 3: Delete and Recreate User (Last Resort)

If other methods fail:
1. Deactivate the old user
2. Create a new user with same email and full name
3. Give new credentials to the user

> ⚠️ This creates a new user ID, so their old requests won't show up. Only use if absolutely necessary.

---

## Monitoring System Health

### Daily Checks (5 minutes)

1. **Check Backup Logs**:
   ```powershell
   Get-Content D:\LIMS_Data\backups\logs\backup_* | Select-Object -Last 20
   ```
   Look for "SUCCESS" messages

2. **Check Backend is Running**:
   - Open browser to: `http://localhost:8000/api/health`
   - Should say: `{"status":"healthy"}`

3. **Check Disk Space**:
   ```powershell
   Get-PSDrive D
   ```
   Free space should be > 50 GB

### Weekly Checks (10 minutes)

1. **Verify Latest Backup Exists**:
   ```powershell
   Get-ChildItem D:\LIMS_Data\backups\database\ | Sort-Object LastWriteTime -Descending | Select-Object -First 5
   ```

2. **Review Audit Logs**:
   - Log into LIMS as admin
   - Check for suspicious activity (future feature)

3. **Check for Inactive Users**:
   - Review user list
   - Deactivate anyone who left the company

### Monthly Tasks

1. **Test backup restore** (quarterly minimum):
   - Follow backup restore procedure
   - Verify data integrity

2. **Update passwords**:
   - Remind users to change passwords
   - Change your own admin password

3. **Review system usage**:
   - How many requests per month?
   - Any duplicate users to clean up?

---

## Common Admin Tasks

### Change User's Role

Currently requires database access. Contact IT.

Future: Will add UI for this.

### View User's Requests

1. Log out of admin account
2. Log in as a CHEMIST account
3. You'll only see that chemist's requests

Or: Use database query (advanced).

### Find Who Uploaded a File

Files are tracked in audit logs with user ID and timestamp.

---

## Troubleshooting Guide

### User Can't Log In

1. **Check if user is active**: Look in user table for "Inactive" status → Reactivate
2. **Verify password**: Reset password for the user
3. **Check username spelling**: Common typo issue
4. **Backend down?**: Check `http://localhost:8000/api/health`

### Backup Failed

1. Check backup log:
   ```powershell
   Get-Content D:\LIMS_Data\backups\logs\backup_*.log | Select-Object -Last 50
   ```

2. Common causes:
   - Disk full → Free up space
   - PostgreSQL stopped → Start it: `Start-Service postgresql*`
   - Password wrong → Update backup script with correct password

3. Run backup manually to test:
   ```powershell
   cd D:\LIMS_Data\scripts
   .\backup_lims.ps1
   ```

### File Upload Not Working

1. Check upload directory exists:
   ```powershell
   Test-Path D:\LIMS_Data\uploads
   ```

2. Check permissions (ensure service account can write)

3. Check disk space (may be full)

4. Check file size (limit is 50MB per file)

### System Running Slow

1. Check CPU/memory usage
2. How many requests in database? (thousands may slow things down)
3. Restart backend service
4. Check for errors in `D:\LIMS_Data\logs\backend.log`

---

## Emergency Procedures

### If Server Crashes

1. **Reboot server PC**
2. **Start PostgreSQL**:
   ```powershell
   Start-Service postgresql*
   ```
3. **Start backend service**:
   ```powershell
   Start-Service LIMSBackend
   ```
   Or manually:
   ```powershell
   cd D:\CAAD_Soft\ReyChemAna\backend
   .\venv\Scripts\Activate.ps1
   python app/main.py
   ```

4. **Verify system is up**:
   - Browser: `http://localhost:8000/api/health`
   - Should respond

### If Database Corrupted

1. **Stop backend**
2. **Restore from most recent backup**:
   - See [BACKUP_STRATEGY.md](file:///D:/CAAD_Soft/ReyChemAna/docs/BACKUP_STRATEGY.md) section 4
3. **Restart backend**
4. **Verify data** (spot-check a few recent requests)

### If You Forgot Admin Password

1. Log into server PC
2. Reset password using Method 2 above
3. Use your own username

### If Files Accidentally Deleted

1. **Stop backend service** immediately
2. **Restore files from backup**:
   - See [BACKUP_STRATEGY.md](file:///D:/CAAD_Soft/ReyChemAna/docs/BACKUP_STRATEGY.md) section 5
3. **Restart backend**

---

## Security Best Practices

### Keep Admin Credentials Secure

- ✅ Never share admin password
- ✅ Don't write it down
- ✅ Use a password manager
- ✅ Change password quarterly

### User Account Hygiene

- ✅ Deactivate users who left immediately
- ✅ Review active users monthly
- ✅ Use strong initial passwords
- ✅ Don't create unnecessary admin accounts

### System Access

- ✅ Only IT staff should access server PC
- ✅ Backend should only run on private network
- ✅ No remote access unless via secure VPN

---

## Useful Commands Reference

### Service Management

```powershell
# Check if backend service is running
Get-Service LIMSBackend

# Start backend
Start-Service LIMSBackend

# Stop backend
Stop-Service LIMSBackend

# Restart backend
Restart-Service LIMSBackend
```

### Log Checking

```powershell
# View recent backend logs
Get-Content D:\LIMS_Data\logs\backend.log -Tail 50

# View backup log
Get-Content D:\LIMS_Data\backups\logs\backup_*.log -Tail 50

# Check for errors
Select-String -Path D:\LIMS_Data\logs\backend.log -Pattern "ERROR"
```

### Database Checks

```powershell
# Connect to database
psql -U postgres -d lims_db

# Count users
SELECT COUNT(*) FROM users;

# Count requests
SELECT COUNT(*) FROM analysis_requests;

# Recent requests
SELECT request_number, compound_name, status, created_at 
FROM analysis_requests 
ORDER BY created_at DESC 
LIMIT 10;

# Exit
\q
```

---

## Training New Users

### For Chemists

1. Give them the [USER_GUIDE_CHEMIST.md](file:///D:/CAAD_Soft/ReyChemAna/docs/USER_GUIDE_CHEMIST.md)
2. Create their account
3. Walk them through:
   - Logging in
   - Creating one practice request
   - Viewing their dashboard
4. Answer questions

### For Analysts

1. Give them the [USER_GUIDE_ANALYST.md](file:///D:/CAAD_Soft/ReyChemAna/docs/USER_GUIDE_ANALYST.md)
2. Create their account
3. Show them:
   - How to pick up a request
   - How to upload files
   - How to mark complete
4. Have them process one practice request

---

## Contact Information

Keep this updated:

```
IT Administrator: __________________
Phone: ____________________________
Email: ____________________________

Database Admin: ___________________
Phone: ____________________________

Server Location: __________________
Server PC Name: ___________________
Server IP: ________________________
```

---

## Admin Quick Reference

```
┌─────────────────────────────────────────┐
│   ADMIN QUICK REFERENCE                 │
├─────────────────────────────────────────┤
│ CREATE USER                             │
│   + New User → Fill form → Create       │
│                                         │
│ DEACTIVATE USER                         │
│   Find user → Deactivate button         │
│                                         │
│ RESET PASSWORD                          │
│   Server PC → python reset_password.py  │
│                                         │
│ CHECK BACKUP                            │
│   D:\LIMS_Data\backups\logs\            │
│                                         │
│ RESTART SERVICE                         │
│   Restart-Service LIMSBackend           │
└─────────────────────────────────────────┘
```

---

**Review this guide monthly**  
**Keep contact info updated**  
**Test backups quarterly**
