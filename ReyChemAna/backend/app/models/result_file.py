# backend/app/models/result_file.py
"""Result file model"""

from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship

from app.database import Base


class ResultFile(Base):
    __tablename__ = "result_files"

    id = Column(Integer, primary_key=True, index=True)

    request_id = Column(
        Integer,
        ForeignKey("analysis_requests.id", ondelete="CASCADE"),
        nullable=False,
    )

    uploaded_by = Column(
        Integer,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )

    file_name = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)

    uploaded_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    request = relationship("AnalysisRequest", back_populates="result_files")
    uploaded_by_user = relationship("User", back_populates="uploaded_files")

    def __repr__(self):
        return f"<ResultFile {self.file_name}>"
