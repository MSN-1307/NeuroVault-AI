# NeuroVault — AI Memory Management Platform (MySQL Edition)

> **Made with ❤️ for DBTHON'26 by Sai Nikhit and Sohan**  
> **Persistent AI Memory Platform that extracts, structures, retrieves, relates, evolves, evaluates, and audits memories from user conversations using MySQL 8.0+ and FastAPI.**

---

## 🌟 Key Architecture & Highlights

- **Database Engine**: **MySQL 8.0+ / 8.4+**
  - Driver: `asyncmy` async connection pool
  - Schema: 14 Core relational entities in 3NF with `PRIMARY KEY`, `FOREIGN KEY`, `CHECK` constraints
  - Keyword Search: Native MySQL `FULLTEXT` (`MATCH(content, summary) AGAINST(... IN BOOLEAN MODE)`)
  - Vector Storage: Vector arrays stored in MySQL native `JSON` columns
  - Database Features: Views (`views.sql`), Stored Procedures (`procedures.sql`), Triggers (`triggers.sql`)
- **Document Intelligence & File Uploading**:
  - Supports PDF, DOCX, CSV, TXT upload with instant question answering and executive summaries
  - Automated visual data chart generation with Recharts (Bar charts, distributions, category counts)
  - Tabular dataset exploration with structured preview
  - Direct pipeline integration to extract and ingest facts into MySQL memory store
- **DBMS Innovations Lab**:
  - **Natural Language to SQL (NL2SQL)**: Schema-aware translation of plain English queries into MySQL syntax
  - **Intelligent Query Optimizer**: Microsecond query profiling and execution plans via `EXPLAIN`
  - **Vector-Graph Multi-Hop Traversal**: Vector similarity search seeding multi-hop graph BFS relationship retrieval
  - **Temporal Point-in-Time Flashback**: Historical state reconstruction leveraging versioning tables and triggers
  - **Privacy & Intelligent Security**: Dynamic Data Masking (DDM) for PII and query burst anomaly detection
- **Hybrid Retrieval Algorithm**:
  $$\text{final\_score} = (0.45 \times \text{semantic\_score}) + (0.20 \times \text{keyword\_score}) + (0.15 \times \text{importance\_score}) + (0.10 \times \text{confidence\_score}) + (0.10 \times \text{recency\_score})$$
- **Frontend Aesthetic**: Modern **Clean Light & Dark Mode** toggleable interface designed with React 19, TypeScript, Vite, Tailwind CSS v4, Lucide React, and Recharts.
- **AI Layer**: Configurable LLM extraction and embeddings (Ollama default `qwen2.5:3b`, `nomic-embed-text`, or OpenAI).

---

## 📁 Directory Structure

```text
neurovault/
├── frontend/
│   ├── src/
│   │   ├── components/      # Light-mode Sidebar, Navigation, Modals
│   │   ├── pages/           # Dashboard, Chat, Vault, Graph, Analytics, Database, Audit, Settings
│   │   ├── services/        # Axios API clients
│   │   └── types/           # TypeScript interfaces
│   ├── package.json
│   └── vite.config.ts
├── backend/
│   ├── app/
│   │   ├── api/             # Auth, Users, Conversations, Messages, Memories, Search, Chat, Analytics, Audit, Database
│   │   ├── models/          # 14 SQLAlchemy ORM entities
│   │   ├── schemas/         # Pydantic v2 schemas
│   │   ├── services/        # RetrievalService, MemoryPipelineService
│   │   ├── ai/              # Ollama/OpenAI LLM & Embedding abstractions
│   │   ├── config.py        # Pydantic settings
│   │   ├── database.py      # SQLAlchemy async engine
│   │   ├── security.py      # JWT authentication and password hashing
│   │   └── seed.py          # Deterministic realistic demo seeder
│   ├── tests/               # Pytest async integration suite
│   └── requirements.txt
├── database/
│   ├── schema.sql           # MySQL DDL with 14 entities
│   ├── seed.sql             # MySQL realistic test dataset
│   ├── views.sql            # Analytical MySQL views
│   ├── procedures.sql       # Stored procedures
│   └── triggers.sql         # Automatic versioning & audit triggers
├── docker-compose.yml       # MySQL 8.4 container, backend, frontend
├── .env.example
└── README.md
```

---

## 🚀 Quickstart Guide

### 1. Backend Setup

```bash
cd backend
python -m pip install -r requirements.txt
python -m app.seed
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Backend API Docs: [http://localhost:8000/docs](http://localhost:8000/docs)  
Health Check: [http://localhost:8000/health](http://localhost:8000/health)

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Open application at: [http://localhost:5173](http://localhost:5173)

### 3. Docker Compose (Full Stack with MySQL 8.4)

```bash
docker compose up -d --build
```

---

## 🧪 Testing

Run automated backend integration tests:

```bash
cd backend
python -m pytest tests/test_api.py -v
```

All 5 core API integration suites pass cleanly.
