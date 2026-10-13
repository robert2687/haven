"""Vector search over document_chunks (+ memories fallback).

Uses the match_document_chunks RPC (see database/schema.sql); returns
[] instead of raising when Supabase is unconfigured so chat can proceed
without context.
"""

from __future__ import annotations

from typing import Any

from .embeddings import embed_query


def _client() -> Any | None:
    import os

    url = os.environ.get("SUPABASE_URL", "")
    key = os.environ.get("SUPABASE_KEY", "")
    if not url or not key:
        return None
    from supabase import create_client

    return create_client(url, key)


async def search_chunks(
    query: str,
    *,
    user_id: str | None = None,
    match_count: int = 5,
    match_threshold: float = 0.0,
) -> list[dict[str, Any]]:
    """Embed query and return matching chunks ordered by similarity."""
    client = _client()
    if client is None:
        return []
    try:
        query_embedding = await embed_query(query)
    except RuntimeError:
        return []
    if not query_embedding:
        return []
    params: dict[str, Any] = {
        "query_embedding": query_embedding,
        "match_count": match_count,
        "match_threshold": match_threshold,
    }
    if user_id:
        params["filter_user_id"] = user_id
    try:
        return client.rpc("match_document_chunks", params).execute().data or []
    except Exception:
        return []
