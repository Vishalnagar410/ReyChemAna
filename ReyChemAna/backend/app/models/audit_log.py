"""Audit log model for tracking user actions"""
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class AuditLog(Base):
    """Audit log for tracking all significant user actions"""
    __tablename__ = "audit_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Action details
    action = Column(String(100), nullable=False)  # e.g., "create_request", "status_change", "upload_file"
    entity_type = Column(String(50), nullable=False)  # e.g., "request", "user", "file"
    entity_id = Column(Integer, nullable=True)  # ID of the affected entity
    
    # Additional context
    changes = Column(JSON, nullable=True)  # JSON field for storing before/after values
    ip_address = Column(String(50), nullable=True)
    details = Column(Text, nullable=True)  # Human-readable description
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    user = relationship("User", back_populates="audit_logs")
    
    def __repr__(self):
        return f"<AuditLog {self.action} by user={self.user_id}>"
