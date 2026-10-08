# NeuroVault — Complete Coding-Agent Implementation Specification

## 0. Document Purpose

This document is the **single source of truth for implementing NeuroVault**.

The coding agent should use this specification to build the project end-to-end, while preserving the project's primary identity:

> **NeuroVault — AI Memory Management Database for Personalized Assistants**

NeuroVault is not simply a chatbot. It is a **database-centric AI memory platform** that stores, structures, retrieves, evolves, relates, evaluates, and audits memories extracted from user interactions.

The database must remain the core of the system. AI and RAG features should operate on top of the relational database rather than replacing the DBMS design.

---

# 1. Product Vision

NeuroVault provides a persistent memory layer for personalized AI assistants.

The system should:

1. Accept user conversations.
2. Analyze messages using an LLM.
3. Detect potentially useful memories.
4. Classify memories.
5. Assign confidence, importance, freshness, and quality scores.
6. Store memories in PostgreSQL.
7. Create tags and relationships.
8. Detect duplicates.
9. Detect contradictions.
10. Maintain memory versions.
11. Retrieve relevant memories for future conversations.
12. Inject retrieved memories into AI prompts.
13. Generate personalized responses.
14. Allow users to inspect and manage memories.
15. Maintain privacy and consent controls.
16. Maintain complete audit logs.
17. Provide analytics and an administrative/database dashboard.

---

# 2. Core Design Principle

The architecture must follow:

```text
User
  ↓
React Frontend
  ↓
FastAPI REST API
  ↓
Application / Memory Service
  ↓
AI Processing Layer
  ↓
PostgreSQL
  ↓
Memory Retrieval
  ↓
LLM
  ↓
Personalized Response
```

For semantic retrieval:

```text
Conversation
     ↓
Memory Extraction
     ↓
Embedding Generation
     ↓
PostgreSQL + pgvector
     ↓
Hybrid Retrieval
     ↓
Relevant Memories
     ↓
LLM Context
```

Do NOT make the project dependent on a standalone vector database unless there is a strong technical reason.

The primary database should be PostgreSQL.

---

# 3. Recommended Technology Stack

## Frontend

Use:

- React
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui
- React Router
- TanStack Query
- Recharts
- Lucide React

Optional:

- Framer Motion for subtle animations

Frontend responsibilities:

- Authentication UI
- Dashboard
- Chat
- Memory Vault
- Memory details
- Memory graph
- Analytics
- Database explorer
- Audit logs
- Settings
- Privacy controls

---

# 4. Backend

Use:

- Python 3.12+
- FastAPI
- Pydantic v2
- SQLAlchemy 2.x
- Alembic
- asyncpg
- PostgreSQL
- pgvector
- JWT authentication
- Passlib/Argon2 or bcrypt for password hashing
- httpx

Backend architecture:

```text
backend/
├── main.py
├── config.py
├── database.py
├── dependencies.py
│
├── api/
│   ├── auth.py
│   ├── users.py
│   ├── conversations.py
│   ├── messages.py
│   ├── memories.py
│   ├── categories.py
│   ├── tags.py
│   ├── relations.py
│   ├── feedback.py
│   ├── analytics.py
│   ├── audit.py
│   ├── search.py
│   └── health.py
│
├── models/
├── schemas/
├── services/
├── repositories/
├── ai/
├── memory/
├── security/
├── utils/
└── tests/
```

---

# 5. AI / LLM Layer

The AI layer must be provider-independent.

Create an abstraction:

```python
class LLMProvider:
    async def generate(...)
    async def structured_generate(...)
```

Possible providers:

- Ollama
- OpenAI-compatible APIs
- Gemini-compatible provider
- Other OpenAI-compatible local/cloud providers

For local development:

```text
Ollama
  ↓
Qwen-family instruct model
```

The exact model must be configurable through `.env`.

Do NOT hard-code a model.

Example:

```env
LLM_PROVIDER=ollama
LLM_MODEL=qwen2.5:latest
OLLAMA_BASE_URL=http://localhost:11434
```

The architecture should allow changing the model without changing application code.

---

# 6. Embedding Layer

Create an embedding abstraction:

```python
class EmbeddingProvider:
    async def embed_text(...)
    async def embed_documents(...)
```

Local development can use:

```env
EMBEDDING_PROVIDER=ollama
EMBEDDING_MODEL=nomic-embed-text
```

Embeddings should be stored using PostgreSQL + pgvector.

Do not scatter embedding logic throughout the codebase.

---

# 7. RAG Architecture

NeuroVault uses **hybrid memory retrieval**.

Retrieval should combine:

### A. Semantic similarity

Use vector embeddings.

### B. Keyword/full-text search

Use PostgreSQL full-text search.

### C. Metadata filtering

Filter by:

- user
- category
- status
- importance
- confidence
- date
- tags
- memory type

### D. Recency

Recent memories should receive an optional recency boost.

### E. Importance

High-importance memories should receive a ranking boost.

---

# 8. Hybrid Retrieval Formula

Implement configurable scoring.

Example:

