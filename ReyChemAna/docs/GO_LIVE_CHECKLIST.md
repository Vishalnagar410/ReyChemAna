# Go-Live Checklist

Complete this checklist before declaring the system ready for production use.

---

## 🔐 Phase 1: Security Hardening

### Backend Configuration

- [ ] `.env` file created in `backend/` directory
- [ ] `DEBUG=False` set in `.env`
- [ ] Strong `SECRET_KEY` generated (64 characters)
  ```powershell
  python -c "import secrets; print(secrets.token_hex(32))"
  ```
- [ ] `DATABASE_URL` configured with production credentials
- [ ] Upload directory set to `D:\LIMS_Data\uploads`
- [ ] `ALLOWED_ORIGINS` configured with server IP only
- [ ] JWT token expiry set (recommend 480 minutes / 8 hours)

### Frontend Configuration

- [ ] `.env` file created in `frontend/` directory
- [ ] `VITE_API_URL` set to server IP (e.g., `http://192.168.1.100:8000/api`)
- [ ] Frontend built for production: `npm run build`

### Database Security

- [ ] Dedicated database user created (not `postgres` superuser)
- [ ] Strong database password set
- [ ] Database permissions limited to necessary access only
- [ ] PostgreSQL configured to listen on localhost only

### User Accounts

- [ ] ALL default passwords changed
  - [ ] admin password changed
  - [ ] chemist1 password changed
  - [ ] analyst1 password changed
  - [ ] All test users deleted or deactivated
- [ ] Real user accounts created for all lab staff
- [ ] Each user has received their credentials privately

### Network & Firewall

- [ ] Server IP address documented
- [ ] Windows Firewall configured for private network only
- [ ] Port 8000 allowed for private/domain network
- [ ] Port 8000 blocked for pub public network
- [ ] Server PC has static IP assigned (not DHCP)
- [ ] Firewall rules verified:
  ```powershell
  Get-NetFirewallRule -DisplayName "*LIMS*"
  ```

---

## 💾 Phase 2: Data Safety

### Backup System

- [ ] Backup directory structure created:
  - [ ] `D:\LIMS_Data\backups\database\`
  - [ ] `D:\LIMS_Data\backups\files\`
  - [ ] `D:\LIMS_Data\backups\config\`
  - [ ] `D:\LIMS_Data\backups\logs\`
  - [ ] `D:\LIMS_Data\scripts\`

- [ ] Backup script created (`backup_lims.ps1`)
- [ ] PostgreSQL password updated in backup script
- [ ] Backup script tested manually:
  ```powershell
  D:\LIMS_Data\scripts\backup_lims.ps1
  ```
- [ ] Backup files verified:
  - [ ] Database .dump file created
  - [ ] Files .zip file created
  - [ ] Backup log file created
- [ ] Scheduled task created (daily at 2 AM)
- [ ] Scheduled task tested:
  ```powershell
  Get-ScheduledTask -TaskName "LIMS Daily Backup"
  ```

### Secondary Backup (Highly Recommended)

- [ ] External USB drive or network share identified
- [ ] Secondary backup location configured in script
- [ ] Test copy to secondary location

### Recovery Testing

- [ ] Database restore tested successfully
- [ ] Files restore tested successfully
- [ ] Recovery procedures documented and reviewed
- [ ] Admin knows how to restore from backup

---

## 🖥️ Phase 3: System Setup

### Server Installation

- [ ] PostgreSQL 14+ installed
- [ ] Database `lims_db` created
- [ ] Python 3.10+ installed
- [ ] Node.js 18+ installed
- [ ] Backend virtual environment created
- [ ] All Python dependencies installed:
  ```powershell
  pip install -r requirements.txt
  ```
- [ ] All frontend dependencies installed:
  ```powershell
  npm install
  ```

### Database Setup

- [ ] Alembic migrations applied:
  ```powershell
  alembic upgrade head
  ```
- [ ] Seed data script executed:
  ```powershell
  python seed_data.py
  ```
- [ ] Analysis types verified in database (HPLC, NMR, LCMS, etc.)
- [ ] Test users verified in database

### File System

- [ ] Upload directory created: `D:\LIMS_Data\uploads\`
- [ ] Log directory created: `D:\LIMS_Data\logs\`
- [ ] Correct permissions set on data directories
- [ ] At least 100 GB free disk space on D: drive

### Service Configuration

- [ ] Backend runs as Windows service (NSSM) OR manually at startup
- [ ] Service configured to auto-start
- [ ] Service tested (start/stop/restart)
- [ ] Service logs configured and working

---

## ✅ Phase 4: Functional Testing

### Backend Health

- [ ] Backend starts without errors
- [ ] Health check endpoint responds:
  ```powershell
  Invoke-WebRequest http://localhost:8000/api/health
  ```
- [ ] API documentation accessible: `http://localhost:8000/api/docs`
- [ ] No errors in backend log

