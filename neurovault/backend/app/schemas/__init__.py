from datetime import datetime
from typing import List, Optional, Any, Dict
from pydantic import BaseModel, EmailStr, Field

# ----------------- Auth & Users -----------------
class UserBase(BaseModel):
    name: str
    email: EmailStr

class UserCreate(UserBase):
    password: str
    role: Optional[str] = "USER"

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(UserBase):
    id: int
    role: str
    status: str
    created_at: datetime
    last_login_at: Optional[datetime] = None

    model_config = {"from_attributes": True}

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class UserPreferenceUpdate(BaseModel):
    communication_style: Optional[str] = None
    language: Optional[str] = None
    theme: Optional[str] = None
    memory_enabled: Optional[bool] = None
    personalization_enabled: Optional[bool] = None
    analytics_enabled: Optional[bool] = None

class UserPreferenceResponse(BaseModel):
    id: int
    user_id: int
    communication_style: str
    language: str
    theme: str
    memory_enabled: bool
    personalization_enabled: bool
    analytics_enabled: bool

    model_config = {"from_attributes": True}

# ----------------- Conversations & Messages -----------------
class ConversationCreate(BaseModel):
    title: str

class MessageCreate(BaseModel):
    content: str
    sender_type: str = "USER"

class MessageResponse(BaseModel):
    id: int
    conversation_id: int
    sender_type: str
    content: str
    token_count: int
    created_at: datetime

    model_config = {"from_attributes": True}

class ConversationResponse(BaseModel):
    id: int
    user_id: int
    title: str
    summary: Optional[str] = None
    status: str
    started_at: datetime
    ended_at: Optional[datetime] = None
    created_at: datetime
    messages: List[MessageResponse] = []

    model_config = {"from_attributes": True}

# ----------------- Memories & Extraction -----------------
class MemoryTagResponse(BaseModel):
    id: int
    name: str

    model_config = {"from_attributes": True}

class MemoryVersionResponse(BaseModel):
    id: int
    version_number: int
    previous_content: Optional[str] = None
    new_content: str
    change_reason: Optional[str] = None
    changed_by: str
    created_at: datetime

    model_config = {"from_attributes": True}

class MemoryCreate(BaseModel):
    content: str
    summary: Optional[str] = None
    memory_type: str = "FACT"
    category_id: Optional[int] = None
    importance_score: int = Field(default=50, ge=0, le=100)
    confidence_score: int = Field(default=80, ge=0, le=100)
    status: Optional[str] = "ACTIVE"
    conflict_with_id: Optional[int] = None
    is_sensitive: bool = False
    tags: List[str] = []


class MemoryUpdate(BaseModel):
    content: Optional[str] = None
    summary: Optional[str] = None
    memory_type: Optional[str] = None
    category_id: Optional[int] = None
    importance_score: Optional[int] = Field(default=None, ge=0, le=100)
    confidence_score: Optional[int] = Field(default=None, ge=0, le=100)
    status: Optional[str] = None
    is_sensitive: Optional[bool] = None
    tags: Optional[List[str]] = None
    change_reason: Optional[str] = "Manual user update"

class MemoryResponse(BaseModel):
    id: int
    user_id: int
    category_id: Optional[int] = None
    category_name: Optional[str] = None
    source_message_id: Optional[int] = None
    source_conversation_id: Optional[int] = None
    memory_type: str
    content: str
    summary: Optional[str] = None
    importance_score: int
    confidence_score: int
    freshness_score: int
    quality_score: int
    status: str
    is_sensitive: bool
    version_number: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    last_accessed_at: Optional[datetime] = None
    tags: List[str] = []
    versions: List[MemoryVersionResponse] = []

    model_config = {"from_attributes": True}

# ----------------- LLM Structured Extraction -----------------
class ExtractedMemoryItem(BaseModel):
    content: str
    summary: Optional[str] = None
    memory_type: str = "FACT"  # PERSONAL, PROJECT, SKILL, PREFERENCE, FACT, EDUCATION
    category: str = "Preferences"
    importance: int = Field(default=50, ge=0, le=100)
    confidence: int = Field(default=80, ge=0, le=100)
    tags: List[str] = []
    is_sensitive: bool = False

class MemoryExtractionResult(BaseModel):
    memories: List[ExtractedMemoryItem] = []

# ----------------- Chat Request / Response -----------------
class ChatRequest(BaseModel):
    conversation_id: Optional[int] = None
    message: str

class RetrievedMemoryCitation(BaseModel):
    id: int
    content: str
    category: Optional[str] = None
    memory_type: str
    score: float
    importance: int
    confidence: int

class ChatResponse(BaseModel):
    conversation_id: int
    response: str
    retrieved_memories: List[RetrievedMemoryCitation] = []
    extracted_memories_count: int = 0
    conflict_detected: bool = False
    conflict_details: Optional[str] = None

# ----------------- Search -----------------
class SearchRequest(BaseModel):
    query: str
    category_id: Optional[int] = None
    memory_type: Optional[str] = None
    status: Optional[str] = "ACTIVE"
    top_k: int = 8

class SearchResultItem(BaseModel):
    id: int
    content: str
    summary: Optional[str] = None
    category_name: Optional[str] = None
    memory_type: str
    final_score: float
    semantic_score: float
    keyword_score: float
    importance_score: int
    confidence_score: int
    status: str
    created_at: datetime

# ----------------- Relations -----------------
class RelationCreate(BaseModel):
    source_memory_id: int
    target_memory_id: int
    relation_type: str = "RELATED_TO"
    confidence: int = 80

class RelationResponse(BaseModel):
    id: int
    source_memory_id: int
    target_memory_id: int
    relation_type: str
    confidence: int
    created_at: datetime

    model_config = {"from_attributes": True}

# ----------------- Feedback -----------------
class FeedbackCreate(BaseModel):
    rating: int = Field(ge=1, le=5)
    feedback_type: str  # USEFUL, NOT_USEFUL, INCORRECT, OUTDATED
    comment: Optional[str] = None

class FeedbackResponse(BaseModel):
    id: int
    user_id: int
    memory_id: int
    rating: int
    feedback_type: str
    comment: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}

# ----------------- Audit Logs -----------------
class AuditLogResponse(BaseModel):
    id: int
    user_id: Optional[int] = None
    actor_type: str
    action: str
    entity_type: str
    entity_id: Optional[int] = None
    metadata_json: Optional[Any] = None
    created_at: datetime

    model_config = {"from_attributes": True}
