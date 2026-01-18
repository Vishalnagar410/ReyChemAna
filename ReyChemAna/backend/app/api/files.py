"""File upload and download endpoints"""

import shutil
from typing import List
from pathlib import Path

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
    UploadFile,
    File,
)
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.core.permissions import require_analyst, require_any_role
from app.models import AnalysisRequest, ResultFile
from app.models.user import User, UserRole
from app.schemas.request import ResultFileResponse
from app.config import settings
from app.utils.audit import log_file_upload, log_action

router = APIRouter(prefix="/files", tags=["File Management"])


# ============================================================
# 🔹 INTERNAL HELPERS
# ============================================================

def _get_request_upload_dir(request_number: str) -> Path:
    """
    Directory structure:
    uploads/
      └── REQ-18JAN26-02/
            ├── result1.pdf
            └── result2.xlsx
    """
    base_dir = Path(settings.UPLOAD_DIR)
    request_dir = base_dir / request_number
    request_dir.mkdir(parents=True, exist_ok=True)
    return request_dir


# ============================================================
# 📤 UPLOAD FILES (ANALYST ONLY)
# ============================================================

@router.post("/upload/{request_id}", response_model=List[ResultFileResponse])
async def upload_files(
    request_id: int,
    files: List[UploadFile] = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    _: bool = Depends(require_analyst),
):
    request = (
        db.query(AnalysisRequest)
        .filter(AnalysisRequest.id == request_id)
        .first()
    )

    if not request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Request not found",
        )

    upload_dir = _get_request_upload_dir(request.request_number)
    uploaded_records: List[ResultFile] = []

    for upload in files:
        upload.file.seek(0, 2)
        size = upload.file.tell()
        upload.file.seek(0)

        if size > settings.max_file_size_bytes:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"{upload.filename} exceeds max size",
            )

        file_path = upload_dir / upload.filename
        counter = 1

        while file_path.exists():
            stem = file_path.stem
            suffix = file_path.suffix
            file_path = upload_dir / f"{stem}_{counter}{suffix}"
            counter += 1

        with file_path.open("wb") as buffer:
            shutil.copyfileobj(upload.file, buffer)

        db_file = ResultFile(
            request_id=request.id,
            uploaded_by=current_user.id,
            file_name=file_path.name,
            file_path=f"{request.request_number}/{file_path.name}",
        )

        db.add(db_file)
        db.flush()
        db.refresh(db_file)

        uploaded_records.append(db_file)

        log_file_upload(
            db=db,
            user=current_user,
            request_id=request.id,
            file_name=file_path.name,
        )

    db.commit()
    return uploaded_records


# ============================================================
# 📥 DOWNLOAD FILE (CHEMIST + ANALYST)
# ============================================================

@router.get("/download/{file_id}")
async def download_file(
    file_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    _: bool = Depends(require_any_role),
):
    file_record = (
        db.query(ResultFile)
        .filter(ResultFile.id == file_id)
        .first()
    )

    if not file_record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found",
        )

    request = (
        db.query(AnalysisRequest)
        .filter(AnalysisRequest.id == file_record.request_id)
        .first()
    )

    if not request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Associated request not found",
        )

    if (
        current_user.role == UserRole.CHEMIST
        and request.chemist_id != current_user.id
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied",
        )

    absolute_path = Path(settings.UPLOAD_DIR) / file_record.file_path

    if not absolute_path.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File missing on disk",
        )

    log_action(
        db=db,
        user=current_user,
        action="download_file",
        entity_type="file",
        entity_id=file_id,
        details=f"Downloaded file: {file_record.file_name}",
    )

    # ✅ IMPORTANT:
    # Do NOT reference file_type (it does not exist in model)
    return FileResponse(
        path=str(absolute_path),
        filename=file_record.file_name,
        media_type="application/octet-stream",
    )


# ============================================================
# 📄 LIST FILES FOR REQUEST
# ============================================================

@router.get("/request/{request_id}", response_model=List[ResultFileResponse])
async def list_request_files(
    request_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    _: bool = Depends(require_any_role),
):
    request = (
        db.query(AnalysisRequest)
        .filter(AnalysisRequest.id == request_id)
        .first()
    )

    if not request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Request not found",
        )

    if (
        current_user.role == UserRole.CHEMIST
        and request.chemist_id != current_user.id
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied",
        )

    return (
        db.query(ResultFile)
        .filter(ResultFile.request_id == request_id)
        .all()
    )


# ============================================================
# 🗑 DELETE FILE (ANALYST ONLY)
# ============================================================

@router.delete("/{file_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_file(
    file_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    _: bool = Depends(require_analyst),
):
    file_record = (
        db.query(ResultFile)
        .filter(ResultFile.id == file_id)
        .first()
    )

    if not file_record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found",
        )

    path = Path(settings.UPLOAD_DIR) / file_record.file_path
    if path.exists():
        try:
            path.unlink()
        except Exception:
            pass

    db.delete(file_record)
    db.commit()

    log_action(
        db=db,
        user=current_user,
        action="delete_file",
        entity_type="file",
        entity_id=file_id,
        details=f"Deleted file: {file_record.file_name}",
    )
