-- ==============================================================================
-- NeuroVault MySQL Triggers
-- ==============================================================================
USE neurovault;

DROP TRIGGER IF EXISTS before_memory_update_version;
DROP TRIGGER IF EXISTS after_memory_insert_audit;
DROP TRIGGER IF EXISTS after_memory_update_audit;

DELIMITER //

-- 1. Automatic versioning trigger:
-- Whenever memories.content is changed, increment version_number and snapshot the previous version in memory_versions
CREATE TRIGGER before_memory_update_version
BEFORE UPDATE ON memories
FOR EACH ROW
BEGIN
    IF OLD.content != NEW.content THEN
        SET NEW.version_number = OLD.version_number + 1;
        
        INSERT INTO memory_versions (
            memory_id,
            version_number,
            previous_content,
            new_content,
            change_reason,
            changed_by,
            created_at
        ) VALUES (
            OLD.id,
            OLD.version_number,
            OLD.content,
            NEW.content,
            'Content updated via system trigger',
            'USER',
            NOW()
        );
    END IF;
END //

-- 2. Audit log trigger on memory insertion
CREATE TRIGGER after_memory_insert_audit
AFTER INSERT ON memories
FOR EACH ROW
BEGIN
    INSERT INTO audit_logs (
        user_id,
        actor_type,
        action,
        entity_type,
        entity_id,
        metadata,
        created_at
    ) VALUES (
        NEW.user_id,
        'USER',
        'CREATE_MEMORY',
        'memories',
        NEW.id,
        JSON_OBJECT(
            'memory_type', NEW.memory_type,
            'status', NEW.status,
            'is_sensitive', NEW.is_sensitive,
            'importance_score', NEW.importance_score
        ),
        NOW()
    );
END //

-- 3. Audit log trigger on memory update (especially sensitive memories or status changes)
CREATE TRIGGER after_memory_update_audit
AFTER UPDATE ON memories
FOR EACH ROW
BEGIN
    IF OLD.status != NEW.status OR OLD.content != NEW.content OR NEW.is_sensitive = TRUE THEN
        INSERT INTO audit_logs (
            user_id,
            actor_type,
            action,
            entity_type,
            entity_id,
            metadata,
            created_at
        ) VALUES (
            NEW.user_id,
            'USER',
            CASE 
                WHEN OLD.status != NEW.status THEN CONCAT('STATUS_CHANGE_', NEW.status)
                ELSE 'UPDATE_MEMORY'
            END,
            'memories',
            NEW.id,
            JSON_OBJECT(
                'old_status', OLD.status,
                'new_status', NEW.status,
                'is_sensitive', NEW.is_sensitive,
                'version', NEW.version_number
            ),
            NOW()
        );
    END IF;
END //

DELIMITER ;