### Database Connectivity

- [ ] Backend connects to database successfully
- [ ] Can query users table:
  ```powershell
  psql -U postgres -d lims_db -c "SELECT COUNT(*) FROM users;"
  ```
- [ ] Can query analysis_types table
- [ ] All expected tables exist

### Authentication

- [ ] Can log in as admin
- [ ] Can log in as chemist
- [ ] Can log in as analyst
- [ ] Invalid credentials are rejected
- [ ] Inactive users cannot log in
- [ ] JWT token works for API requests

### Chemist Workflow

- [ ] Chemist can create new request
- [ ] Can select multiple analysis types
- [ ] Can set priority and due date
- [ ] Request appears in chemist's dashboard
- [ ] Request number auto-generated (REQ-XXXX format)

### Analyst Workflow

- [ ] Analyst sees all requests
- [ ] Can filter by status (Pending, In Progress)
- [ ] Can assign request to self
- [ ] Can update request status
- [ ] Can upload result files
- [ ] Files organized in request folder (e.g., `uploads/REQ-0001/`)

### Admin Workflow

- [ ] Admin can create new users
- [ ] Admin can deactivate users
- [ ] Admin can reactivate users
- [ ] User changes take effect immediately

### File Management

- [ ] File upload works (< 50MB)
- [ ] Files stored in correct request folder
- [ ] Can download files
- [ ] File names preserved correctly
- [ ] Multiple files can be uploaded to same request

### Audit Logging

- [ ] Login events recorded in audit_logs table
- [ ] Request creation logged
- [ ] Status changes logged
- [ ] File uploads logged
- [ ] Can query audit logs:
  ```sql
  SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 10;
  ```

---

## 🌐 Phase 5: Network Access

### Server Access

- [ ] Can access from server itself: `http://localhost:8000`
- [ ] Can access from server using IP: `http://SERVER_IP:8000`

### Client PC Access

- [ ] Test from at least 2 client PCs on network
- [ ] Can reach server: `ping SERVER_IP`
- [ ] Can load login page: `http://SERVER_IP:8000`
- [ ] Can log in from client PC
- [ ] Can create request from client PC
- [ ] Can upload files from client PC
- [ ] Can download files to client PC

### Launcher Distribution (If Using)

- [ ] Launcher built: `build_launcher.bat`
- [ ] Launcher .exe tested on client PC
- [ ] Launcher config file updated with server IP
- [ ] Launcher successfully opens browser to LIMS

---

## 📚 Phase 6: Documentation

### Technical Documentation

- [ ] All README files reviewed and current
- [ ] Backend README has correct setup steps
- [ ] Frontend README updated
- [ ] Deployment guide reviewed
- [ ] Production hardening guide reviewed
- [ ] Backup strategy documented
- [ ] Failure recovery procedures reviewed

### User Documentation

- [ ] Chemist user guide created
- [ ] Analyst user guide created
- [ ] Admin user guide created
- [ ] Quick reference cards printed
- [ ] SOPs ready for distribution

### System Information

- [ ] Server IP documented
- [ ] Database credentials stored securely (password manager)
- [ ] Admin credentials stored securely
- [ ] Backup locations documented
- [ ] Emergency contact information filled out
- [ ] System architecture diagram printed (optional)

---

## 👥 Phase 7: User Training

### Admin Training

- [ ] Admin trained on user creation
- [ ] Admin trained on password reset
- [ ] Admin trained on backup verification
- [ ] Admin trained on failure recovery
- [ ] Admin has access to server PC
- [ ] Admin has system credentials

