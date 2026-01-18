from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.dependencies import get_current_user
from app.core.permissions import require_admin
from app.models import AnalysisRequest, RequestStatus, Priority
from app.models.user import User
from app.schemas.request import RequestListResponse
from app.api.requests import _build_request_response

router = APIRouter(
    prefix="/admin/requests",
    tags=["Admin – Requests"],
)


@router.get("/", response_model=RequestListResponse)
async def list_requests_admin(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=500),
    status: Optional[RequestStatus] = None,
    priority: Optional[Priority] = None,
    chemist_id: Optional[int] = None,
    analyst_id: Optional[int] = None,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
    __: bool = Depends(require_admin),
):
    """
    Admin-only read-only request listing
    """
    query = db.query(AnalysisRequest).options(
        joinedload(AnalysisRequest.analysis_types),
        joinedload(AnalysisRequest.result_files),
    )

    if status:
        query = query.filter(AnalysisRequest.status == status)

    if priority:
        query = query.filter(AnalysisRequest.priority == priority)

    if chemist_id:
        query = query.filter(AnalysisRequest.chemist_id == chemist_id)

    if analyst_id:
        query = query.filter(AnalysisRequest.analyst_id == analyst_id)

    total = query.count()

    requests = (
        query.order_by(AnalysisRequest.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    return RequestListResponse(
        requests=[_build_request_response(r, db) for r in requests],
        total=total,
        page=page,
        page_size=page_size,
    )
