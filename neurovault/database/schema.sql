# ==============================================================================
# NeuroVault MySQL Schema DDL
# Compatible with MySQL 8.0+ and 8.4+
# ==============================================================================

CREATE DATABASE IF NOT EXISTS neurovault
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE neurovault;

-- Drop tables if needed in reverse dependency order
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS audit_logs;
DROP TABLE IF EXISTS memory_extraction_events;
DROP TABLE IF EXISTS memory_access_logs;
DROP TABLE IF EXISTS feedback;
DROP TABLE IF EXISTS memory_relations;
DROP TABLE IF EXISTS memory_tags;
DROP TABLE IF EXISTS tags;
DROP TABLE IF EXISTS memory_versions;
DROP TABLE IF EXISTS memories;
DROP TABLE IF EXISTS messages;
DROP TABLE IF EXISTS conversations;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS user_preferences;
DROP TABLE IF EXISTS users;
SET FOREIGN_KEY_CHECKS = 1;

-- ------------------------------------------------------------------------------
-- 1. users
-- ------------------------------------------------------------------------------
CREATE TABLE users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(191) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('USER', 'ADMIN', 'AI_SERVICE') NOT NULL DEFAULT 'USER',
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP NULL DEFAULT NULL,
    INDEX idx_users_email (email),
    INDEX idx_users_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 2. user_preferences
