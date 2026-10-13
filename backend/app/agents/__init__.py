"""Agent prompt library. Each module exposes NAME + SYSTEM (+ build_system).

Callers pass the agent's SYSTEM as `system` to POST /api/subagent
(`backend/app/routers/subagent.py`), which preserves reasoning_details.
Use get_agent() to resolve by name.
"""

from __future__ import annotations

from . import coding_agent, companion_agent, memory_agent, planner_agent, research_agent, sales_agent
from .base import Agent

REGISTRY: dict[str, Agent] = {
    coding_agent.NAME: coding_agent.AGENT,
    research_agent.NAME: research_agent.AGENT,
    memory_agent.NAME: memory_agent.AGENT,
    planner_agent.NAME: planner_agent.AGENT,
    sales_agent.NAME: sales_agent.AGENT,
    companion_agent.NAME: companion_agent.AGENT,
}


def get_agent(name: str) -> Agent | None:
    return REGISTRY.get((name or "").strip().lower())
