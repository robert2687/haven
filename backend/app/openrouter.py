"""httpx-based OpenRouter client.

Mirrors ``callOpenRouterChat`` and the ``/api/chat/stream`` upstream logic
from ``server.ts``: ``chat_json()`` for non-streaming ``json_schema``
responses, ``chat_stream()`` as an async generator that parses SSE, yields
content chunks, and surfaces reasoning-token usage from both snake_case and
camelCase usage shapes.
"""

from __future__ import annotations

import json
from collections.abc import AsyncIterator
from typing import Any

import httpx

BASE_URL = "https://openrouter.ai/api/v1"


def provider_pin(pin: str | None) -> dict[str, Any] | None:
    """Pin to a single provider with no fallbacks (upstream errors surface)."""
    pin = (pin or "").strip()
    if not pin:
        return None
    return {"only": [pin], "allow_fallbacks": False}


def _reasoning_tokens(payload: dict[str, Any]) -> int | None:
    usage = payload.get("usage") or {}
    details = usage.get("completion_tokens_details") or {}
    rt = details.get("reasoning_tokens")
    if isinstance(rt, (int, float)):
        return int(rt)
    details = usage.get("completionTokensDetails") or {}
    rt = details.get("reasoningTokens")
    if isinstance(rt, (int, float)):
        return int(rt)
    return None


class OpenRouterClient:
    def __init__(
        self,
        api_key: str,
        site_url: str = "http://localhost:8080",
        title: str = "Haven AI Companion",
        timeout: float = 120.0,
    ) -> None:
        if not api_key:
            raise RuntimeError("OPENROUTER_API_KEY is not set")
        self._api_key = api_key
        self._site_url = site_url
        self._title = title
        self._timeout = timeout

    def _headers(self) -> dict[str, str]:
        return {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self._api_key}",
            "HTTP-Referer": self._site_url,
            "X-Title": self._title,
        }

    async def chat_json(
        self,
        *,
        model: str,
        system: str,
        messages: list[dict[str, Any]],
        temperature: float = 0.95,
        max_tokens: int = 4096,
        schema_name: str = "haven_chat",
        schema: dict[str, Any] | None = None,
        provider: dict[str, Any] | None = None,
    ) -> str:
        """Non-streaming chat; returns raw text (expected JSON per prompt)."""
        body: dict[str, Any] = {
            "model": model,
            "messages": [{"role": "system", "content": system}, *messages],
            "temperature": temperature,
            "max_tokens": max_tokens,
            "response_format": {
                "type": "json_schema",
                "json_schema": {
                    "name": schema_name,
                    "strict": False,
                    "schema": schema or {"type": "object"},
                },
            },
        }
        if provider:
            body["provider"] = provider
        async with httpx.AsyncClient(timeout=self._timeout) as client:
            res = await client.post(
                f"{BASE_URL}/chat/completions", headers=self._headers(), json=body
            )
        if res.status_code >= 400:
            raise RuntimeError(f"OpenRouter {res.status_code}: {res.text[:500]}")
        data = res.json()
        choices = data.get("choices") or [{}]
        return choices[0].get("message", {}).get("content") or "{}"

    async def chat_stream(
        self,
        *,
        model: str,
        system: str,
        messages: list[dict[str, Any]],
        temperature: float = 0.95,
        max_tokens: int = 4096,
        schema_name: str = "haven_chat",
        schema: dict[str, Any] | None = None,
        provider: dict[str, Any] | None = None,
    ) -> AsyncIterator[dict[str, Any]]:
        """Yield ``{"content": str}`` chunks, then ``{"reasoning_tokens": int}``."""
        body: dict[str, Any] = {
            "model": model,
            "messages": [{"role": "system", "content": system}, *messages],
            "temperature": temperature,
            "max_tokens": max_tokens,
            "stream": True,
            "include_reasoning": True,
            "response_format": {
                "type": "json_schema",
                "json_schema": {
                    "name": schema_name,
                    "strict": False,
                    "schema": schema or {"type": "object"},
                },
            },
        }
        if provider:
            body["provider"] = provider
        reasoning_tokens = 0
        async with httpx.AsyncClient(timeout=self._timeout) as client:
            async with client.stream(
                "POST", f"{BASE_URL}/chat/completions", headers=self._headers(), json=body
            ) as res:
                if res.status_code >= 400:
                    text = await res.aread()
                    raise RuntimeError(
                        f"OpenRouter stream {res.status_code}: {text[:500]!r}"
                    )
                async for line in res.aiter_lines():
                    if not line.startswith("data: "):
                        continue
                    payload = line[6:].strip()
                    if not payload or payload == "[DONE]":
                        continue
                    try:
                        chunk = json.loads(payload)
                    except json.JSONDecodeError:
                        continue
                    delta = (chunk.get("choices") or [{}])[0].get("delta") or {}
                    content = delta.get("content")
                    if isinstance(content, str) and content:
                        yield {"content": content}
                    rt = _reasoning_tokens(chunk)
                    if rt is not None:
                        reasoning_tokens = rt
        yield {"reasoning_tokens": reasoning_tokens}