-- ------------------------------------------------------------------------------
CREATE TABLE user_preferences (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    communication_style VARCHAR(50) DEFAULT 'BALANCED',
    language VARCHAR(20) DEFAULT 'en',
    theme VARCHAR(20) DEFAULT 'light',
    memory_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    personalization_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    analytics_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_user_preferences_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY uq_user_pref (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 3. categories
-- ------------------------------------------------------------------------------
CREATE TABLE categories (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_categories_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 4. conversations
-- ------------------------------------------------------------------------------
CREATE TABLE conversations (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    title VARCHAR(255) NOT NULL,
    summary TEXT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP NULL DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_conversations_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_conversations_user_id (user_id),
    INDEX idx_conversations_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 5. messages
-- ------------------------------------------------------------------------------
CREATE TABLE messages (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    conversation_id BIGINT NOT NULL,
    sender_type ENUM('USER', 'ASSISTANT', 'SYSTEM') NOT NULL,
    content LONGTEXT NOT NULL,
    token_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_messages_conversation FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
    INDEX idx_messages_conv_id (conversation_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 6. memories
-- ------------------------------------------------------------------------------
CREATE TABLE memories (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    category_id BIGINT NULL,
    source_message_id BIGINT NULL,
    source_conversation_id BIGINT NULL,
    memory_type VARCHAR(50) NOT NULL DEFAULT 'FACT',
    content TEXT NOT NULL,
    summary TEXT NULL,
    embedding JSON NULL COMMENT 'Vector float array representation for semantic similarity',
    importance_score INT NOT NULL DEFAULT 50 CHECK (importance_score BETWEEN 0 AND 100),
    confidence_score INT NOT NULL DEFAULT 80 CHECK (confidence_score BETWEEN 0 AND 100),
    freshness_score INT NOT NULL DEFAULT 100 CHECK (freshness_score BETWEEN 0 AND 100),
    quality_score INT NOT NULL DEFAULT 85 CHECK (quality_score BETWEEN 0 AND 100),
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE' COMMENT 'DETECTED, ACTIVE, ARCHIVED, EXPIRED, DELETED, CONFLICTED',
    is_sensitive BOOLEAN NOT NULL DEFAULT FALSE,
    version_number INT NOT NULL DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_accessed_at DATETIME NULL DEFAULT NULL,
    expires_at DATETIME NULL DEFAULT NULL,
    CONSTRAINT fk_memories_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_memories_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
    CONSTRAINT fk_memories_src_msg FOREIGN KEY (source_message_id) REFERENCES messages(id) ON DELETE SET NULL,
    CONSTRAINT fk_memories_src_conv FOREIGN KEY (source_conversation_id) REFERENCES conversations(id) ON DELETE SET NULL,
    INDEX idx_memories_user (user_id),
    INDEX idx_memories_category (category_id),
    INDEX idx_memories_status (status),
    INDEX idx_memories_type (memory_type),
    INDEX idx_memories_created_at (created_at),
    INDEX idx_memories_last_accessed (last_accessed_at),
    FULLTEXT KEY ft_memory_content (content, summary)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 7. memory_versions
-- ------------------------------------------------------------------------------
CREATE TABLE memory_versions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    memory_id BIGINT NOT NULL,
    version_number INT NOT NULL,
    previous_content TEXT NULL,
    new_content TEXT NOT NULL,
    change_reason VARCHAR(255) NULL,
    changed_by VARCHAR(100) DEFAULT 'SYSTEM',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_mem_versions_memory FOREIGN KEY (memory_id) REFERENCES memories(id) ON DELETE CASCADE,
    INDEX idx_mem_versions_memory_id (memory_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 8. tags
-- ------------------------------------------------------------------------------
CREATE TABLE tags (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_tags_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 9. memory_tags (Many-to-Many)
-- ------------------------------------------------------------------------------
CREATE TABLE memory_tags (
    memory_id BIGINT NOT NULL,
    tag_id BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (memory_id, tag_id),
    CONSTRAINT fk_memtags_memory FOREIGN KEY (memory_id) REFERENCES memories(id) ON DELETE CASCADE,
    CONSTRAINT fk_memtags_tag FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 10. memory_relations (Self-Referencing / Graph Relations)
-- ------------------------------------------------------------------------------
CREATE TABLE memory_relations (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    source_memory_id BIGINT NOT NULL,
    target_memory_id BIGINT NOT NULL,
    relation_type VARCHAR(50) NOT NULL DEFAULT 'RELATED_TO' COMMENT 'RELATED_TO, CONTRADICTS, REPLACES, PART_OF, SUPPORTS, DERIVED_FROM',
    confidence INT NOT NULL DEFAULT 80 CHECK (confidence BETWEEN 0 AND 100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_memrel_source FOREIGN KEY (source_memory_id) REFERENCES memories(id) ON DELETE CASCADE,
    CONSTRAINT fk_memrel_target FOREIGN KEY (target_memory_id) REFERENCES memories(id) ON DELETE CASCADE,
    INDEX idx_memrel_source (source_memory_id),
    INDEX idx_memrel_target (target_memory_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 11. feedback
-- ------------------------------------------------------------------------------
CREATE TABLE feedback (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    memory_id BIGINT NOT NULL,
    rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    feedback_type VARCHAR(50) NOT NULL COMMENT 'USEFUL, NOT_USEFUL, INCORRECT, OUTDATED',
    comment TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_feedback_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_feedback_memory FOREIGN KEY (memory_id) REFERENCES memories(id) ON DELETE CASCADE,
    INDEX idx_feedback_memory (memory_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 12. memory_access_logs
-- ------------------------------------------------------------------------------
CREATE TABLE memory_access_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    memory_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    access_type VARCHAR(50) NOT NULL DEFAULT 'RETRIEVAL' COMMENT 'RETRIEVAL, DIRECT_VIEW, API_EXPORT',
    query TEXT NULL,
    retrieval_score FLOAT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_memaccess_memory FOREIGN KEY (memory_id) REFERENCES memories(id) ON DELETE CASCADE,
    CONSTRAINT fk_memaccess_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_memaccess_user (user_id),
    INDEX idx_memaccess_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 13. memory_extraction_events
-- ------------------------------------------------------------------------------
CREATE TABLE memory_extraction_events (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    message_id BIGINT NULL,
    model_name VARCHAR(100) NOT NULL,
    prompt_version VARCHAR(50) DEFAULT 'v1.0',
    extracted_count INT NOT NULL DEFAULT 0,
    processing_time_ms INT NOT NULL DEFAULT 0,
    status VARCHAR(50) NOT NULL DEFAULT 'SUCCESS',
    error_message TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_memextract_message FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE SET NULL,
    INDEX idx_memextract_msg (message_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 14. audit_logs
-- ------------------------------------------------------------------------------
CREATE TABLE audit_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NULL,
    actor_type VARCHAR(50) NOT NULL DEFAULT 'USER' COMMENT 'USER, ADMIN, AI_SERVICE, SYSTEM',
    action VARCHAR(100) NOT NULL COMMENT 'CREATE_MEMORY, UPDATE_MEMORY, DELETE_MEMORY, ARCHIVE_MEMORY, RETRIEVE_MEMORY, LOGIN, EXPORT_DATA',
    entity_type VARCHAR(50) NOT NULL,
    entity_id BIGINT NULL,
    metadata JSON NULL,
    ip_hash VARCHAR(128) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_audit_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_audit_created (created_at),
    INDEX idx_audit_user (user_id),
    INDEX idx_audit_action (action)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
