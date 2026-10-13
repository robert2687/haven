/**
 * Typed client for the Haven backend (`server.ts`).
 *
 * Base URL comes from NEXT_PUBLIC_API_URL (public, no secrets).
 * Defaults to http://localhost:8080 for local backend dev.
 */
import type {
  ChatResponse,
  ChatStreamDone,
  ChatStreamEvent,
  EdgeTTSResult,
  SubagentResult,
  SubagentTurn,
} from "./types";

const RAW_BASE =
  typeof process.env.NEXT_PUBLIC_API_URL === "string" &&
  process.env.NEXT_PUBLIC_API_URL.trim().length > 0
    ? process.env.NEXT_PUBLIC_API_URL.trim()
    : "http://localhost:8080";

export const API_URL = RAW_BASE.replace(/\/+$/, "");

async function parseError(res: Response): Promise<Error> {
  const text = await res.text().catch(() => "");
  let detail = text.slice(0, 300);
  try {
    const parsed = JSON.parse(text) as { error?: unknown };
    if (typeof parsed.error === "string" && parsed.error.trim()) {
      detail = parsed.error.slice(0, 300);
    }
  } catch {
    // non-JSON error body: keep the raw snippet
  }
  return new Error(`API ${res.status} ${res.statusText}: ${detail}`);
}

// ---------------------------------------------------------------------------
// POST /api/chat
// ---------------------------------------------------------------------------

export interface ChatHistoryItem {
  role: "user" | "assistant";
  content: string;
  image?: { mimeType: string; data: string };
}

/** Mirrors the ChatRequestBody the backend builds its system prompt from. */
export interface ChatRequestBody {
  companionName: string;
  userName: string;
  relationship: string;
  archetype?: string;
  title?: string;
  persona: string;
  tastesAndQuirks: string;
  specialties?: string[];
  memories: string[];
  locale?: string;
  history: ChatHistoryItem[];
  latestMessage: string;
  hasVoiceNote?: boolean;
  /** Passthrough for structuredMemory / moodIntelligence / storylines / etc. */
  [key: string]: unknown;
}

function normalizeChatResponse(data: Partial<ChatResponse>): ChatResponse {
  const bubbles = Array.isArray(data.bubbles)
    ? data.bubbles
        .map((b) => String(b).trim())
        .filter((b) => b.length > 0)
    : [];
  return {
    bubbles: bubbles.length > 0 ? bubbles : ["hey, sorry, what was that?"],
    newMemory:
      typeof data.newMemory === "string" && data.newMemory.trim()
        ? data.newMemory.trim()
        : null,
    moodAnalysis: data.moodAnalysis ?? null,
    memoryDeltas: data.memoryDeltas ?? null,
  };
}

