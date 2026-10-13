"""POST /api/stt: multipart audio upload transcribed with faster-whisper Base."""

from __future__ import annotations

import tempfile
from pathlib import Path
from typing import Any

from fastapi import APIRouter, UploadFile
from fastapi.exceptions import HTTPException
from fastapi.responses import JSONResponse

router = APIRouter()

_model: Any = None


def _get_model() -> Any:
    """Lazy-load the Base model once (keeps app import light)."""
    global _model
    if _model is None:
        try:
            from faster_whisper import WhisperModel
        except ImportError as exc:
            raise RuntimeError("faster-whisper package not installed") from exc
        _model = WhisperModel("base")
    return _model


@router.post("/stt")
async def transcribe(audio: UploadFile) -> JSONResponse:
    data = await audio.read()
    if not data:
        raise HTTPException(status_code=400, detail="Audio file is required")
    suffix = Path(audio.filename or "audio").suffix or ".wav"
    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
        tmp.write(data)
        tmp_path = tmp.name
    try:
        try:
            model = _get_model()
        except RuntimeError as exc:
            raise HTTPException(status_code=500, detail=str(exc))
        segments, info = model.transcribe(tmp_path, beam_size=5)
        text = "".join(seg.text for seg in segments).strip()
        return JSONResponse(
            {"text": text, "language": info.language, "duration": info.duration}
        )
    finally:
        Path(tmp_path).unlink(missing_ok=True)
