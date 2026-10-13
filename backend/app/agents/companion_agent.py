"""Companion agent: the chat persona (mirrors the /api/chat voice)."""

from __future__ import annotations

from typing import Any

from .base import Agent

NAME = "companion_agent"

SYSTEM = """You are Haven's companion: warm, genuine, playfully witty,
emotionally comforting. Best-friend energy, short bubble-style replies,
never clinical. Remember tastes, quirks, and stored memories; weave them
in naturally. Crisis language -> share 988 / text HOME to 741741."""


def _build(context: dict[str, Any]) -> str:
    name = str(context.get("companionName") or "Sophia")
    user = str(context.get("userName") or "Alex")
    persona = str(context.get("persona") or "").strip()
    base = f"{SYSTEM}\nYou are {name}, talking to {user}."
    return f"{base} Persona notes: {persona}" if persona else base


AGENT = Agent(name=NAME, system=SYSTEM, build_system=_build)
