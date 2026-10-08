from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from app.database import get_db
from app.models import Conversation, Message, User
from app.schemas import (
    ConversationCreate, ConversationResponse, MessageCreate, MessageResponse
)
from app.dependencies import get_current_user

router = APIRouter(prefix="/conversations", tags=["Conversations"])

@router.get("", response_model=List[ConversationResponse])
async def list_conversations(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = (
        select(Conversation)
        .where(Conversation.user_id == current_user.id)
        .order_by(desc(Conversation.created_at))
    )
    res = await db.execute(stmt)
    convs = res.scalars().all()
    
    result = []
    for c in convs:
        # Load messages
        msg_stmt = select(Message).where(Message.conversation_id == c.id).order_by(Message.created_at)
        msg_res = await db.execute(msg_stmt)
        msgs = msg_res.scalars().all()
        result.append(
            ConversationResponse(
                id=c.id,
                user_id=c.user_id,
                title=c.title,
                summary=c.summary,
                status=c.status,
                started_at=c.started_at,
                ended_at=c.ended_at,
                created_at=c.created_at,
                messages=[MessageResponse.model_validate(m) for m in msgs]
            )
        )
    return result


@router.post("", response_model=ConversationResponse)
async def create_conversation(
    conv_in: ConversationCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    new_c = Conversation(
        user_id=current_user.id,
        title=conv_in.title,
        status="ACTIVE"
    )
    db.add(new_c)
    await db.commit()
    await db.refresh(new_c)
    return ConversationResponse(
        id=new_c.id,
        user_id=new_c.user_id,
        title=new_c.title,
        status=new_c.status,
        started_at=new_c.started_at,
        created_at=new_c.created_at,
        messages=[]
    )


@router.get("/{id}", response_model=ConversationResponse)
async def get_conversation(
    id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    c = await db.get(Conversation, id)
    if not c or c.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Conversation not found.")

    msg_stmt = select(Message).where(Message.conversation_id == c.id).order_by(Message.created_at)
    msg_res = await db.execute(msg_stmt)
    msgs = msg_res.scalars().all()

    return ConversationResponse(
        id=c.id,
        user_id=c.user_id,
        title=c.title,
        summary=c.summary,
        status=c.status,
        started_at=c.started_at,
        ended_at=c.ended_at,
        created_at=c.created_at,
        messages=[MessageResponse.model_validate(m) for m in msgs]
    )


@router.delete("/{id}")
async def delete_conversation(
    id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    c = await db.get(Conversation, id)
    if not c or c.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Conversation not found.")

    await db.delete(c)
    await db.commit()
    return {"message": "Conversation deleted successfully."}
