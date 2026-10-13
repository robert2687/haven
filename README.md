# OpenCode AI Companion

OpenCode is an open-source AI companion platform designed for voice-first
conversations, long-term memory, and agent-based workflows. Built entirely
on a free-tier stack, OpenCode combines modern AI models, speech
processing, and cloud-native deployment while keeping infrastructure costs
at zero during the MVP stage.

## Features

- AI Chat
- Voice Conversations
- Speech-to-Text (Whisper)
- Text-to-Speech (Edge TTS)
- Long-Term Memory
- Supabase Integration
- OpenRouter Integration
- OpenShift Deployment
- Vercel Frontend
- Agent-Ready Architecture

## Architecture

```text
┌─────────────┐
│    User     │
└──────┬──────┘
       ▼
┌─────────────┐
│  Frontend   │
│  Next.js    │
│  Vercel     │
└──────┬──────┘
       ▼
┌─────────────┐
│  FastAPI    │
│ OpenShift   │
└──────┬──────┘
       │
┌──────┼─────────────────┐
│      │                 │
▼      ▼                 ▼
Whisper  OpenRouter    Edge-TTS
│      │                 │
▼      ▼                 ▼
STT    LLM             Audio
│
▼
Supabase
```

## Technology Stack

### Frontend

- Next.js 15
- TypeScript
- Tailwind CSS
- Shadcn/UI

### Backend

- Python 3.12
- FastAPI
- Uvicorn

### Database

- Supabase PostgreSQL
- Supabase Auth
- Supabase Storage
- pgvector

### LLM Providers (OpenRouter Free)

- NVIDIA Nemotron 3 Nano Omni (Free)
- Thinking Machines Inkling (Free)

### Speech

- Speech-to-Text: Faster Whisper (Base)
- Text-to-Speech: Edge TTS

## Requirements

Install the following software before getting started:

- Git
- Node.js 22+
- Python 3.12+
- Docker Desktop
- OpenShift CLI (oc)

## Clone the Repository

```bash
git clone https://github.com/your-org/opencode.git
cd opencode
```

## Frontend Setup

Navigate to the frontend directory:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Create `frontend/.env.local` and add:

```text
NEXT_PUBLIC_API_URL=https://<openshift-route-host>
```

Run locally:

```bash
npm run dev
```

Frontend URL: `http://localhost:3000`

> `NEXT_PUBLIC_API_URL` defaults to `http://localhost:8080`
> (see `frontend/.env.example`). Point it at your OpenShift route when deployed.

## Backend Setup

Navigate to the backend folder:

```bash
cd backend
```

Create a virtual environment:

```bash
python -m venv .venv
```

Windows:

```bash
.venv\Scripts\activate
```

Linux / macOS:

```bash
source .venv/bin/activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

### Backend Environment Variables

Create `backend/.env` (see `backend/.env.example`) and add:

```text
OPENROUTER_API_KEY=YOUR_KEY
AI_PROVIDER=openrouter
CHAT_MODEL=nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free
INKLING_MODEL=thinking-machines/inkling:free
SUBAGENT_MODEL=nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free
EMBEDDING_MODEL=<768-dim-model>
SUPABASE_URL=https://PROJECT.supabase.co
SUPABASE_KEY=YOUR_SERVICE_ROLE_KEY
STORAGE_BUCKET=haven-assets
SITE_URL=http://localhost:3000
```

> `SUPABASE_KEY` is the **service-role** key server-side (bypasses RLS).
> `EMBEDDING_MODEL` must emit 768-dim vectors (`document_chunks.embedding`).

Run the backend:

```bash
uvicorn app.main:app --reload --port 8080
```

- API URL: `http://localhost:8080`
- Swagger docs: `http://localhost:8080/docs`
- Health probe: `http://localhost:8080/health`

## Supabase Setup

1. Create a new project in Supabase.
2. Copy your **Project URL**, **anon key**, and **service-role key**.
3. Run the database schema (SQL editor, in order):
   - `database/schema.sql` — tables: `users`, `conversations`, `messages`,
     `memories` (+`embedding`), `voices`, `documents`, `document_chunks`,
     plus the `match_*` vector-search functions.
   - `infra/supabase/policies.sql` — RLS owner policies.

Column overview:

| Table           | Columns                                                      |
| --------------- | ------------------------------------------------------------ |
| users           | id, email, name, avatar_url, created_at                      |
| conversations   | id, user_id, title, created_at, updated_at                   |
| messages        | id, conversation_id, role, content, model, created_at         |
| memories        | id, user_id, memory, embedding, importance, created_at        |
| voices          | id, user_id, voice_name, language, provider                  |
| documents       | id, user_id, title, created_at, updated_at                   |
| document_chunks | id, document_id, chunk_index, content, embedding, created_at |

## OpenRouter Setup

