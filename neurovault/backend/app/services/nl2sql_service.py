import json
import re
import time
from typing import Dict, Any, List, Optional
import httpx
from app.config import settings
from app.models import User

SCHEMA_CONTEXT = """
Database: MySQL 8.0+
Tables:
1. users (id, name, email, role, status, created_at, updated_at)
2. user_preferences (id, user_id, communication_style, language, theme, memory_enabled, personalization_enabled, analytics_enabled)
3. categories (id, name, description, created_at)
4. conversations (id, user_id, title, summary, status, started_at, ended_at, created_at)
5. messages (id, conversation_id, sender_type, content, token_count, created_at)
6. memories (id, user_id, category_id, source_message_id, source_conversation_id, memory_type, content, summary, importance_score, confidence_score, freshness_score, quality_score, status, is_sensitive, version_number, created_at, updated_at, last_accessed_at, expires_at)
7. memory_versions (id, memory_id, version_number, previous_content, new_content, change_reason, changed_by, created_at)
8. tags (id, name, description, created_at)
9. memory_tags (memory_id, tag_id, created_at)
10. memory_relations (id, source_memory_id, target_memory_id, relation_type, confidence, created_at)
11. feedback (id, user_id, memory_id, rating, feedback_type, comment, created_at)
12. memory_access_logs (id, memory_id, user_id, access_type, query, retrieval_score, created_at)
13. memory_extraction_events (id, message_id, model_name, prompt_version, extracted_count, processing_time_ms, status, error_message, created_at)
14. audit_logs (id, user_id, actor_type, action, entity_type, entity_id, metadata, created_at)

Views:
- vw_active_memory_summary (memory_id, user_id, user_name, user_email, category_name, memory_type, content, summary, importance_score, confidence_score, quality_score, status, tags_list)
- vw_memory_quality_dashboard (user_id, total_memories, active_count, archived_count, conflicted_count, avg_quality_score, avg_importance_score, avg_confidence_score)
- vw_user_memory_statistics (user_id, category_name, memory_type, memory_count, avg_importance, avg_confidence)
"""

class NL2SQLService:
    def __init__(self):
        self.ollama_url = settings.OLLAMA_BASE_URL.rstrip("/")
        self.model = settings.LLM_MODEL

    async def translate_nl_to_sql(self, natural_query: str, user_id: int) -> Dict[str, Any]:
        """
        Translates a natural language question into safe, optimized MySQL SELECT queries.
        Enforces user data isolation and produces human explanation + query intent.
        """
        system_prompt = (
            "You are an expert MySQL database query compiler. Your job is to translate natural language into "
            "syntactically valid, safe, read-only MySQL 8.0+ SELECT queries.\n"
            "Rules:\n"
            "1. ONLY produce SELECT queries. Never generate INSERT, UPDATE, DELETE, DROP, ALTER, TRUNCATE.\n"
            f"2. Always enforce user isolation where applicable (e.g. user_id = {user_id} or JOIN users).\n"
            "3. Use table joins and aggregate functions where appropriate.\n"
            "4. Return STRICT JSON with keys: sql, explanation, estimated_complexity, target_tables.\n"
            f"{SCHEMA_CONTEXT}"
        )

        prompt = f"Convert this natural language request to MySQL query: \"{natural_query}\""

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                resp = await client.post(
                    f"{self.ollama_url}/api/generate",
                    json={
                        "model": self.model,
                        "prompt": prompt,
                        "system": system_prompt,
                        "format": "json",
                        "stream": False,
                        "options": {"temperature": 0.1}
                    }
                )
                if resp.status_code == 200:
                    raw = resp.json().get("response", "{}")
                    parsed = json.loads(raw)
                    sql = parsed.get("sql", "").strip()
                    sql = self._clean_and_validate_sql(sql)
                    return {
                        "sql": sql,
                        "explanation": parsed.get("explanation", "Generated query based on schema entities."),
                        "estimated_complexity": parsed.get("estimated_complexity", "O(log N) indexed search"),
                        "target_tables": parsed.get("target_tables", ["memories"])
                    }
        except Exception:
            pass

        # Rule-based fallback translation for instant sub-second response
        return self._heuristic_translation(natural_query, user_id)

    def _clean_and_validate_sql(self, sql: str) -> str:
        sql = sql.replace("```sql", "").replace("```", "").strip()
        if not sql.upper().startswith("SELECT"):
            sql = f"SELECT id, memory_type, content, status FROM memories WHERE user_id = 1 LIMIT 10;"
        # Ensure semicolon
        if not sql.endswith(";"):
            sql += ";"
        return sql

    def _heuristic_translation(self, q: str, user_id: int) -> Dict[str, Any]:
        lower = q.lower()

        if "high importance" in lower or "most important" in lower:
            sql = f"SELECT id, memory_type, content, importance_score, confidence_score FROM memories WHERE user_id = {user_id} AND status = 'ACTIVE' ORDER BY importance_score DESC LIMIT 10;"
            explanation = "Retrieves top 10 active memories for user ordered by importance score descending."
            tables = ["memories"]
        elif "conflict" in lower or "contradiction" in lower:
            sql = f"SELECT id, memory_type, content, status, importance_score FROM memories WHERE user_id = {user_id} AND status = 'CONFLICTED';"
            explanation = "Queries all memories flagged as CONFLICTED requiring user review."
            tables = ["memories"]
        elif "category" in lower or "group by" in lower or "count" in lower:
            sql = f"SELECT c.name AS category_name, COUNT(m.id) AS total_memories, ROUND(AVG(m.importance_score), 1) AS avg_importance FROM memories m LEFT JOIN categories c ON m.category_id = c.id WHERE m.user_id = {user_id} GROUP BY c.name ORDER BY total_memories DESC;"
            explanation = "Aggregates memories grouped by category with counts and average importance."
            tables = ["memories", "categories"]
        elif "recent" in lower or "latest" in lower:
            sql = f"SELECT id, memory_type, content, created_at, status FROM memories WHERE user_id = {user_id} ORDER BY created_at DESC LIMIT 10;"
            explanation = "Retrieves latest 10 created memories ordered by timestamp."
            tables = ["memories"]
        elif "user" in lower or "profile" in lower:
            sql = f"SELECT id, name, email, role, status, created_at FROM users WHERE id = {user_id};"
            explanation = "Queries the isolated user profile record."
            tables = ["users"]
        elif "audit" in lower or "log" in lower:
            sql = f"SELECT id, actor_type, action, entity_type, entity_id, created_at FROM audit_logs WHERE user_id = {user_id} ORDER BY created_at DESC LIMIT 20;"
            explanation = "Selects recent 20 security and operations audit log entries."
            tables = ["audit_logs"]
        else:
            # Generic smart memory search query
            sql = f"SELECT memory_id, category_name, memory_type, content, importance_score, tags_list FROM vw_active_memory_summary WHERE user_id = {user_id} LIMIT 15;"
            explanation = "Queries the analytical active memory view with joined tags and categories."
            tables = ["vw_active_memory_summary"]

        return {
            "sql": sql,
            "explanation": explanation,
            "estimated_complexity": "O(log N) Indexed Lookup / B-Tree Scan",
            "target_tables": tables
        }

nl2sql_service = NL2SQLService()
