/**
 * Chat + API contract types for the Next.js frontend.
 *
 * `ChatMessage` / `MessageReaction` mirror `src/types.ts` in the Vite app.
 * The remaining interfaces describe the backend (`server.ts`) JSON contract:
 * - POST /api/chat        -> { bubbles[], newMemory, moodAnalysis, memoryDeltas }
 * - POST /api/chat/stream -> SSE events { type: start | content | done | error }
 * - POST /api/subagent    -> { message: { role, content, reasoning_details }, ... }
 * - POST /api/edge-tts    -> { audioUrl data URI, voice, format }
 */

export interface MessageReaction {
  emoji: string;
  count: number;
  userReacted?: boolean;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  image?: {
    mimeType: string;
    data: string; // base64
  };
  audioUrl?: string; // base64 WAV/MP3 data URI or remote URL
  audioDuration?: number; // seconds
  reactions?: MessageReaction[];
  isVoiceNote?: boolean;
  burstGroup?: string;
  status?: "sending" | "delivered" | "read";
}

export interface MoodAnalysis {
  happiness?: number;
  energy?: number;
  stress?: number;
  loneliness?: number;
  motivation?: number;
  dominantEmotion?: string;
  adaptiveBehaviorNote?: string;
}

export interface MemoryDeltas {
  lifeProfileUpdate?: string | null;
  goalUpdate?: string | null;
  relationshipUpdate?: string | null;
  emotionalPattern?: string | null;
}

export interface ChatResponse {
  bubbles: string[];
  newMemory: string | null;
  moodAnalysis: MoodAnalysis | null;
  memoryDeltas: MemoryDeltas | null;
}

export type ChatStreamEvent =
  | { type: "start"; model?: string }
  | { type: "content"; content: string }
  | {
      type: "done";
      bubbles: string[];
      newMemory: string | null;
      moodAnalysis: MoodAnalysis | null;
      memoryDeltas: MemoryDeltas | null;
      reasoningTokens?: number;
    }
  | { type: "error"; error: string };

export type ChatStreamDone = Extract<ChatStreamEvent, { type: "done" }>;

export interface SubagentTurn {
  role: string;
  content: string;
  reasoning_details?: unknown;
}

export interface SubagentResult {
  message: {
    role: string;
    content: string;
    reasoning_details: unknown;
  };
  reasoning: unknown;
  usage: unknown;
  model: string;
}

export interface EdgeTTSResult {
  audioUrl: string; // "data:audio/mp3;base64,..." data URI
  voice: string;
  format: string;
}
