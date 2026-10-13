# Haven FastAPI backend

Python 3.12 port of the Express `server.ts` API contract, built to run on
OpenShift Sandbox. The existing Express server and `src/` frontend are untouched.

## Run

```bash
cd backend
python -m venv .venv
# Windows: .venv\Scripts\activate | macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # then fill in keys
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Health check: `GET http://localhost:8000/health` (use for OpenShift
readiness/liveness probes).

## Container

```bash
docker build -t haven-backend .
docker run -p 8000:8000 --env-file .env haven-backend
```

## Env vars

| Key | Default | Notes |
| --- | ------- | ----- |
| `OPENROUTER_API_KEY` | — | Required for chat/stream/subagent |
| `AI_PROVIDER` | `gemini` | Set to `openrouter`; `gemini` returns 501 on chat routes |
| `CHAT_MODEL` | `nvidia/nemotron-3-ultra-550b-a55b:free` | |
| `INKLING_MODEL` | `thinkingmachines/inkling:free` | Reserved for future stream routing |
| `SUBAGENT_MODEL` | `nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free` | |
| `SUBAGENT_PROVIDER_ONLY` | `nvidia` | Pinned, no fallbacks |
| `OPENROUTER_PROVIDER_ONLY` | — | Optional pin for chat, no fallbacks |
| `SUPABASE_URL` / `SUPABASE_KEY` | — | Without these, memory/storage return 501 |
| `STORAGE_BUCKET` | `haven-assets` | |
| `SITE_URL` | `http://localhost:3000` | Sent as OpenRouter referer |

## Endpoints (all under `/api` except `/health`)

- `POST /api/chat` → `{bubbles[], newMemory, moodAnalysis, memoryDeltas}`
- `POST /api/chat/stream` → SSE `{type:start/content/done/error}`, done carries `reasoningTokens`
- `POST /api/subagent` → `{message{role,content,reasoning_details}, reasoning, usage, model}`
- `POST /api/edge-tts` → `{audioUrl (MP3 data URI), voice, format}`
- `POST /api/stt` → `{text, language, duration}` (faster-whisper Base, lazy-loaded)
- `GET/POST /api/memories`, `GET/PATCH/DELETE /api/memories/{id}`, `POST /api/memory/search`
- `POST /api/storage/upload`, `GET /api/storage/url?path=`
- `POST /api/voice-note`, `/api/daily-companion`, `/api/starter-message`,
  `/api/character-appearance`, `/api/life-coach/advice`, `/api/future-self/advice`,
  `/api/proactive-checkin`, `/api/custom-companion`

## Database

Apply `supabase/migrations.sql` in the Supabase SQL editor (pgvector +
`memories` table + `match_memories` RPC + storage bucket).
