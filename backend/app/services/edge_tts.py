"""Edge TTS synthesis service (MP3 bytes via the edge-tts Python API).

Routers import resolve_edge_voice() / synthesize_mp3() instead of
embedding voice logic. edge-tts is already in requirements.txt; the
import stays lazy so the app boots without the package until TTS runs.
"""

from __future__ import annotations

import re
import tempfile
from pathlib import Path
from typing import Any

EDGE_VOICE_MAP: dict[str, str] = {
    "zephyr": "en-US-GuyNeural",
    "kore": "en-US-AriaNeural",
    "puck": "en-US-ChristopherNeural",
    "fenrir": "en-US-EricNeural",
    "charon": "en-US-RogerNeural",
    "lukas": "sk-SK-LukasNeural",
    "viktoria": "sk-SK-ViktoriaNeural",
}

# Per-locale default when callers pass "locale:xx-YY".
LOCALE_FALLBACK: dict[str, str] = {
    "sk-SK": "sk-SK-ViktoriaNeural",
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
FALLBACK_VOICE = "en-US-AriaNeural"
MAX_CHARS = 5000


def resolve_edge_voice(voice: Any) -> str:
    if not isinstance(voice, str) or not voice.strip():
        return FALLBACK_VOICE
    v = voice.strip()
    haven = EDGE_VOICE_MAP.get(v.lower())
    if haven:
        return haven
    if _EDGE_VOICE_RE.match(v):
        return v
    locale = _LOCALE_RE.match(v)
    if locale:
        return LOCALE_FALLBACK.get(locale.group(1), f"{locale.group(1)}-AriaNeural")
    return FALLBACK_VOICE


def adjust(value: Any, pattern: re.Pattern[str], fallback: str) -> str:
    return value if isinstance(value, str) and pattern.match(value) else fallback


def rate_re() -> re.Pattern[str]:
    return _RATE_RE


def volume_re() -> re.Pattern[str]:
    return _VOLUME_RE


def pitch_re() -> re.Pattern[str]:
    return _PITCH_RE


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
