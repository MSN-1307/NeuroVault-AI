from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models import Category, Tag

router = APIRouter(tags=["Metadata"])

@router.get("/categories")
async def list_categories(db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(Category).order_by(Category.name))
    cats = res.scalars().all()
    return [{"id": c.id, "name": c.name, "description": c.description} for c in cats]

@router.get("/tags")
async def list_tags(db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(Tag).order_by(Tag.name))
    tags = res.scalars().all()
    return [{"id": t.id, "name": t.name, "description": t.description} for t in tags]
