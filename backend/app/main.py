"""Haven FastAPI backend: mirrors the Express ``server.ts`` API contract."""

from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routers import chat, companions, memory, storage, stt, subagent, tts

app = FastAPI(title="Haven API (FastAPI)")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # open for dev; tighten in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict[str, str]:
    """OpenShift readiness/liveness probe."""
    return {"status": "ok"}


app.include_router(chat.router, prefix="/api")
app.include_router(subagent.router, prefix="/api")
app.include_router(tts.router, prefix="/api")
app.include_router(stt.router, prefix="/api")
app.include_router(memory.router, prefix="/api")
app.include_router(storage.router, prefix="/api")
app.include_router(companions.router, prefix="/api")
