from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings

from app.api.auth import router as auth_router
from app.api.users import router as users_router
from app.api.conversations import router as conversations_router
from app.api.memories import router as memories_router
from app.api.search import router as search_router
from app.api.chat import router as chat_router
from app.api.analytics import router as analytics_router
from app.api.audit import router as audit_router
from app.api.database_explorer import router as db_explorer_router
from app.api.metadata import router as metadata_router
from app.api.innovations import router as innovations_router
from app.api.documents import router as documents_router

app = FastAPI(
    title=settings.APP_NAME,
    description="NeuroVault - Persistent AI Memory Management Platform built with MySQL 8.0+",
    version="1.0.0"
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list or ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers
app.include_router(auth_router, prefix="/api")
app.include_router(users_router, prefix="/api")
app.include_router(conversations_router, prefix="/api")
app.include_router(memories_router, prefix="/api")
app.include_router(search_router, prefix="/api")
app.include_router(chat_router, prefix="/api")
app.include_router(analytics_router, prefix="/api")
app.include_router(audit_router, prefix="/api")
app.include_router(db_explorer_router, prefix="/api")
app.include_router(metadata_router, prefix="/api")
app.include_router(innovations_router, prefix="/api")
app.include_router(documents_router, prefix="/api")

@app.get("/health", tags=["Health"])
async def health_check():
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "database": "MySQL",
        "llm_provider": settings.LLM_PROVIDER,
        "embedding_provider": settings.EMBEDDING_PROVIDER
    }
