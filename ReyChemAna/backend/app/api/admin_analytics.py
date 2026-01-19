from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import func
import io

import matplotlib.pyplot as plt
import seaborn as sns

from app.database import get_db
from app.dependencies import get_current_user
from app.core.permissions import require_admin
from app.models import AnalysisRequest, RequestStatus
from app.models.user import User

# ------------------------------------------------------------------
# Router
# ------------------------------------------------------------------
router = APIRouter(
    prefix="/admin/analytics",
    tags=["Admin – Analytics"],
)

# ------------------------------------------------------------------
# 🔹 BASE JSON ANALYTICS (UNCHANGED – DO NOT TOUCH)
# ------------------------------------------------------------------
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

# ------------------------------------------------------------------
# 🔹 INTERNAL HELPER: RETURN PLOT AS PNG STREAM
# ------------------------------------------------------------------
def _plot_to_response():
    buf = io.BytesIO()
    plt.tight_layout()
    plt.savefig(buf, format="png", dpi=120)
    plt.close()
    buf.seek(0)
    return StreamingResponse(buf, media_type="image/png")

# ------------------------------------------------------------------
# 📊 CHART 1: REQUESTS BY STATUS (DONUT)
# ------------------------------------------------------------------
@router.get("/chart/status")
async def chart_requests_by_status(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
    __: bool = Depends(require_admin),
):
    data = (
        db.query(
            AnalysisRequest.status,
            func.count(AnalysisRequest.id)
        )
        .group_by(AnalysisRequest.status)
        .all()
    )

    labels = [status.value.replace("_", " ").title() for status, _ in data]
    values = [count for _, count in data]

    plt.figure(figsize=(5, 5))
    plt.pie(
        values,
        labels=labels,
        autopct="%1.0f%%",
        startangle=140,
        wedgeprops={"width": 0.4},
    )
    plt.title("Requests by Status")

    return _plot_to_response()

# ------------------------------------------------------------------
# 📊 CHART 2: REQUESTS PER MONTH (BAR)
# ------------------------------------------------------------------
@router.get("/chart/monthly")
async def chart_requests_monthly(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
    __: bool = Depends(require_admin),
):
    data = (
        db.query(
            func.date_trunc("month", AnalysisRequest.created_at).label("month"),
            func.count(AnalysisRequest.id)
        )
        .group_by("month")
        .order_by("month")
        .all()
    )

    months = [row.month.strftime("%b %Y") for row in data]
    counts = [row[1] for row in data]

    plt.figure(figsize=(7, 4))
    sns.barplot(x=months, y=counts)
    plt.xticks(rotation=45)
    plt.xlabel("Month")
    plt.ylabel("Requests")
    plt.title("Requests per Month")

    return _plot_to_response()

# ------------------------------------------------------------------
# 📊 CHART 3: REQUESTS BY PRIORITY (BAR)
# ------------------------------------------------------------------
@router.get("/chart/priority")
async def chart_requests_by_priority(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
    __: bool = Depends(require_admin),
):
    data = (
        db.query(
            AnalysisRequest.priority,
            func.count(AnalysisRequest.id)
        )
        .group_by(AnalysisRequest.priority)
        .all()
    )

    priorities = [row[0].value.title() for row in data]
    counts = [row[1] for row in data]

    plt.figure(figsize=(6, 4))
    sns.barplot(x=priorities, y=counts)
    plt.xlabel("Priority")
    plt.ylabel("Requests")
    plt.title("Requests by Priority")

    return _plot_to_response()
