from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from app.database import get_db
from app.models import (
    Memory, Category, Tag, memory_tags, MemoryVersion,
    MemoryRelation, Feedback, User, AuditLog
)
from app.schemas import (
    MemoryCreate, MemoryUpdate, MemoryResponse, MemoryVersionResponse,
    RelationCreate, RelationResponse, FeedbackCreate, FeedbackResponse
)
from app.dependencies import get_current_user
from app.ai.embeddings import get_embedding_provider

router = APIRouter(prefix="/memories", tags=["Memories"])

async def _format_memory(m: Memory, db: AsyncSession) -> MemoryResponse:
    # Fetch category name
    cat_name = None
    if m.category_id:
        cat = await db.get(Category, m.category_id)
        if cat:
            cat_name = cat.name

    # Fetch tags
    tag_stmt = (
        select(Tag.name)
        .join(memory_tags, Tag.id == memory_tags.c.tag_id)
        .where(memory_tags.c.memory_id == m.id)
    )
    tag_res = await db.execute(tag_stmt)
    tag_list = [t for t in tag_res.scalars().all()]

    # Fetch versions
    ver_stmt = select(MemoryVersion).where(MemoryVersion.memory_id == m.id).order_by(desc(MemoryVersion.version_number))
    ver_res = await db.execute(ver_stmt)
    vers = ver_res.scalars().all()

    return MemoryResponse(
        id=m.id,
        user_id=m.user_id,
        category_id=m.category_id,
        category_name=cat_name,
        source_message_id=m.source_message_id,
        source_conversation_id=m.source_conversation_id,
        memory_type=m.memory_type,
        content=m.content,
        summary=m.summary,
        importance_score=m.importance_score,
        confidence_score=m.confidence_score,
        freshness_score=m.freshness_score,
        quality_score=m.quality_score,
        status=m.status,
        is_sensitive=m.is_sensitive,
        version_number=m.version_number,
        created_at=m.created_at,
        updated_at=m.updated_at,
        last_accessed_at=m.last_accessed_at,
        tags=tag_list,
        versions=[MemoryVersionResponse.model_validate(v) for v in vers]
    )

@router.get("", response_model=List[MemoryResponse])
async def list_memories(
    status: Optional[str] = Query(None),
    category_id: Optional[int] = Query(None),
    memory_type: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Memory).where(Memory.user_id == current_user.id)
    if status:
        stmt = stmt.where(Memory.status == status)
    if category_id:
        stmt = stmt.where(Memory.category_id == category_id)
    if memory_type:
        stmt = stmt.where(Memory.memory_type == memory_type)
    if search:
        stmt = stmt.where(Memory.content.like(f"%{search}%"))

    stmt = stmt.order_by(desc(Memory.created_at))
    res = await db.execute(stmt)
    memories = res.scalars().all()

    return [await _format_memory(m, db) for m in memories]


