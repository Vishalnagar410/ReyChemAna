"""Analysis request schemas"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime, date
from app.models.request import Priority, RequestStatus


class AnalysisTypeBase(BaseModel):
    """Base analysis type schema"""
    code: str
    name: str
    description: Optional[str] = None


class AnalysisTypeResponse(AnalysisTypeBase):
    """Analysis type response"""
    id: int
    is_active: bool
    
    class Config:
        from_attributes = True


class ResultFileBase(BaseModel):
    """Base file schema"""
    file_name: str
    file_type: Optional[str] = None
    file_size: Optional[int] = None


class ResultFileResponse(ResultFileBase):
    """File response schema"""
    id: int
    request_id: int
    file_path: str
    uploaded_by: int
    uploaded_at: datetime
    
    class Config:
        from_attributes = True


class RequestBase(BaseModel):
    """Base request schema"""
    compound_name: str = Field(..., min_length=1, max_length=200)
    analysis_type_ids: List[int] = Field(..., min_items=1)  # List of analysis type IDs
    priority: Priority = Priority.MEDIUM
    due_date: date
    description: Optional[str] = None
    chemist_comments: Optional[str] = None


class RequestCreate(RequestBase):
    """Schema for creating a new request"""
    pass


class RequestUpdate(BaseModel):
    """Schema for updating a request (analyst)"""
    analyst_id: Optional[int] = None
    status: Optional[RequestStatus] = None
    analyst_comments: Optional[str] = None


class RequestUpdateChemist(BaseModel):
    """Schema for chemist to update their own request"""
    compound_name: Optional[str] = Field(None, min_length=1, max_length=200)
    analysis_type_ids: Optional[List[int]] = Field(None, min_items=1)
    priority: Optional[Priority] = None
    due_date: Optional[date] = None
    description: Optional[str] = None
    chemist_comments: Optional[str] = None


class RequestResponse(BaseModel):
    """Request response schema"""
    id: int
    request_number: str
    chemist_id: int
    analyst_id: Optional[int] = None
    compound_name: str
    analysis_types: List[AnalysisTypeResponse]
    priority: Priority
    due_date: date
    status: RequestStatus
    description: Optional[str] = None
    chemist_comments: Optional[str] = None
    analyst_comments: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    
    # Related data
    chemist_name: Optional[str] = None
    analyst_name: Optional[str] = None
    result_files: List[ResultFileResponse] = []
    
    class Config:
        from_attributes = True


class RequestListResponse(BaseModel):
    """Paginated request list response"""
    requests: List[RequestResponse]
    total: int
    page: int
    page_size: int
