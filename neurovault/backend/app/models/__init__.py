from datetime import datetime
from typing import List, Optional, Any
from sqlalchemy import (
    BigInteger, String, Text, Boolean, Integer, Float, DateTime, 
    ForeignKey, Table, Column, Index, JSON, Enum as SAEnum
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from app.database import Base

# Association Table: memory_tags (Many-to-Many)
memory_tags = Table(
    "memory_tags",
    Base.metadata,
    Column("memory_id", BigInteger, ForeignKey("memories.id", ondelete="CASCADE"), primary_key=True),
    Column("tag_id", BigInteger, ForeignKey("tags.id", ondelete="CASCADE"), primary_key=True),
    Column("created_at", DateTime, server_default=func.now())
)

class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    email: Mapped[str] = mapped_column(String(191), unique=True, nullable=False, index=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(SAEnum("USER", "ADMIN", "AI_SERVICE", name="user_roles"), default="USER", nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="ACTIVE", nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())
    last_login_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    # Relationships
    preferences: Mapped[Optional["UserPreference"]] = relationship("UserPreference", back_populates="user", uselist=False, cascade="all, delete-orphan")
    conversations: Mapped[List["Conversation"]] = relationship("Conversation", back_populates="user", cascade="all, delete-orphan")
    memories: Mapped[List["Memory"]] = relationship("Memory", back_populates="user", cascade="all, delete-orphan")
    feedbacks: Mapped[List["Feedback"]] = relationship("Feedback", back_populates="user", cascade="all, delete-orphan")
    access_logs: Mapped[List["MemoryAccessLog"]] = relationship("MemoryAccessLog", back_populates="user", cascade="all, delete-orphan")
    audit_logs: Mapped[List["AuditLog"]] = relationship("AuditLog", back_populates="user")


class UserPreference(Base):
    __tablename__ = "user_preferences"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    communication_style: Mapped[str] = mapped_column(String(50), default="BALANCED")
    language: Mapped[str] = mapped_column(String(20), default="en")
    theme: Mapped[str] = mapped_column(String(20), default="light")
    memory_enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    personalization_enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    analytics_enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())

    user: Mapped["User"] = relationship("User", back_populates="preferences")


class Category(Base):
    __tablename__ = "categories"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    memories: Mapped[List["Memory"]] = relationship("Memory", back_populates="category")


class Conversation(Base):
    __tablename__ = "conversations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(50), default="ACTIVE", index=True)
    started_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    ended_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())

    user: Mapped["User"] = relationship("User", back_populates="conversations")
    messages: Mapped[List["Message"]] = relationship("Message", back_populates="conversation", cascade="all, delete-orphan", order_by="Message.created_at")


class Message(Base):
    __tablename__ = "messages"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    conversation_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("conversations.id", ondelete="CASCADE"), nullable=False, index=True)
    sender_type: Mapped[str] = mapped_column(SAEnum("USER", "ASSISTANT", "SYSTEM", name="sender_types"), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    token_count: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    conversation: Mapped["Conversation"] = relationship("Conversation", back_populates="messages")
    extraction_events: Mapped[List["MemoryExtractionEvent"]] = relationship("MemoryExtractionEvent", back_populates="message")


class Memory(Base):
    __tablename__ = "memories"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    category_id: Mapped[Optional[int]] = mapped_column(BigInteger, ForeignKey("categories.id", ondelete="SET NULL"), nullable=True, index=True)
    source_message_id: Mapped[Optional[int]] = mapped_column(BigInteger, ForeignKey("messages.id", ondelete="SET NULL"), nullable=True)
    source_conversation_id: Mapped[Optional[int]] = mapped_column(BigInteger, ForeignKey("conversations.id", ondelete="SET NULL"), nullable=True)
    
    memory_type: Mapped[str] = mapped_column(String(50), default="FACT", index=True)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    embedding: Mapped[Optional[Any]] = mapped_column(JSON, nullable=True)
    
    importance_score: Mapped[int] = mapped_column(Integer, default=50)
    confidence_score: Mapped[int] = mapped_column(Integer, default=80)
    freshness_score: Mapped[int] = mapped_column(Integer, default=100)
    quality_score: Mapped[int] = mapped_column(Integer, default=85)
    
    status: Mapped[str] = mapped_column(String(50), default="ACTIVE", index=True)  # DETECTED, ACTIVE, ARCHIVED, EXPIRED, DELETED, CONFLICTED
    is_sensitive: Mapped[bool] = mapped_column(Boolean, default=False)
    version_number: Mapped[int] = mapped_column(Integer, default=1)
    
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), index=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())
    last_accessed_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True, index=True)
    expires_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="memories")
    category: Mapped[Optional["Category"]] = relationship("Category", back_populates="memories")
    tags: Mapped[List["Tag"]] = relationship("Tag", secondary=memory_tags, back_populates="memories")
    versions: Mapped[List["MemoryVersion"]] = relationship("MemoryVersion", back_populates="memory", cascade="all, delete-orphan", order_by="desc(MemoryVersion.version_number)")
    feedbacks: Mapped[List["Feedback"]] = relationship("Feedback", back_populates="memory", cascade="all, delete-orphan")
    
    # Relations as source and target
    outgoing_relations: Mapped[List["MemoryRelation"]] = relationship("MemoryRelation", foreign_keys="MemoryRelation.source_memory_id", back_populates="source_memory", cascade="all, delete-orphan")
    incoming_relations: Mapped[List["MemoryRelation"]] = relationship("MemoryRelation", foreign_keys="MemoryRelation.target_memory_id", back_populates="target_memory", cascade="all, delete-orphan")


