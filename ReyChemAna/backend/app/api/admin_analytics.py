from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.dependencies import get_current_user
from app.core.permissions import require_admin
from app.models import AnalysisRequest, RequestStatus
from app.models.user import User

router = APIRouter(
    prefix="/admin/analytics",
    tags=["Admin – Analytics"],
)


@router.get("/")
async def admin_analytics(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
    __: bool = Depends(require_admin),
):
    """
    Simple admin analytics (safe, read-only)
    """

    total = db.query(func.count(AnalysisRequest.id)).scalar()

    by_status = (
        db.query(
            AnalysisRequest.status,
            func.count(AnalysisRequest.id)
        )
        .group_by(AnalysisRequest.status)
        .all()
    )

    return {
        "total_requests": total,
        "by_status": {status.value: count for status, count in by_status},
    }
