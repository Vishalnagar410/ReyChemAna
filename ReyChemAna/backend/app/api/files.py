"""File upload and download endpoints"""
import os
import shutil
from typing import List
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.database import get_db
from app.dependencies import get_current_user
from app.core.permissions import require_analyst, require_any_role
from app.models.user import User, UserRole
from app.models import AnalysisRequest, ResultFile
from app.schemas.request import ResultFileResponse
from app.config import settings
from app.utils.audit import log_file_upload, log_action

router = APIRouter(prefix="/files", tags=["File Management"])


def _get_request_upload_dir(request_number: str) -> Path:
    """Get upload directory for a specific request"""
    upload_base = Path(settings.UPLOAD_DIR)
    request_dir = upload_base / request_number
    request_dir.mkdir(parents=True, exist_ok=True)
    return request_dir


@router.post("/upload/{request_id}", response_model=List[ResultFileResponse])
async def upload_files(
    request_id: int,
    files: List[UploadFile] = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    _: bool = Depends(require_analyst)
):
    """
    Upload result files to a request (Analyst only)
    
    Args:
        request_id: Request ID
        files: List of files to upload
        db: Database session
        current_user: Current authenticated user
    
    Returns:
        List of uploaded file records
    
    Raises:
        HTTPException: If request not found or file size exceeds limit
    """
    # Get request
    request = db.query(AnalysisRequest).filter(AnalysisRequest.id == request_id).first()
    if not request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Request not found"
        )
    
    # Get request upload directory
    upload_dir = _get_request_upload_dir(request.request_number)
    
    uploaded_files = []
    
    for file in files:
        # Check file size
        file.file.seek(0, 2)  # Seek to end
        file_size = file.file.tell()
        file.file.seek(0)  # Seek back to start
        
        if file_size > settings.max_file_size_bytes:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"File {file.filename} exceeds maximum size of {settings.MAX_FILE_SIZE_MB}MB"
            )
        
        # Generate unique filename if file already exists
        file_path = upload_dir / file.filename
        counter = 1
        original_stem = Path(file.filename).stem
        original_suffix = Path(file.filename).suffix
        
        while file_path.exists():
            new_name = f"{original_stem}_{counter}{original_suffix}"
            file_path = upload_dir / new_name
            counter += 1
        
        # Save file
        try:
            with file_path.open("wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to save file {file.filename}: {str(e)}"
            )
        
        # Create database record
        relative_path = f"{request.request_number}/{file_path.name}"
        result_file = ResultFile(
            request_id=request.id,
            uploaded_by=current_user.id,
            file_name=file_path.name,
            file_path=relative_path
        )
        
        db.add(result_file)
        db.flush()
        db.refresh(result_file)
        
        uploaded_files.append(result_file)
        
        # Log file upload
        log_file_upload(
            db=db,
            user=current_user,
            request_id=request.id,
            file_name=file.filename
        )
    
    db.commit()
    
    return uploaded_files


@router.get("/download/{file_id}")
async def download_file(
    file_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    _: bool = Depends(require_any_role)
):
    """
    Download a result file
    
    Args:
        file_id: File ID
        db: Database session
        current_user: Current authenticated user
    
    Returns:
        File response
    
    Raises:
        HTTPException: If file not found or access denied
    """
    # Get file record
    file_record = db.query(ResultFile).filter(ResultFile.id == file_id).first()
    if not file_record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found"
        )
    
    # Get associated request
    request = db.query(AnalysisRequest).filter(AnalysisRequest.id == file_record.request_id).first()
    if not request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Associated request not found"
        )
    
    # Check permissions
    if current_user.role == UserRole.CHEMIST and request.chemist_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    # Build file path
    file_path = Path(settings.UPLOAD_DIR) / file_record.file_path
    
    if not file_path.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found on disk"
        )
    
    # Log download action
    log_action(
        db=db,
        user=current_user,
        action="download_file",
        entity_type="file",
        entity_id=file_id,
        details=f"Downloaded file: {file_record.file_name}"
    )
    
    return FileResponse(
        path=str(file_path),
        filename=file_record.file_name,
        media_type=file_record.file_type or "application/octet-stream"
    )


@router.delete("/{file_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_file(
    file_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    _: bool = Depends(require_analyst)
):
    """
    Delete a result file (Analyst only)
    
    Args:
        file_id: File ID
        db: Database session
        current_user: Current authenticated user
    
    Raises:
        HTTPException: If file not found
    """
    # Get file record
    file_record = db.query(ResultFile).filter(ResultFile.id == file_id).first()
    if not file_record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found"
        )
    
    # Delete file from disk
    file_path = Path(settings.UPLOAD_DIR) / file_record.file_path
    if file_path.exists():
        try:
            file_path.unlink()
        except Exception as e:
            # Log but don't fail if file deletion fails
            pass
    
    # Delete database record
    db.delete(file_record)
    db.commit()
    
    # Log action
    log_action(
        db=db,
        user=current_user,
        action="delete_file",
        entity_type="file",
        entity_id=file_id,
        details=f"Deleted file: {file_record.file_name}"
    )
    
    return None


@router.get("/request/{request_id}", response_model=List[ResultFileResponse])
async def list_request_files(
    request_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    _: bool = Depends(require_any_role)
):
    """
    List all files for a request
    
    Args:
        request_id: Request ID
        db: Database session
        current_user: Current authenticated user
    
    Returns:
        List of files
    
    Raises:
        HTTPException: If request not found or access denied
    """
    # Get request
    request = db.query(AnalysisRequest).filter(AnalysisRequest.id == request_id).first()
    if not request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Request not found"
        )
    
    # Check permissions
    if current_user.role == UserRole.CHEMIST and request.chemist_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    # Get files
    files = db.query(ResultFile).filter(ResultFile.request_id == request_id).all()
    
    return files
