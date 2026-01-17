# Laboratory Request Management System (LIMS)

A production-ready internal laboratory application for managing analysis requests in drug discovery labs.

## 🎯 Overview

This system enables chemists to submit analysis requests, analysts to process them, and administrators to manage users - all through a web interface accessible on your local network.

## 📁 Project Structure

```
ReyChemAna/
├── backend/          # FastAPI backend + PostgreSQL
├── frontend/         # React + Vite web interface
├── launcher/         # Optional .exe launcher for clients
└── docs/             # Documentation
```

## ✨ Key Features

- **Multi-role System**: Chemist, Analyst, Admin roles
- **Analysis Requests**: Support for multiple analysis types per request (HPLC, NMR, LCMS, etc.)
- **File Management**: Upload/download result files organized per request
- **Audit Logging**: Track all status changes, uploads, and user actions
- **JWT Authentication**: Secure token-based auth
- **LAN Access**: Server on one PC, clients access via browser

## 🚀 Quick Start

### 1. Server PC Setup

#### Backend Setup

```powershell
# 1. Install PostgreSQL and create database
createdb lims_db

# 2. Setup backend
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt

# 3. Configure environment
copy .env.example .env
# Edit .env with your database credentials

# 4. Run migrations and seed data
alembic upgrade head
python seed_data.py

# 5. Start backend
python app/main.py
```

Backend runs on: `http://0.0.0.0:8000`

#### Frontend Setup

```powershell
# 1. Install dependencies
cd frontend
npm install

# 2. Configure environment
copy .env.example .env
# Edit .env with backend URL

# 3. Run development server
npm run dev

# OR build for production
npm run build
```

Frontend runs on: `http://0.0.0.0:5173`

### 2. Client PC Access

Clients can access the system in two ways:

**Option A: Direct Browser Access**
- Open browser to: `http://[server-ip]:8000`

**Option B: Use Launcher**
- Build launcher on server: `cd launcher && build_launcher.bat`
- Copy `LIMS_Launcher.exe` and `launcher_config.ini` to client
- Edit `launcher_config.ini` with server IP
- Double-click launcher

### 3. Default Credentials

```
Admin:    admin / admin123
Chemist:  chemist1 / chemist123
Analyst:  analyst1 / analyst123
```

⚠️ **Change these in production!**

## 📖 User Guides

### For Chemists

1. Login with chemist credentials
2. Click "New Request" to create analysis request
3. Fill in compound name, select analysis types, set priority and due date
4. Track request status on dashboard
5. Download results when completed

### For Analysts

1. Login with analyst credentials
2. View all pending requests
3. Click on a request to view details
4. Assign to yourself, update status, upload result files
5. Add analyst comments

### For Admins

1. Login with admin credentials
2. Manage users (create, activate, deactivate)
3. View all system activity via audit logs
4. Full access to all features

## 🔒 Security Features

- ✅ Bcrypt password hashing
- ✅ JWT token authentication
- ✅ Role-based access control (backend + frontend)
- ✅ SQL injection prevention (ORM)
- ✅ File upload size limits
- ✅ CORS configuration
- ✅ Comprehensive audit logging

## 📊 Technology Stack

### Backend
- FastAPI 0.104+ (Python web framework)
- PostgreSQL 14+ (Database)
- SQLAlchemy 2.0+ (ORM)
- Alembic (Migrations)
- JWT (Authentication)

### Frontend
- React 18+ (UI framework)
- Vite 5+ (Build tool)
- React Router 6+ (Routing)
- Axios (HTTP client)

## 🛠️ Production Deployment

### 1. Configure Firewall

```powershell
# Allow backend port
New-NetFirewallRule -DisplayName "LIMS Backend" -Direction Inbound -LocalPort 8000 -Protocol TCP -Action Allow
```

### 2. Environment Configuration

**Backend (.env)**:
```ini
DEBUG=False
SECRET_KEY=<strong-random-key>
DATABASE_URL=postgresql://user:pass@localhost:5432/lims_db
ALLOWED_ORIGINS=http://your-server-ip:5173
```

**Frontend (.env)**:
```ini
VITE_API_URL=http://your-server-ip:8000/api
```

### 3. Run as Windows Service (Optional)

Use NSSM to run backend as a service:
```powershell
nssm install LIMSBackend "D:\CAAD_Soft\ReyChemAna\backend\venv\Scripts\python.exe"
nssm set LIMSBackend AppParameters "-m uvicorn app.main:app --host 0.0.0.0 --port 8000"
nssm set LIMSBackend AppDirectory "D:\CAAD_Soft\ReyChemAna\backend"
nssm start LIMSBackend
```

### 4. Database Backups

```powershell
# Backup
pg_dump -U postgres -d lims_db -F c -f lims_backup_$(Get-Date -Format 'yyyyMMdd').dump

# Restore
pg_restore -U postgres -d lims_db lims_backup_20260115.dump
```

## 📚 Documentation

- [Backend README](backend/README.md) - API documentation, setup guide
- [Frontend README](frontend/README.md) - Component documentation, development guide
- [Launcher README](launcher/README.md) - Client launcher instructions
- [Implementation Plan](C:\Users\visha\.gemini\antigravity\brain\bb252ee1-ea08-4ce0-a142-2b30b98c3bd2\implementation_plan.md) - Technical architecture

## 🔍 API Documentation

When backend is running, visit:
- Swagger UI: `http://localhost:8000/api/docs`
- ReDoc: `http://localhost:8000/api/redoc`

## 🐛 Troubleshooting

### Backend won't start
- Check PostgreSQL is running
- Verify DATABASE_URL in .env
- Ensure migrations are applied: `alembic upgrade head`

### Frontend can't connect to backend
- Verify backend is running: `curl http://localhost:8000/api/health`
- Check VITE_API_URL in frontend .env
- Verify CORS settings in backend

### Client can't access from network
- Verify server firewall allows port 8000
- Ping server from client PC
- Check backend is bound to 0.0.0.0 (not 127.0.0.1)

## 📞 Support & Maintenance

### Regular Maintenance

1. **Daily**: Check audit logs for suspicious activity
2. **Weekly**: Backup database
3. **Monthly**: Update dependencies, review user accounts
4. **Quarterly**: Review and optimize database

### Updating the System

```powershell
# Backend updates
cd backend
.\venv\Scripts\Activate.ps1
pip install --upgrade -r requirements.txt
alembic upgrade head

# Frontend updates
cd frontend
npm update
npm run build
```

## 📝 License

Internal use only - Drug Discovery Lab

## 🎓 Learning Resources

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [React Documentation](https://react.dev/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

---

**Built for:** Internal Laboratory Use  
**Version:** 1.0.0  
**Last Updated:** January 2026
