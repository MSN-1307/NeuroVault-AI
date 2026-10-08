import json
from typing import AsyncGenerator
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models import Conversation, Message, User, UserPreference
from app.schemas import ChatRequest, ChatResponse, RetrievedMemoryCitation
from app.dependencies import get_current_user
from app.services.retrieval_service import HybridRetrievalService
from app.services.memory_pipeline import MemoryPipelineService
from app.ai.llm import get_llm_provider

router = APIRouter(prefix="/chat", tags=["Chat"])

@router.post("", response_model=ChatResponse)
async def chat_message(
    req: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Standard fast JSON chat endpoint with retrieval, duplicate check, and memory extraction.
    """
    # 1. Resolve or create conversation
    conv = None
    if req.conversation_id:
        conv = await db.get(Conversation, req.conversation_id)
    if not conv:
        conv = Conversation(
            user_id=current_user.id,
            title=req.message[:40] + ("..." if len(req.message) > 40 else ""),
            status="ACTIVE"
        )
        db.add(conv)
        await db.flush()

    # 2. Save user message to MySQL messages
    user_msg = Message(
        conversation_id=conv.id,
        sender_type="USER",
        content=req.message,
        token_count=len(req.message.split())
    )
    db.add(user_msg)
    await db.flush()

    # 3. Check User Preferences for memory
    pref_res = await db.execute(select(UserPreference).where(UserPreference.user_id == current_user.id))
    pref = pref_res.scalar_one_or_none()
    memory_enabled = pref.memory_enabled if pref else True

    # 4. Hybrid Retrieval for relevant context
    retrieved_citations = []
    context_str = ""
    if memory_enabled:
        retrieval_svc = HybridRetrievalService(db)
        top_memories = await retrieval_svc.search(
            user_id=current_user.id,
            query=req.message,
            status="ACTIVE",
            top_k=5
        )
        if top_memories:
            context_lines = []
            for m in top_memories:
                context_lines.append(f"- [{m.memory_type}] {m.content}")
                retrieved_citations.append(
                    RetrievedMemoryCitation(
                        id=m.id,
                        content=m.content,
                        category=m.category_name,
                        memory_type=m.memory_type,
                        score=m.final_score,
                        importance=m.importance_score,
                        confidence=m.confidence_score
                    )
                )
            context_str = "RELEVANT USER MEMORIES FROM NEUROVAULT:\n" + "\n".join(context_lines)

    # 5. Extract new memories & prevent duplicates
    pipeline_svc = MemoryPipelineService(db)
    memories_info, conflict_detected, conflict_details = await pipeline_svc.process_message_memories(
        user_id=current_user.id,
        message_id=user_msg.id,
        conversation_id=conv.id,
        message_content=req.message
    )

    # 6. Generate Assistant Response
    llm = get_llm_provider()
    system_prompt = (
        "You are NeuroVault, an elite, professional, low-latency AI assistant backed by a persistent MySQL memory vault.\n"
        "Answer questions accurately, concisely, and helpfully across all domains (engineering, databases, life, programming).\n"
        "Leverage the retrieved memories below to provide tailored context.\n"
        "If contradictory memories exist, point them out tactfully."
    )
    if context_str:
        system_prompt += f"\n\n{context_str}"

    ai_reply_text = await llm.generate(
        prompt=req.message,
        system_prompt=system_prompt
    )

    # 7. Save Assistant message
    assistant_msg = Message(
        conversation_id=conv.id,
        sender_type="ASSISTANT",
        content=ai_reply_text,
        token_count=len(ai_reply_text.split())
    )
    db.add(assistant_msg)
    await db.commit()

    return ChatResponse(
        conversation_id=conv.id,
        response=ai_reply_text,
        retrieved_memories=retrieved_citations,
        extracted_memories_count=len(memories_info),
        conflict_detected=conflict_detected,
        conflict_details=conflict_details
    )


@router.post("/stream")
async def chat_stream_message(
    req: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    High-speed SSE streaming endpoint: Streams tokens immediately to the frontend
    while concurrently performing hybrid retrieval and background deduplication extraction.
    """
    # 1. Resolve or create conversation
    conv = None
    if req.conversation_id:
        conv = await db.get(Conversation, req.conversation_id)
    if not conv:
        conv = Conversation(
            user_id=current_user.id,
            title=req.message[:40] + ("..." if len(req.message) > 40 else ""),
            status="ACTIVE"
        )
        db.add(conv)
        await db.flush()

    # 2. Save user message
    user_msg = Message(
        conversation_id=conv.id,
        sender_type="USER",
        content=req.message,
        token_count=len(req.message.split())
    )
    db.add(user_msg)
    await db.flush()

    # 3. Hybrid Retrieval for context
    retrieval_svc = HybridRetrievalService(db)
    top_memories = await retrieval_svc.search(
        user_id=current_user.id,
        query=req.message,
        status="ACTIVE",
        top_k=4
    )
    
    retrieved_citations = []
    context_lines = []
    for m in top_memories:
        context_lines.append(f"- [{m.memory_type}] {m.content}")
        retrieved_citations.append({
            "id": m.id,
            "content": m.content,
            "category": m.category_name,
            "memory_type": m.memory_type,
            "score": m.final_score
        })
    context_str = "RELEVANT USER MEMORIES:\n" + "\n".join(context_lines) if context_lines else ""

    # 4. Extract new memories & handle deduplication
    pipeline_svc = MemoryPipelineService(db)
    memories_info, conflict_detected, conflict_details = await pipeline_svc.process_message_memories(
        user_id=current_user.id,
        message_id=user_msg.id,
        conversation_id=conv.id,
        message_content=req.message
    )

    llm = get_llm_provider()
    system_prompt = (
        "You are NeuroVault, an elite, highly knowledgeable, professional AI assistant.\n"
        "Provide thorough, direct, and well-structured answers to every question like ChatGPT / Gemini.\n"
        "Use markdown formatting with bolding and bullet points where helpful."
    )
    if context_str:
        system_prompt += f"\n\n{context_str}"

    async def event_generator() -> AsyncGenerator[str, None]:
        # Send initial metadata event (citations, deduplication count, conversation ID)
        meta_event = {
            "type": "meta",
            "conversation_id": conv.id,
            "retrieved_memories": retrieved_citations,
            "conflict_detected": conflict_detected,
            "conflict_details": conflict_details,
            "extracted_count": len(memories_info)
        }
        yield f"data: {json.dumps(meta_event)}\n\n"

        full_response_parts = []
        async for token in llm.stream_generate(req.message, system_prompt):
            full_response_parts.append(token)
            yield f"data: {json.dumps({'type': 'token', 'token': token})}\n\n"

        full_reply = "".join(full_response_parts)

        # Save assistant message
        async with db.begin_nested():
            assistant_msg = Message(
                conversation_id=conv.id,
                sender_type="ASSISTANT",
                content=full_reply,
                token_count=len(full_reply.split())
            )
            db.add(assistant_msg)
        await db.commit()

        yield f"data: {json.dumps({'type': 'done'})}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "Connection": "keep-alive"}
    )
