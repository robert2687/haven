"""Text embeddings via OpenRouter (/api/v1/embeddings).

Model comes from EMBEDDING_MODEL and must emit 768-dim vectors to match
the document_chunks.embedding vector(768) column. Raises RuntimeError
when the key/model is missing so routers can return 501/400.
"""

from __future__ import annotations

import os

import httpx

BASE_URL = "https://openrouter.ai/api/v1"


def _model() -> str:
    return os.environ.get("EMBEDDING_MODEL", "")


def _key() -> str:
    return os.environ.get("OPENROUTER_API_KEY", "")


async def embed_texts(texts: list[str]) -> list[list[float]]:
    """Embed a batch of texts; returns one vector per input."""
    model = _model()
    if not model:
        raise RuntimeError("EMBEDDING_MODEL is not set")
    key = _key()
    if not key:
        raise RuntimeError("OPENROUTER_API_KEY is not set")
    async with httpx.AsyncClient(timeout=60.0) as client:
        res = await client.post(
            f"{BASE_URL}/embeddings",
            headers={"Content-Type": "application/json", "Authorization": f"Bearer {key}"},
            json={"model": model, "input": texts},
        )
    if res.status_code >= 400:
        raise RuntimeError(f"OpenRouter embeddings {res.status_code}: {res.text[:300]}")
    data = res.json().get("data") or []
    return [row.get("embedding") or [] for row in data]


async def embed_query(text: str) -> list[float]:
    """Embed a single search query."""
    vectors = await embed_texts([text])
    return vectors[0] if vectors else []