class MemoryVersion(Base):
    __tablename__ = "memory_versions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    memory_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("memories.id", ondelete="CASCADE"), nullable=False, index=True)
    version_number: Mapped[int] = mapped_column(Integer, nullable=False)
    previous_content: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    new_content: Mapped[str] = mapped_column(Text, nullable=False)
    change_reason: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    changed_by: Mapped[str] = mapped_column(String(100), default="SYSTEM")
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    memory: Mapped["Memory"] = relationship("Memory", back_populates="versions")


class Tag(Base):
    __tablename__ = "tags"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    description: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    memories: Mapped[List["Memory"]] = relationship("Memory", secondary=memory_tags, back_populates="tags")


class MemoryRelation(Base):
    __tablename__ = "memory_relations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    source_memory_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("memories.id", ondelete="CASCADE"), nullable=False, index=True)
    target_memory_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("memories.id", ondelete="CASCADE"), nullable=False, index=True)
    relation_type: Mapped[str] = mapped_column(String(50), default="RELATED_TO")  # RELATED_TO, CONTRADICTS, REPLACES, PART_OF, SUPPORTS
    confidence: Mapped[int] = mapped_column(Integer, default=80)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    source_memory: Mapped["Memory"] = relationship("Memory", foreign_keys=[source_memory_id], back_populates="outgoing_relations")
    target_memory: Mapped["Memory"] = relationship("Memory", foreign_keys=[target_memory_id], back_populates="incoming_relations")


class Feedback(Base):
    __tablename__ = "feedback"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    memory_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("memories.id", ondelete="CASCADE"), nullable=False, index=True)
    rating: Mapped[int] = mapped_column(Integer, nullable=False)  # 1-5
    feedback_type: Mapped[str] = mapped_column(String(50), nullable=False)  # USEFUL, NOT_USEFUL, INCORRECT, OUTDATED
    comment: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    user: Mapped["User"] = relationship("User", back_populates="feedbacks")
    memory: Mapped["Memory"] = relationship("Memory", back_populates="feedbacks")


class MemoryAccessLog(Base):
    __tablename__ = "memory_access_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    memory_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("memories.id", ondelete="CASCADE"), nullable=False)
    user_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    access_type: Mapped[str] = mapped_column(String(50), default="RETRIEVAL")
    query: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    retrieval_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), index=True)

    user: Mapped["User"] = relationship("User", back_populates="access_logs")
    memory: Mapped["Memory"] = relationship("Memory")


class MemoryExtractionEvent(Base):
    __tablename__ = "memory_extraction_events"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    message_id: Mapped[Optional[int]] = mapped_column(BigInteger, ForeignKey("messages.id", ondelete="SET NULL"), nullable=True, index=True)
    model_name: Mapped[str] = mapped_column(String(100), nullable=False)
    prompt_version: Mapped[str] = mapped_column(String(50), default="v1.0")
    extracted_count: Mapped[int] = mapped_column(Integer, default=0)
    processing_time_ms: Mapped[int] = mapped_column(Integer, default=0)
    status: Mapped[str] = mapped_column(String(50), default="SUCCESS")
    error_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    message: Mapped[Optional["Message"]] = relationship("Message", back_populates="extraction_events")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[Optional[int]] = mapped_column(BigInteger, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    actor_type: Mapped[str] = mapped_column(String(50), default="USER")
    action: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    entity_type: Mapped[str] = mapped_column(String(50), nullable=False)
    entity_id: Mapped[Optional[int]] = mapped_column(BigInteger, nullable=True)
    metadata_json: Mapped[Optional[Any]] = mapped_column("metadata", JSON, nullable=True)
    ip_hash: Mapped[Optional[str]] = mapped_column(String(128), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), index=True)

    user: Mapped[Optional["User"]] = relationship("User", back_populates="audit_logs")
