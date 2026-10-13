"""POST /api/stt + /api/speech: multipart audio upload via Faster-Whisper Base."""

from __future__ import annotations

import tempfile
from pathlib import Path

from fastapi import APIRouter, Request, UploadFile
from fastapi.exceptions import HTTPException
from fastapi.responses import JSONResponse
from starlette.datastructures import UploadFile as StarletteUploadFile

from ..services.whisper import transcribe_file as _service_transcribe

router = APIRouter()

MAX_AUDIO_BYTES = 25 * 1024 * 1024
SAFE_SUFFIXES = {".wav", ".mp3", ".m4a", ".ogg", ".oga", ".flac", ".webm", ".mp4"}


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
        result = _service_transcribe(tmp_path)
    except RuntimeError as exc:
        raise HTTPException(status_code=500, detail=str(exc))
    return result.text, result.language, result.duration


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
async def speech(request: Request) -> JSONResponse:
    """Minimal alias: { text }. Accepts the upload as `file` or `audio`."""
    form = await request.form()
    upload = form.get("file") or form.get("audio")
    # NOTE: request.form() yields starlette's UploadFile, which is a different
    # class from fastapi.UploadFile in recent versions — check both.
    if not isinstance(upload, (UploadFile, StarletteUploadFile)):
        raise HTTPException(status_code=400, detail="Audio file is required (field 'file' or 'audio')")
    data, suffix = await _read_upload(upload)
    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
        tmp.write(data)
        tmp_path = tmp.name
    try:
        text, _, _ = _transcribe_file(tmp_path)
        return JSONResponse({"text": text})
    finally:
        Path(tmp_path).unlink(missing_ok=True)
