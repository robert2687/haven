# Haven Frontend (Next.js 15)

Minimal Next.js 15 (App Router) + TypeScript + Tailwind CSS chat frontend for
the Haven AI companion backend. It does **not** replace the existing Vite app
in `src/` or the Express `server.ts` — it is a separate deployable target for
**Vercel**.

## Prerequisites

- Node.js 20+
- A running Haven backend (local default `http://localhost:8000`)

## Getting started

```bash
cd frontend
npm install
cp .env.example .env.local   # then edit NEXT_PUBLIC_API_URL if needed
npm run dev                  # http://localhost:3000
```

## Scripts

| Script       | What it does              |
| ------------ | ------------------------- |
| `npm run dev`   | Start the dev server   |
| `npm run build` | Production build       |
| `npm run start` | Serve the production build |
| `npm run lint`  | Type-check (`tsc --noEmit`) |

## Environment variables

| Variable               | Required | Purpose                                  |
| ---------------------- | -------- | ---------------------------------------- |
| `NEXT_PUBLIC_API_URL`  | No       | Backend base URL (default `http://localhost:8000`) |

No secrets live in this repo — `.env.example` contains only the public
backend URL. Never commit `.env.local`.

## Backend contract used

- `POST /api/chat` → `{ bubbles[], newMemory, moodAnalysis, memoryDeltas }`
- `POST /api/chat/stream` → SSE events `{ type: start | content | done | error }`
  (streams raw JSON deltas; clean `bubbles[]` arrive on `done`)
- `POST /api/subagent` → `{ message: { role, content, reasoning_details }, … }`
- `POST /api/edge-tts` → `{ audioUrl data URI, voice, format }`

See `lib/api.ts` for the typed client and `lib/types.ts` for the mirrored
types (`ChatMessage` matches `src/types.ts`).

## Deploy to Vercel

1. Push this repo and import it in Vercel with the **Root Directory** set to
   `frontend/` (or deploy the `frontend/` folder as its own project).
2. Framework preset: **Next.js** (defaults work — `npm run build`).
3. In **Project → Settings → Environment Variables**, set:
   - `NEXT_PUBLIC_API_URL` = your deployed backend URL
     (e.g. `https://your-backend.example.com` — no trailing slash needed).
4. Redeploy after changing env vars (`NEXT_PUBLIC_*` is inlined at build time).

Notes:

- The backend must accept browser CORS from your Vercel domain for
  `/api/chat`, `/api/chat/stream`, `/api/subagent`, and `/api/edge-tts`.
- `/api-test` is a dev-only bench page for exercising `/api/subagent` and
  `/api/edge-tts`; remove or guard it if you don't want it public.