```text
final_score =
    0.45 * semantic_score
  + 0.20 * keyword_score
  + 0.15 * importance_score
  + 0.10 * confidence_score
  + 0.10 * recency_score
```

Weights must be configurable.

Do not hard-code business logic into SQL where it becomes difficult to maintain.

---

# 9. Complete Memory Lifecycle

Every memory follows:

```text
DETECTED
   ↓
VALIDATING
   ↓
ACTIVE
   ↓
UPDATED
   ↓
ARCHIVED
   ↓
EXPIRED
   ↓
DELETED
```

Possible status values:

```text
DETECTED
ACTIVE
ARCHIVED
EXPIRED
DELETED
CONFLICTED
```

Deletion should be handled carefully.

Where appropriate, use soft deletion.

---

# 10. Memory Types

Initial memory types:

```text
PERSONAL
EDUCATION
PROJECT
SKILL
PREFERENCE
INTEREST
GOAL
EVENT
FACT
RELATIONSHIP
TEMPORARY
OTHER
```

The system should allow categories to be extended.

---

# 11. Memory Attributes

Each memory should support:

```text
id
user_id
category_id
content
summary
memory_type
importance_score
confidence_score
freshness_score
quality_score
status
source_message_id
source_conversation_id
created_at
updated_at
last_accessed_at
expires_at
version_number
is_sensitive
```

If embeddings are stored directly in the memory table, use pgvector.

---

# 12. Database Architecture

Use PostgreSQL.

Target approximately 14–16 core entities.

Recommended ER structure:

```text
users
  │
  ├── user_preferences
  │
  ├── conversations
  │       │
  │       └── messages
  │               │
  │               └── memory_extraction_events
  │
  ├── memories
  │       │
  │       ├── memory_versions
  │       ├── memory_tags
  │       ├── memory_relations
  │       ├── memory_feedback
  │       └── memory_access_logs
  │
  ├── categories
  │
  ├── tags
  │
  └── audit_logs
```

---

# 13. Recommended Entities

## 13.1 users

Fields:

```text
id PK
name
email UNIQUE
password_hash
role
status
created_at
updated_at
last_login_at
```

Roles:

```text
USER
ADMIN
AI_SERVICE
```

---

## 13.2 user_preferences

Fields:

```text
id PK
user_id FK
communication_style
language
theme
memory_enabled
personalization_enabled
analytics_enabled
created_at
updated_at
```

---

## 13.3 conversations

Fields:

```text
id PK
user_id FK
title
summary
status
started_at
ended_at
created_at
updated_at
```

---

## 13.4 messages

Fields:

```text
id PK
conversation_id FK
sender_type
content
token_count
created_at
```

Sender types:

```text
USER
ASSISTANT
SYSTEM
```

---

## 13.5 memory_categories

Fields:

```text
id PK
name UNIQUE
description
created_at
```

---

## 13.6 memories

Fields:

```text
id PK
user_id FK
category_id FK
source_message_id FK
source_conversation_id FK
memory_type
content
summary
importance_score
confidence_score
freshness_score
quality_score
status
is_sensitive
created_at
updated_at
last_accessed_at
expires_at
```

---

## 13.7 memory_versions

Fields:

```text
id PK
memory_id FK
version_number
previous_content
new_content
change_reason
changed_by
created_at
```

Never overwrite historical versions.

---

## 13.8 tags

Fields:

```text
id PK
name UNIQUE
description
created_at
```

---

## 13.9 memory_tags

Many-to-many relationship:

```text
memory_id FK
tag_id FK
created_at

PRIMARY KEY(memory_id, tag_id)
```

---

## 13.10 memory_relations

Fields:

```text
id PK
source_memory_id FK
target_memory_id FK
relation_type
confidence
created_at
```

Relation types:

```text
RELATED_TO
DERIVED_FROM
PART_OF
DEPENDS_ON
CONTRADICTS
REPLACES
SUPPORTS
```

---

## 13.11 feedback

Fields:

```text
id PK
user_id FK
memory_id FK
rating
feedback_type
comment
created_at
```

Feedback types:

```text
USEFUL
NOT_USEFUL
INCORRECT
OUTDATED
```

---

## 13.12 memory_access_logs

Fields:

```text
id PK
memory_id FK
user_id FK
access_type
query
retrieval_score
created_at
```

---

## 13.13 memory_extraction_events

Fields:

```text
id PK
message_id FK
model_name
prompt_version
extracted_count
processing_time_ms
status
error_message
created_at
```

---

## 13.14 audit_logs

Fields:

```text
id PK
user_id FK
actor_type
action
entity_type
entity_id
metadata JSONB
ip_hash
created_at
```

---

## Optional 15th/16th entities

Add:

```text
notifications
consent_records
```

if implementation scope allows.

---

# 14. Database Constraints

Use:

- PRIMARY KEY
- FOREIGN KEY
- UNIQUE
- NOT NULL
- CHECK
- DEFAULT
- ENUM where appropriate

Examples:

```sql
CHECK (importance_score BETWEEN 0 AND 100)

CHECK (confidence_score BETWEEN 0 AND 100)

CHECK (quality_score BETWEEN 0 AND 100)
```

