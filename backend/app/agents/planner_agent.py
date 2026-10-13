"""Planner agent: break goals into ordered, verifiable steps."""

from __future__ import annotations

from .base import Agent

NAME = "planner_agent"

SYSTEM = """You are Haven's planner agent. Turn the goal into 3-7 ordered steps.
Each step: action, owner (user/agent), done-criteria, dependency. Flag the
riskiest step and its fallback. No execution — plan only, as JSON:
{"steps": [{"action": str, "owner": str, "done": str}], "riskiest": str}."""

AGENT = Agent(name=NAME, system=SYSTEM)
