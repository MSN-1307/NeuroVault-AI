import asyncio
from datetime import datetime
from sqlalchemy import select
from app.database import AsyncSessionLocal, init_db
from app.models import (
    User, UserPreference, Category, Tag, Conversation, Message,
    Memory, memory_tags, MemoryRelation, MemoryVersion, Feedback,
    MemoryAccessLog, MemoryExtractionEvent, AuditLog
)
from app.security import get_password_hash

async def seed_data():
    await init_db()
    async with AsyncSessionLocal() as db:
        # Check if already seeded
        res = await db.execute(select(User).where(User.id == 1))
        if res.scalar_one_or_none():
            print("Database already seeded. Skipping.")
            return

        print("Seeding NeuroVault database with realistic demo dataset...")

        # 1. Users
        pwd = get_password_hash("password123")
        user1 = User(id=1, name="Demo User", email="demo@neurovault.ai", password_hash=pwd, role="USER", status="ACTIVE")
        user2 = User(id=2, name="Alex Admin", email="admin@neurovault.ai", password_hash=pwd, role="ADMIN", status="ACTIVE")
        user3 = User(id=3, name="Sarah Connor", email="sarah@neurovault.ai", password_hash=pwd, role="USER", status="ACTIVE")
        db.add_all([user1, user2, user3])
        await db.flush()

        # 2. Preferences
        pref1 = UserPreference(id=1, user_id=1, communication_style="CONCISE_TECHNICAL", language="en", theme="light", memory_enabled=True, personalization_enabled=True, analytics_enabled=True)
        pref2 = UserPreference(id=2, user_id=2, communication_style="EXECUTIVE", language="en", theme="light", memory_enabled=True, personalization_enabled=True, analytics_enabled=True)
        pref3 = UserPreference(id=3, user_id=3, communication_style="CASUAL", language="en", theme="light", memory_enabled=True, personalization_enabled=True, analytics_enabled=True)
        db.add_all([pref1, pref2, pref3])

        # 3. Categories
        cat1 = Category(id=1, name="Project", description="Software and engineering initiatives")
        cat2 = Category(id=2, name="Technical Skills", description="Languages, frameworks, databases, and architectural tools")
        cat3 = Category(id=3, name="Preferences", description="Coding styles, toolsets, communication nuances")
        cat4 = Category(id=4, name="Education", description="Academic courses, degrees, universities, exams")
        cat5 = Category(id=5, name="Goals", description="Milestones, deadlines, personal aspirations")
        cat6 = Category(id=6, name="Personal", description="Interests, routines, and factual statements")
        db.add_all([cat1, cat2, cat3, cat4, cat5, cat6])
        await db.flush()

        # 4. Tags
        tags_data = [
            (1, "MySQL", "Relational database"),
            (2, "Python", "Python 3 language"),
            (3, "FastAPI", "High performance async web framework"),
            (4, "React", "Frontend UI library"),
            (5, "TypeScript", "Typed JavaScript"),
            (6, "AI-Agents", "Autonomous agent workflows and RAG"),
            (7, "NeuroVault", "Core AI memory platform"),
            (8, "Full-Stack", "End-to-end development"),
            (9, "Algorithms", "Data structures and complexity"),
            (10, "Cloud", "Infrastructure and microservices")
        ]
        tags = [Tag(id=t[0], name=t[1], description=t[2]) for t in tags_data]
        db.add_all(tags)
        await db.flush()

        # 5. Conversations
        conv1 = Conversation(id=1, user_id=1, title="NeuroVault Architecture Discussion", summary="MySQL storage layer and hybrid retrieval mechanics", status="ACTIVE")
        conv2 = Conversation(id=2, user_id=1, title="Frontend Tech Stack Selection", summary="Deciding on Vite, React 18, and Tailwind CSS light theme", status="ACTIVE")
        conv3 = Conversation(id=3, user_id=1, title="University Exam Preparation", summary="Preparing for the upcoming Database Management Systems exam", status="COMPLETED")
        conv4 = Conversation(id=4, user_id=1, title="Python vs Go Preferences", summary="Discussion regarding preferred backend development languages", status="ACTIVE")
        db.add_all([conv1, conv2, conv3, conv4])
        await db.flush()

        # 6. Messages
        msgs = [
            Message(id=1, conversation_id=1, sender_type="USER", content="I am building NeuroVault, an AI memory platform using MySQL instead of PostgreSQL for our project.", token_count=24),
            Message(id=2, conversation_id=1, sender_type="ASSISTANT", content="Great architectural decision. MySQL 8.0+ provides robust FULLTEXT search and native JSON capabilities for vector embeddings.", token_count=28),
            Message(id=3, conversation_id=1, sender_type="USER", content="We also need hybrid retrieval combining cosine similarity on embeddings with MySQL FULLTEXT search.", token_count=22),
            Message(id=4, conversation_id=2, sender_type="USER", content="For the UI, let us build a light-mode clean interface using React, Vite, and Tailwind CSS.", token_count=21),
            Message(id=5, conversation_id=3, sender_type="USER", content="I am a Computer Science Senior and my DBMS finals are scheduled for next week.", token_count=18),
            Message(id=6, conversation_id=4, sender_type="USER", content="I strictly prefer Python with FastAPI for building AI backends because of the rich async ecosystem.", token_count=23),
            Message(id=7, conversation_id=4, sender_type="USER", content="Actually, for high-throughput real-time streaming, I prefer Go microservices.", token_count=17),
        ]
        db.add_all(msgs)
        await db.flush()

        # 7. Memories
        mem1 = Memory(
            id=1, user_id=1, category_id=1, source_message_id=1, source_conversation_id=1,
            memory_type="PROJECT", content="Building NeuroVault, a persistent AI memory management system utilizing MySQL 8.0+ and FastAPI.",
            summary="Developing NeuroVault AI Memory Platform on MySQL",
            embedding=[0.12, 0.45, -0.32, 0.81, 0.05, -0.19, 0.62, 0.33, -0.41, 0.22, 0.15, -0.08, 0.51, 0.38, -0.27, 0.66],
            importance_score=95, confidence_score=98, freshness_score=100, quality_score=96,
            status="ACTIVE", is_sensitive=False, version_number=1
        )
        mem2 = Memory(
            id=2, user_id=1, category_id=2, source_message_id=3, source_conversation_id=1,
            memory_type="SKILL", content="Implements hybrid search combining vector cosine similarity with MySQL FULLTEXT Boolean search.",
            summary="MySQL Hybrid Retrieval Implementation",
            embedding=[0.18, 0.52, -0.29, 0.77, 0.08, -0.15, 0.58, 0.40, -0.36, 0.28, 0.12, -0.04, 0.49, 0.35, -0.22, 0.71],
            importance_score=90, confidence_score=95, freshness_score=100, quality_score=94,
            status="ACTIVE", is_sensitive=False, version_number=1
        )
        mem3 = Memory(
            id=3, user_id=1, category_id=3, source_message_id=4, source_conversation_id=2,
            memory_type="PREFERENCE", content="Prefers clean light-mode user interfaces designed with React, Vite, and Tailwind CSS.",
            summary="Preference for Light-Mode React UIs",
            embedding=[0.35, 0.12, 0.08, 0.44, -0.21, 0.33, 0.18, 0.65, -0.11, 0.55, 0.29, 0.14, 0.22, 0.41, -0.05, 0.39],
            importance_score=85, confidence_score=92, freshness_score=100, quality_score=90,
            status="ACTIVE", is_sensitive=False, version_number=1
        )
        mem4 = Memory(
            id=4, user_id=1, category_id=4, source_message_id=5, source_conversation_id=3,
            memory_type="EDUCATION", content="Computer Science Senior student preparing for final Database Management Systems examinations.",
            summary="CS Senior with upcoming DBMS exams",
            embedding=[0.05, 0.28, -0.12, 0.39, 0.41, -0.33, 0.25, 0.18, -0.22, 0.14, 0.68, -0.15, 0.31, 0.19, -0.11, 0.45],
            importance_score=80, confidence_score=99, freshness_score=100, quality_score=95,
            status="ACTIVE", is_sensitive=False, version_number=1
        )
        mem5 = Memory(
            id=5, user_id=1, category_id=3, source_message_id=6, source_conversation_id=4,
            memory_type="PREFERENCE", content="Prefers Python with FastAPI for building AI backend architectures and agent workflows.",
            summary="Prefers Python/FastAPI for AI backends",
            embedding=[0.22, 0.48, -0.25, 0.72, 0.11, -0.18, 0.55, 0.38, -0.39, 0.31, 0.19, -0.07, 0.46, 0.42, -0.21, 0.63],
            importance_score=88, confidence_score=94, freshness_score=100, quality_score=92,
            status="ACTIVE", is_sensitive=False, version_number=1
        )
        mem6 = Memory(
            id=6, user_id=1, category_id=3, source_message_id=7, source_conversation_id=4,
            memory_type="PREFERENCE", content="Prefers Go microservices for high-throughput real-time streaming services.",
            summary="Prefers Go for real-time streaming services",
            embedding=[-0.15, 0.33, -0.18, 0.55, 0.31, -0.09, 0.42, 0.29, -0.25, 0.19, 0.12, -0.11, 0.38, 0.25, -0.15, 0.50],
            importance_score=75, confidence_score=85, freshness_score=100, quality_score=82,
            status="CONFLICTED", is_sensitive=False, version_number=1
        )
        db.add_all([mem1, mem2, mem3, mem4, mem5, mem6])
        await db.flush()

        # 8. Memory Tags
        for mid, tid in [(1, 1), (1, 3), (1, 6), (1, 7), (2, 1), (2, 2), (2, 6), (3, 4), (3, 5), (4, 1), (4, 9), (5, 2), (5, 3), (5, 6), (6, 10)]:
            await db.execute(memory_tags.insert().values(memory_id=mid, tag_id=tid))

        # 9. Memory Relations
        rel1 = MemoryRelation(id=1, source_memory_id=2, target_memory_id=1, relation_type="PART_OF", confidence=95)
        rel2 = MemoryRelation(id=2, source_memory_id=3, target_memory_id=1, relation_type="SUPPORTS", confidence=90)
        rel3 = MemoryRelation(id=3, source_memory_id=5, target_memory_id=1, relation_type="SUPPORTS", confidence=92)
        rel4 = MemoryRelation(id=4, source_memory_id=6, target_memory_id=5, relation_type="CONTRADICTS", confidence=78)
        db.add_all([rel1, rel2, rel3, rel4])

        # 10. Memory Versions
        ver1 = MemoryVersion(memory_id=1, version_number=1, previous_content=None, new_content=mem1.content, change_reason="Initial memory creation", changed_by="AI_SERVICE")
        ver2 = MemoryVersion(memory_id=2, version_number=1, previous_content=None, new_content=mem2.content, change_reason="Initial memory creation", changed_by="AI_SERVICE")
        ver5 = MemoryVersion(memory_id=5, version_number=1, previous_content=None, new_content=mem5.content, change_reason="Initial preference recorded", changed_by="AI_SERVICE")
        db.add_all([ver1, ver2, ver5])

        # 11. Feedbacks
        fb1 = Feedback(user_id=1, memory_id=1, rating=5, feedback_type="USEFUL", comment="Accurately recognized our primary hackathon project!")
        fb2 = Feedback(user_id=1, memory_id=2, rating=5, feedback_type="USEFUL", comment="Exact retrieval strategy we planned to present.")
        fb3 = Feedback(user_id=1, memory_id=6, rating=2, feedback_type="OUTDATED", comment="Needs resolution against my core Python preference.")
        db.add_all([fb1, fb2, fb3])

        # 12. Access Logs
        al1 = MemoryAccessLog(memory_id=1, user_id=1, access_type="RETRIEVAL", query="What database are we using for NeuroVault?", retrieval_score=0.96)
        al2 = MemoryAccessLog(memory_id=2, user_id=1, access_type="RETRIEVAL", query="How does our memory search work?", retrieval_score=0.91)
        al3 = MemoryAccessLog(memory_id=5, user_id=1, access_type="RETRIEVAL", query="What is my preferred language for AI services?", retrieval_score=0.89)
        db.add_all([al1, al2, al3])

        # 13. Extraction Events
        ee1 = MemoryExtractionEvent(message_id=1, model_name="qwen2.5:3b", prompt_version="v1.0", extracted_count=1, processing_time_ms=412, status="SUCCESS")
        ee2 = MemoryExtractionEvent(message_id=4, model_name="qwen2.5:3b", prompt_version="v1.0", extracted_count=1, processing_time_ms=385, status="SUCCESS")
        ee3 = MemoryExtractionEvent(message_id=6, model_name="qwen2.5:3b", prompt_version="v1.0", extracted_count=1, processing_time_ms=420, status="SUCCESS")
        db.add_all([ee1, ee2, ee3])

        # 14. Audit Logs
        au1 = AuditLog(user_id=1, actor_type="USER", action="LOGIN", entity_type="users", entity_id=1, metadata_json={"client": "web", "ip": "127.0.0.1"})
        au2 = AuditLog(user_id=1, actor_type="AI_SERVICE", action="CREATE_MEMORY", entity_type="memories", entity_id=1, metadata_json={"confidence": 98, "importance": 95})
        au3 = AuditLog(user_id=1, actor_type="AI_SERVICE", action="CREATE_MEMORY", entity_type="memories", entity_id=2, metadata_json={"confidence": 95, "importance": 90})
        au4 = AuditLog(user_id=1, actor_type="USER", action="RETRIEVE_MEMORY", entity_type="memories", entity_id=1, metadata_json={"score": 0.96, "query": "What database are we using?"})
        db.add_all([au1, au2, au3, au4])

        await db.commit()
        print("NeuroVault realistic dataset loaded successfully!")

if __name__ == "__main__":
    asyncio.run(seed_data())
