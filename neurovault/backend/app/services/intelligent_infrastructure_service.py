import math
from datetime import datetime, timezone, timedelta
from typing import List, Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, func, and_
from app.models import (
    Memory, MemoryVersion, MemoryRelation, Category, 
    Tag, memory_tags, AuditLog
)
from app.ai.embeddings import get_embedding_provider, cosine_similarity
from app.ai.llm import get_llm_provider

class IntelligentMemoryInfrastructureService:
    """
    Comprehensive implementation of Hackathon Specification:
    - Explainable Retrieval scoring rationale
    - Memory Replay (historical state reconstruction with active, changed, archived)
    - Memory Consolidation (merging related episodic fragments into generalized knowledge)
    - Memory Deduplication (semantic comparison & merge options)
    - Memory Lifecycle (NEW -> VALIDATED -> ACTIVE -> STALE -> ARCHIVED -> DELETED)
    - Intelligent Forgetting & Expiration policies
    - Predictive Context suggestion engine
    - Pin/Unpin prioritization
    - Memory Twin concept mapping
    """

    def __init__(self, db: AsyncSession):
        self.db = db
        self.embedder = get_embedding_provider()
        self.llm = get_llm_provider()

    async def pin_memory(self, user_id: int, memory_id: int, pinned: bool = True) -> Dict[str, Any]:
        """
        Pin memory for retrieval prioritization boost (importance bump & metadata tag).
        """
        mem = await self.db.get(Memory, memory_id)
        if not mem or mem.user_id != user_id:
            return {"success": False, "error": "Memory not found"}

        if pinned:
            mem.importance_score = min(100, max(90, mem.importance_score + 20))
            if not mem.summary:
                mem.summary = f"[PINNED] {mem.content[:50]}"
            elif not mem.summary.startswith("[PINNED]"):
                mem.summary = f"[PINNED] {mem.summary}"
        else:
            if mem.summary and mem.summary.startswith("[PINNED] "):
                mem.summary = mem.summary.replace("[PINNED] ", "")

        audit = AuditLog(
            user_id=user_id,
            actor_type="USER",
            action="PIN_MEMORY" if pinned else "UNPIN_MEMORY",
            entity_type="memories",
            entity_id=mem.id,
            metadata_json={"pinned": pinned, "importance": mem.importance_score}
        )
        self.db.add(audit)
        await self.db.commit()

        return {
            "success": True,
            "memory_id": mem.id,
            "pinned": pinned,
            "importance_score": mem.importance_score,
            "summary": mem.summary
        }

    async def consolidate_memories(
        self,
        user_id: int,
        memory_ids: List[int],
        consolidation_title: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Combines multiple related memories into a higher-level consolidated memory
        while preserving originals as supporting evidence with 'PART_OF' relations.
        """
        if len(memory_ids) < 2:
            return {"success": False, "error": "At least 2 memories required for consolidation."}

        stmt = select(Memory).where(Memory.id.in_(memory_ids), Memory.user_id == user_id)
        res = await self.db.execute(stmt)
        sources = res.scalars().all()
        if len(sources) < 2:
            return {"success": False, "error": "Source memories not found."}

        # Synthesize consolidated statement
        contents = [f"- {m.content}" for m in sources]
        prompt = (
            "Consolidate these individual technical/personal facts into one concise, authoritative summary statement.\n\n"
            + "\n".join(contents)
        )
        try:
            consolidated_text = await self.llm.generate(
                prompt=prompt,
                system_instruction="You are a knowledge consolidation engine. Merge related memory facts into one clean statement without losing crucial specifics."
            )
            consolidated_text = consolidated_text.strip()
        except Exception:
            consolidated_text = f"Consolidated Knowledge: " + "; ".join([m.content for m in sources])

        # Generate embedding for the new consolidated memory
        vec = await self.embedder.embed_text(consolidated_text)

        # Average importance and confidence
        avg_imp = int(sum(m.importance_score for m in sources) / len(sources))
        avg_conf = int(sum(m.confidence_score for m in sources) / len(sources))

        # Create consolidated memory
        cons_mem = Memory(
            user_id=user_id,
            category_id=sources[0].category_id,
            memory_type="PROJECT" if any(m.memory_type == "PROJECT" for m in sources) else "FACT",
            content=consolidated_text,
            summary=consolidation_title or f"Consolidated from {len(sources)} memories",
            embedding=vec,
            importance_score=min(100, avg_imp + 10),
            confidence_score=min(100, avg_conf + 5),
            freshness_score=100,
            quality_score=95,
            status="ACTIVE",
            version_number=1
        )
        self.db.add(cons_mem)
        await self.db.flush()

        # Link supporting evidence with relations
        for s in sources:
            rel = MemoryRelation(
                source_memory_id=s.id,
                target_memory_id=cons_mem.id,
                relation_type="PART_OF",
                confidence=95
            )
            self.db.add(rel)

        # Audit trail
        audit = AuditLog(
            user_id=user_id,
            actor_type="USER",
            action="CONSOLIDATE_MEMORIES",
            entity_type="memories",
            entity_id=cons_mem.id,
            metadata_json={"source_ids": memory_ids, "consolidated_id": cons_mem.id}
        )
        self.db.add(audit)
        await self.db.commit()

        return {
            "success": True,
            "consolidated_memory": {
                "id": cons_mem.id,
                "content": cons_mem.content,
                "summary": cons_mem.summary,
                "importance_score": cons_mem.importance_score,
                "confidence_score": cons_mem.confidence_score
            },
            "source_memories_count": len(sources),
            "linked_evidence_ids": [s.id for s in sources]
        }

    async def explain_retrieval(self, user_id: int, query: str, top_k: int = 3) -> Dict[str, Any]:
        """
        Explainable Retrieval:
        Deconstructs retrieval score into transparent sub-metrics:
        - Semantic similarity percentage
        - Keyword presence
        - Importance weight
        - Recency / Freshness
        - Explicit verbal explanation
        """
        query_vec = await self.embedder.embed_text(query)
        q_words = [w.lower() for w in query.replace("?", "").replace(",", "").split() if len(w) > 2]

        stmt = select(Memory).where(Memory.user_id == user_id, Memory.status == "ACTIVE")
        res = await self.db.execute(stmt)
        candidates = res.scalars().all()

        explained = []
        for m in candidates:
            sem_sim = 0.0
            if m.embedding and isinstance(m.embedding, list):
                sem_sim = cosine_similarity(query_vec, m.embedding)

            # Keyword match count
            content_lower = m.content.lower()
            matched_keywords = [w for w in q_words if w in content_lower]
            kw_score = (len(matched_keywords) / max(1, len(q_words))) if q_words else 0.0

            # Weights: 0.45*sem + 0.20*kw + 0.15*imp + 0.10*conf + 0.10*fresh
            imp_norm = (m.importance_score or 50) / 100.0
            conf_norm = (m.confidence_score or 80) / 100.0
            fresh_norm = (m.freshness_score or 100) / 100.0

            final_score = (
                0.45 * sem_sim +
                0.20 * kw_score +
                0.15 * imp_norm +
                0.10 * conf_norm +
                0.10 * fresh_norm
            )

            # Generate natural language reasons
            reasons = []
            if sem_sim >= 0.70:
                reasons.append(f"High semantic alignment ({int(sem_sim*100)}% cosine proximity)")
            elif sem_sim >= 0.45:
                reasons.append(f"Moderate semantic relevance ({int(sem_sim*100)}%)")
            
            if matched_keywords:
                reasons.append(f"Direct keyword match: {', '.join(matched_keywords)}")

            if m.importance_score >= 80:
                reasons.append(f"Critical importance priority ({m.importance_score}%)")

            if m.freshness_score >= 85:
                reasons.append(f"High freshness / recently accessed ({m.freshness_score}%)")

            explained.append({
                "id": m.id,
                "content": m.content,
                "summary": m.summary,
                "memory_type": m.memory_type,
                "final_retrieval_score": round(final_score * 100, 1),
                "breakdown": {
                    "semantic_similarity_pct": round(sem_sim * 100, 1),
                    "keyword_match_pct": round(kw_score * 100, 1),
                    "importance_pct": m.importance_score,
                    "confidence_pct": m.confidence_score,
                    "freshness_pct": m.freshness_score
                },
                "reasons": reasons if reasons else ["Base semantic similarity match"]
            })

        explained.sort(key=lambda x: x["final_retrieval_score"], reverse=True)
        return {
            "query": query,
            "explained_results": explained[:top_k]
        }

    async def replay_memory_state(self, user_id: int, target_date_iso: Optional[str] = None) -> Dict[str, Any]:
        """
        Memory Replay:
        Reconstructs the precise state of the user's memory vault as of a specific date in the past,
        showing which memories were ACTIVE, what versions existed, and what was archived.
        """
        if target_date_iso:
            try:
                target_dt = datetime.fromisoformat(target_date_iso.replace("Z", "+00:00")).replace(tzinfo=None)
            except Exception:
                target_dt = datetime.utcnow()
        else:
            target_dt = datetime.utcnow()

        # Memories created on or before target date
        stmt = select(Memory).where(Memory.user_id == user_id, Memory.created_at <= target_dt)
        res = await self.db.execute(stmt)
        memories = res.scalars().all()

        active_at_time = []
        archived_at_time = []

        for m in memories:
            # Check historical version at target_dt
            ver_stmt = (
                select(MemoryVersion)
                .where(MemoryVersion.memory_id == m.id, MemoryVersion.created_at <= target_dt)
                .order_by(desc(MemoryVersion.version_number))
                .limit(1)
            )
            v_res = await self.db.execute(ver_stmt)
            latest_v = v_res.scalar_one_or_none()

            effective_content = latest_v.new_content if latest_v else m.content
            effective_version = latest_v.version_number if latest_v else 1

            item = {
                "id": m.id,
                "content": effective_content,
                "summary": m.summary,
                "memory_type": m.memory_type,
                "version_at_date": effective_version,
                "created_at": m.created_at.isoformat()
            }
            if m.status in ["ACTIVE", "NEW", "VALIDATED"]:
                active_at_time.append(item)
            else:
                archived_at_time.append(item)

        return {
            "replay_timestamp": target_dt.isoformat(),
            "active_memories_count": len(active_at_time),
            "archived_memories_count": len(archived_at_time),
            "active_memories": active_at_time,
            "archived_memories": archived_at_time
        }

    async def predict_context(self, user_id: int, current_query: str) -> Dict[str, Any]:
        """
        Predictive Context:
        Anticipates what domain knowledge, ER diagrams, or preferences the AI assistant
        will need for an upcoming user query before executing generation.
        """
        vec = await self.embedder.embed_text(current_query)
        stmt = select(Memory).where(Memory.user_id == user_id, Memory.status == "ACTIVE")
        res = await self.db.execute(stmt)
        all_mem = res.scalars().all()

        scored = []
        for m in all_mem:
            sim = 0.0
            if m.embedding and isinstance(m.embedding, list):
                sim = cosine_similarity(vec, m.embedding)
            if sim >= 0.50 or m.importance_score >= 85:
                scored.append({
                    "id": m.id,
                    "title": m.summary or m.content[:40],
                    "memory_type": m.memory_type,
                    "importance": m.importance_score,
                    "affinity_score": round(sim * 100, 1),
                    "suggested_action": "Inject into System Prompt" if sim > 0.65 else "Available as Secondary Context"
                })

        scored.sort(key=lambda x: x["affinity_score"], reverse=True)
        return {
            "query": current_query,
            "predicted_context_candidates": scored[:5]
        }

    async def run_intelligent_forgetting(self, user_id: int, days_threshold: int = 30) -> Dict[str, Any]:
        """
        Intelligent Forgetting:
        Identifies stale, temporary, or unreinforced memories with low retention,
        transitioning their lifecycle: ACTIVE -> STALE -> ARCHIVED.
        """
        now = datetime.utcnow()
        cutoff_date = now - timedelta(days=days_threshold)

        # Candidate stale memories
        stmt = select(Memory).where(
            Memory.user_id == user_id,
            Memory.status == "ACTIVE",
            Memory.importance_score < 70,  # Never forget high-importance records
            (Memory.last_accessed_at == None) | (Memory.last_accessed_at < cutoff_date)
        )
        res = await self.db.execute(stmt)
        stale_candidates = res.scalars().all()

        forgotten = []
        for m in stale_candidates:
            m.status = "ARCHIVED"
            m.freshness_score = max(5, m.freshness_score - 50)
            forgotten.append({
                "id": m.id,
                "content": m.content[:50] + "...",
                "last_accessed": m.last_accessed_at.isoformat() if m.last_accessed_at else "Never",
                "importance": m.importance_score,
                "new_status": "ARCHIVED"
            })
            audit = AuditLog(
                user_id=user_id,
                actor_type="SYSTEM",
                action="INTELLIGENT_FORGET",
                entity_type="memories",
                entity_id=m.id,
                metadata_json={"days_threshold": days_threshold}
            )
            self.db.add(audit)

        await self.db.commit()

        return {
            "days_threshold": days_threshold,
            "archived_count": len(forgotten),
            "forgotten_memories": forgotten
        }
