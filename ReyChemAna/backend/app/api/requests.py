from typing import List, Optional
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.dependencies import get_current_user
from app.core.permissions import (
    require_chemist,
    require_analyst,
    require_any_role,
)

from app.models import (
    AnalysisRequest,
    AnalysisType,
    RequestAnalysisType,
    RequestStatus,
    Priority,
)
from app.models.user import User, UserRole

from app.schemas.request import (
    RequestCreate,
    RequestUpdate,
    RequestResponse,
    RequestListResponse,
    AnalysisTypeResponse,
)

from app.utils.audit import log_action, log_status_change

router = APIRouter(prefix="/requests", tags=["Analysis Requests"])


# ============================================================
# 🔹 UTILITIES
# ============================================================

def _generate_request_number(db: Session) -> str:
    today = datetime.utcnow()
    date_part = today.strftime("%d%b%y").upper()

    count_today = (
        db.query(AnalysisRequest)
        .filter(AnalysisRequest.request_number.like(f"REQ-{date_part}-%"))
        .count()
    )

    return f"REQ-{date_part}-{count_today + 1:02d}"


def _build_request_response(request: AnalysisRequest, db: Session) -> dict:
    chemist = db.query(User).filter(User.id == request.chemist_id).first()
    analyst = (
        db.query(User).filter(User.id == request.analyst_id).first()
        if request.analyst_id else None
    )

    analysis_types = [
        AnalysisTypeResponse.model_validate(rat.analysis_type)
        for rat in request.analysis_types
        if rat.analysis_type
    ]

    return {
        "id": request.id,
        "request_number": request.request_number,
        "chemist_id": request.chemist_id,
        "analyst_id": request.analyst_id,
        "compound_name": request.compound_name,
        "analysis_types": analysis_types,
        "priority": request.priority,
        "due_date": request.due_date,
        "status": request.status,
        "description": request.description,
        "chemist_comments": request.chemist_comments,   # ✅ visible to analyst
        "analyst_comments": request.analyst_comments,
        "created_at": request.created_at,
        "updated_at": request.updated_at,
        "completed_at": request.completed_at,
        "chemist_name": chemist.full_name if chemist else None,
        "analyst_name": analyst.full_name if analyst else None,
        "result_files": request.result_files,
    }


# ============================================================
# ✅ ANALYSIS TYPES
# ============================================================

@router.get("/analysis-types/", response_model=List[AnalysisTypeResponse])
async def list_analysis_types(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    _: bool = Depends(require_any_role),
):
    return db.query(AnalysisType).filter(AnalysisType.is_active == 1).all()


# ============================================================
# 🧪 CHEMIST — CREATE REQUEST
# ============================================================

@router.post("/", response_model=RequestResponse, status_code=status.HTTP_201_CREATED)
async def create_request(
    request_data: RequestCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    _: bool = Depends(require_chemist),
):
    if not request_data.analysis_type_ids:
        raise HTTPException(400, "Please select at least one analysis type")

    request = AnalysisRequest(
        request_number=_generate_request_number(db),
        chemist_id=current_user.id,
        compound_name=request_data.compound_name,
        priority=request_data.priority,
        due_date=request_data.due_date,
        description=request_data.description,
        chemist_comments=request_data.chemist_comments,
        status=RequestStatus.PENDING,
    )

    db.add(request)
    db.flush()

    for type_id in request_data.analysis_type_ids:
        db.add(RequestAnalysisType(
            request_id=request.id,
            analysis_type_id=type_id,
        ))

    db.commit()
    db.refresh(request)

    log_action(
        db=db,
        user=current_user,
        action="create_request",
        entity_type="request",
        entity_id=request.id,
        details=f"Request {request.request_number} created",
    )

    return _build_request_response(request, db)


# ============================================================
# 🧑‍🔬 ANALYST — SAMPLE RECEIVED
# ============================================================

@router.post("/{request_id}/sample-received")
async def sample_received(
    request_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    _: bool = Depends(require_analyst),
):
    request = db.query(AnalysisRequest).filter(
        AnalysisRequest.id == request_id
    ).first()

    if not request:
        raise HTTPException(404, "Request not found")

    if request.status != RequestStatus.PENDING:
        raise HTTPException(400, "Sample already received")

    request.status = RequestStatus.IN_PROGRESS
    request.analyst_id = current_user.id

    db.commit()

    log_status_change(
        db=db,
        user=current_user,
        request_id=request.id,
        old_status="pending",
        new_status="in_progress",
    )

    return {"message": "Sample received"}


# ============================================================
# 🧪 ANALYST — COMPLETE REQUEST (🔥 FIX)
# ============================================================

@router.patch("/{request_id}", response_model=RequestResponse)
async def complete_request(
    request_id: int,
    payload: RequestUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    _: bool = Depends(require_analyst),
):
    request = db.query(AnalysisRequest).filter(
        AnalysisRequest.id == request_id
    ).first()

    if not request:
        raise HTTPException(404, "Request not found")

    if request.status != RequestStatus.IN_PROGRESS:
        raise HTTPException(400, "Only IN_PROGRESS requests can be completed")

    if request.analyst_id != current_user.id:
        raise HTTPException(403, "You are not assigned to this request")

    request.status = RequestStatus.COMPLETED
    request.completed_at = datetime.utcnow()

    if payload.analyst_comments is not None:
        request.analyst_comments = payload.analyst_comments

    db.commit()
    db.refresh(request)

    log_status_change(
        db=db,
        user=current_user,
        request_id=request.id,
        old_status="in_progress",
        new_status="completed",
    )

    return _build_request_response(request, db)


# ============================================================
# 📋 LIST REQUESTS
# ============================================================

@router.get("/", response_model=RequestListResponse)
async def list_requests(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    status: Optional[RequestStatus] = None,
    priority: Optional[Priority] = None,
    analyst_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    _: bool = Depends(require_any_role),
):
    query = db.query(AnalysisRequest).options(
        joinedload(AnalysisRequest.analysis_types),
        joinedload(AnalysisRequest.result_files),
    )

    if current_user.role == UserRole.CHEMIST:
        query = query.filter(AnalysisRequest.chemist_id == current_user.id)

    if status:
        query = query.filter(AnalysisRequest.status == status)

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


# ============================================================
# 🔍 GET REQUEST BY ID
# ============================================================

@router.get("/{request_id}", response_model=RequestResponse)
async def get_request(
    request_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    _: bool = Depends(require_any_role),
):
    request = db.query(AnalysisRequest).options(
        joinedload(AnalysisRequest.analysis_types),
        joinedload(AnalysisRequest.result_files),
    ).filter(AnalysisRequest.id == request_id).first()

    if not request:
        raise HTTPException(404, "Request not found")

    return _build_request_response(request, db)
