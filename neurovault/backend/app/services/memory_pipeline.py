import time
from datetime import datetime
from typing import List, Optional, Tuple, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from app.models import (
    Memory, Category, Tag, memory_tags, MemoryRelation,
    MemoryExtractionEvent, AuditLog, Message
)
from app.schemas import ExtractedMemoryItem
from app.ai.llm import get_llm_provider
from app.ai.embeddings import get_embedding_provider, cosine_similarity

class MemoryPipelineService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.llm = get_llm_provider()
        self.embedding = get_embedding_provider()

    async def process_message_memories(
        self,
        user_id: int,
        message_id: int,
        conversation_id: int,
        message_content: str
    ) -> Tuple[List[Dict[str, Any]], bool, Optional[str]]:
        start_time = time.time()
        extraction_result = await self.llm.extract_memories(message_content)
        processing_time_ms = int((time.time() - start_time) * 1000)

        # Log extraction event
        event = MemoryExtractionEvent(
            message_id=message_id,
            model_name=getattr(self.llm, "model", "qwen2.5:3b"),
            extracted_count=len(extraction_result.memories),
            processing_time_ms=processing_time_ms,
            status="SUCCESS"
        )
        self.db.add(event)

        processed_memories_info = []
        any_conflict = False
        conflict_msg = None

        for item in extraction_result.memories:
            # 1. Generate vector embedding
            vec = await self.embedding.embed_text(item.content)

            # 2. Strict Semantic + Lexical Duplicate Detection against MySQL database
            is_dup, existing_mem = await self._check_duplicate(user_id, item.content, vec, threshold=0.88)
            if is_dup and existing_mem:
                # Deduplication: Enhance or reaffirm the existing memory rather than creating duplicate row
                existing_mem.confidence_score = min(100, existing_mem.confidence_score + 2)
                existing_mem.freshness_score = 100
                existing_mem.last_accessed_at = datetime.utcnow()
                processed_memories_info.append({
                    "id": existing_mem.id,
                    "action": "DEDUPLICATED",
                    "content": existing_mem.content,
                    "reason": f"Merged into existing Memory #{existing_mem.id} (duplicate detected)"
                })
                continue

            # 3. Contradiction Detection against active memories
            is_conflict, conflict_mem_id = await self._check_conflict(user_id, item)
            status = "ACTIVE"
            if is_conflict:
                status = "CONFLICTED"
                any_conflict = True
                conflict_msg = f"Opposing preference or fact detected with existing Memory #{conflict_mem_id}."

            # 4. Resolve category ID
            cat_id = await self._resolve_category(item.category)

            # 5. Insert new pristine Memory
            new_mem = Memory(
                user_id=user_id,
                category_id=cat_id,
                source_message_id=message_id,
                source_conversation_id=conversation_id,
                memory_type=item.memory_type.upper(),
                content=item.content,
                summary=item.summary or item.content[:60],
                embedding=vec,
                importance_score=item.importance,
                confidence_score=item.confidence,
                quality_score=int((item.importance + item.confidence) / 2),
                status=status,
                is_sensitive=item.is_sensitive,
                version_number=1,
                created_at=datetime.utcnow()
            )
            self.db.add(new_mem)
            await self.db.flush()

            # 6. Associate tags
            if item.tags:
                await self._attach_tags(new_mem.id, item.tags)

            # 7. Add self-referencing relation if conflicted
            if is_conflict and conflict_mem_id:
                rel = MemoryRelation(
                    source_memory_id=new_mem.id,
                    target_memory_id=conflict_mem_id,
                    relation_type="CONTRADICTS",
                    confidence=88
                )
                self.db.add(rel)

            processed_memories_info.append({
                "id": new_mem.id,
                "action": "EXTRACTED_NEW",
                "content": new_mem.content,
                "type": new_mem.memory_type,
                "status": status
            })

        await self.db.commit()
        return processed_memories_info, any_conflict, conflict_msg

    async def _check_duplicate(
        self,
        user_id: int,
        content: str,
        new_vec: List[float],
        threshold: float = 0.88
    ) -> Tuple[bool, Optional[Memory]]:
        """
        Multi-stage duplicate detection:
        1. Exact/Substring lexical match
        2. High-confidence semantic cosine similarity (> 0.88)
        """
        res = await self.db.execute(
            select(Memory).where(
                Memory.user_id == user_id,
                Memory.status.in_(["ACTIVE", "CONFLICTED"])
            )
        )
        content_clean = content.lower().strip()

        for mem in res.scalars():
            existing_content = (mem.content or "").lower().strip()
            # 1. Exact or near-identical text
            if existing_content == content_clean or (len(content_clean) > 10 and content_clean in existing_content):
                return True, mem

            # 2. Semantic vector cosine similarity
            if mem.embedding and isinstance(mem.embedding, list):
                sim = cosine_similarity(new_vec, mem.embedding)
                if sim >= threshold:
                    return True, mem

        return False, None

    async def _check_conflict(self, user_id: int, item: ExtractedMemoryItem) -> Tuple[bool, Optional[int]]:
        """
        Contradiction detection for conflicting preferences, frameworks, or tech stacks.
        """
        lower = item.content.lower()
        if any(w in lower for w in ["prefer", "like", "use", "want", "switch"]):
            res = await self.db.execute(
                select(Memory).where(
                    Memory.user_id == user_id,
                    Memory.memory_type == "PREFERENCE",
                    Memory.status == "ACTIVE"
                )
            )
            for mem in res.scalars():
                m_lower = (mem.content or "").lower()
                # Antonyms / mutually conflicting preference patterns
                conflicts = [
                    ("python", "go"),
                    ("light mode", "dark mode"),
                    ("react", "vue"),
                    ("postgres", "mysql"),
                    ("sql", "nosql"),
                    ("javascript", "typescript")
                ]
                for tech1, tech2 in conflicts:
                    if (tech1 in lower and tech2 in m_lower) or (tech2 in lower and tech1 in m_lower):
                        return True, mem.id

        return False, None

    async def _resolve_category(self, cat_name: str) -> Optional[int]:
        res = await self.db.execute(select(Category).where(Category.name == cat_name))
        cat = res.scalar_one_or_none()
        if cat:
            return cat.id
        res_default = await self.db.execute(select(Category).limit(1))
        def_cat = res_default.scalar_one_or_none()
        return def_cat.id if def_cat else None

    async def _attach_tags(self, memory_id: int, tag_names: List[str]):
        for tname in tag_names:
            tname_clean = tname.strip()
            if not tname_clean:
                continue
            res = await self.db.execute(select(Tag).where(Tag.name == tname_clean))
            tag_obj = res.scalar_one_or_none()
            if not tag_obj:
                tag_obj = Tag(name=tname_clean)
                self.db.add(tag_obj)
                await self.db.flush()
            
            stmt = memory_tags.insert().values(memory_id=memory_id, tag_id=tag_obj.id)
            try:
                await self.db.execute(stmt)
            except Exception:
                pass
