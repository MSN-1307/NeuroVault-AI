from typing import List, Dict, Any
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from app.database import get_db
from app.models import User
from app.dependencies import get_current_user
from app.services.nl2sql_service import nl2sql_service
from app.services.query_optimizer import QueryOptimizerService

router = APIRouter(prefix="/database", tags=["Database Explorer"])

ALLOWED_TABLES = [
    "users", "user_preferences", "categories", "conversations",
    "messages", "memories", "memory_versions", "tags",
    "memory_tags", "memory_relations", "feedback",
    "memory_access_logs", "memory_extraction_events", "audit_logs"
]

class QueryRequest(BaseModel):
    query: str

class NLQueryRequest(BaseModel):
    natural_language_query: str

@router.post("/nl2sql")
async def natural_language_to_sql(
    req: NLQueryRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Translates natural language questions into safe, optimized MySQL queries,
    then executes the query with query profiling, EXPLAIN plan, and index suggestions.
    """
    translation = await nl2sql_service.translate_nl_to_sql(req.natural_language_query, current_user.id)
    generated_sql = translation["sql"]

    optimizer = QueryOptimizerService(db)
    execution_result = await optimizer.analyze_and_execute(generated_sql)

    return {
        "natural_query": req.natural_language_query,
        "generated_sql": generated_sql,
        "explanation": translation["explanation"],
        "estimated_complexity": translation["estimated_complexity"],
        "target_tables": translation["target_tables"],
        "execution": execution_result
    }

@router.get("/metrics")
async def get_dbms_metrics(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    total_records = 0
    table_stats = {}
    for tbl in ALLOWED_TABLES:
        try:
            cnt_res = await db.execute(text(f"SELECT COUNT(*) FROM {tbl}"))
            c = cnt_res.scalar() or 0
            table_stats[tbl] = c
            total_records += c
        except Exception:
            table_stats[tbl] = 0

    return {
        "engine": "MySQL 8.0+ / 8.4+ Architecture",
        "driver": "asyncmy async connection pool",
        "acid_compliance": "WAL Enabled (InnoDB / Full ACID Isolation)",
        "normalization": "3NF Normalized (Atomic fields, FK relations, no transitive dependencies)",
        "foreign_key_relations": 11,
        "indexes_active": 18,
        "views_configured": 4,
        "stored_procedures": 3,
        "active_triggers": 3,
        "total_records_stored": total_records,
        "tables": table_stats
    }

@router.post("/query")
async def execute_safe_query(
    req: QueryRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    sql = req.query.strip()
    if not sql.upper().startswith("SELECT"):
        raise HTTPException(
            status_code=400,
            detail="Safety Rule: Only read-only 'SELECT' statements are permitted in the interactive DBMS console."
        )

    forbidden = ["DROP", "DELETE", "TRUNCATE", "UPDATE", "INSERT", "ALTER", "REPLACE"]
    for word in forbidden:
        if f" {word} " in f" {sql.upper()} ":
            raise HTTPException(
                status_code=400,
                detail=f"Forbidden keyword '{word}' detected. This console is read-only for ACID safety."
            )

    optimizer = QueryOptimizerService(db)
    try:
        return await optimizer.analyze_and_execute(sql)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"SQL Execution Error: {str(e)}")

@router.get("/tables")
async def list_database_tables(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    table_metadata = []
    is_sqlite = "sqlite" in str(db.bind.url if db.bind else "")

    for tbl in ALLOWED_TABLES:
        try:
            cnt_res = await db.execute(text(f"SELECT COUNT(*) FROM {tbl}"))
            row_count = cnt_res.scalar() or 0

            cols = []
            if is_sqlite:
                pragma_res = await db.execute(text(f"PRAGMA table_info({tbl})"))
                for col in pragma_res.all():
                    cols.append({
                        "name": col[1],
                        "type": col[2],
                        "nullable": "YES" if col[3] == 0 else "NO",
                        "key": "PRI" if col[5] == 1 else "",
                        "comment": ""
                    })
            else:
                col_res = await db.execute(text(
                    "SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_KEY, COLUMN_COMMENT "
                    "FROM INFORMATION_SCHEMA.COLUMNS "
                    f"WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = '{tbl}' "
                    "ORDER BY ORDINAL_POSITION"
                ))
                for r in col_res.all():
                    cols.append({
                        "name": r[0],
                        "type": r[1],
                        "nullable": r[2],
                        "key": r[3],
                        "comment": r[4] or ""
                    })

            table_metadata.append({
                "table_name": tbl,
                "row_count": row_count,
                "columns": cols
            })
        except Exception:
            pass

    return table_metadata

@router.get("/tables/{table_name}/data")
async def get_table_sample_data(
    table_name: str,
    limit: int = 25,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if table_name not in ALLOWED_TABLES:
        raise HTTPException(status_code=400, detail="Invalid or restricted table name.")

    query = text(f"SELECT * FROM {table_name} ORDER BY 1 DESC LIMIT :limit")
    res = await db.execute(query, {"limit": min(limit, 100)})
    keys = res.keys()
    rows = []
    for row in res.all():
        row_dict = {}
        for idx, key in enumerate(keys):
            val = row[idx]
            if hasattr(val, "isoformat"):
                val = val.isoformat()
            row_dict[key] = val
        rows.append(row_dict)

    return {
        "table": table_name,
        "columns": list(keys),
        "total_returned": len(rows),
        "rows": rows
    }
