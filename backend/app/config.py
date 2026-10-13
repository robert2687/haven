"""Environment-driven settings (pydantic-settings style, stdlib + dotenv only).

No secrets live in code. Everything comes from the environment (or a local
``.env`` file loaded via python-dotenv). Import-time safe: missing keys
simply yield empty strings; routers return 501 instead of crashing.
"""

from __future__ import annotations

import os
from dataclasses import dataclass
from functools import lru_cache

try:  # optional at import time; harmless if dotenv is absent
    from dotenv import load_dotenv

    load_dotenv()
except Exception:
    pass


def _env(name: str, default: str = "") -> str:
    return os.environ.get(name, default)


@dataclass(frozen=True)
class Settings:
    openrouter_api_key: str = ""
    ai_provider: str = "openrouter"  # openrouter | gemini
    chat_model: str = "nvidia/nemotron-3-ultra-550b-a55b:free"
    inkling_model: str = "thinkingmachines/inkling:free"
    subagent_model: str = "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free"
    subagent_provider_only: str = "nvidia"
    openrouter_provider_only: str = ""
    supabase_url: str = ""
    supabase_key: str = ""
    storage_bucket: str = "haven-assets"
    site_url: str = "http://localhost:8080"


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings(
        openrouter_api_key=_env("OPENROUTER_API_KEY"),
        ai_provider=_env("AI_PROVIDER", "openrouter").lower(),
        chat_model=_env("CHAT_MODEL", "nvidia/nemotron-3-ultra-550b-a55b:free"),
        inkling_model=_env("INKLING_MODEL", "thinkingmachines/inkling:free"),
        subagent_model=_env(
            "SUBAGENT_MODEL",
            "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free",
        ),
        subagent_provider_only=_env("SUBAGENT_PROVIDER_ONLY", "nvidia"),
        openrouter_provider_only=_env("OPENROUTER_PROVIDER_ONLY", ""),
        supabase_url=_env("SUPABASE_URL"),
        supabase_key=_env("SUPABASE_KEY"),
        storage_bucket=_env("STORAGE_BUCKET", "haven-assets"),
        site_url=_env("SITE_URL", _env("OPENROUTER_SITE_URL", "http://localhost:8080")),
    )