---

# 15. Database Indexing

Create indexes on:

```text
users.email

conversations.user_id

messages.conversation_id

memories.user_id

memories.category_id

memories.status

memories.created_at

memories.last_accessed_at

memory_relations.source_memory_id

memory_relations.target_memory_id

audit_logs.created_at

audit_logs.user_id
```

Use pgvector indexing for embeddings.

Use PostgreSQL full-text search indexes where appropriate.

---

# 16. Normalization

Database design should target at least **3NF**.

Avoid:

```text
memories.tags = "AI,DBMS,Project"
```

Instead:

```text
memories
tags
memory_tags
```

Avoid storing repeated user information in conversations.

Use foreign keys.

---

# 17. Important DBMS Features

The implementation must demonstrate:

### CRUD

Users, conversations, memories, tags, feedback.

### Complex joins

Memory + user + category + tags + source conversation.

### Aggregation

Memory statistics by category.

### Views

Recommended views:

```text
active_memory_summary
memory_quality_dashboard
user_memory_statistics
recent_memory_access
```

### Stored procedures/functions

Examples:

```text
create_memory()
archive_memory()
update_memory_quality()
get_memory_statistics()
```

### Triggers

Examples:

1. Update `updated_at`.
2. Create memory version before update.
3. Create audit log after sensitive operations.
4. Recalculate quality after feedback.
5. Update last-accessed timestamp.

---

# 18. AI Memory Extraction Pipeline

When a user sends:

> "I'm building a DBMS project called NeuroVault using PostgreSQL."

Pipeline:

```text
USER MESSAGE
    ↓
Message saved
    ↓
Extraction request
    ↓
LLM structured output
    ↓
Candidate memories
    ↓
Validation
    ↓
Category classification
    ↓
Duplicate search
    ↓
Contradiction search
    ↓
Importance scoring
    ↓
Confidence scoring
    ↓
Embedding generation
    ↓
Memory persistence
    ↓
Tags
    ↓
Relationships
    ↓
Audit log
```

---

# 19. Structured LLM Output

Never depend on free-form parsing.

Ask the model for JSON matching a Pydantic schema.

Example:

```json
{
  "memories": [
    {
      "content": "User is building a DBMS project called NeuroVault.",
      "memory_type": "PROJECT",
      "category": "Academic",
      "importance": 92,
      "confidence": 98,
      "tags": ["DBMS", "AI", "NeuroVault"]
    }
  ]
}
```

Validate using Pydantic.

If parsing fails:

1. Retry once.
2. Log the failure.
3. Do not insert malformed data.

---

# 20. Duplicate Detection

Before creating a new memory:

```text
New candidate
     ↓
Semantic search
     ↓
Top existing memories
     ↓
Similarity threshold
     ↓
Duplicate?
```

Example:

```text
"I like Python"

"I prefer Python for coding"
```

These should potentially be consolidated.

---

# 21. Memory Consolidation

When duplicate memories are detected:

```text
Memory A
+
Memory B
+
Memory C
     ↓
LLM consolidation
     ↓
Canonical Memory
     ↓
Versions preserved
     ↓
Relations preserved
```

Never silently destroy the original history.

---

# 22. Contradiction Detection

Example:

```text
Existing:
User prefers Java.

New:
User prefers Python.
```

The system should detect:

```text
CONTRADICTS
```

Then create a review item.

The assistant should ask:

> "I found conflicting preferences. Should I update your preference to Python?"

Do not automatically overwrite high-confidence memories unless configured to do so.

---

# 23. Memory Importance

Importance should consider:

```text
explicit user statement
frequency
relevance
long-term usefulness
feedback
recency
```

Use a bounded 0–100 score.

Keep the scoring service isolated so it can be improved later.

---

# 24. Memory Freshness

Freshness should decrease over time for temporary or time-sensitive memories.

Example:

```text
"DBMS exam tomorrow"
```

should become less relevant after the exam.

Do not automatically decay permanent facts such as:

```text
name
university
long-term preferences
```

---

# 25. Temporary Memory

Support:

```text
expires_at
```

Example:

```text
Memory:
"User has an exam tomorrow."

expires_at:
2026-10-08
```

A scheduled cleanup job may mark expired memories as `EXPIRED`.

---

# 26. Retrieval Pipeline

When the user asks:

> "What database should I use for my project?"

Pipeline:

```text
Query
 ↓
Query embedding
 ↓
Semantic retrieval
 ↓
Keyword retrieval
 ↓
Metadata filtering
 ↓
Ranking
 ↓
Top-K memories
 ↓
Memory access log
 ↓
Context builder
 ↓
LLM
 ↓
Response
```

Default:

```env
TOP_K=8
```

Make configurable.

---

# 27. Context Builder

Do not dump the entire memory database into the prompt.

Create:

```python
ContextBuilder
```

Responsibilities:

- Deduplicate retrieved memories.
- Sort by relevance.
- Limit tokens.
- Remove expired memories.
- Respect privacy settings.
- Exclude restricted memories.
- Format context clearly.