1. Create an account at `https://openrouter.ai`.
2. Generate an API key: **Settings → Keys → Create Key**.
3. Add it to `backend/.env` as `OPENROUTER_API_KEY`.

## Edge TTS Setup

Already in `requirements.txt`:

```bash
pip install edge-tts
```

Example:

```python
import asyncio
import edge_tts

async def generate_voice():
    communicate = edge_tts.Communicate("Hello world", "en-US-AriaNeural")
    await communicate.save("voice.mp3")

asyncio.run(generate_voice())
```

Supported voices:

- `sk-SK-LukasNeural`
- `sk-SK-ViktoriaNeural`
- `en-US-AriaNeural`
- `en-US-GuyNeural`

Service: `backend/app/services/edge_tts.py` (aliases `lukas`/`viktoria`,
`locale:sk-SK` fallback). Endpoint: `POST /api/edge-tts`.

## Faster Whisper Setup

Already in `requirements.txt`:

```bash
pip install faster-whisper
```

Example:

```python
from faster_whisper import WhisperModel

model = WhisperModel("base", device="cpu", compute_type="int8")
segments, info = model.transcribe("audio.wav")
for segment in segments:
    print(segment.text)
```

Service: `backend/app/services/whisper.py` (`base`, beam 5, lazy load).
Endpoint: `POST /api/stt` (multipart `audio`, 25 MB max).

## Docker Build

Build container:

```bash
docker build -t opencode-backend ./backend
```

Run locally:

```bash
docker run -p 8080:8080 --env-file backend/.env opencode-backend
```

## OpenShift Deployment

Login:

```bash
oc login
```

Create project:

```bash
oc new-project opencode
```

Create the env secret, then deploy:

```bash
oc create secret generic haven-backend-env \
  --from-literal=OPENROUTER_API_KEY=... \
  --from-literal=EMBEDDING_MODEL=... \
  --from-literal=SUPABASE_URL=... \
  --from-literal=SUPABASE_KEY=... \
  --from-literal=SITE_URL=https://<vercel-app>
oc apply -f infra/openshift/
```

Verify:

```bash
oc get routes
```

The command returns the public API URL — set it as `NEXT_PUBLIC_API_URL` on Vercel.

## Vercel Deployment

Install CLI:

```bash
npm install -g vercel
```

Deploy (Root Directory = `frontend/`):

```bash
vercel
```

Production deployment:

```bash
vercel --prod
```

Configure environment variables:

- `NEXT_PUBLIC_API_URL` → your OpenShift route host

## API Endpoints

### Chat

```http
POST /api/chat
```

Request:

```json
{
  "companionName": "Sophia",
  "userName": "Alex",
  "latestMessage": "Hello",
  "history": []
}
```

Streaming: `POST /api/chat/stream` (SSE: `start` / `content` / `done`).

### Speech-to-Text

```http
POST /api/stt
```

Upload: multipart `audio` (wav/mp3/m4a/ogg/flac/webm, 25 MB max).
Alias `POST /api/speech` returns `{ text }` only.

### Text-to-Speech

```http
POST /api/edge-tts
```

Request:

```json
{ "text": "Hello Robert", "voice": "sk-SK-ViktoriaNeural" }
```

Plus: `POST /api/subagent` (reasoning agents, see `backend/app/agents/`),
`GET /api/memories`, `POST /api/memory/search`.

## Production Deployment

```text
Frontend        └── Vercel
Backend         └── OpenShift Sandbox
Database        └── Supabase Free
Speech-To-Text  └── Faster Whisper Base
Text-To-Speech  └── Edge TTS
LLM             ├── NVIDIA Nemotron 3 Nano Omni (Free)
                └── Thinking Machines Inkling (Free)
```

## Monthly Cost

```text
Vercel Hobby      €0
OpenShift Sandbox €0
Supabase Free     €0
OpenRouter Free   €0
Edge TTS          €0
Faster Whisper    €0
--------------------
Total             €0
```

## Development Roadmap

```text
✅ AI Chat
✅ Voice Chat
✅ Speech-to-Text
✅ Text-to-Speech
✅ Supabase Integration
⬜ Memory Embeddings
⬜ Document RAG
⬜ Agent Marketplace
⬜ Multi-Agent System
⬜ Mobile Apps
⬜ Desktop App
⬜ Knowledge Base
⬜ Plugin System
⬜ Team Workspaces
```

## MVP Conversation Flow

```text
User Voice
│
▼
Faster Whisper
│
▼
Text Input
│
▼
OpenRouter
│
▼
Nemotron / Inkling
│
▼
AI Response
│
▼
Edge TTS
│
▼
Audio Playback
```

OpenCode provides a scalable foundation for AI companions, voice
assistants, RAG systems, and future multi-agent platforms while remaining
completely free during the MVP phase.
