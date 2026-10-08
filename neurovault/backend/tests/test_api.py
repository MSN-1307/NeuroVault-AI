import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app

@pytest.mark.asyncio
async def test_health_check():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["database"] == "MySQL"

@pytest.mark.asyncio
async def test_get_memories_list():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/api/memories")
    assert response.status_code == 200
    memories = response.json()
    assert isinstance(memories, list)
    assert len(memories) >= 1

@pytest.mark.asyncio
async def test_analytics_overview():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/api/analytics/overview")
    assert response.status_code == 200
    data = response.json()
    assert "total_memories" in data
    assert "avg_quality_score" in data

@pytest.mark.asyncio
async def test_database_explorer_tables():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/api/database/tables")
    assert response.status_code == 200
    tables = response.json()
    assert isinstance(tables, list)
    table_names = [t["table_name"] for t in tables]
    assert "memories" in table_names
    assert "users" in table_names

@pytest.mark.asyncio
async def test_search_memories():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.post("/api/search/memories", json={"query": "MySQL database", "top_k": 3})
    assert response.status_code == 200
    results = response.json()
    assert isinstance(results, list)
    assert len(results) >= 1
    assert "final_score" in results[0]