Example:

```text
Relevant user memories:

1. User is building NeuroVault.
2. User uses PostgreSQL.
3. User is a CSE student.
4. User prefers Python for AI projects.
```

---

# 28. Privacy Architecture

Users must control:

```text
memory_enabled
personalization_enabled
analytics_enabled
```

Sensitive memories should support:

```text
is_sensitive
```

Sensitive memories should not be included in normal retrieval unless explicitly authorized.

---

# 29. Authentication

Implement:

```text
POST /auth/register
POST /auth/login
POST /auth/refresh
GET  /auth/me
POST /auth/logout
```

Use:

- Password hashing
- JWT access tokens
- Refresh tokens
- Role checks

Never store plaintext passwords.

---

# 30. API Design

## Authentication

```text
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/me
```

## Users

```text
GET /api/users/me
PATCH /api/users/me
GET /api/users/me/preferences
PATCH /api/users/me/preferences
```

## Conversations

```text
GET /api/conversations
POST /api/conversations
GET /api/conversations/{id}
DELETE /api/conversations/{id}
```

## Messages

```text
POST /api/conversations/{id}/messages
GET /api/conversations/{id}/messages
```

## Memories

```text
GET /api/memories
POST /api/memories
GET /api/memories/{id}
PATCH /api/memories/{id}
DELETE /api/memories/{id}
POST /api/memories/{id}/archive
POST /api/memories/{id}/restore
```

## Search

```text
POST /api/search/memories
```

## Relations

```text
GET /api/memories/{id}/relations
POST /api/memories/{id}/relations
DELETE /api/relations/{id}
```

## Feedback

```text
POST /api/memories/{id}/feedback
GET /api/memories/{id}/feedback
```

## Analytics

```text
GET /api/analytics/overview
GET /api/analytics/memory-growth
GET /api/analytics/categories
GET /api/analytics/quality
GET /api/analytics/ai-processing
```

## Audit

```text
GET /api/audit-logs
```

Admin-only where appropriate.

---

# 31. Chat API

Primary endpoint:

```text
POST /api/chat
```

Request:

```json
{
  "conversation_id": 12,
  "message": "What do you remember about my DBMS project?"
}
```

Response:

```json
{
  "response": "...",
  "retrieved_memories": [
    {
      "id": 42,
      "score": 0.94
    }
  ],
  "memory_events": [
    {
      "type": "retrieved",
      "memory_id": 42
    }
  ]
}
```

---

# 32. Frontend Pages

Build these routes:

```text
/login
/register

/dashboard
/chat
/memories
/memories/:id
/graph
/analytics
/database
/audit
/settings
```

---

# 33. Dashboard UI

The dashboard should show:

```text
Active Memories
Conversations
Memory Quality
Contradictions
```

Charts:

- Memory growth
- Category distribution
- Quality distribution
- Recent activity

Recent memories.

Needs-attention section.

---

# 34. AI Chat UI

Design similar to modern AI assistants.

Include:

- Message bubbles
- Streaming response
- Retrieved memory indicator
- "Why did you remember this?"
- Memory creation notification
- Suggested follow-up
- Conversation history

Example:

```text
NeuroVault

You:
What do you remember about my projects?

AI:
You are working on several technical projects...

Memory used:
• NeuroVault
• AI Software Engineering Copilot
• CloudVaultX
```

---

# 35. Memory Vault UI

Each memory card should show:

```text
Title/content

Category
Importance
Confidence
Quality
Status
Created
Last accessed
Tags
```

Actions:

```text
View
Edit
Archive
Delete
Restore
```

Filters:

```text
Category
Type
Status
Importance
Confidence
Date
Tags
```

Search should be available.

---

# 36. Memory Detail Page

Show:

```text
Memory content

Confidence: 94%
Importance: 91%
Quality: 93%

Source
Conversation #42
Message #831

Tags

Relations

Version history

Access history

Feedback
```

Actions:

```text
Edit
Archive
Delete
Create relation
```

---

# 37. Memory Graph

Use a graph visualization library such as:

- React Flow
- Cytoscape.js

Show:

```text
Memory
   ↓
Related memory
   ↓
Project
   ↓
Technology
```

Node colors/types should correspond to categories.

Clicking a node opens memory details.

---

# 38. Analytics Page

Metrics:

```text
Total memories
Active memories
Archived memories
Expired memories
Average confidence
Average importance
Average retrieval latency
AI extraction accuracy
Duplicate memories
Contradictions
```

Charts:

- Memory growth
- Category distribution
- Quality distribution
- Retrieval frequency
- Memory lifecycle
- AI processing

Use Recharts.

---

# 39. Database Explorer

This is important for the DBMS evaluation.

Display:

```text
users
conversations
messages
memories
memory_categories
memory_versions
tags
memory_tags
memory_relations
feedback
memory_access_logs
memory_extraction_events
audit_logs
...
```

Allow users/admins to inspect safe, read-only table information.

Do not expose unrestricted SQL execution in production.

---

# 40. Audit Dashboard

Show:

