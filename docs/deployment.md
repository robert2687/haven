# Haven deployment topology

| Layer    | Target            | Source                    |
| -------- | ----------------- | ------------------------- |
| Frontend | Vercel            | `frontend/` (Next.js 15)  |
| Backend  | OpenShift Sandbox | `backend/` (FastAPI :8080)|
| Database | Supabase          | `database/schema.sql` + `infra/supabase/policies.sql` |
| Models   | OpenRouter Free   | chat / inkling / subagent + embeddings |
| STT      | Faster-Whisper `base` (in-container) | `backend/app/services/whisper.py` |
| TTS      | Edge TTS ( host network egress) | `backend/app/services/edge_tts.py` |

## Frontend → Vercel

1. Vercel project Root Directory = `frontend/`
   (reference config: `infra/vercel/vercel.json`).
2. Env (Vercel dashboard → Environment Variables):
   - `NEXT_PUBLIC_API_URL=https://<openshift-route-host>` (no trailing slash).
3. Deploy. Browser calls the backend directly; no rewrites in `next.config.ts`.

## Backend → OpenShift Sandbox

1. Build/push image from `backend/Dockerfile`, or `oc start-build`.
2. Create secret (never commit values):
   `oc create secret generic haven-backend-env
     --from-literal=OPENROUTER_API_KEY=...
     --from-literal=EMBEDDING_MODEL=<768-dim model>
     --from-literal=SUPABASE_URL=...
     --from-literal=SUPABASE_KEY=<service-role>
     --from-literal=SITE_URL=https://<vercel-app>`
3. `oc apply -f infra/openshift/` (Deployment + Service + Route).
4. Check `GET https://<route>/health` → `{"status":"ok"}`.
5. Set the Route host as `NEXT_PUBLIC_API_URL` on Vercel.

Sandbox notes:
- STT (Faster-Whisper `base`, `backend/app/services/whisper.py:14`)
  downloads ~150MB weights on first call; image already ships `ffmpeg`,
  cache dirs point at `/tmp`, memory limit is 2Gi — expect a slow first
  transcription after each pod restart.
- TTS (Edge TTS) needs HTTPS egress to `speech.platform.bing.com`;
  Sandbox permits egress by default — no NetworkPolicy required.

## Database → Supabase

1. SQL editor: run `database/schema.sql`, then `infra/supabase/policies.sql`.
2. `haven-assets` bucket is created by schema; storage policies ship with it.
3. Backend uses the **service-role** key (bypasses RLS); browser uses anon key
   under the owner policies in `policies.sql`.

## Models → OpenRouter Free

- Chat: `CHAT_MODEL` (default `nvidia/nemotron-3-ultra-550b-a55b:free`).
- Inkling/mood: `INKLING_MODEL`. Subagent: `SUBAGENT_MODEL` (+ `*_PROVIDER_ONLY` pins).
- Embeddings: `EMBEDDING_MODEL` must emit **768-dim** vectors
  (`document_chunks.embedding vector(768)`).
- Free-tier rate limits apply; `/api/chat` falls back to canned bubbles on
  upstream failure (`backend/app/routers/chat.py`).
