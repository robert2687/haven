"""Faster-Whisper Base transcription service.

Lazy-loads WhisperModel("base") once; routers import transcribe_file()
instead of embedding model logic. faster-whisper is already in
requirements.txt; import stays lazy so the app boots without the
package/GPU weights until STT is actually called.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any

MODEL_NAME = "base"
BEAM_SIZE = 5

_model: Any = None


def get_model() -> Any:
    """Load and cache the Base model (raises RuntimeError if missing)."""
    global _model
    if _model is None:
        try:
            from faster_whisper import WhisperModel
        except ImportError as exc:
            raise RuntimeError("faster-whisper package not installed") from exc
        _model = WhisperModel(MODEL_NAME)
    return _model


@dataclass
class Transcript:
    text: str
    language: str
    duration: float


def transcribe_file(path: str, beam_size: int = BEAM_SIZE) -> Transcript:
    """Transcribe an audio file on disk via the Base model."""
    model = get_model()
    segments, info = model.transcribe(path, beam_size=beam_size)
    text = "".join(seg.text for seg in segments).strip()
    return Transcript(text=text, language=info.language, duration=info.duration)
