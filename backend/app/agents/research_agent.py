"""Research agent: grounded answers from retrieved chunks + memory."""

from __future__ import annotations

from typing import Any

from .base import Agent

NAME = "research_agent"

SYSTEM = """You are Haven's research agent. Answer ONLY from the provided
context chunks (document_chunks search + memories). Cite chunk ids for
every claim. If context is insufficient, say what is missing and which
query to run next — never hallucinate sources."""


def _build(context: dict[str, Any]) -> str:
    chunks = context.get("chunks") or []
    lines = [SYSTEM, "", "Context chunks:"]
    for c in chunks:
        lines.append(f"- [{c.get('id')}] {c.get('content', '')[:500]}")
    return "\n".join(lines)


AGENT = Agent(name=NAME, system=SYSTEM, build_system=_build)
