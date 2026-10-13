# Haven — Migration Map (Express/Vite → Next.js/FastAPI/Supabase)

The original app (`server.ts` + `src/`) still runs as-is. The new stack lives
alongside it until cutover.

| Concern | Old | New |
|---|---|---|
| Frontend | Vite + React (`src/`) | Next.js 15 App Router (`frontend/`, deploy: Vercel, `NEXT_PUBLIC_API_URL`) |
| Backend | Express `server.ts` (`npm run dev`, :3000) | FastAPI `backend/` (`uvicorn app.main:app`, :8080, OpenShift via `backend/Dockerfile`, probes: `GET /health`) |
| Chat | `POST /api/chat` (Gemini/OpenRouter) | `backend/app/routers/chat.py` (OpenRouter; 501 otherwise) |
| Streaming | `POST /api/chat/stream` (SSE) | Same path/event shapes in `routers/chat.py` |
| Reasoning subagent | `POST /api/subagent` (Nemotron nano, nvidia pin) | `routers/subagent.py` (same model/pin, `reasoning_details` passthrough) |
| TTS | `POST /api/voice-note` (Gemini WAV), `POST /api/edge-tts` (MP3) | `routers/tts.py` (Edge TTS, same data-URI shape) |
| STT | Browser SpeechRecognition only | `POST /api/stt` (Faster-Whisper Base) |
| Memory | In-memory + localStorage | Supabase `memories` + pgvector (`routers/memory.py`, `supabase/migrations.sql`) |
| Avatars/uploads | `public/assets/images/` | Supabase Storage (`routers/storage.py`) |
| Companion extras | daily/starter/appearance/coach/future/checkin/custom | `routers/companions.py` (same shapes, static fallbacks without AI key) |

## Env vars (see `backend/.env.example`, `frontend/.env.example`)

`OPENROUTER_API_KEY`, `AI_PROVIDER`, `CHAT_MODEL`, `INKLING_MODEL`,
`SUBAGENT_MODEL`, `SUBAGENT_PROVIDER_ONLY`, `OPENROUTER_PROVIDER_ONLY`,
`SUPABASE_URL`, `SUPABASE_KEY`, `STORAGE_BUCKET`, `NEXT_PUBLIC_API_URL`.

## Cutover checklist

1. `pip install -r backend/requirements.txt` + `uvicorn app.main:app` (from `backend/`)
2. Apply `backend/supabase/migrations.sql` in Supabase SQL editor
3. `npm install && npm run dev` (from `frontend/`) with `NEXT_PUBLIC_API_URL` set
4. Set Vercel env vars; deploy `frontend/`
5. Point OpenShift service at `backend/` (`GET /health` probes)
