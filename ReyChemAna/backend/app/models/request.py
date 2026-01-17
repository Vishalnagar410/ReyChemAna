# backend/app/models/request.py
"""Analysis request and related models"""

from sqlalchemy import (
    Column, Integer, String, Text, DateTime,
    Enum, ForeignKey, Date
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum

from app.database import Base


class Priority(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"


class RequestStatus(str, enum.Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class AnalysisRequest(Base):
    __tablename__ = "analysis_requests"

    id = Column(Integer, primary_key=True, index=True)
    request_number = Column(String(20), unique=True, nullable=False, index=True)

    chemist_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    analyst_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    compound_name = Column(String(200), nullable=False)
    priority = Column(Enum(Priority), nullable=False, default=Priority.MEDIUM)
    due_date = Column(Date, nullable=False)
    status = Column(Enum(RequestStatus), nullable=False, default=RequestStatus.PENDING)

    description = Column(Text)
    chemist_comments = Column(Text)
    analyst_comments = Column(Text)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    chemist = relationship("User", foreign_keys=[chemist_id], back_populates="chemist_requests")
    analyst = relationship("User", foreign_keys=[analyst_id], back_populates="analyst_requests")

    analysis_types = relationship(
        "RequestAnalysisType",
        back_populates="request",
        cascade="all, delete-orphan"
    )

    result_files = relationship(
        "ResultFile",
        back_populates="request",
        cascade="all, delete-orphan"
    )

    def __repr__(self):
        return f"<AnalysisRequest {self.request_number}>"


class AnalysisType(Base):
    __tablename__ = "analysis_types"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(20), unique=True, nullable=False)
    name = Column(String(100), nullable=False)
    description = Column(Text)
    is_active = Column(Integer, default=1)

    request_associations = relationship(
        "RequestAnalysisType",
        back_populates="analysis_type"
    )

    def __repr__(self):
        return f"<AnalysisType {self.code}>"


class RequestAnalysisType(Base):
    __tablename__ = "request_analysis_types"

    id = Column(Integer, primary_key=True, index=True)
    request_id = Column(Integer, ForeignKey("analysis_requests.id"), nullable=False)
    analysis_type_id = Column(Integer, ForeignKey("analysis_types.id"), nullable=False)

    request = relationship("AnalysisRequest", back_populates="analysis_types")
    analysis_type = relationship("AnalysisType", back_populates="request_associations")

    def __repr__(self):
        return f"<RequestAnalysisType r={self.request_id} a={self.analysis_type_id}>"
