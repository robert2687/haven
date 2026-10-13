"""POST /api/edge-tts: TTS via the edge-tts Python API (MP3 data URI)."""

from __future__ import annotations

import base64
import re
import tempfile
from pathlib import Path
from typing import Any

from fastapi import APIRouter
from fastapi.exceptions import HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel

router = APIRouter()

EDGE_VOICE_MAP: dict[str, str] = {
    "zephyr": "en-US-GuyNeural",
    "kore": "en-US-AriaNeural",
    "puck": "en-US-ChristopherNeural",
    "fenrir": "en-US-EricNeural",
    "charon": "en-US-RogerNeural",
}

MODULATION_PRESETS: dict[str, dict[str, str]] = {
    "warm": {"rate": "-5%", "pitch": "-2Hz", "volume": "+0%"},
    "playful": {"rate": "+10%", "pitch": "+4Hz", "volume": "+0%"},
    "calm": {"rate": "-10%", "pitch": "-4Hz", "volume": "+0%"},
    "late-night": {"rate": "-15%", "pitch": "-6Hz", "volume": "-10%"},
    "encouraging": {"rate": "+5%", "pitch": "+2Hz", "volume": "+0%"},
}

_EDGE_VOICE_RE = re.compile(r"^[a-z]{2}-[A-Z]{2}-[A-Za-z]+Neural$")
_LOCALE_RE = re.compile(r"^locale:([a-z]{2}-[A-Z]{2})$")
_RATE_RE = re.compile(r"^[+-]\d+%$")
_VOLUME_RE = re.compile(r"^[+-]\d+%$")
_PITCH_RE = re.compile(r"^[+-]\d+Hz$")
_FALLBACK_VOICE = "en-US-AriaNeural"
MAX_CHARS = 5000


class EdgeTTSRequest(BaseModel):
    model_config = {"extra": "allow"}

    text: str = ""
    voice: str | None = None
    rate: str | None = None
    volume: str | None = None
    pitch: str | None = None
    emotionalModulation: str | None = None


def resolve_edge_voice(voice: Any) -> str:
    if not isinstance(voice, str) or not voice.strip():
        return _FALLBACK_VOICE
    v = voice.strip()
    haven = EDGE_VOICE_MAP.get(v.lower())
    if haven:
        return haven
    if _EDGE_VOICE_RE.match(v):
        return v
    locale = _LOCALE_RE.match(v)
    if locale:
        return f"{locale.group(1)}-AriaNeural"
    return _FALLBACK_VOICE


def _adjust(value: Any, pattern: re.Pattern[str], fallback: str) -> str:
    return value if isinstance(value, str) and pattern.match(value) else fallback


async def synthesize_mp3(text: str, voice: str, rate: str, volume: str, pitch: str) -> bytes:
    """Synthesize MP3 bytes via the edge-tts Python API (lazy import)."""
    try:
        import edge_tts
    except ImportError as exc:
        raise RuntimeError("edge-tts package not installed") from exc
    communicate = edge_tts.Communicate(text, voice=voice, rate=rate, volume=volume, pitch=pitch)
    with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as tmp:
        tmp_path = tmp.name
    try:
        await communicate.save(tmp_path)
        return Path(tmp_path).read_bytes()
    finally:
        Path(tmp_path).unlink(missing_ok=True)


@router.post("/edge-tts")
async def edge_tts_route(body: EdgeTTSRequest) -> JSONResponse:
    text = (body.text or "").strip()
    if not text:
        raise HTTPException(status_code=400, detail="Text is required for edge TTS")
    preset = MODULATION_PRESETS.get(body.emotionalModulation or "")
    voice = resolve_edge_voice(body.voice)
    rate = _adjust(body.rate if body.rate is not None else (preset or {}).get("rate"), _RATE_RE, "+0%")
    volume = _adjust(body.volume if body.volume is not None else (preset or {}).get("volume"), _VOLUME_RE, "+0%")
    pitch = _adjust(body.pitch if body.pitch is not None else (preset or {}).get("pitch"), _PITCH_RE, "+0Hz")
    try:
        audio = await synthesize_mp3(text[:MAX_CHARS], voice, rate, volume, pitch)
    except RuntimeError as exc:
        raise HTTPException(status_code=500, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc) or "Edge TTS synthesis failed")
    return JSONResponse(
        {
            "audioUrl": f"data:audio/mp3;base64,{base64.b64encode(audio).decode()}",
            "voice": voice,
            "format": "audio/mp3",
        }
    )
