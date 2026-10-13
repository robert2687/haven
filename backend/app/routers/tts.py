"""POST /api/edge-tts: TTS via the edge-tts service (MP3 data URI)."""

from __future__ import annotations

import base64

from fastapi import APIRouter
from fastapi.exceptions import HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from ..services.edge_tts import (
    MAX_CHARS,
    MODULATION_PRESETS,
    adjust,
    pitch_re,
    rate_re,
    resolve_edge_voice,
    synthesize_mp3,
    volume_re,
)

router = APIRouter()


class EdgeTTSRequest(BaseModel):
    model_config = {"extra": "allow"}

    text: str = ""
    voice: str | None = None
    rate: str | None = None
    volume: str | None = None
    pitch: str | None = None
    emotionalModulation: str | None = None


@router.post("/edge-tts")
async def edge_tts_route(body: EdgeTTSRequest) -> JSONResponse:
    text = (body.text or "").strip()
    if not text:
        raise HTTPException(status_code=400, detail="Text is required for edge TTS")
    preset = MODULATION_PRESETS.get(body.emotionalModulation or "")
    voice = resolve_edge_voice(body.voice)
    rate = adjust(body.rate if body.rate is not None else (preset or {}).get("rate"), rate_re(), "+0%")
    volume = adjust(body.volume if body.volume is not None else (preset or {}).get("volume"), volume_re(), "+0%")
    pitch = adjust(body.pitch if body.pitch is not None else (preset or {}).get("pitch"), pitch_re(), "+0Hz")
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