```text
timestamp
actor
action
entity
entity ID
result
```

Examples:

```text
CREATE_MEMORY
UPDATE_MEMORY
DELETE_MEMORY
ARCHIVE_MEMORY
RETRIEVE_MEMORY
LOGIN
EXPORT_DATA
```

---

# 41. Settings

Sections:

### Profile

Name, email.

### Personalization

Communication style.

### Memory

```text
Enable memory
Enable personalization
Allow AI extraction
```

### Privacy

```text
Export data
Delete memories
Delete account
```

### Appearance

Dark/light theme.

---

# 42. Background Jobs

Use a lightweight task architecture initially.

Potential jobs:

```text
memory cleanup
memory freshness update
duplicate detection
analytics aggregation
temporary memory expiration
```

For the first implementation, FastAPI background tasks are sufficient.

If scale becomes necessary, introduce:

```text
Celery
Redis
```

Do not add infrastructure unnecessarily in Phase 1.

---

# 43. Project Directory

Recommended final structure:

```text
neurovault/
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── layouts/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── stores/
│   │   ├── types/
│   │   └── utils/
│   ├── package.json
│   └── vite.config.ts
│
├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── repositories/
│   │   ├── services/
│   │   ├── memory/
│   │   ├── ai/
│   │   ├── security/
│   │   ├── workers/
│   │   ├── utils/
│   │   ├── config.py
│   │   ├── database.py
│   │   └── main.py
│   │
│   ├── migrations/
│   ├── tests/
│   └── requirements.txt
│
├── database/
│   ├── schema.sql
│   ├── seed.sql
│   ├── views.sql
│   ├── functions.sql
│   ├── triggers.sql
│   └── indexes.sql
│
├── docs/
│   ├── architecture.md
│   ├── database-design.md
│   ├── api.md
│   └── demo-script.md
│
├── docker/
├── docker-compose.yml
├── .env.example
├── README.md
└── LICENSE
```

---

# 44. Environment Variables

Create `.env.example`:

```env
APP_NAME=NeuroVault
ENVIRONMENT=development

DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/neurovault

JWT_SECRET_KEY=change-me
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30
JWT_REFRESH_TOKEN_EXPIRE_DAYS=7

LLM_PROVIDER=ollama
LLM_MODEL=qwen2.5:latest
OLLAMA_BASE_URL=http://localhost:11434

EMBEDDING_PROVIDER=ollama
EMBEDDING_MODEL=nomic-embed-text

VECTOR_DIMENSION=768

TOP_K=8

SEMANTIC_WEIGHT=0.45
KEYWORD_WEIGHT=0.20
IMPORTANCE_WEIGHT=0.15
CONFIDENCE_WEIGHT=0.10
RECENCY_WEIGHT=0.10

CORS_ORIGINS=http://localhost:5173
```

Do not commit the real `.env`.

---

# 45. Docker

Provide:

```text
PostgreSQL
Backend
Frontend
```

through Docker Compose.

Recommended:

```text
postgres + pgvector
backend
frontend
```

Ollama may remain installed on the host initially because GPU/local-model setup varies by machine.

---

# 46. Phase-by-Phase Implementation

## PHASE 0 — Project Setup

Tasks:

- Create repository structure.
- Configure Git.
- Configure Python.
- Configure Node.
- Configure PostgreSQL.
- Configure Docker.
- Configure `.env`.
- Create README.
- Create basic health endpoint.

Success:

```text
Frontend runs.
Backend runs.
PostgreSQL connects.
```

---

# PHASE 1 — Database Foundation

Implement:

- PostgreSQL database.
- All core entities.
- Foreign keys.
- Constraints.
- Indexes.
- Alembic migrations.
- Seed data.
- Views.
- Functions.
- Triggers.

Create:

```text
schema.sql
seed.sql
indexes.sql
views.sql
functions.sql
triggers.sql
```

Success:

- Database builds from scratch.
- Migration works.
- Seed data works.
- Referential integrity passes.

---

# PHASE 2 — Authentication

Implement:

- Register.
- Login.
- JWT.
- Refresh tokens.
- Password hashing.
- Role-based authorization.
- Current user endpoint.

Success:

- User can register.
- User can login.
- Protected APIs reject unauthenticated users.

---

# PHASE 3 — Conversations

Implement:

- Create conversation.
- List conversations.
- Store messages.
- Conversation summaries.
- Conversation history.

Success:

```text
User → Chat → Message stored in PostgreSQL
```

---

# PHASE 4 — Memory CRUD

Implement:

- Create memory.
- Read memory.
- Update memory.
- Delete memory.
- Archive.
- Restore.
- Categories.
- Tags.

Success:

The Memory Vault works without AI.

---

# PHASE 5 — AI Memory Extraction

Implement:

```text
message
 ↓
LLM extraction
 ↓
Pydantic validation
 ↓
candidate memory
 ↓
database
```

Add:

- Prompt versioning.
- Extraction event logging.
- Error handling.
- Retry.

Success:

A chat message can automatically create a structured memory.

---

# PHASE 6 — Embeddings and Retrieval

Implement:

