import math
import hashlib
from abc import ABC, abstractmethod
from typing import List, Optional
import httpx
from app.config import settings

class EmbeddingProvider(ABC):
    @abstractmethod
    async def embed_text(self, text: str) -> List[float]:
        pass


class OllamaEmbeddingProvider(EmbeddingProvider):
    def __init__(self, base_url: str = settings.OLLAMA_BASE_URL, model: str = settings.EMBEDDING_MODEL):
        self.base_url = base_url.rstrip("/")
        self.model = model

    async def embed_text(self, text: str) -> List[float]:
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                resp = await client.post(
                    f"{self.base_url}/api/embeddings",
                    json={"model": self.model, "prompt": text}
                )
                if resp.status_code == 200:
                    embedding = resp.json().get("embedding", [])
                    if embedding:
                        return embedding
        except Exception:
            pass

        # Deterministic normalized hash-based pseudo vector embedding (16 dimensions)
        return self._generate_pseudo_vector(text)

    def _generate_pseudo_vector(self, text: str, dim: int = 16) -> List[float]:
        # Hash text into deterministic pseudo vector
        words = text.lower().split()
        vec = [0.0] * dim
        for i, word in enumerate(words):
            h = int(hashlib.md5(word.encode()).hexdigest(), 16)
            idx = h % dim
            val = ((h >> 4) % 1000) / 500.0 - 1.0
            vec[idx] += val

        norm = math.sqrt(sum(x * x for x in vec))
        if norm > 0:
            return [round(x / norm, 4) for x in vec]
        return [0.0] * dim


def cosine_similarity(v1: List[float], v2: List[float]) -> float:
    if not v1 or not v2:
        return 0.0
    # Trim to shortest length if dimension differs
    length = min(len(v1), len(v2))
    dot = sum(v1[i] * v2[i] for i in range(length))
    norm1 = math.sqrt(sum(v1[i] * v1[i] for i in range(length)))
    norm2 = math.sqrt(sum(v2[i] * v2[i] for i in range(length)))
    if norm1 == 0 or norm2 == 0:
        return 0.0
    return max(0.0, min(1.0, dot / (norm1 * norm2)))


def get_embedding_provider() -> EmbeddingProvider:
    return OllamaEmbeddingProvider()
