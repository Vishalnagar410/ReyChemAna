# Laboratory Request Management System - Backend

Production-ready backend for a drug discovery laboratory request management system.

## Technology Stack

- **Framework**: FastAPI 0.104+
- **Database**: PostgreSQL 14+
- **ORM**: SQLAlchemy 2.0+
- **Migrations**: Alembic
- **Authentication**: JWT (python-jose)
- **Password Hashing**: bcrypt (passlib)

## Project Structure

```
backend/
├── alembic/                  # Database migrations
├── app/
│   ├── api/                 # API endpoints
│   │   ├── auth.py         # Authentication
│   │   ├── users.py        # User management
│   │   ├── requests.py     # Analysis requests
│   │   └── files.py        # File upload/download
│   ├── core/               # Core utilities
│   │   ├── security.py     # JWT & password hashing
│   │   └── permissions.py  # Role-based access
│   ├── models/             # Database models
│   ├── schemas/            # Pydantic schemas
│   ├── utils/              # Utilities (audit logging)
│   ├── config.py           # Configuration
│   ├── database.py         # Database setup
│   ├── dependencies.py     # FastAPI dependencies
│   └── main.py             # Application entry
├── uploads/                # File storage (created automatically)
├── .env                    # Environment variables
├── .env.example            # Environment template
├── requirements.txt        # Python dependencies
├── alembic.ini            # Alembic configuration
└── seed_data.py           # Database seed script
```

## Setup Instructions

### 1. Prerequisites

- Python 3.10 or higher
- PostgreSQL 14 or higher
- PowerShell (Windows)

### 2. Install PostgreSQL

1. Download PostgreSQL from: https://www.postgresql.org/download/windows/
2. Install and remember the postgres user password
3. Create a database:

```powershell
# Open PowerShell and run:
psql -U postgres

# In psql prompt:
CREATE DATABASE lims_db;
\q
```

### 3. Create Virtual Environment

```powershell
# Navigate to backend directory
cd D:\CAAD_Soft\ReyChemAna\backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
.\venv\Scripts\Activate.ps1

# If you get execution policy error, run:
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### 4. Install Dependencies

```powershell
pip install -r requirements.txt
```

### 5. Configure Environment

```powershell
# Copy environment template
copy .env.example .env

# Edit .env file and update:
# - DATABASE_URL with your PostgreSQL credentials
# - SECRET_KEY (use a strong random key)
```

Example `.env`:
```ini
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/lims_db
SECRET_KEY=your-very-secret-key-change-this
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=480
DEBUG=True
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
MAX_FILE_SIZE_MB=50
UPLOAD_DIR=uploads
```

### 6. Run Database Migrations

```powershell
# Initialize Alembic (if needed)
alembic revision --autogenerate -m "initial migration"

# Apply migrations
alembic upgrade head
```

### 7. Seed Database

```powershell
python seed_data.py
```

This creates:
- Default admin user: `admin` / `admin123`
- Sample chemists: `chemist1` / `chemist123`
- Sample analysts: `analyst1` / `analyst123`
- Standard analysis types (HPLC, NMR, LCMS, etc.)

### 8. Run the Application

```powershell
# Development mode with auto-reload
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Or using the main.py directly
python app/main.py
```

The API will be available at:
- http://localhost:8000 (or http://your-ip:8000 from LAN)
- API Documentation: http://localhost:8000/api/docs
- Alternative Docs: http://localhost:8000/api/redoc

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login and get JWT token
- `POST /api/auth/logout` - Logout (audit log only)

### Users (Admin only)
- `POST /api/users/` - Create user
- `GET /api/users/` - List users (with pagination)
- `GET /api/users/{id}` - Get user by ID
- `PATCH /api/users/{id}` - Update user
- `GET /api/users/me` - Get current user info

### Requests
- `POST /api/requests/` - Create request (Chemist)
- `GET /api/requests/` - List requests (with filters)
- `GET /api/requests/{id}` - Get request details
- `PATCH /api/requests/{id}` - Update request (Analyst)
- `PATCH /api/requests/{id}/chemist` - Update own request (Chemist)
- `GET /api/requests/analysis-types/` - List analysis types

### Files
- `POST /api/files/upload/{request_id}` - Upload files (Analyst)
- `GET /api/files/download/{file_id}` - Download file
- `DELETE /api/files/{file_id}` - Delete file (Analyst)
- `GET /api/files/request/{request_id}` - List files for request

## Features

✅ JWT-based authentication with single token
✅ Role-based access control (Chemist, Analyst, Admin)
✅ Multiple analysis types per request (normalized)
✅ Files organized in per-request folders (REQ-XXXX)
✅ Comprehensive audit logging
✅ Password hashing with bcrypt
✅ CORS configured for frontend
✅ Automatic API documentation
✅ Database migrations with Alembic
✅ Environment-based configuration

## Production Deployment

### 1. Update .env for Production

```ini
DEBUG=False
SECRET_KEY=<generate-strong-random-key>
ALLOWED_ORIGINS=http://your-server-ip:5173
```

### 2. Configure Windows Firewall

```powershell
# Allow port 8000
New-NetFirewallRule -DisplayName "LIMS Backend" -Direction Inbound -LocalPort 8000 -Protocol TCP -Action Allow
```

### 3. Run as Windows Service (Optional)

Use NSSM (Non-Sucking Service Manager) to run as a service:

```powershell
# Download NSSM from https://nssm.cc/download
nssm install LIMSBackend "D:\CAAD_Soft\ReyChemAna\backend\venv\Scripts\python.exe" "-m uvicorn app.main:app --host 0.0.0.0 --port 8000"
nssm set LIMSBackend AppDirectory "D:\CAAD_Soft\ReyChemAna\backend"
nssm start LIMSBackend
```

## Database Backup

```powershell
# Backup database
pg_dump -U postgres -d lims_db -F c -f lims_backup.dump

# Restore database
pg_restore -U postgres -d lims_db lims_backup.dump
```

## Security Notes

⚠️ **IMPORTANT**:
1. Change all default passwords immediately
2. Use a strong SECRET_KEY (generate with: `openssl rand -hex 32`)
3. Keep DATABASE_URL credentials secure
4. Regularly backup the database
5. Monitor audit logs for suspicious activity
6. Use HTTPS in production (nginx reverse proxy recommended)

## Troubleshooting

### Port Already in Use
```powershell
# Find process using port 8000
netstat -ano | findstr :8000

# Kill the process
taskkill /PID <PID> /F
```

### Database Connection Error
- Verify PostgreSQL is running
- Check DATABASE_URL in .env
- Ensure database exists

### Import Errors
- Activate virtual environment
- Reinstall dependencies: `pip install -r requirements.txt`

## Support

For issues or questions, check:
- FastAPI docs: https://fastapi.tiangolo.com/
- SQLAlchemy docs: https://docs.sqlalchemy.org/
- Alembic docs: https://alembic.sqlalchemy.org/
