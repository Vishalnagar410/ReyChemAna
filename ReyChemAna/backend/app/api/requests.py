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
from app.models.user import User, UserRole  # ✅ CORRECT PLACE

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


def _generate_request_number(db: Session) -> str:
    """Generate unique request number"""
    # Get the latest request number
    latest = db.query(AnalysisRequest).order_by(AnalysisRequest.id.desc()).first()
    
    if latest and latest.request_number:
        # Extract number from REQ-XXXX format
        try:
            num = int(latest.request_number.split("-")[1])
            new_num = num + 1
        except:
            new_num = 1
    else:
        new_num = 1
    
    return f"REQ-{new_num:04d}"


def _build_request_response(request: AnalysisRequest, db: Session) -> dict:
    """Build request response with related data"""
    # Get chemist name
    chemist = db.query(User).filter(User.id == request.chemist_id).first()
    chemist_name = chemist.full_name if chemist else None
    
    # Get analyst name
    analyst_name = None
    if request.analyst_id:
        analyst = db.query(User).filter(User.id == request.analyst_id).first()
        analyst_name = analyst.full_name if analyst else None
    
    # Get analysis types
    analysis_types = []
    for rat in request.analysis_types:
        if rat.analysis_type:
            analysis_types.append(AnalysisTypeResponse.model_validate(rat.analysis_type))
    
    # Build response dict
    response_dict = {
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
        "chemist_name": chemist_name,
        "analyst_name": analyst_name,
        "result_files": request.result_files
    }
    
    return response_dict


@router.post("/", response_model=RequestResponse, status_code=status.HTTP_201_CREATED)
async def create_request(
    request_data: RequestCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    _: bool = Depends(require_chemist)
):
    """
    Create a new analysis request (Chemist only)
    
    Args:
        request_data: Request creation data
        db: Database session
        current_user: Current authenticated user
    
    Returns:
        Created request
    
    Raises:
        HTTPException: If analysis types are invalid
    """
    # Verify all analysis type IDs exist
    for type_id in request_data.analysis_type_ids:
        analysis_type = db.query(AnalysisType).filter(
            AnalysisType.id == type_id,
            AnalysisType.is_active == 1
        ).first()
        if not analysis_type:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid analysis type ID: {type_id}"
            )
    
    # Generate request number
    request_number = _generate_request_number(db)
    
    # Create request
    request = AnalysisRequest(
        request_number=request_number,
        chemist_id=current_user.id,
        compound_name=request_data.compound_name,
        priority=request_data.priority,
        due_date=request_data.due_date,
        description=request_data.description,
        chemist_comments=request_data.chemist_comments,
        status=RequestStatus.PENDING
    )
    
    db.add(request)
    db.flush()  # Get the ID without committing
    
    # Add analysis types
    for type_id in request_data.analysis_type_ids:
        rat = RequestAnalysisType(
            request_id=request.id,
            analysis_type_id=type_id
        )
        db.add(rat)
    
    db.commit()
    db.refresh(request)
    
    # Log action
    log_action(
        db=db,
        user=current_user,
        action="create_request",
        entity_type="request",
        entity_id=request.id,
        details=f"Request {request.request_number} created for {request.compound_name}"
    )
    
    return _build_request_response(request, db)


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
    _: bool = Depends(require_any_role)
):
    """
    List requests with pagination and filters
    
    Args:
        page: Page number
        page_size: Items per page
        status: Filter by status
        priority: Filter by priority
        chemist_id: Filter by chemist
        analyst_id: Filter by analyst
        db: Database session
        current_user: Current authenticated user
    
    Returns:
        Paginated list of requests
    """
    query = db.query(AnalysisRequest).options(
        joinedload(AnalysisRequest.analysis_types)
    )
    
    # Role-based filtering
    if current_user.role == UserRole.CHEMIST:
        # Chemists see only their own requests
        query = query.filter(AnalysisRequest.chemist_id == current_user.id)
    elif current_user.role == UserRole.ANALYST:
        # Analysts see all requests (can filter to their own)
        pass
    # Admins see all requests
    
    # Apply filters
    if status:
        query = query.filter(AnalysisRequest.status == status)
    if priority:
        query = query.filter(AnalysisRequest.priority == priority)
    if chemist_id:
        query = query.filter(AnalysisRequest.chemist_id == chemist_id)
    if analyst_id is not None:  # Allow explicit None filtering
        if analyst_id == 0:  # Special case: unassigned
            query = query.filter(AnalysisRequest.analyst_id.is_(None))
        else:
            query = query.filter(AnalysisRequest.analyst_id == analyst_id)
    
    # Get total count
    total = query.count()
    
    # Apply pagination
    offset = (page - 1) * page_size
    requests = query.order_by(AnalysisRequest.created_at.desc()).offset(offset).limit(page_size).all()
    
    # Build responses
    request_responses = [_build_request_response(req, db) for req in requests]
    
    return RequestListResponse(
        requests=request_responses,
        total=total,
        page=page,
        page_size=page_size
    )