- Embedding provider.
- pgvector.
- Vector storage.
- Semantic search.
- Keyword search.
- Hybrid ranking.
- Top-K retrieval.

Success:

A query retrieves relevant memories.

---

# PHASE 7 — Personalized Chat

Implement:

```text
user query
 ↓
retrieve memories
 ↓
build context
 ↓
LLM
 ↓
personalized answer
```

Record memory access logs.

Success:

The assistant demonstrably remembers previous information.

---

# PHASE 8 — Advanced Memory Intelligence

Implement:

### Duplicate detection

### Consolidation

### Contradiction detection

### Importance scoring

### Confidence scoring

### Freshness

### Temporary memories

### Memory versioning

Success:

Memories behave like an intelligent lifecycle rather than static rows.

---

# PHASE 9 — Relationships and Graph

Implement:

- Memory relations.
- Relation types.
- Graph API.
- React graph UI.
- Node details.
- Relationship creation.

Success:

Users can visually explore memory connections.

---

# PHASE 10 — Dashboard and Analytics

Implement:

- Dashboard.
- Charts.
- Memory statistics.
- AI processing statistics.
- Retrieval statistics.
- Quality metrics.

Success:

The project looks like a complete product.

---

# PHASE 11 — Privacy and Audit

Implement:

- Consent.
- Sensitive memory handling.
- Access control.
- Audit logs.
- Export.
- Delete/anonymize functionality.

Success:

Memory operations are traceable and user-controlled.

---

# PHASE 12 — Database Demonstration

Implement polished DBMS features:

- Views.
- Triggers.
- Stored functions.
- Complex joins.
- Aggregations.
- Window functions.
- Transactions.
- Indexing demonstration.

Prepare SQL demo queries.

---

# PHASE 13 — Testing

Backend tests:

```text
authentication
users
conversations
messages
memories
retrieval
extraction
relations
feedback
audit
analytics
```

Test:

- Unit tests.
- Integration tests.
- API tests.
- Database tests.

Frontend:

- Component tests for critical components.
- Basic end-to-end flow.

---

# PHASE 14 — Optimization

Measure:

```text
API latency
database query latency
retrieval latency
LLM latency
embedding latency
```

Optimize:

- SQL queries.
- Indexes.
- Retrieval.
- Context size.
- Caching where useful.

Do not prematurely optimize.

---

# PHASE 15 — Final Demo Preparation

Prepare a deterministic demo dataset.

Demo account:

```text
Demo User
```

Populate:

- Education memories.
- Project memories.
- Preferences.
- Skills.
- Relationships.
- Version history.
- Feedback.
- Audit logs.
- Contradictions.

---

# 47. Final Demo Script

The final presentation should follow this sequence.

## Step 1 — Login

Show secure authentication.

## Step 2 — Dashboard

Explain:

```text
932 active memories
148 conversations
91.7% memory quality
12 contradictions
```

## Step 3 — Chat

Ask:

> "What do you remember about my DBMS project?"

Show personalized response.

## Step 4 — Show Retrieved Memories

Display:

```text
NeuroVault
DBMS
PostgreSQL
AI Memory
```

## Step 5 — Add New Memory

Say:

> "I'm planning to use React for the NeuroVault frontend."

Show:

```text
AI extraction
↓
PROJECT/TECHNOLOGY
↓
Confidence
↓
Embedding
↓
PostgreSQL
```

## Step 6 — Memory Vault

Show the newly created memory.

## Step 7 — Memory Graph

Show relationships.

## Step 8 — Contradiction

Introduce:

> "I now prefer Java over Python."

Show conflict detection.

## Step 9 — Version History

Show:

```text
v1 Python preference
v2 Java preference
```

## Step 10 — Analytics

Show system statistics.

## Step 11 — Database

Show the relational schema/table list.

## Step 12 — Audit

Show:

```text
CREATE_MEMORY
RETRIEVE_MEMORY
UPDATE_MEMORY
DETECT_CONFLICT
```

This creates a strong end-to-end demonstration.

---

# 48. Important DBMS Viva Features

The coding agent must ensure the final project can demonstrate:

### Primary keys

Every major entity has a primary key.

### Foreign keys

Relationships are enforced.

### Normalization

Explain 1NF → 2NF → 3NF.

### Many-to-many

Use:

```text
memory_tags
```

### Self relationship

Use:

```text
memory_relations
```

### Transactions

Memory update + version creation + audit log should be transaction-safe.

### Triggers

Automatic versioning/auditing.

### Views

Analytics-ready views.

### Indexing

Explain why indexes exist.

### Constraints

Protect data quality.

---

# 49. Security Requirements

Never:

- Store plaintext passwords.
- Commit API keys.
- Return sensitive memories unnecessarily.
- Allow users to access another user's memories.
- Trust user-provided IDs without ownership checks.
- Allow unrestricted SQL from the frontend.

Every memory query must enforce:

```text
memory.user_id == authenticated_user.id
```

unless the actor is an authorized admin.

---

# 50. Error Handling

Use consistent API errors.

Example:

