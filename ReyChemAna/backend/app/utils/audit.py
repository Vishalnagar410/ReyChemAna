"""Audit logging utilities"""
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from app.models.audit_log import AuditLog
from app.models.user import User


def log_action(
    db: Session,
    user: User,
    action: str,
    entity_type: str,
    entity_id: Optional[int] = None,
    changes: Optional[Dict[str, Any]] = None,
    details: Optional[str] = None,
    ip_address: Optional[str] = None
) -> AuditLog:
    """
    Create an audit log entry
    
    Args:
        db: Database session
        user: User performing the action
        action: Action name (e.g., "create_request", "status_change")
        entity_type: Type of entity affected (e.g., "request", "user")
        entity_id: ID of the affected entity
        changes: Dictionary of changes (before/after)
        details: Human-readable description
        ip_address: IP address of the user
    
    Returns:
        Created audit log entry
    """
    audit_log = AuditLog(
        user_id=user.id,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        changes=changes,
        details=details,
        ip_address=ip_address
    )
    
    db.add(audit_log)
    db.commit()
    db.refresh(audit_log)
    
    return audit_log


def log_status_change(
    db: Session,
    user: User,
    request_id: int,
    old_status: str,
    new_status: str,
    ip_address: Optional[str] = None
) -> AuditLog:
    """
    Log a request status change
    
    Args:
        db: Database session
        user: User making the change
        request_id: ID of the request
        old_status: Previous status
        new_status: New status
        ip_address: IP address
    
    Returns:
        Created audit log entry
    """
    return log_action(
        db=db,
        user=user,
        action="status_change",
        entity_type="request",
        entity_id=request_id,
        changes={"status": {"old": old_status, "new": new_status}},
        details=f"Request status changed from {old_status} to {new_status}",
        ip_address=ip_address
    )


def log_file_upload(
    db: Session,
    user: User,
    request_id: int,
    file_name: str,
    ip_address: Optional[str] = None
) -> AuditLog:
    """
    Log a file upload
    
    Args:
        db: Database session
        user: User uploading the file
        request_id: ID of the request
        file_name: Name of uploaded file
        ip_address: IP address
    
    Returns:
        Created audit log entry
    """
    return log_action(
        db=db,
        user=user,
        action="upload_file",
        entity_type="file",
        entity_id=request_id,
        details=f"File uploaded: {file_name}",
        ip_address=ip_address
    )
