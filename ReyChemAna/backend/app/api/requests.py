# backend/app/api/requests.py

from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.dependencies import get_current_user
from app.core.permissions import require_chemist, require_analyst, require_any_role

from app.models import (
    AnalysisRequest,
    AnalysisType,
    RequestAnalysisType,
    RequestStatus,
    Priority,
    ResultFile,
)
from app.models.user import User, UserRole

from app.schemas.request import (
    RequestCreate,
    RequestUpdate,
    RequestUpdateChemist,
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
    latest = db.query(AnalysisRequest).order_by(AnalysisRequest.id.desc()).first()
    if latest and latest.request_number:
        try:
            num = int(latest.request_number.split("-")[1])
            return f"REQ-{num + 1:04d}"
        except Exception:
            pass
    return "REQ-0001"


def _build_request_response(request: AnalysisRequest, db: Session) -> dict:
    chemist = db.query(User).filter(User.id == request.chemist_id).first()
    analyst = db.query(User).filter(User.id == request.analyst_id).first() if request.analyst_id else None

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
        "chemist_comments": request.chemist_comments,
        "analyst_comments": request.analyst_comments,
        "created_at": request.created_at,
        "updated_at": request.updated_at,
        "completed_at": request.completed_at,
        "chemist_name": chemist.full_name if chemist else None,
        "analyst_name": analyst.full_name if analyst else None,
        "result_files": request.result_files,
    }


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
    for type_id in request_data.analysis_type_ids:
        if not db.query(AnalysisType).filter(
            AnalysisType.id == type_id,
            AnalysisType.is_active == 1,
        ).first():
            raise HTTPException(400, f"Invalid analysis type ID: {type_id}")

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
# 🧑‍🔬 STEP-2 — ANALYST: SAMPLE RECEIVED
# ============================================================

@router.post("/{request_id}/sample-received", status_code=status.HTTP_200_OK)
async def sample_received(
    request_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    _: bool = Depends(require_analyst),
):
    """
    Analyst acknowledges physical sample receipt.
    Workflow:
    PENDING → IN_PROGRESS
    """

    request = db.query(AnalysisRequest).filter(AnalysisRequest.id == request_id).first()

    if not request:
        raise HTTPException(status_code=404, detail="Request not found")

    if request.status != RequestStatus.PENDING:
        raise HTTPException(
            status_code=400,
            detail="Sample can only be received for PENDING requests",
        )

    if request.analyst_id is not None:
        raise HTTPException(
            status_code=400,
            detail="Request already assigned to another analyst",
        )

    request.analyst_id = current_user.id
    request.status = RequestStatus.IN_PROGRESS

    db.commit()

    log_status_change(
        db=db,
        user=current_user,
        request_id=request.id,
        old_status="pending",
        new_status="in_progress",
    )

    log_action(
        db=db,
        user=current_user,
        action="sample_received",
        entity_type="request",
        entity_id=request.id,
        details=f"Sample received for request {request.request_number}",
    )

    return {"message": "Sample received. Analysis started."}


# ============================================================
# 📋 LIST / GET REQUESTS
# ============================================================

@router.get("/", response_model=RequestListResponse)
async def list_requests(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    status: Optional[RequestStatus] = None,
    priority: Optional[Priority] = None,
    chemist_id: Optional[int] = None,
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
    if priority:
        query = query.filter(AnalysisRequest.priority == priority)
    if analyst_id is not None:
        query = query.filter(
            AnalysisRequest.analyst_id.is_(None) if analyst_id == 0
            else AnalysisRequest.analyst_id == analyst_id
        )

    total = query.count()
    requests = query.order_by(
        AnalysisRequest.created_at.desc()
    ).offset((page - 1) * page_size).limit(page_size).all()

    return RequestListResponse(
        requests=[_build_request_response(r, db) for r in requests],
        total=total,
        page=page,
        page_size=page_size,
    )


# ============================================================
# 🔧 EXISTING UPDATE & ANALYSIS TYPE ENDPOINTS
# (UNCHANGED — intentionally preserved)
# ============================================================

@router.get("/{request_id}", response_model=RequestResponse)
async def get_request(
    request_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    _: bool = Depends(require_any_role),
):
    request = db.query(AnalysisRequest).options(
        joinedload(AnalysisRequest.analysis_types)
    ).filter(AnalysisRequest.id == request_id).first()

    if not request:
        raise HTTPException(404, "Request not found")

    if current_user.role == UserRole.CHEMIST and request.chemist_id != current_user.id:
        raise HTTPException(403, "Access denied")

    return _build_request_response(request, db)


@router.get("/analysis-types/", response_model=List[AnalysisTypeResponse])
async def list_analysis_types(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    _: bool = Depends(require_any_role),
):
    return db.query(AnalysisType).filter(AnalysisType.is_active == 1).all()