@router.get("/{request_id}", response_model=RequestResponse)
async def get_request(
    request_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    _: bool = Depends(require_any_role)
):
    """
    Get request by ID
    
    Args:
        request_id: Request ID
        db: Database session
        current_user: Current authenticated user
    
    Returns:
        Request details
    
    Raises:
        HTTPException: If request not found or access denied
    """
    request = db.query(AnalysisRequest).options(
        joinedload(AnalysisRequest.analysis_types)
    ).filter(AnalysisRequest.id == request_id).first()
    
    if not request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Request not found"
        )
    
    # Check access permissions
    if current_user.role == UserRole.CHEMIST and request.chemist_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    return _build_request_response(request, db)


@router.patch("/{request_id}", response_model=RequestResponse)
async def update_request_analyst(
    request_id: int,
    update_data: RequestUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    _: bool = Depends(require_analyst)
):
    """
    Update request (Analyst only) - assign, update status, add comments
    
    Args:
        request_id: Request ID
        update_data: Update data
        db: Database session
        current_user: Current authenticated user
    
    Returns:
        Updated request
    
    Raises:
        HTTPException: If request not found
    """
    request = db.query(AnalysisRequest).filter(AnalysisRequest.id == request_id).first()
    if not request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Request not found"
        )
    
    changes = {}
    
    # Update analyst assignment
    if update_data.analyst_id is not None:
        changes["analyst_id"] = {"old": request.analyst_id, "new": update_data.analyst_id}
        request.analyst_id = update_data.analyst_id
    
    # Update status
    if update_data.status:
        old_status = request.status.value
        changes["status"] = {"old": old_status, "new": update_data.status.value}
        request.status = update_data.status
        
        # Set completed_at if status is completed
        if update_data.status == RequestStatus.COMPLETED:
            request.completed_at = datetime.utcnow()
        
        # Log status change
        log_status_change(
            db=db,
            user=current_user,
            request_id=request.id,
            old_status=old_status,
            new_status=update_data.status.value
        )
    
    # Update analyst comments
    if update_data.analyst_comments:
        changes["analyst_comments"] = {"old": request.analyst_comments, "new": update_data.analyst_comments}
        request.analyst_comments = update_data.analyst_comments
    
    db.commit()
    db.refresh(request)
    
    # Log action
    if changes:
        log_action(
            db=db,
            user=current_user,
            action="update_request",
            entity_type="request",
            entity_id=request.id,
            changes=changes,
            details=f"Request {request.request_number} updated by analyst"
        )
    
    return _build_request_response(request, db)


@router.patch("/{request_id}/chemist", response_model=RequestResponse)
async def update_request_chemist(
    request_id: int,
    update_data: RequestUpdateChemist,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    _: bool = Depends(require_chemist)
):
    """
    Update request (Chemist only) - can only update their own requests
    
    Args:
        request_id: Request ID
        update_data: Update data
        db: Database session
        current_user: Current authenticated user
    
    Returns:
        Updated request
    
    Raises:
        HTTPException: If request not found or not owned by chemist
    """
    request = db.query(AnalysisRequest).filter(AnalysisRequest.id == request_id).first()
    if not request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Request not found"
        )
    
    # Check ownership
    if request.chemist_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Can only update your own requests"
        )
    
    changes = {}
    
    # Update fields
    if update_data.compound_name:
        changes["compound_name"] = {"old": request.compound_name, "new": update_data.compound_name}
        request.compound_name = update_data.compound_name
    
    if update_data.analysis_type_ids:
        # Remove old analysis types
        db.query(RequestAnalysisType).filter(
            RequestAnalysisType.request_id == request.id
        ).delete()
        
        # Add new analysis types
        for type_id in update_data.analysis_type_ids:
            rat = RequestAnalysisType(
                request_id=request.id,
                analysis_type_id=type_id
            )
            db.add(rat)
        
        changes["analysis_types"] = {"action": "updated"}
    
    if update_data.priority:
        changes["priority"] = {"old": request.priority.value, "new": update_data.priority.value}
        request.priority = update_data.priority
    
    if update_data.due_date:
        changes["due_date"] = {"old": str(request.due_date), "new": str(update_data.due_date)}
        request.due_date = update_data.due_date
    
    if update_data.description is not None:
        changes["description"] = {"old": request.description, "new": update_data.description}
        request.description = update_data.description
    
    if update_data.chemist_comments is not None:
        changes["chemist_comments"] = {"old": request.chemist_comments, "new": update_data.chemist_comments}
        request.chemist_comments = update_data.chemist_comments
    
    db.commit()
    db.refresh(request)
    
    # Log action
    if changes:
        log_action(
            db=db,
            user=current_user,
            action="update_request",
            entity_type="request",
            entity_id=request.id,
            changes=changes,
            details=f"Request {request.request_number} updated by chemist"
        )
    
    return _build_request_response(request, db)


@router.get("/analysis-types/", response_model=List[AnalysisTypeResponse])
async def list_analysis_types(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    _: bool = Depends(require_any_role)
):
    """
    Get all active analysis types
    
    Args:
        db: Database session
        current_user: Current authenticated user
    
    Returns:
        List of analysis types
    """
    types = db.query(AnalysisType).filter(AnalysisType.is_active == 1).all()
    return types
