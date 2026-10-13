"""Shared agent shape: name + system prompt (+ optional context builder)."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Callable


@dataclass(frozen=True)
class Agent:
    name: str
    system: str
    build_system: Callable[[dict[str, Any]], str] | None = field(default=None)

    def prompt(self, context: dict[str, Any] | None = None) -> str:
        if self.build_system and context:
            return self.build_system(context)
        return self.system
