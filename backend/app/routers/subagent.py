"""POST /api/subagent: reasoning calls with reasoning_details preservation."""

from __future__ import annotations

from typing import Any, Literal

import httpx
from fastapi import APIRouter
from fastapi.exceptions import HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from ..config import get_settings
from ..openrouter import BASE_URL

router = APIRouter()


class SubagentHistoryMessage(BaseModel):
    model_config = {"extra": "allow"}

    role: str = "user"
    content: str = ""
    reasoning_details: Any | None = None


class SubagentRequest(BaseModel):
    model_config = {"extra": "allow"}

    query: str | None = None
    system: str | None = None
    messages: list[SubagentHistoryMessage] | None = None
    model: str | None = None


@router.post("/subagent")
async def subagent(body: SubagentRequest) -> JSONResponse:
    settings = get_settings()
    if not settings.openrouter_api_key:
        raise HTTPException(status_code=400, detail="Subagent requires OPENROUTER_API_KEY")

    messages: list[dict[str, Any]] = []
    if body.system:
        messages.append({"role": "system", "content": body.system})
    if body.messages:
        for m in body.messages:
            msg: dict[str, Any] = {"role": m.role, "content": m.content}
            # Pass reasoning_details back unmodified for reasoning continuation.
            if m.role == "assistant" and m.reasoning_details is not None:
                msg["reasoning_details"] = m.reasoning_details
            messages.append(msg)
    elif body.query and body.query.strip():
        messages.append({"role": "user", "content": body.query.strip()})
    else:
        raise HTTPException(status_code=400, detail="Provide query or messages[]")

    model = body.model or settings.subagent_model
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {settings.openrouter_api_key}",
        "HTTP-Referer": settings.site_url,
        "X-Title": "Haven Subagent",
    }
    payload: dict[str, Any] = {
        "model": model,
        "messages": messages,
        "reasoning": {"enabled": True},
        "provider": {"only": [settings.subagent_provider_only], "allow_fallbacks": False},
    }
    try:
        async with httpx.AsyncClient(timeout=180.0) as client:
            res = await client.post(f"{BASE_URL}/chat/completions", headers=headers, json=payload)
        if res.status_code >= 400:
            raise RuntimeError(f"OpenRouter {res.status_code}: {res.text[:500]}")
        data = res.json()
    except RuntimeError as exc:
        raise HTTPException(status_code=500, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc) or "Subagent call failed")
    msg = (data.get("choices") or [{}])[0].get("message")
    if not msg:
        raise HTTPException(status_code=500, detail="No message in OpenRouter response")
    return JSONResponse(
        {
            "message": {
                "role": "assistant",
                "content": msg.get("content") or "",
                "reasoning_details": msg.get("reasoning_details"),
            },
            "reasoning": msg.get("reasoning"),
            "usage": data.get("usage"),
            "model": data.get("model") or model,
        }
    )
