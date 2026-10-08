from typing import List, Dict, Any
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from app.database import get_db
from app.models import (
    Memory, Category, Conversation, Message, Feedback,
    AuditLog, MemoryExtractionEvent, User
)
from app.dependencies import get_current_user

router = APIRouter(prefix="/analytics", tags=["Analytics"])

@router.get("/overview")
async def get_overview(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Aggregated user metrics
    total_memories = await db.scalar(
        select(func.count(Memory.id)).where(Memory.user_id == current_user.id)
    ) or 0
    active_memories = await db.scalar(
        select(func.count(Memory.id)).where(Memory.user_id == current_user.id, Memory.status == "ACTIVE")
    ) or 0
    conflicted_memories = await db.scalar(
        select(func.count(Memory.id)).where(Memory.user_id == current_user.id, Memory.status == "CONFLICTED")
    ) or 0
    archived_memories = await db.scalar(
        select(func.count(Memory.id)).where(Memory.user_id == current_user.id, Memory.status == "ARCHIVED")
    ) or 0
    
    total_convs = await db.scalar(
        select(func.count(Conversation.id)).where(Conversation.user_id == current_user.id)
    ) or 0

    avg_quality = await db.scalar(
        select(func.avg(Memory.quality_score)).where(Memory.user_id == current_user.id)
    ) or 0.0

    avg_confidence = await db.scalar(
        select(func.avg(Memory.confidence_score)).where(Memory.user_id == current_user.id)
    ) or 0.0

    avg_importance = await db.scalar(
        select(func.avg(Memory.importance_score)).where(Memory.user_id == current_user.id)
    ) or 0.0

    return {
        "total_memories": total_memories,
        "active_memories": active_memories,
        "conflicted_memories": conflicted_memories,
        "archived_memories": archived_memories,
        "total_conversations": total_convs,
        "avg_quality_score": round(float(avg_quality), 1),
        "avg_confidence_score": round(float(avg_confidence), 1),
        "avg_importance_score": round(float(avg_importance), 1)
    }


@router.get("/categories")
async def get_category_distribution(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = (
        select(Category.name, func.count(Memory.id))
        .join(Memory, Category.id == Memory.category_id)
        .where(Memory.user_id == current_user.id, Memory.status != "DELETED")
        .group_by(Category.name)
    )
    res = await db.execute(stmt)
    rows = res.all()
    total_count = sum(row[1] for row in rows) or 1
    data = [
        {
            "category": row[0],
            "category_name": row[0],
            "count": row[1],
            "memory_count": row[1],
            "percentage": round((row[1] / total_count) * 100, 1)
        }
        for row in rows
    ]
    return data


@router.get("/memory-growth")
async def get_memory_growth(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Group by date
    stmt = (
        select(func.date(Memory.created_at).label("mem_date"), func.count(Memory.id))
        .where(Memory.user_id == current_user.id)
        .group_by(func.date(Memory.created_at))
        .order_by("mem_date")
    )
    res = await db.execute(stmt)
    data = [{"date": str(row[0]), "count": row[1]} for row in res.all()]
    return data


@router.get("/quality-distribution")
async def get_quality_distribution(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(
        select(Memory.quality_score, Memory.importance_score, Memory.confidence_score)
        .where(Memory.user_id == current_user.id, Memory.status == "ACTIVE")
    )
    items = res.all()
    ranges = {"90-100": 0, "80-89": 0, "70-79": 0, "Below 70": 0}
    for item in items:
        q = item[0] or 0
        if q >= 90:
            ranges["90-100"] += 1
        elif q >= 80:
            ranges["80-89"] += 1
        elif q >= 70:
            ranges["70-79"] += 1
        else:
            ranges["Below 70"] += 1

    return [{"range": k, "count": v} for k, v in ranges.items()]
