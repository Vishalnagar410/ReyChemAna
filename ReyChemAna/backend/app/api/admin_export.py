from io import BytesIO
from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session, joinedload
from datetime import datetime

from app.database import get_db
from app.dependencies import get_current_user
from app.core.permissions import require_admin
from app.models import AnalysisRequest
from app.models.user import User

import openpyxl

router = APIRouter(
    prefix="/admin/export",
    tags=["Admin – Export"],
)


@router.get("/requests")
async def export_requests_excel(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
    __: bool = Depends(require_admin),
):
    """
    Export requests (monthly scope handled frontend-side)
    """

    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Requests"

    headers = [
        "Request #",
        "Compound",
        "Analysis Types",
        "Chemist",
        "Analyst",
        "Priority",
        "Status",
        "Due Date",
        "Chemist Comments",
        "Analyst Comments",
        "Created At",
        "Completed At",
    ]
    ws.append(headers)

    requests = (
        db.query(AnalysisRequest)
        .options(joinedload(AnalysisRequest.analysis_types))
        .order_by(AnalysisRequest.created_at.desc())
        .all()
    )

    for r in requests:
        ws.append([
            r.request_number,
            r.compound_name,
            ", ".join(
                at.analysis_type.code
                for at in r.analysis_types
                if at.analysis_type
            ),
            r.chemist.full_name if r.chemist else "",
            r.analyst.full_name if r.analyst else "",
            r.priority.value if r.priority else "",
            r.status.value,
            r.due_date.strftime("%Y-%m-%d") if r.due_date else "",
            r.chemist_comments or "",
            r.analyst_comments or "",
            r.created_at.strftime("%Y-%m-%d"),
            r.completed_at.strftime("%Y-%m-%d") if r.completed_at else "",
        ])

    stream = BytesIO()
    wb.save(stream)
    stream.seek(0)

    filename = f"requests_{datetime.utcnow().strftime('%Y_%m')}.xlsx"

    return StreamingResponse(
        stream,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={
            "Content-Disposition": f"attachment; filename={filename}"
        },
    )
