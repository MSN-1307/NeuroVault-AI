from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from app.database import get_db
from app.models import AuditLog, User
from app.schemas import AuditLogResponse
from app.dependencies import get_current_user

router = APIRouter(prefix="/audit-logs", tags=["Audit"])

@router.get("", response_model=List[AuditLogResponse])
async def list_audit_logs(
    action: Optional[str] = Query(None),
    limit: int = Query(50, le=200),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(AuditLog)
    # Admin sees all, regular user sees their own
    if current_user.role != "ADMIN":
        stmt = stmt.where(AuditLog.user_id == current_user.id)

    if action:
        stmt = stmt.where(AuditLog.action == action)

    stmt = stmt.order_by(desc(AuditLog.created_at)).limit(limit)
    res = await db.execute(stmt)
    logs = res.scalars().all()

    return [AuditLogResponse.model_validate(l) for l in logs]
