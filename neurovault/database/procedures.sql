-- ==============================================================================
-- NeuroVault MySQL Stored Procedures & Functions
-- ==============================================================================
USE neurovault;

DROP PROCEDURE IF EXISTS sp_archive_old_memories;
DROP PROCEDURE IF EXISTS sp_get_user_memory_stats;
DROP PROCEDURE IF EXISTS sp_create_memory_with_audit;

DELIMITER //

-- 1. Archive temporary or expired memories based on expires_at timestamp
CREATE PROCEDURE sp_archive_old_memories()
BEGIN
    DECLARE rows_affected INT DEFAULT 0;

    UPDATE memories
    SET status = 'EXPIRED'
    WHERE expires_at IS NOT NULL 
      AND expires_at < NOW() 
      AND status NOT IN ('EXPIRED', 'DELETED');

    SET rows_affected = ROW_COUNT();

    INSERT INTO audit_logs (user_id, actor_type, action, entity_type, entity_id, metadata, created_at)
    VALUES (
        NULL, 
        'SYSTEM', 
        'ARCHIVE_EXPIRED_BATCH', 
        'memories', 
        NULL, 
        JSON_OBJECT('expired_count', rows_affected, 'timestamp', NOW()), 
        NOW()
    );

    SELECT rows_affected AS expired_memories_count;
END //

-- 2. Return aggregated counts by category, average confidence, and quality metrics
CREATE PROCEDURE sp_get_user_memory_stats(IN p_user_id BIGINT)
BEGIN
    SELECT 
        c.id AS category_id,
        COALESCE(c.name, 'Uncategorized') AS category_name,
        COUNT(m.id) AS total_count,
        SUM(CASE WHEN m.status = 'ACTIVE' THEN 1 ELSE 0 END) AS active_count,
        SUM(CASE WHEN m.status = 'CONFLICTED' THEN 1 ELSE 0 END) AS conflicted_count,
        ROUND(AVG(m.confidence_score), 2) AS avg_confidence,
        ROUND(AVG(m.importance_score), 2) AS avg_importance,
        ROUND(AVG(m.quality_score), 2) AS avg_quality
    FROM memories m
    LEFT JOIN categories c ON m.category_id = c.id
    WHERE m.user_id = p_user_id AND m.status != 'DELETED'
    GROUP BY c.id, c.name;
END //

-- 3. Stored procedure to safely insert a memory and auto-record audit log
CREATE PROCEDURE sp_create_memory_with_audit(
    IN p_user_id BIGINT,
    IN p_category_id BIGINT,
    IN p_memory_type VARCHAR(50),
    IN p_content TEXT,
    IN p_summary TEXT,
    IN p_importance INT,
    IN p_confidence INT,
    IN p_is_sensitive BOOLEAN,
    OUT p_new_memory_id BIGINT
)
BEGIN
    INSERT INTO memories (
        user_id, category_id, memory_type, content, summary,
        importance_score, confidence_score, is_sensitive, status, created_at
    ) VALUES (
        p_user_id, p_category_id, p_memory_type, p_content, p_summary,
        p_importance, p_confidence, p_is_sensitive, 'ACTIVE', NOW()
    );

    SET p_new_memory_id = LAST_INSERT_ID();

    INSERT INTO audit_logs (
        user_id, actor_type, action, entity_type, entity_id, metadata, created_at
    ) VALUES (
        p_user_id, 'USER', 'CREATE_MEMORY', 'memories', p_new_memory_id,
        JSON_OBJECT('type', p_memory_type, 'importance', p_importance, 'is_sensitive', p_is_sensitive),
        NOW()
    );
END //

DELIMITER ;