### Analyst Training

- [ ] At least 2 analysts trained on system use
- [ ] Analysts practiced:
  - [ ] Picking up requests
  - [ ] Uploading files
  - [ ] Updating status
  - [ ] Completing requests
- [ ] Analysts have user guide

### Chemist Training

- [ ] All chemists trained or briefed
- [ ] Chemists practiced:
  - [ ] Creating requests
  - [ ] Tracking status
  - [ ] Downloading results
- [ ] Chemists have user guide

### Training Materials

- [ ] Training session conducted (or scheduled)
- [ ] Users know who to contact for help
- [ ] Users know server URL or have launcher

---

## 🔍 Phase 8: Monitoring & Maintenance

### Monitoring Setup

- [ ] Admin knows how to check backups
- [ ] Backup verification script tested
- [ ] Admin knows how to check logs
- [ ] Admin knows how to check disk space
- [ ] Admin understands service management

### Maintenance Schedule

- [ ] Daily: Auto-backup runs (scheduled)
- [ ] Weekly: Backup verification (admin responsibility)
- [ ] Monthly: Review user accounts
- [ ] Quarterly: Test restore procedure

### Support Structure

- [ ] IT support contact identified
- [ ] Database admin identified (if different)
- [ ] Escalation path defined
- [ ] Emergency contact card printed and posted

---

## 🚦 Phase 9: Go-Live Decision

### Pre-Launch Meeting

- [ ] IT admin ready
- [ ] Lab manager informed
- [ ] Users notified of launch date
- [ ] Support availability confirmed

### Final Checklist

- [ ] All sections above completed
- [ ] No critical issues remaining
- [ ] Rollback plan in place (restore from backup)
- [ ] First week support plan ready

### Launch Communication

- [ ] Email sent to users with:
  - [ ] LIMS URL
  - [ ] Login instructions
  - [ ] Support contact
  - [ ] User guide link
- [ ] Quick reference cards distributed

---

## 📅 First Week Monitoring

### Day 1

- [ ] Monitor for login issues
- [ ] Verify first requests created successfully
- [ ] Check for any errors in logs
- [ ] Backend still running?
- [ ] Backup ran successfully?

### Day 2-3

- [ ] First analyst workflows completed?
- [ ] File uploads working for all users?
- [ ] Any user confusion or questions?
- [ ] System performance acceptable?

### Day 7

- [ ] Weekly backup verification
- [ ] Review audit logs
- [ ] Collect user feedback
- [ ] Address any pain points
- [ ] Backups running automatically?

---

## ✅ Sign-Off

When all items are checked, complete this sign-off:

```
┌─────────────────────────────────────────────────┐
│                                                 │
│   LIMS GO-LIVE APPROVAL                        │
│                                                 │
│   System Name: Laboratory Request Management  │
│   Version: 1.0                                  │
│                                                 │
│   Checklist Completed: ___/___/______          │
│                                                 │
│   IT Administrator: ____________________       │
│   Signature: ____________________              │
│   Date: ___/___/______                         │
│                                                 │
│   Lab Manager: ____________________            │
│   Signature: ____________________              │
│   Date: ___/___/______                         │
│                                                 │
│   Go-Live Date: ___/___/______                 │
│                                                 │
│   Status: □ APPROVED  □ CONDITIONALLY APPROVED │
│           □ NOT READY                          │
│                                                 │
│   Notes:                                       │
│   ______________________________________       │
│   ______________________________________       │
│   ______________________________________       │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## Post Go-Live

### Week 1

- Daily monitoring
- Quick response to issues
- Gather initial feedback

### Week 2-4

- Continue monitoring
- Address any usability issues
- Fine-tune if needed

### Month 2

- Schedule quarterly backup restore test
- Review system usage
- Plan any improvements (separate from v1)

---

**CONGRATULATIONS!**

You're ready to go live. Remember:
- Monitor closely the first week
- Respond quickly to user questions
- Keep backups running
- Document any issues for future reference

The system is designed to be stable and reliable.  
Trust your preparation!

---

**Checklist Version**: 1.0  
**Last Updated**: January 2026  
**Print and work through systematically**
