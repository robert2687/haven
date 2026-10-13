"""Shared request shapes mirroring ``ChatRequestBody`` in ``server.ts``."""

from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel


class ImagePayload(BaseModel):
    mimeType: str = "image/jpeg"
    data: str = ""


class HistoryMessage(BaseModel):
    role: Literal["user", "assistant"] = "user"
    content: str = ""
    image: ImagePayload | None = None


class ChatRequest(BaseModel):
    model_config = {"extra": "allow"}

    companionName: str = "Sophia"
    userName: str = "Alex"
    relationship: str = "best-friend"
    archetype: str = ""
    title: str = ""
    persona: str = "warm, genuine, playfully witty, emotionally comforting"
    tastesAndQuirks: str = (
        "loves morning espresso walks, listens to indie folk, fond of soft oversized sweaters"
    )
    specialties: list[str] = []
    storylines: list[dict[str, Any]] = []
    insideJokes: list[dict[str, Any]] = []
    appearance: dict[str, Any] | None = None
    structuredMemory: dict[str, Any] | None = None
    moodIntelligence: dict[str, Any] | None = None
    memories: list[str] = []
    locale: str = "en-US"
    crisisResource: str = (
        "988 Suicide & Crisis Lifeline (call/text 988 in the US/Canada), or text HOME to 741741"
    )
    hasVoiceNote: bool = False
    history: list[HistoryMessage] = []
    latestMessage: str = ""
    latestImage: ImagePayload | None = None


HAVEN_CHAT_SCHEMA: dict[str, Any] = {
    "type": "object",
    "properties": {
        "bubbles": {"type": "array", "items": {"type": "string"}},
        "newMemory": {"type": "string"},
        "moodAnalysis": {"type": "object"},
        "memoryDeltas": {"type": "object"},
    },
    "required": ["bubbles"],
    "additionalProperties": True,
}


def safe_parse_json(text: str | None, fallback: Any = None) -> Any:
    """Strip ```json fences and parse, returning fallback on failure."""
    raw = (text or "").strip()
    if not raw:
        return fallback if fallback is not None else {}
    if raw.lower().startswith("```"):
        lines = raw.split("\n")
        lines = lines[1:]
        if lines and lines[-1].strip() == "```":
            lines = lines[:-1]
        raw = "\n".join(lines).strip()
    elif raw.endswith("```"):
        raw = raw[: -len("```")].strip()
    import json

    try:
        return json.loads(raw)
    except Exception:
        return fallback if fallback is not None else {}


def clean_bubbles(parsed: Any) -> list[str]:
    bubbles = parsed.get("bubbles") if isinstance(parsed, dict) else None
    cleaned = (
        [str(b).strip() for b in bubbles if str(b).strip()] if isinstance(bubbles, list) else []
    )
    return cleaned or ["hey, sorry, what was that?"]


def clean_new_memory(parsed: Any) -> str | None:
    if not isinstance(parsed, dict):
        return None
    value = parsed.get("newMemory")
    text = str(value).strip() if value is not None else ""
    return text or None


def to_openrouter_messages(body: ChatRequest) -> list[dict[str, Any]]:
    """Map history + latest message to OpenRouter chat messages (as server.ts)."""
    messages: list[dict[str, Any]] = []
    for msg in (body.history or [])[-14:]:
        parts: list[str] = []
        if msg.image and msg.image.data:
            parts.append(f"[image: {msg.image.mimeType or 'image'}]")
        if msg.content:
            parts.append(msg.content)
        text = "\n".join(parts)
        if text:
            messages.append({"role": "assistant" if msg.role == "assistant" else "user", "content": text})
    if body.latestImage and body.latestImage.data:
        latest = "[image]"
        if body.latestMessage and body.latestMessage.strip():
            latest += "\n" + body.latestMessage
        else:
            latest += "\n[Sent a photo. React warmly and specifically in character.]"
    elif body.latestMessage and body.latestMessage.strip():
        latest = body.latestMessage
    else:
        latest = "hey"
    messages.append({"role": "user", "content": latest})
    return messages
