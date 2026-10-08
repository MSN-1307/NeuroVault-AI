from datetime import datetime
from typing import List, Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_
from app.models import Memory, MemoryVersion

class TemporalDatabaseService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_point_in_time_snapshot(
        self,
        user_id: int,
        target_timestamp: datetime
    ) -> Dict[str, Any]:
        """
        Temporal Database Point-in-Time (Flashback) Query:
        Reconstructs the exact state of user memories at a historical point in time
        using memory creation timestamps and immutable memory_versions audit snapshots.
        """
        # 1. Fetch memories that existed on or before target_timestamp
        res = await self.db.execute(
            select(Memory).where(
                Memory.user_id == user_id,
                Memory.created_at <= target_timestamp
            )
        )
        memories = res.scalars().all()

        reconstructed_items = []
        for m in memories:
            # Check if there are version snapshots created after target_timestamp
            # If so, flashback to the oldest version valid at target_timestamp
            ver_res = await self.db.execute(
                select(MemoryVersion)
                .where(
                    MemoryVersion.memory_id == m.id,
                    MemoryVersion.created_at > target_timestamp
                )
                .order_by(MemoryVersion.version_number.asc())
            )
            future_versions = ver_res.scalars().all()

            if future_versions:
                # The state at target_timestamp was previous_content of the first future edit
                flashback_content = future_versions[0].previous_content or m.content
                active_version = max(1, future_versions[0].version_number - 1)
                is_flashback = True
            else:
                flashback_content = m.content
                active_version = m.version_number
                is_flashback = False

            reconstructed_items.append({
                "memory_id": m.id,
                "content": flashback_content,
                "current_content": m.content,
                "version_at_time": active_version,
                "current_version": m.version_number,
                "is_flashback": is_flashback,
                "memory_type": m.memory_type,
                "created_at": m.created_at.isoformat()
            })

        return {
            "target_timestamp": target_timestamp.isoformat(),
            "active_memories_at_point": len(reconstructed_items),
            "flashback_modifications_count": sum(1 for item in reconstructed_items if item["is_flashback"]),
            "snapshot_records": reconstructed_items
        }

    async def get_memory_timeline(self, memory_id: int, user_id: int) -> Dict[str, Any]:
        """
        Returns full temporal change timeline with diffs and rollback reasons.
        """
        m = await self.db.get(Memory, memory_id)
        if not m or m.user_id != user_id:
            return {"error": "Memory not found"}

        ver_res = await self.db.execute(
            select(MemoryVersion)
            .where(MemoryVersion.memory_id == m.id)
            .order_by(MemoryVersion.version_number.asc())
        )
        versions = ver_res.scalars().all()

        timeline = []
        # Initial creation event
        timeline.append({
            "version": 1,
            "timestamp": m.created_at.isoformat(),
            "content": versions[0].new_content if versions else m.content,
            "change_reason": "Origin: Extracted from conversation",
            "changed_by": "SYSTEM"
        })

        for v in versions:
            if v.version_number > 1:
                timeline.append({
                    "version": v.version_number,
                    "timestamp": v.created_at.isoformat(),
                    "content": v.new_content,
                    "previous_content": v.previous_content,
                    "change_reason": v.change_reason or "Updated via user or trigger",
                    "changed_by": v.changed_by
                })

        return {
            "memory_id": m.id,
            "current_version": m.version_number,
            "total_versions": len(timeline),
            "timeline": timeline
        }