```json
{
  "error": {
    "code": "MEMORY_NOT_FOUND",
    "message": "The requested memory does not exist."
  }
}
```

Handle:

- Database failures.
- LLM failures.
- Embedding failures.
- Invalid JSON.
- Authentication errors.
- Permission errors.
- Rate limits.
- Timeouts.

The application must fail gracefully.

---

# 51. Observability

Log:

```text
request ID
user ID
endpoint
latency
LLM latency
embedding latency
database latency
errors
```

Do not log raw sensitive memory content unnecessarily.

---

# 52. Performance Targets

Initial targets:

```text
Normal API request: < 300ms excluding LLM
Memory retrieval: < 150ms target
Database indexed lookup: < 50ms target
Frontend initial load: reasonable production bundle
```

LLM latency is model-dependent and should not be treated as an application failure by itself.

---

# 53. Coding Standards

Use:

- Type hints.
- Pydantic schemas.
- Async FastAPI where appropriate.
- Repository/service separation.
- Dependency injection.
- Small functions.
- Clear names.
- Centralized configuration.
- No duplicated business logic.
- No hard-coded secrets.
- No unnecessary global state.

Every major feature should have tests.

---

# 54. Architecture Rules

Do NOT:

```text
React → PostgreSQL directly
```

Correct:

```text
React
 ↓
FastAPI
 ↓
Service
 ↓
Repository
 ↓
PostgreSQL
```

AI should also not directly mutate arbitrary database tables.

Correct:

```text
AI
 ↓
Validated schema
 ↓
Memory Service
 ↓
Repository
 ↓
Database
```

---

# 55. Recommended Backend Layering

```text
API Layer
   ↓
Schema Validation
   ↓
Service Layer
   ↓
Repository Layer
   ↓
Database
```

AI:

```text
AI Service
   ↓
LLM Provider
Embedding Provider
```

Memory:

```text
Memory Service
   ↓
Extraction
Validation
Deduplication
Conflict Detection
Scoring
Persistence
```

---

# 56. API Documentation

FastAPI should automatically expose:

```text
/docs
/redoc
```

Keep OpenAPI documentation clean.

Document:

- Request schema.
- Response schema.
- Authentication.
- Errors.
- Examples.

---

# 57. Seed Data

Create realistic seed data for:

```text
2–5 users
10+ conversations
50+ messages
30+ memories
10+ relations
20+ tags
feedback
audit events
versions
```

The final demo should never look empty.

---

# 58. Demo Data Theme

Use realistic examples such as:

```text
Education
CSE
DBMS
AI
PostgreSQL
Python
Projects
Programming preferences
Learning preferences
```

Avoid using fake sensitive personal data.

---

# 59. UI Design Direction

Use a premium dark AI-product interface.

Design language:

```text
Dark navy background
Subtle gradients
Glass/ layered cards
Cyan + violet accent
Rounded cards
Clean typography
Minimal animations
```

The UI should feel like:

```text
AI infrastructure + knowledge management
```

rather than:

```text
basic college CRUD application
```

---

# 60. Responsive Design

Must work on:

```text
Desktop
Laptop
Tablet
Mobile
```

Desktop is the primary demo target.

---

# 61. Final Product Architecture

```text
                         NEUROVAULT
                 AI MEMORY MANAGEMENT SYSTEM
                              │
             ┌────────────────┴────────────────┐
             │                                 │
        React Frontend                    FastAPI Backend
             │                                 │
      ┌──────┼────────┐                ┌───────┼────────┐
      │      │        │                │       │        │
    Chat   Vault   Analytics          Auth   Memory    AI
      │      │        │                │       │        │
      └──────┴────────┘                │       │        │
                                      │       │        ├── LLM
                                      │       │        └── Embeddings
                                      │       │
                                      └───────┤
                                              ↓
                                        PostgreSQL
                                              │
                 ┌────────────────────────────┼───────────────────────┐
                 │                            │                       │
             Relational                    pgvector                Audit
             Data Model                   Retrieval                 Logs
                 │                            │                       │
                 ├── Users                    ├── Semantic Search    │
                 ├── Conversations            ├── Keyword Search     │
                 ├── Messages                 └── Hybrid Ranking     │
                 ├── Memories                                         │
                 ├── Categories                                       │
                 ├── Tags                                             │
                 ├── Relations                                        │
                 ├── Versions                                         │
                 └── Feedback                                          │
```

---

# 62. Minimum Viable Product

If time becomes limited, the absolute MVP is:

```text
PostgreSQL
+
Authentication
+
Users
+
Conversations
+
Messages
+
Memories
+
Categories
+
Tags
+
Memory CRUD
+
LLM extraction
+
Embeddings
+
Hybrid retrieval
+
Personalized chat
+
Dashboard
```

Then add advanced features progressively.

---

# 63. Priority Order

Use this priority:

