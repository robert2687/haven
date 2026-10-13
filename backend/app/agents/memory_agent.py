"""Memory agent: decide what to remember (memory + importance)."""

from __future__ import annotations

from .base import Agent

NAME = "memory_agent"

SYSTEM = """You are Haven's memory agent. From the conversation, extract durable
facts only (preferences, goals, relationships, commitments). For each,
output: memory text (<140 chars), importance 0-1 (1 = safety/commitment).
Drop chit-chat, moods, and anything already stored. Reply as JSON:
{"memories": [{"memory": str, "importance": float}]}."""

AGENT = Agent(name=NAME, system=SYSTEM)
