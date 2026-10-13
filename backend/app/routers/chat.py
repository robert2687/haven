"""POST /api/chat + POST /api/chat/stream (OpenRouter, SSE shapes as server.ts)."""

from __future__ import annotations

import json
from typing import Any

from fastapi import APIRouter
from fastapi.exceptions import HTTPException
from fastapi.responses import JSONResponse, StreamingResponse

from ..config import get_settings
from ..openrouter import OpenRouterClient, provider_pin
from ..schemas import (
    HAVEN_CHAT_SCHEMA,
    ChatRequest,
    clean_bubbles,
    clean_new_memory,
    safe_parse_json,
    to_openrouter_messages,
)
from ..system_prompt import build_system_instruction

router = APIRouter()


def _client_or_501() -> OpenRouterClient:
    settings = get_settings()
    if settings.ai_provider != "openrouter":
        raise HTTPException(
            status_code=501,
            detail="gemini provider not implemented, set AI_PROVIDER=openrouter",
        )
    if not settings.openrouter_api_key:
        raise HTTPException(status_code=400, detail="OPENROUTER_API_KEY is not set")
    return OpenRouterClient(api_key=settings.openrouter_api_key, site_url=settings.site_url)


def _fallback(message: str, user: str) -> dict[str, Any]:
    msg = (message or "").lower().strip()
    if "rough" in msg or "exhaust" in msg or "bad day" in msg:
        bubbles = [
            "ugh, that sounds completely draining.",
            "come sit down for a second.",
            "want to vent about it, get some advice, or just need a complete distraction?",
        ]
    elif "good news" in msg or "promot" in msg:
        bubbles = ["wait, REALLY?!", "tell me every single detail right now!!", f"I knew you had that in you, {user}."]
    elif msg.startswith("hey") or msg in {"hi", "hello", "hey"}:
        bubbles = ["hey! good to hear from you.", "how's your day going?"]
    else:
        bubbles = ["wait, tell me more about that.", "what did you end up doing?"]
    return {"bubbles": bubbles, "newMemory": None, "moodAnalysis": None, "memoryDeltas": None}


@router.post("/chat")
async def chat(body: ChatRequest) -> JSONResponse:
    settings = get_settings()
    if settings.ai_provider != "openrouter":
        raise HTTPException(
            status_code=501,
            detail="gemini provider not implemented, set AI_PROVIDER=openrouter",
        )
    system = build_system_instruction(body.model_dump())
    messages = to_openrouter_messages(body)
    try:
        client = _client_or_501()
        text = await client.chat_json(
            model=settings.chat_model,
            system=system,
            messages=messages,
            schema=HAVEN_CHAT_SCHEMA,
            provider=provider_pin(settings.openrouter_provider_only),
        )
    except HTTPException:
        raise
    except Exception:
        return JSONResponse(_fallback(body.latestMessage, body.userName or "Alex"))
    parsed = safe_parse_json((text or "").strip() or "{}", {})
    return JSONResponse(
        {
            "bubbles": clean_bubbles(parsed),
            "newMemory": clean_new_memory(parsed),
            "moodAnalysis": parsed.get("moodAnalysis") if isinstance(parsed, dict) else None,
            "memoryDeltas": parsed.get("memoryDeltas") if isinstance(parsed, dict) else None,
        }
    )


@router.post("/chat/stream")
async def chat_stream(body: ChatRequest) -> StreamingResponse:
    settings = get_settings()
    if settings.ai_provider != "openrouter":
        raise HTTPException(
            status_code=501,
            detail="gemini provider not implemented, set AI_PROVIDER=openrouter",
        )
    if not settings.openrouter_api_key:
        return JSONResponse({"error": "Streaming requires OPENROUTER_API_KEY"}, status_code=400)
    system = build_system_instruction(body.model_dump())
    messages = to_openrouter_messages(body)
    model = settings.chat_model
    pin = provider_pin(settings.openrouter_provider_only)

    async def generate():  # type: ignore[no-untyped-def]
        def send(data: Any) -> str:
            return f"data: {json.dumps(data)}\n\n"

        client = OpenRouterClient(api_key=settings.openrouter_api_key, site_url=settings.site_url)
        yield send({"type": "start", "model": model})
        full_content = ""
        reasoning_tokens = 0
        try:
            async for event in client.chat_stream(
                model=model, system=system, messages=messages,
                schema=HAVEN_CHAT_SCHEMA, provider=pin,
            ):
                if "content" in event:
                    full_content += event["content"]
                    yield send({"type": "content", "content": event["content"]})
                elif "reasoning_tokens" in event:
                    reasoning_tokens = int(event["reasoning_tokens"])
        except Exception as exc:
            yield send({"type": "error", "error": str(exc) or "Stream failed"})
            return
        parsed = safe_parse_json(full_content, {})
        parsed = parsed if isinstance(parsed, dict) else {}
        yield send(
            {
                "type": "done",
                "bubbles": clean_bubbles(parsed),
                "newMemory": clean_new_memory(parsed),
                "moodAnalysis": parsed.get("moodAnalysis"),
                "memoryDeltas": parsed.get("memoryDeltas"),
                "reasoningTokens": reasoning_tokens,
            }
        )

    return StreamingResponse(generate(), media_type="text/event-stream")
