-- ==============================================================================
-- NeuroVault Realistic Seed Data
-- ==============================================================================
USE neurovault;

SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE audit_logs;
TRUNCATE TABLE memory_extraction_events;
TRUNCATE TABLE memory_access_logs;
TRUNCATE TABLE feedback;
TRUNCATE TABLE memory_relations;
TRUNCATE TABLE memory_tags;
TRUNCATE TABLE tags;
TRUNCATE TABLE memory_versions;
TRUNCATE TABLE memories;
TRUNCATE TABLE messages;
TRUNCATE TABLE conversations;
TRUNCATE TABLE categories;
TRUNCATE TABLE user_preferences;
TRUNCATE TABLE users;
SET FOREIGN_KEY_CHECKS = 1;

-- 1. Users
-- password is 'password123' hashed with bcrypt/pbkdf2:
-- $2b$12$e8x5OsqyT4n.B9z/iL3jB.2qLz3kQ5H4X/kM7xOqL0G1e5Uq7NqIu -> placeholder pbkdf2_sha256
-- Using standard sha256_crypt or known pbkdf2_sha256 hash for 'password123'
INSERT INTO users (id, name, email, password_hash, role, status) VALUES
(1, 'Demo User', 'demo@neurovault.ai', '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'USER', 'ACTIVE'),
(2, 'Alex Admin', 'admin@neurovault.ai', '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'ADMIN', 'ACTIVE'),
(3, 'Sarah Connor', 'sarah@neurovault.ai', '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'USER', 'ACTIVE');

-- 2. User Preferences
INSERT INTO user_preferences (user_id, communication_style, language, theme, memory_enabled, personalization_enabled, analytics_enabled) VALUES
(1, 'CONCISE_TECHNICAL', 'en', 'light', TRUE, TRUE, TRUE),
(2, 'EXECUTIVE', 'en', 'light', TRUE, TRUE, TRUE),
(3, 'CASUAL', 'en', 'light', TRUE, TRUE, TRUE);

-- 3. Categories
INSERT INTO categories (id, name, description) VALUES
(1, 'Project', 'Software, engineering initiatives, and research projects'),
(2, 'Technical Skills', 'Languages, frameworks, databases, and architectural tools'),
(3, 'Preferences', 'Coding styles, toolsets, communication nuances, and patterns'),
(4, 'Education', 'Academic courses, degrees, universities, and milestones'),
(5, 'Goals', 'Long-term milestones, deadlines, and personal aspirations'),
(6, 'Personal', 'Interests, working routines, and biographical facts');

-- 4. Tags
INSERT INTO tags (id, name, description) VALUES
(1, 'MySQL', 'Relational database management system'),
(2, 'Python', 'Python 3 programming language'),
(3, 'FastAPI', 'High performance async Python web framework'),
(4, 'React', 'Frontend UI library'),
(5, 'TypeScript', 'Typed superset of JavaScript'),
(6, 'AI-Agents', 'Autonomous agent workflows and RAG'),
(7, 'NeuroVault', 'Core AI memory platform'),
(8, 'Full-Stack', 'End-to-end development'),
(9, 'Algorithms', 'Data structures and complexity'),
(10, 'Cloud', 'Infrastructure and containerization');

-- 5. Conversations
INSERT INTO conversations (id, user_id, title, summary, status) VALUES
(1, 1, 'NeuroVault Architecture Discussion', 'Discussing MySQL storage layer and hybrid retrieval mechanics', 'ACTIVE'),
(2, 1, 'Frontend Tech Stack Selection', 'Deciding on Vite, React 18, and Tailwind CSS light theme', 'ACTIVE'),
(3, 1, 'University Exam Preparation', 'Preparing for the upcoming Database Management Systems exam', 'COMPLETED'),
(4, 1, 'Python vs Go Preferences', 'Discussion regarding preferred backend development languages', 'ACTIVE');

-- 6. Messages
INSERT INTO messages (id, conversation_id, sender_type, content, token_count) VALUES
(1, 1, 'USER', 'I am building NeuroVault, an AI memory platform using MySQL instead of PostgreSQL for our hackathon project.', 24),
(2, 1, 'ASSISTANT', 'Great architectural decision. MySQL 8.0+ provides robust FULLTEXT search and native JSON capabilities for vector embeddings.', 28),
(3, 1, 'USER', 'We also need hybrid retrieval combining cosine similarity on embeddings with MySQL FULLTEXT search.', 22),
(4, 2, 'USER', 'For the UI, let us build a light-mode clean interface using React, Vite, and Tailwind CSS.', 21),
(5, 3, 'USER', 'I am a Computer Science Senior and my DBMS finals are scheduled for next week.', 18),
(6, 4, 'USER', 'I strictly prefer Python with FastAPI for building AI backends because of the rich async ecosystem.', 23),
(7, 4, 'USER', 'Actually, for high-throughput real-time streaming, I prefer Go microservices.', 17);

-- 7. Memories
-- Mock 16-dim normalized vector embeddings for tests/demos
INSERT INTO memories (id, user_id, category_id, source_message_id, source_conversation_id, memory_type, content, summary, embedding, importance_score, confidence_score, quality_score, status, is_sensitive, version_number) VALUES
(1, 1, 1, 1, 1, 'PROJECT', 'Building NeuroVault, a persistent AI memory management system utilizing MySQL 8.0+ and FastAPI.', 'Developing NeuroVault AI Memory Platform on MySQL', '[0.12, 0.45, -0.32, 0.81, 0.05, -0.19, 0.62, 0.33, -0.41, 0.22, 0.15, -0.08, 0.51, 0.38, -0.27, 0.66]', 95, 98, 96, 'ACTIVE', FALSE, 1),
(2, 1, 2, 3, 1, 'SKILL', 'Implements hybrid search combining vector cosine similarity with MySQL FULLTEXT Boolean search.', 'MySQL Hybrid Retrieval Implementation', '[0.18, 0.52, -0.29, 0.77, 0.08, -0.15, 0.58, 0.40, -0.36, 0.28, 0.12, -0.04, 0.49, 0.35, -0.22, 0.71]', 90, 95, 94, 'ACTIVE', FALSE, 1),
(3, 1, 3, 4, 2, 'PREFERENCE', 'Prefers clean light-mode user interfaces designed with React, Vite, and Tailwind CSS.', 'Preference for Light-Mode React UIs', '[0.35, 0.12, 0.08, 0.44, -0.21, 0.33, 0.18, 0.65, -0.11, 0.55, 0.29, 0.14, 0.22, 0.41, -0.05, 0.39]', 85, 92, 90, 'ACTIVE', FALSE, 1),
(4, 1, 4, 5, 3, 'EDUCATION', 'Computer Science Senior student preparing for final Database Management Systems examinations.', 'CS Senior with upcoming DBMS exams', '[0.05, 0.28, -0.12, 0.39, 0.41, -0.33, 0.25, 0.18, -0.22, 0.14, 0.68, -0.15, 0.31, 0.19, -0.11, 0.45]', 80, 99, 95, 'ACTIVE', FALSE, 1),
(5, 1, 3, 6, 4, 'PREFERENCE', 'Prefers Python with FastAPI for building AI backend architectures and agent workflows.', 'Prefers Python/FastAPI for AI backends', '[0.22, 0.48, -0.25, 0.72, 0.11, -0.18, 0.55, 0.38, -0.39, 0.31, 0.19, -0.07, 0.46, 0.42, -0.21, 0.63]', 88, 94, 92, 'ACTIVE', FALSE, 1),
(6, 1, 3, 7, 4, 'PREFERENCE', 'Prefers Go microservices for high-throughput real-time streaming services.', 'Prefers Go for real-time streaming services', '[-0.15, 0.33, -0.18, 0.55, 0.31, -0.09, 0.42, 0.29, -0.25, 0.19, 0.12, -0.11, 0.38, 0.25, -0.15, 0.50]', 75, 85, 82, 'CONFLICTED', FALSE, 1);

-- 8. Memory Tags
INSERT INTO memory_tags (memory_id, tag_id) VALUES
(1, 1), (1, 3), (1, 6), (1, 7),
(2, 1), (2, 2), (2, 6),
(3, 4), (3, 5),
(4, 1), (4, 9),
(5, 2), (5, 3), (5, 6),
(6, 10);

-- 9. Memory Relations
INSERT INTO memory_relations (id, source_memory_id, target_memory_id, relation_type, confidence) VALUES
(1, 2, 1, 'PART_OF', 95),
(2, 3, 1, 'SUPPORTS', 90),
(3, 5, 1, 'SUPPORTS', 92),
(4, 6, 5, 'CONTRADICTS', 78);

-- 10. Memory Versions (initial snapshot)
INSERT INTO memory_versions (memory_id, version_number, previous_content, new_content, change_reason, changed_by) VALUES
(1, 1, NULL, 'Building NeuroVault, a persistent AI memory management system utilizing MySQL 8.0+ and FastAPI.', 'Initial memory creation', 'AI_SERVICE'),
(2, 1, NULL, 'Implements hybrid search combining vector cosine similarity with MySQL FULLTEXT Boolean search.', 'Initial memory creation', 'AI_SERVICE'),
(5, 1, NULL, 'Prefers Python with FastAPI for building AI backend architectures and agent workflows.', 'Initial preference recorded', 'AI_SERVICE');

-- 11. Feedback
INSERT INTO feedback (user_id, memory_id, rating, feedback_type, comment) VALUES
(1, 1, 5, 'USEFUL', 'Accurately recognized our primary hackathon project!'),
(1, 2, 5, 'USEFUL', 'Exact retrieval strategy we planned to present.'),
(1, 6, 2, 'OUTDATED', 'Needs resolution against my core Python preference.');

-- 12. Memory Access Logs
INSERT INTO memory_access_logs (memory_id, user_id, access_type, query, retrieval_score) VALUES
(1, 1, 'RETRIEVAL', 'What database are we using for NeuroVault?', 0.96),
(2, 1, 'RETRIEVAL', 'How does our memory search work?', 0.91),
(5, 1, 'RETRIEVAL', 'What is my preferred language for AI services?', 0.89);

-- 13. Memory Extraction Events
INSERT INTO memory_extraction_events (message_id, model_name, prompt_version, extracted_count, processing_time_ms, status) VALUES
(1, 'qwen2.5:3b', 'v1.0', 1, 412, 'SUCCESS'),
(4, 'qwen2.5:3b', 'v1.0', 1, 385, 'SUCCESS'),
(6, 'qwen2.5:3b', 'v1.0', 1, 420, 'SUCCESS');

-- 14. Audit Logs
INSERT INTO audit_logs (user_id, actor_type, action, entity_type, entity_id, metadata) VALUES
(1, 'USER', 'LOGIN', 'users', 1, JSON_OBJECT('client', 'web', 'ip', '127.0.0.1')),
(1, 'AI_SERVICE', 'CREATE_MEMORY', 'memories', 1, JSON_OBJECT('confidence', 98, 'importance', 95)),
(1, 'AI_SERVICE', 'CREATE_MEMORY', 'memories', 2, JSON_OBJECT('confidence', 95, 'importance', 90)),
(1, 'USER', 'RETRIEVE_MEMORY', 'memories', 1, JSON_OBJECT('score', 0.96, 'query', 'What database are we using?'));
