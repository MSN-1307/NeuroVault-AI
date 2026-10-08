-- ==============================================================================
-- NeuroVault MySQL Views
-- ==============================================================================
USE neurovault;

DROP VIEW IF EXISTS vw_active_memory_summary;
DROP VIEW IF EXISTS vw_memory_quality_dashboard;
DROP VIEW IF EXISTS vw_user_memory_statistics;
DROP VIEW IF EXISTS vw_recent_memory_access;

-- 1. Joined view of active memories with category, author, and comma-separated tags
CREATE VIEW vw_active_memory_summary AS
SELECT 
    m.id AS memory_id,
    m.user_id,
    u.name AS user_name,
    u.email AS user_email,
    c.name AS category_name,
    m.memory_type,
    m.content,
    m.summary,
    m.importance_score,
    m.confidence_score,
    m.quality_score,
    m.status,
    m.is_sensitive,
    m.version_number,
    m.created_at,
    m.last_accessed_at,
    COALESCE(GROUP_CONCAT(t.name ORDER BY t.name SEPARATOR ', '), '') AS tags_list
FROM memories m
JOIN users u ON m.user_id = u.id
LEFT JOIN categories c ON m.category_id = c.id
LEFT JOIN memory_tags mt ON m.id = mt.memory_id
LEFT JOIN tags t ON mt.tag_id = t.id
WHERE m.status = 'ACTIVE'
GROUP BY 
    m.id, m.user_id, u.name, u.email, c.name, m.memory_type, 
    m.content, m.summary, m.importance_score, m.confidence_score, 
    m.quality_score, m.status, m.is_sensitive, m.version_number, 
    m.created_at, m.last_accessed_at;

-- 2. Aggregated quality metrics and conflict counts
CREATE VIEW vw_memory_quality_dashboard AS
SELECT 
    m.user_id,
    COUNT(m.id) AS total_memories,
    SUM(CASE WHEN m.status = 'ACTIVE' THEN 1 ELSE 0 END) AS active_count,
    SUM(CASE WHEN m.status = 'ARCHIVED' THEN 1 ELSE 0 END) AS archived_count,
    SUM(CASE WHEN m.status = 'CONFLICTED' THEN 1 ELSE 0 END) AS conflicted_count,
    SUM(CASE WHEN m.status = 'EXPIRED' THEN 1 ELSE 0 END) AS expired_count,
    ROUND(AVG(m.quality_score), 2) AS avg_quality_score,
    ROUND(AVG(m.importance_score), 2) AS avg_importance_score,
    ROUND(AVG(m.confidence_score), 2) AS avg_confidence_score,
    SUM(CASE WHEN m.is_sensitive = TRUE THEN 1 ELSE 0 END) AS sensitive_count
FROM memories m
GROUP BY m.user_id;

-- 3. Aggregated counts and metrics by category
CREATE VIEW vw_user_memory_statistics AS
SELECT 
    m.user_id,
    COALESCE(c.name, 'Uncategorized') AS category_name,
    m.memory_type,
    COUNT(m.id) AS memory_count,
    ROUND(AVG(m.importance_score), 1) AS avg_importance,
    ROUND(AVG(m.confidence_score), 1) AS avg_confidence
FROM memories m
LEFT JOIN categories c ON m.category_id = c.id
WHERE m.status != 'DELETED'
GROUP BY m.user_id, c.name, m.memory_type;

-- 4. Recent memory retrieval and access logs
CREATE VIEW vw_recent_memory_access AS
SELECT 
    mal.id AS log_id,
    mal.user_id,
    mal.memory_id,
    m.content AS memory_snippet,
    mal.access_type,
    mal.query,
    mal.retrieval_score,
    mal.created_at
FROM memory_access_logs mal
JOIN memories m ON mal.memory_id = m.id
ORDER BY mal.created_at DESC;
