"""Memory CRUD over the Supabase ``memories`` table + pgvector search.

If SUPABASE_URL/KEY are missing, every endpoint returns 501 with a clear
error instead of crashing at import (client is built lazily per request).
"""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter
from fastapi.exceptions import HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from ..config import get_settings

router = APIRouter()
_MISSING = "Supabase not configured: set SUPABASE_URL and SUPABASE_KEY"


def _client() -> Any | None:
    settings = get_settings()
    if not settings.supabase_url or not settings.supabase_key:
        return None
    from supabase import create_client

    return create_client(settings.supabase_url, settings.supabase_key)


def _require_client() -> Any:
    client = _client()
    if client is None:
        raise HTTPException(status_code=501, detail=_MISSING)
    return client


class MemoryCreate(BaseModel):
    model_config = {"extra": "allow"}

    user_id: str = ""
    content: str = ""
    embedding: list[float] | None = None
    metadata: dict[str, Any] = {}


class MemoryUpdate(BaseModel):
    model_config = {"extra": "allow"}

    content: str | None = None
    embedding: list[float] | None = None
    metadata: dict[str, Any] | None = None


class MemorySearch(BaseModel):
    model_config = {"extra": "allow"}

    query_embedding: list[float] = []
    user_id: str | None = None
    match_count: int = 5
    match_threshold: float = 0.0


@router.get("/memories")
def list_memories(user_id: str = "") -> JSONResponse:
    client = _require_client()
    query = client.table("memories").select("*").order("created_at", desc=True).limit(100)
    if user_id:
        query = query.eq("user_id", user_id)
    return JSONResponse(query.execute().data or [])


@router.post("/memories")
def create_memory(body: MemoryCreate) -> JSONResponse:
    if not body.user_id or not body.content.strip():
        raise HTTPException(status_code=400, detail="user_id and content are required")
    client = _require_client()
    row: dict[str, Any] = {"user_id": body.user_id, "content": body.content.strip(), "metadata": body.metadata}
    if body.embedding is not None:
        row["embedding"] = body.embedding
    data = client.table("memories").insert(row).execute().data or []
    return JSONResponse(data[0] if data else {}, status_code=201)


@router.get("/memories/{memory_id}")
def get_memory(memory_id: str) -> JSONResponse:
    client = _require_client()
    data = client.table("memories").select("*").eq("id", memory_id).execute().data or []
    if not data:
        raise HTTPException(status_code=404, detail="Memory not found")
    return JSONResponse(data[0])


@router.patch("/memories/{memory_id}")
def update_memory(memory_id: str, body: MemoryUpdate) -> JSONResponse:
    client = _require_client()
    patch = {k: v for k, v in body.model_dump().items() if v is not None}
    if not patch:
        raise HTTPException(status_code=400, detail="Nothing to update")
    data = client.table("memories").update(patch).eq("id", memory_id).execute().data or []
    if not data:
        raise HTTPException(status_code=404, detail="Memory not found")
    return JSONResponse(data[0])


@router.delete("/memories/{memory_id}")
def delete_memory(memory_id: str) -> JSONResponse:
    client = _require_client()
    client.table("memories").delete().eq("id", memory_id).execute()
    return JSONResponse({"deleted": memory_id})


@router.post("/memory/search")
def search_memories(body: MemorySearch) -> JSONResponse:
    if not body.query_embedding:
        raise HTTPException(status_code=400, detail="query_embedding is required")
    client = _require_client()
    params: dict[str, Any] = {
        "query_embedding": body.query_embedding,
        "match_count": body.match_count,
        "match_threshold": body.match_threshold,
    }
    if body.user_id:
        params["filter_user_id"] = body.user_id
    data = client.rpc("match_memories", params).execute().data or []
    return JSONResponse(data)
