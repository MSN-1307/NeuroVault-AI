from datetime import datetime
from typing import List, Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text
from app.config import settings
from app.models import Memory, Category, Tag, MemoryAccessLog
from app.ai.embeddings import get_embedding_provider, cosine_similarity
from app.schemas import SearchResultItem

class HybridRetrievalService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.embedding_provider = get_embedding_provider()

    async def search(
        self,
        user_id: int,
        query: str,
        category_id: Optional[int] = None,
        memory_type: Optional[str] = None,
        status: str = "ACTIVE",
        top_k: int = settings.RETRIEVAL_TOP_K
    ) -> List[SearchResultItem]:
        # 1. Generate query embedding
        query_vector = await self.embedding_provider.embed_text(query)

        # 2. Execute MySQL Keyword Full-Text Search
        # Sanitizing query string for MySQL boolean fulltext search
        clean_words = [w.strip() for w in query.replace("+", "").replace("-", "").replace("*", "").split() if len(w.strip()) > 2]
        boolean_query = " ".join([f"+{w}*" for w in clean_words]) if clean_words else query

        # 3. Query candidate memories for user
        stmt = (
            select(Memory, Category.name.label("category_name"))
            .outerjoin(Category, Memory.category_id == Category.id)
            .where(Memory.user_id == user_id)
        )
        if status:
            stmt = stmt.where(Memory.status == status)
        if category_id:
            stmt = stmt.where(Memory.category_id == category_id)
        if memory_type:
            stmt = stmt.where(Memory.memory_type == memory_type)

        res = await self.db.execute(stmt)
        candidates = res.all()

        scored_memories = []
        now = datetime.utcnow()

        for mem, cat_name in candidates:
            # Semantic Score via Cosine Similarity
            semantic_score = 0.0
            if mem.embedding and isinstance(mem.embedding, list):
                semantic_score = cosine_similarity(query_vector, mem.embedding)

            # Keyword Score using keyword match presence or fulltext relevance
            keyword_score = 0.0
            content_lower = (mem.content or "").lower()
            summary_lower = (mem.summary or "").lower()
            query_words = [w.lower() for w in clean_words]
            if query_words:
                matches = sum(1 for w in query_words if w in content_lower or w in summary_lower)
                keyword_score = min(1.0, matches / len(query_words))

            # Importance Score normalized (0-1)
            norm_importance = (mem.importance_score or 50) / 100.0

            # Confidence Score normalized (0-1)
            norm_confidence = (mem.confidence_score or 80) / 100.0

            # Recency Score (Decays gently over 30 days)
            age_days = (now - (mem.created_at or now)).total_seconds() / 86400.0
            recency_score = max(0.1, 1.0 - (age_days / 60.0))

            # Formula:
            # final_score = (0.45 * semantic) + (0.20 * keyword) + (0.15 * importance) + (0.10 * confidence) + (0.10 * recency)
            final_score = (
                (settings.SEMANTIC_WEIGHT * semantic_score) +
                (settings.KEYWORD_WEIGHT * keyword_score) +
                (settings.IMPORTANCE_WEIGHT * norm_importance) +
                (settings.CONFIDENCE_WEIGHT * norm_confidence) +
                (settings.RECENCY_WEIGHT * recency_score)
            )

            scored_memories.append(
                SearchResultItem(
                    id=mem.id,
                    content=mem.content,
                    summary=mem.summary,
                    category_name=cat_name,
                    memory_type=mem.memory_type,
                    final_score=round(final_score, 4),
                    semantic_score=round(semantic_score, 4),
                    keyword_score=round(keyword_score, 4),
                    importance_score=mem.importance_score,
                    confidence_score=mem.confidence_score,
                    status=mem.status,
                    created_at=mem.created_at
                )
            )

        # Sort descending by final score
        scored_memories.sort(key=lambda x: x.final_score, reverse=True)
        top_results = scored_memories[:top_k]

        # Log memory access for top results
        for item in top_results:
            log = MemoryAccessLog(
                memory_id=item.id,
                user_id=user_id,
                access_type="RETRIEVAL",
                query=query,
                retrieval_score=item.final_score
            )
            self.db.add(log)
            # Update last_accessed_at on the memory
            mem_obj = await self.db.get(Memory, item.id)
            if mem_obj:
                mem_obj.last_accessed_at = datetime.utcnow()

        await self.db.commit()
        return top_results
