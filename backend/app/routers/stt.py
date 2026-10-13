"""POST /api/stt + /api/speech: multipart audio upload via Faster-Whisper Base."""

from __future__ import annotations

import tempfile
from pathlib import Path
from typing import Any

from fastapi import APIRouter, UploadFile
from fastapi.exceptions import HTTPException
from fastapi.responses import JSONResponse

router = APIRouter()

_model: Any = None

MAX_AUDIO_BYTES = 25 * 1024 * 1024
SAFE_SUFFIXES = {".wav", ".mp3", ".m4a", ".ogg", ".oga", ".flac", ".webm", ".mp4"}


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


def _safe_suffix(filename: str | None) -> str:
    suffix = Path(filename or "audio").suffix.lower() or ".wav"
    return suffix if suffix in SAFE_SUFFIXES else ".wav"


async def _read_upload(audio: UploadFile) -> tuple[bytes, str]:
    data = await audio.read()
    if not data:
        raise HTTPException(status_code=400, detail="Audio file is required")
    if len(data) > MAX_AUDIO_BYTES:
        raise HTTPException(status_code=413, detail="Audio file too large (max 25 MB)")
    return data, _safe_suffix(audio.filename)


def _transcribe_file(tmp_path: str) -> tuple[str, str, float]:
    try:
        model = _get_model()
    except RuntimeError as exc:
        raise HTTPException(status_code=500, detail=str(exc))
    segments, info = model.transcribe(tmp_path, beam_size=5)
    text = "".join(seg.text for seg in segments).strip()
    return text, info.language, info.duration


@router.post("/stt")
async def transcribe(audio: UploadFile) -> JSONResponse:
    """Full result: { text, language, duration }."""
    data, suffix = await _read_upload(audio)
    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
        tmp.write(data)
        tmp_path = tmp.name
    try:
        text, language, duration = _transcribe_file(tmp_path)
        return JSONResponse({"text": text, "language": language, "duration": duration})
    finally:
        Path(tmp_path).unlink(missing_ok=True)


@router.post("/speech")
async def speech(file: UploadFile) -> JSONResponse:
    """Minimal alias: { text }. Same hardened path as /stt."""
    data, suffix = await _read_upload(file)
    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
        tmp.write(data)
        tmp_path = tmp.name
    try:
        text, _, _ = _transcribe_file(tmp_path)
        return JSONResponse({"text": text})
    finally:
        Path(tmp_path).unlink(missing_ok=True)
