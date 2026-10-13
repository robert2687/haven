"""Supabase Storage: upload (multipart) + signed URL. 501 without config."""

from __future__ import annotations

import uuid

from fastapi import APIRouter, UploadFile
from fastapi.exceptions import HTTPException
from fastapi.responses import JSONResponse

from ..config import get_settings

router = APIRouter()
_MISSING = "Supabase not configured: set SUPABASE_URL and SUPABASE_KEY"


def _require_client():  # type: ignore[no-untyped-def]
    settings = get_settings()
    if not settings.supabase_url or not settings.supabase_key:
        raise HTTPException(status_code=501, detail=_MISSING)
    from supabase import create_client

    return create_client(settings.supabase_url, settings.supabase_key), settings


@router.post("/storage/upload")
async def upload(file: UploadFile, path: str | None = None) -> JSONResponse:
    client, settings = _require_client()
    try:
        data = await file.read()
        if not data:
            raise HTTPException(status_code=400, detail="File is required")
        raw_key = (path or f"{uuid.uuid4().hex}-{file.filename or 'upload'}").replace("\\", "/")
        # Sanitize: no absolute paths, no parent escapes, no empty segments.
        parts = [p for p in raw_key.split("/") if p and p not in {".", ".."}]
        key = "/".join(parts)
        if not key:
            raise HTTPException(status_code=400, detail="Invalid path")
        client.storage.from_(settings.storage_bucket).upload(
            key, data, {"content-type": file.content_type or "application/octet-stream"}
        )
        public = client.storage.from_(settings.storage_bucket).get_public_url(key)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)[:500] or "Storage upload failed")
    return JSONResponse({"path": key, "url": public})


@router.get("/storage/url")
def signed_url(path: str = "", expires_in: int = 3600) -> JSONResponse:
    if not path:
        raise HTTPException(status_code=400, detail="path query param is required")
    client, settings = _require_client()
    try:
        data = client.storage.from_(settings.storage_bucket).create_signed_url(path, expires_in)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)[:500] or "Signed URL failed")
    url = data.get("signedURL") if isinstance(data, dict) else None
    return JSONResponse({"path": path, "url": url})