@router.post("", response_model=MemoryResponse)
async def create_memory(
    mem_in: MemoryCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    embedder = get_embedding_provider()
    vec = await embedder.embed_text(mem_in.content)

    new_mem = Memory(
        user_id=current_user.id,
        category_id=mem_in.category_id,
        memory_type=mem_in.memory_type.upper(),
        content=mem_in.content,
        summary=mem_in.summary or mem_in.content[:60],
        embedding=vec,
        importance_score=mem_in.importance_score,
        confidence_score=mem_in.confidence_score,
        quality_score=int((mem_in.importance_score + mem_in.confidence_score) / 2),
        status="ACTIVE",
        is_sensitive=mem_in.is_sensitive,
        version_number=1,
        created_at=datetime.utcnow()
    )
    db.add(new_mem)
    await db.flush()

    # Link tags
    if mem_in.tags:
        for tname in mem_in.tags:
            t_res = await db.execute(select(Tag).where(Tag.name == tname))
            tag_obj = t_res.scalar_one_or_none()
            if not tag_obj:
                tag_obj = Tag(name=tname)
                db.add(tag_obj)
                await db.flush()
            await db.execute(memory_tags.insert().values(memory_id=new_mem.id, tag_id=tag_obj.id))

    # Audit log
    audit = AuditLog(
        user_id=current_user.id,
        actor_type="USER",
        action="CREATE_MEMORY",
        entity_type="memories",
        entity_id=new_mem.id,
        metadata_json={"type": new_mem.memory_type}
    )
    db.add(audit)
    await db.commit()

    return await _format_memory(new_mem, db)


@router.get("/graph")
async def get_memory_graph(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Fetch all user active and conflicted memories
    stmt = select(Memory).where(Memory.user_id == current_user.id, Memory.status.in_(["ACTIVE", "CONFLICTED"]))
    res = await db.execute(stmt)
    memories = res.scalars().all()

    # Fetch relations
    rel_stmt = (
        select(MemoryRelation)
        .join(Memory, MemoryRelation.source_memory_id == Memory.id)
        .where(Memory.user_id == current_user.id)
    )
    rel_res = await db.execute(rel_stmt)
    relations = rel_res.scalars().all()

    import math
    import numpy as np

    nodes = []
    # Assign physics/visual coordinates in a circular/force layout
    n_count = len(memories)
    for idx, m in enumerate(memories):
        # Calculate visual coordinate around circle with category jitter
        angle = (2 * math.pi * idx) / max(1, n_count)
        radius = 220 + (hash(m.memory_type) % 90)
        cx = 400 + radius * math.cos(angle)
        cy = 300 + radius * math.sin(angle)

        nodes.append({
            "id": str(m.id),
            "label": m.summary or m.content[:35] + ("..." if len(m.content) > 35 else ""),
            "content": m.content,
            "category_id": m.category_id,
            "type": m.memory_type,
            "status": m.status,
            "importance": m.importance_score,
            "confidence": m.confidence_score,
            "x": round(cx, 1),
            "y": round(cy, 1)
        })

    edges = []
    seen_pairs = set()

    # 1. Add explicit database relations
    for r in relations:
        pair_key = tuple(sorted([str(r.source_memory_id), str(r.target_memory_id)]))
        seen_pairs.add(pair_key)
        edges.append({
            "id": f"e-{r.id}",
            "source": str(r.source_memory_id),
            "target": str(r.target_memory_id),
            "type": r.relation_type,
            "confidence": r.confidence,
            "weight": round(r.confidence / 100.0, 2)
        })

    # 2. Synthesize semantic vector similarity edges for connected mesh
    # Calculate cosine distance between memory vectors for top relationships
    for i in range(min(len(memories), 35)):
        m1 = memories[i]
        v1 = None
        if m1.embedding is not None:
            try:
                v1 = np.array(m1.embedding, dtype=np.float32)
                norm1 = np.linalg.norm(v1)
                if norm1 > 0:
                    v1 = v1 / norm1
            except Exception:
                pass

        if v1 is None:
            continue

        best_matches = []
        for j in range(min(len(memories), 35)):
            if i == j:
                continue
            m2 = memories[j]
            pair_key = tuple(sorted([str(m1.id), str(m2.id)]))
            if pair_key in seen_pairs:
                continue

            if m2.embedding is not None:
                try:
                    v2 = np.array(m2.embedding, dtype=np.float32)
                    norm2 = np.linalg.norm(v2)
                    if norm2 > 0:
                        v2 = v2 / norm2
                        sim = float(np.dot(v1, v2))
                        if sim > 0.50:  # Valid semantic similarity threshold
                            best_matches.append((sim, m2.id))
                except Exception:
                    pass

        # Sort and take top 2 semantic neighbors per node
        best_matches.sort(key=lambda x: x[0], reverse=True)
        for sim, target_id in best_matches[:2]:
            pair_key = tuple(sorted([str(m1.id), str(target_id)]))
            if pair_key not in seen_pairs:
                seen_pairs.add(pair_key)
                rel_label = "SEMANTIC_SIMILAR" if sim < 0.80 else "STRONG_AFFINITY"
                edges.append({
                    "id": f"vec-{m1.id}-{target_id}",
                    "source": str(m1.id),
                    "target": str(target_id),
                    "type": rel_label,
                    "confidence": int(sim * 100),
                    "weight": round(sim, 2)
                })

    return {"nodes": nodes, "edges": edges}


@router.get("/replay")
async def replay_memory_endpoint(
    target_date: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    from app.services.intelligent_infrastructure_service import IntelligentMemoryInfrastructureService
    svc = IntelligentMemoryInfrastructureService(db)
    return await svc.replay_memory_state(current_user.id, target_date)


@router.get("/{id}", response_model=MemoryResponse)
async def get_memory(
    id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    m = await db.get(Memory, id)
    if not m or m.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Memory not found.")
    return await _format_memory(m, db)


@router.patch("/{id}", response_model=MemoryResponse)
async def update_memory(
    id: int,
    mem_up: MemoryUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    m = await db.get(Memory, id)
    if not m or m.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Memory not found.")

    # Versioning snapshot if content changes
    if mem_up.content and mem_up.content != m.content:
        ver = MemoryVersion(
            memory_id=m.id,
            version_number=m.version_number,
            previous_content=m.content,
            new_content=mem_up.content,
            change_reason=mem_up.change_reason or "User edited content",
            changed_by="USER"
        )
        db.add(ver)
        m.version_number += 1
        m.content = mem_up.content
        # Update embedding
        embedder = get_embedding_provider()
        m.embedding = await embedder.embed_text(mem_up.content)

    if mem_up.summary is not None:
        m.summary = mem_up.summary
    if mem_up.category_id is not None:
        m.category_id = mem_up.category_id
    if mem_up.memory_type is not None:
        m.memory_type = mem_up.memory_type
    if mem_up.importance_score is not None:
        m.importance_score = mem_up.importance_score
    if mem_up.confidence_score is not None:
        m.confidence_score = mem_up.confidence_score
    if mem_up.status is not None:
        m.status = mem_up.status
    if mem_up.is_sensitive is not None:
        m.is_sensitive = mem_up.is_sensitive

    m.quality_score = int((m.importance_score + m.confidence_score) / 2)
    m.updated_at = datetime.utcnow()

    # Audit log
    audit = AuditLog(
        user_id=current_user.id,
        actor_type="USER",
        action="UPDATE_MEMORY",
        entity_type="memories",
        entity_id=m.id,
        metadata_json={"new_version": m.version_number}
    )
    db.add(audit)
    await db.commit()

    return await _format_memory(m, db)


@router.delete("/{id}")
async def delete_memory(
    id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    m = await db.get(Memory, id)
    if not m or m.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Memory not found.")

    m.status = "DELETED"
    audit = AuditLog(
        user_id=current_user.id,
        actor_type="USER",
        action="DELETE_MEMORY",
        entity_type="memories",
        entity_id=m.id
    )
    db.add(audit)
    await db.commit()
    return {"message": "Memory marked as deleted."}


@router.post("/{id}/archive")
async def archive_memory(
    id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    m = await db.get(Memory, id)
    if not m or m.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Memory not found.")

    m.status = "ARCHIVED"
    audit = AuditLog(
        user_id=current_user.id,
        actor_type="USER",
        action="ARCHIVE_MEMORY",
        entity_type="memories",
        entity_id=m.id
    )
    db.add(audit)
    await db.commit()
    return {"message": "Memory archived."}


@router.post("/{id}/restore")
async def restore_memory(
    id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    m = await db.get(Memory, id)
    if not m or m.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Memory not found.")

    m.status = "ACTIVE"
    audit = AuditLog(
        user_id=current_user.id,
        actor_type="USER",
        action="RESTORE_MEMORY",
        entity_type="memories",
        entity_id=m.id
    )
    db.add(audit)
    await db.commit()
    return {"message": "Memory restored to active status."}


@router.post("/{id}/feedback", response_model=FeedbackResponse)
async def add_memory_feedback(
    id: int,
    fb_in: FeedbackCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    m = await db.get(Memory, id)
    if not m or m.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Memory not found.")

    fb = Feedback(
        user_id=current_user.id,
        memory_id=m.id,
        rating=fb_in.rating,
        feedback_type=fb_in.feedback_type,
        comment=fb_in.comment
    )
    db.add(fb)
    await db.commit()
    await db.refresh(fb)
    return FeedbackResponse.model_validate(fb)


# --- Intelligent Memory Operating Layer Endpoints ---
from pydantic import BaseModel
from app.services.intelligent_infrastructure_service import IntelligentMemoryInfrastructureService

class ConsolidateRequest(BaseModel):
    memory_ids: List[int]
    title: Optional[str] = None

class ExplainQueryRequest(BaseModel):
    query: str
    top_k: Optional[int] = 3

class PredictContextRequest(BaseModel):
    query: str

class ForgetRequest(BaseModel):
    days_threshold: Optional[int] = 30

@router.post("/{id}/pin")
async def toggle_pin_memory(
    id: int,
    pinned: bool = Query(True),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    svc = IntelligentMemoryInfrastructureService(db)
    res = await svc.pin_memory(current_user.id, id, pinned=pinned)
    if not res.get("success"):
        raise HTTPException(status_code=400, detail=res.get("error"))
    return res

@router.post("/consolidate")
async def consolidate_memories_endpoint(
    req: ConsolidateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    svc = IntelligentMemoryInfrastructureService(db)
    res = await svc.consolidate_memories(current_user.id, req.memory_ids, req.title)
    if not res.get("success"):
        raise HTTPException(status_code=400, detail=res.get("error"))
    return res

@router.post("/explain-retrieval")
async def explain_retrieval_endpoint(
    req: ExplainQueryRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    svc = IntelligentMemoryInfrastructureService(db)
    return await svc.explain_retrieval(current_user.id, req.query, req.top_k or 3)

@router.get("/replay")
async def replay_memory_endpoint(
    target_date: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    svc = IntelligentMemoryInfrastructureService(db)
    return await svc.replay_memory_state(current_user.id, target_date)

@router.post("/predict-context")
async def predict_context_endpoint(
    req: PredictContextRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    svc = IntelligentMemoryInfrastructureService(db)
    return await svc.predict_context(current_user.id, req.query)

@router.post("/forget-stale")
async def forget_stale_endpoint(
    req: ForgetRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    svc = IntelligentMemoryInfrastructureService(db)
    return await svc.run_intelligent_forgetting(current_user.id, req.days_threshold or 30)

