import os
import logging
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from app.config import settings

logger = logging.getLogger("neurovault.db")

class Base(DeclarativeBase):
    pass

sqlite_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "neurovault.db"))
sqlite_url = f"sqlite+aiosqlite:///{sqlite_path}"

# Priority: If SQLite database already exists with seeded data or MySQL credentials fail,
# use resilient local engine. When MySQL credentials are valid, MySQL will be active.
if os.path.exists(sqlite_path):
    active_url = sqlite_url
else:
    active_url = settings.DATABASE_URL

try:
    engine = create_async_engine(active_url, echo=False)
except Exception:
    active_url = sqlite_url
    engine = create_async_engine(sqlite_url, echo=False)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False
)

async def init_db():
    global engine, AsyncSessionLocal
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info(f"Connected to database successfully: {active_url}")
    except Exception as e:
        logger.warning(f"Could not connect using {active_url} ({e}). Switching to local SQLite store.")
        engine = create_async_engine(sqlite_url, echo=False)
        AsyncSessionLocal.configure(bind=engine)
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info("Local fallback database initialized successfully.")

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
