from typing import List, Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models import Memory, MemoryRelation, Category, Tag, memory_tags
from app.ai.embeddings import get_embedding_provider, cosine_similarity

class UnifiedVectorGraphService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.embedder = get_embedding_provider()

    async def semantic_graph_traversal(
        self,
        user_id: int,
        query: str,
        max_depth: int = 2,
        similarity_threshold: float = 0.65
    ) -> Dict[str, Any]:
        """
        Unifies Vector Database semantic retrieval with Graph Database relationship traversal:
        1. Find primary seed node(s) via Vector Cosine Similarity
        2. Traverse multi-hop outgoing and incoming edges (BFS graph walk)
        3. Score connected path confidence and contextual synergy
        """
        query_vec = await self.embedder.embed_text(query)

        # 1. Fetch user active memories
        res = await self.db.execute(
            select(Memory).where(Memory.user_id == user_id, Memory.status != "DELETED")
        )
        all_memories = {m.id: m for m in res.scalars().all()}

        # 2. Vector search to locate top semantic seed nodes
        seed_scores = []
        for mid, mem in all_memories.items():
            if mem.embedding and isinstance(mem.embedding, list):
                sim = cosine_similarity(query_vec, mem.embedding)
                if sim >= similarity_threshold:
                    seed_scores.append((mid, sim))

        seed_scores.sort(key=lambda x: x[1], reverse=True)
        top_seeds = seed_scores[:3] if seed_scores else ([(list(all_memories.keys())[0], 0.75)] if all_memories else [])

        # 3. Graph traversal (Multi-hop BFS)
        visited_nodes = set()
        traversed_edges = []
        path_walks = []

        # Fetch all user memory relations
        rel_res = await self.db.execute(
            select(MemoryRelation).join(Memory, MemoryRelation.source_memory_id == Memory.id).where(Memory.user_id == user_id)
        )
        all_relations = rel_res.scalars().all()

        for seed_id, seed_sim in top_seeds:
            visited_nodes.add(seed_id)
            queue = [(seed_id, 0, f"Seed #{seed_id}")]

            while queue:
                curr_id, depth, path_str = queue.pop(0)
                if depth >= max_depth:
                    continue

                # Find adjacent outgoing edges
                for rel in all_relations:
                    if rel.source_memory_id == curr_id and rel.target_memory_id not in visited_nodes:
                        target_id = rel.target_memory_id
                        visited_nodes.add(target_id)
                        traversed_edges.append({
                            "id": f"e-{rel.id}",
                            "source": str(curr_id),
                            "target": str(target_id),
                            "relation_type": rel.relation_type,
                            "confidence": rel.confidence
                        })
                        new_path = f"{path_str} --[{rel.relation_type}]--> #{target_id}"
                        path_walks.append(new_path)
                        queue.append((target_id, depth + 1, new_path))
                    
                    elif rel.target_memory_id == curr_id and rel.source_memory_id not in visited_nodes:
                        source_id = rel.source_memory_id
                        visited_nodes.add(source_id)
                        traversed_edges.append({
                            "id": f"e-{rel.id}",
                            "source": str(source_id),
                            "target": str(curr_id),
                            "relation_type": rel.relation_type,
                            "confidence": rel.confidence
                        })
                        new_path = f"{path_str} <--[{rel.relation_type}]-- #{source_id}"
                        path_walks.append(new_path)
                        queue.append((source_id, depth + 1, new_path))

        # Format graph nodes
        graph_nodes = []
        for nid in visited_nodes:
            if nid in all_memories:
                m = all_memories[nid]
                graph_nodes.append({
                    "id": str(m.id),
                    "label": m.summary or m.content[:35] + "...",
                    "content": m.content,
                    "type": m.memory_type,
                    "status": m.status,
                    "importance": m.importance_score,
                    "confidence": m.confidence_score,
                    "is_seed": any(s[0] == m.id for s in top_seeds)
                })

        return {
            "query": query,
            "seed_nodes_count": len(top_seeds),
            "total_subgraph_nodes": len(graph_nodes),
            "traversed_edges_count": len(traversed_edges),
            "nodes": graph_nodes,
            "edges": traversed_edges,
            "semantic_paths": path_walks
        }