/** POST /api/chat -> { bubbles[], newMemory, moodAnalysis, memoryDeltas } */
export async function sendChat(
  body: ChatRequestBody,
  signal?: AbortSignal,
): Promise<ChatResponse> {
  const res = await fetch(`${API_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal,
  });
  if (!res.ok) throw await parseError(res);
  const data = (await res.json()) as Partial<ChatResponse>;
  return normalizeChatResponse(data);
}

// ---------------------------------------------------------------------------
// POST /api/chat/stream (SSE)
// ---------------------------------------------------------------------------

export interface StreamChatOptions {
  signal?: AbortSignal;
  /** Fired for every raw SSE event (start/content/done/error). */
  onEvent?: (event: ChatStreamEvent) => void;
  /** Fired for each { type: "content" } chunk as it arrives. */
  onToken?: (chunk: string) => void;
}

/**
 * POST /api/chat/stream -> SSE events { type: start | content | done | error }.
 *
 * NOTE: the backend streams the raw JSON payload as `content` deltas, so
 * tokens seen live are the in-progress JSON text; the parsed `bubbles[]`
 * arrive in the final `done` event, which this function resolves with.
 */
export async function streamChat(
  body: ChatRequestBody,
  opts: StreamChatOptions = {},
): Promise<ChatStreamDone> {
  const res = await fetch(`${API_URL}/api/chat/stream`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: opts.signal,
  });
  if (!res.ok) throw await parseError(res);
  if (!res.body) throw new Error("Streaming response has no body");

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let donePayload: ChatStreamDone | null = null;

  const handleLine = (line: string): void => {
    const trimmed = line.trim();
    if (!trimmed.startsWith("data:")) return;
    const payload = trimmed.slice(5).trim();
    if (!payload || payload === "[DONE]") return;
    let event: ChatStreamEvent;
    try {
      event = JSON.parse(payload) as ChatStreamEvent;
    } catch {
      return; // ignore malformed SSE lines
    }
    opts.onEvent?.(event);
    if (event.type === "content") {
      opts.onToken?.(event.content);
    } else if (event.type === "done") {
      donePayload = event;
    } else if (event.type === "error") {
      throw new Error(event.error);
    }
  };

  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (value) {
        buffer += decoder.decode(value, { stream: true });
        let idx: number;
        while ((idx = buffer.indexOf("\n")) !== -1) {
          const line = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 1);
          handleLine(line);
        }
      }
      if (done) break;
    }
    buffer += decoder.decode();
    if (buffer.trim()) handleLine(buffer);
  } finally {
    try {
      reader.releaseLock();
    } catch {
      // reader already closed/cancelled
    }
  }

  if (!donePayload) throw new Error("Stream ended without a done event");
  return donePayload;
}

// ---------------------------------------------------------------------------
// POST /api/subagent
// ---------------------------------------------------------------------------

export interface SubagentRequest {
  query?: string;
  system?: string;
  messages?: SubagentTurn[];
  model?: string;
}

/**
 * POST /api/subagent -> { message: { role, content, reasoning_details }, ... }.
 * One-shot: pass { query }. Multi-turn: pass the full history back, keeping
 * assistant messages' reasoning_details unmodified.
 */
export async function callSubagent(
  req: SubagentRequest,
  signal?: AbortSignal,
): Promise<SubagentResult> {
  const res = await fetch(`${API_URL}/api/subagent`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
    signal,
  });
  if (!res.ok) throw await parseError(res);
  const data = (await res.json()) as Partial<SubagentResult> & {
    message?: { role?: unknown; content?: unknown; reasoning_details?: unknown };
  };
  if (!data || typeof data.message?.content !== "string") {
    throw new Error("Subagent response missing message.content");
  }
  return {
    message: {
      role:
        typeof data.message.role === "string" ? data.message.role : "assistant",
      content: data.message.content,
      reasoning_details: data.message.reasoning_details ?? null,
    },
    reasoning: data.reasoning ?? null,
    usage: data.usage ?? null,
    model: typeof data.model === "string" ? data.model : "",
  };
}

// ---------------------------------------------------------------------------
// POST /api/edge-tts
// ---------------------------------------------------------------------------

export interface EdgeTTSRequest {
  text: string;
  voice?: string;
  rate?: string;
  volume?: string;
  pitch?: string;
  emotionalModulation?: "warm" | "playful" | "calm" | "late-night" | "encouraging";
}

/** POST /api/edge-tts -> { audioUrl data URI, voice, format } */
export async function synthEdgeTTS(
  req: EdgeTTSRequest,
  signal?: AbortSignal,
): Promise<EdgeTTSResult> {
  const res = await fetch(`${API_URL}/api/edge-tts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
    signal,
  });
  if (!res.ok) throw await parseError(res);
  const data = (await res.json()) as Partial<EdgeTTSResult>;
  if (!data || typeof data.audioUrl !== "string" || !data.audioUrl) {
    throw new Error("Edge TTS response missing audioUrl");
  }
  return {
    audioUrl: data.audioUrl,
    voice: typeof data.voice === "string" ? data.voice : "",
    format: typeof data.format === "string" ? data.format : "audio/mp3",
  };
}