```text
P0 — Must work
----------------
Database
Authentication
Memory CRUD
Conversation storage
AI extraction
Retrieval
Personalized chat

P1 — Strong final demo
----------------------
Memory versioning
Tags
Relations
Analytics
Dashboard
Audit logs
Contradiction detection
Duplicate detection

P2 — Advanced
----------------------
Memory graph
Consolidation
Freshness
Temporary memories
Privacy controls
Export
Advanced analytics

P3 — Optional
----------------------
Notifications
Redis
Celery
Advanced caching
Multi-model routing
```

---

# 64. Definition of Done

The project is complete only when:

- [ ] PostgreSQL database builds successfully.
- [ ] Alembic migrations work.
- [ ] Seed data works.
- [ ] Frontend builds.
- [ ] Backend starts.
- [ ] Authentication works.
- [ ] User isolation works.
- [ ] Conversations work.
- [ ] Messages are persisted.
- [ ] AI extraction works.
- [ ] Memories are persisted.
- [ ] Embeddings are generated.
- [ ] Hybrid search works.
- [ ] Personalized chat works.
- [ ] Duplicate detection works.
- [ ] Contradiction detection works.
- [ ] Memory versioning works.
- [ ] Memory relations work.
- [ ] Feedback works.
- [ ] Audit logs work.
- [ ] Analytics work.
- [ ] Dashboard works.
- [ ] Graph works.
- [ ] Database explorer works.
- [ ] Tests pass.
- [ ] Docker setup works.
- [ ] README is complete.
- [ ] `.env.example` is complete.
- [ ] No secrets are committed.

---

# 65. Instructions to the Coding Agent

You are implementing **NeuroVault — AI Memory Management Database for Personalized Assistants**.

Follow this document as the architecture and implementation specification.

### Important rules

1. Inspect the existing repository before changing anything.
2. Do not rewrite working code unnecessarily.
3. Preserve existing functionality.
4. Follow the architecture defined here.
5. PostgreSQL must remain the primary database.
6. Keep AI providers configurable.
7. Keep embedding providers configurable.
8. Use migrations rather than manually changing production tables.
9. Validate AI output with Pydantic.
10. Do not store malformed AI output.
11. Do not expose secrets.
12. Enforce user ownership on every memory operation.
13. Add tests for every major service.
14. Keep frontend and backend responsibilities separate.
15. Keep business logic out of React components.
16. Keep database access out of React.
17. Do not let the LLM directly execute SQL.
18. Do not introduce Redis/Celery unless required.
19. Prefer simple maintainable implementations.
20. Update documentation whenever architecture changes.

### Implementation order

Follow:

```text
Phase 0
→ Phase 1
→ Phase 2
→ Phase 3
→ Phase 4
→ Phase 5
→ Phase 6
→ Phase 7
→ Phase 8
→ Phase 9
→ Phase 10
→ Phase 11
→ Phase 12
→ Phase 13
→ Phase 14
→ Phase 15
```

After each phase:

1. Run tests.
2. Run lint/type checks where configured.
3. Verify database migrations.
4. Verify API startup.
5. Verify frontend build.
6. Update README if necessary.
7. Do not proceed while critical errors remain.

---

# 66. Final Expected Experience

The final application should feel like:

```text
                    NEUROVAULT

       "Your AI assistant, with persistent memory."

 ┌──────────────┬─────────────────────────────────────┐
 │ Dashboard    │                                     │
 │ AI Chat      │       Personalized AI Chat          │
 │ Memory Vault │                                     │
 │ Memory Graph │       User asks a question          │
 │ Analytics    │                ↓                    │
 │ Database     │       Memory retrieval              │
 │ Audit Logs   │                ↓                    │
 │ Settings     │       Relevant memories              │
 │              │                ↓                    │
 │              │       Personalized response         │
 └──────────────┴─────────────────────────────────────┘
```

Behind this UI:

```text
AI
 ↓
Memory Intelligence
 ↓
RAG
 ↓
PostgreSQL
 ↓
Relational Data
 ↓
Audit + Analytics
```

The final project should demonstrate that **NeuroVault is both a serious DBMS project and a practical AI application**.

---

# 67. Final Technology Summary

| Layer | Technology |
|---|---|
| Frontend | React + TypeScript |
| Build | Vite |
| UI | Tailwind + shadcn/ui |
| Charts | Recharts |
| Graph | React Flow / Cytoscape |
| Backend | FastAPI |
| Language | Python 3.12+ |
| Validation | Pydantic v2 |
| ORM | SQLAlchemy 2.x |
| Migrations | Alembic |
| Database | PostgreSQL |
| Vector Search | pgvector |
| Full Text Search | PostgreSQL FTS |
| Authentication | JWT |
| Password Hashing | Argon2/bcrypt |
| LLM | Configurable Ollama/OpenAI-compatible provider |
| Local LLM | Configurable Qwen-family model |
| Embeddings | Configurable embedding provider |
| Containers | Docker + Docker Compose |
| Testing | Pytest + frontend test framework |
| API Docs | FastAPI OpenAPI |
| Version Control | Git |

---

# 68. One-Sentence Project Definition

> **NeuroVault is a PostgreSQL-powered AI memory management platform that extracts, stores, retrieves, relates, evolves, evaluates, and securely manages persistent user memories to provide personalized AI assistance.**
