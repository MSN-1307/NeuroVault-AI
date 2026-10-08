from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.models import User
from app.schemas import SearchRequest, SearchResultItem
from app.dependencies import get_current_user
from app.services.retrieval_service import HybridRetrievalService

router = APIRouter(prefix="/search", tags=["Search"])

@router.post("/memories", response_model=List[SearchResultItem])
async def search_memories(
    req: SearchRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    retrieval_svc = HybridRetrievalService(db)
    results = await retrieval_svc.search(
        user_id=current_user.id,
        query=req.query,
        category_id=req.category_id,
        memory_type=req.memory_type,
        status=req.status or "ACTIVE",
        top_k=req.top_k or 8
    )
    return results
