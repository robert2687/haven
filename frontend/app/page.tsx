"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Avatar } from "../components/ui/avatar";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  API_URL,
  sendChat,
  streamChat,
  synthEdgeTTS,
  type ChatRequestBody,
} from "../lib/api";
import type { ChatMessage, MoodAnalysis } from "../lib/types";
import { cn } from "../lib/utils";

const DEFAULT_PERSONA = "warm, genuine, playfully witty, emotionally comforting";
const DEFAULT_QUIRKS = "loves morning espresso walks, listens to indie folk";
const STORAGE_KEY = "haven-nextjs-messages-v1";

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: "init-1",
    role: "assistant",
    content: "hey! how's your day going so far?",
    timestamp: "",
    status: "read",
  },
];

function now(): string {
  return new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function uid(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
}

function toErrorMessage(e: unknown): string {
  if (e instanceof Error) return e.message;
  return "Request failed";
}

export default function ChatPage(): React.JSX.Element {
  const [companionName, setCompanionName] = useState("Sophia");
  const [userName, setUserName] = useState("Alex");
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [streaming, setStreaming] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [lastMemory, setLastMemory] = useState<string | null>(null);
  const [lastMood, setLastMood] = useState<MoodAnalysis | null>(null);
  const [reasoningTokens, setReasoningTokens] = useState<number | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Restore persisted thread once (client only).
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as ChatMessage[];
      if (Array.isArray(parsed) && parsed.length > 0) setMessages(parsed);
    } catch {
      // corrupted storage: keep the greeting
    }
  }, []);

  // Persist thread (strip large audio payloads) + autoscroll.
  useEffect(() => {
    try {
      const storable = messages.map((m) => ({
        ...m,
        audioUrl:
          m.audioUrl && m.audioUrl.length < 200000 ? m.audioUrl : undefined,
      }));
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(storable));
    } catch {
      // quota exceeded: keep messages in memory only
    }
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const buildBody = (text: string, thread: ChatMessage[]): ChatRequestBody => ({
    companionName: companionName.trim() || "Sophia",
    userName: userName.trim() || "Alex",
    relationship: "best-friend",
    persona: DEFAULT_PERSONA,
    tastesAndQuirks: DEFAULT_QUIRKS,
    memories: [],
    locale: "en-US",
    history: thread
      .slice(-14)
      .map((m) => ({ role: m.role, content: m.content })),
    latestMessage: text,
  });

  const appendBubbles = (bubbles: string[]): void => {
    const at = now();
    setMessages((prev) => [
      ...prev,
      ...bubbles.map((content, i) => ({
        id: uid("asst"),
        role: "assistant" as const,
        content,
        timestamp: at,
        status: "read" as const,
        burstGroup: `burst-${at}-${i}`,
      })),
    ]);
  };

  const handleSend = async (): Promise<void> => {
    const text = draft.trim();
    if (!text || sending) return;
    setDraft("");
    setError(null);
    setReasoningTokens(null);

    const userMsg: ChatMessage = {
      id: uid("usr"),
      role: "user",
      content: text,
      timestamp: now(),
      status: "read",
    };
    const thread = [...messages, userMsg];
    setMessages(thread);
    setSending(true);

    if (streaming) {
      // Live placeholder: the backend streams raw JSON deltas, so tokens look
      // like partial JSON until the `done` event resolves with clean bubbles.
      const placeholderId = uid("asst-stream");
      setMessages((prev) => [
        ...prev,
        {
          id: placeholderId,
          role: "assistant",
          content: "",
          timestamp: now(),
          status: "sending",
        },
      ]);
      const controller = new AbortController();
      abortRef.current = controller;
      try {
        const done = await streamChat(buildBody(text, messages), {
          signal: controller.signal,
          onToken: (chunk) => {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === placeholderId
                  ? { ...m, content: m.content + chunk }
                  : m,
              ),
            );
          },
        });
        setMessages((prev) => {
          const at = now();
          return [
            ...prev.filter((m) => m.id !== placeholderId),
            ...done.bubbles.map((content) => ({
              id: uid("asst"),
              role: "assistant" as const,
              content,
              timestamp: at,
              status: "read" as const,
            })),
          ];
        });
        setLastMemory(done.newMemory);
        setLastMood(done.moodAnalysis);
        if (typeof done.reasoningTokens === "number") {
          setReasoningTokens(done.reasoningTokens);
        }
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") {
          setMessages((prev) => prev.filter((m) => m.id !== placeholderId));
        } else {
          setMessages((prev) => prev.filter((m) => m.id !== placeholderId));
          setError(toErrorMessage(e));
        }
      } finally {
        setSending(false);
        abortRef.current = null;
      }
      return;
    }

    try {
      const data = await sendChat(buildBody(text, messages));
      appendBubbles(data.bubbles);
      setLastMemory(data.newMemory);
      setLastMood(data.moodAnalysis);
    } catch (e) {
      setError(toErrorMessage(e));
      setMessages((prev) => [
        ...prev,
        {
          id: uid("err"),
          role: "assistant",
          content: "hm, reception feels spotty right now. try again in a sec?",
          timestamp: now(),
          status: "read",
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  const handleStop = (): void => {
    abortRef.current?.abort();
  };

  const handlePlayVoice = async (msg: ChatMessage): Promise<void> => {
    if (!msg.content.trim() || playingId !== null) return;
    setPlayingId(msg.id);
    setError(null);
    try {
      const { audioUrl } = await synthEdgeTTS({ text: msg.content });
      const audio = new Audio(audioUrl);
      await audio.play();
    } catch (e) {
      setError(toErrorMessage(e));
    } finally {
      setPlayingId(null);
    }
  };

  const handleClear = (): void => {
    setMessages(INITIAL_MESSAGES);
    setLastMemory(null);
    setLastMood(null);
    setReasoningTokens(null);
    setError(null);
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // storage unavailable: in-memory clear is enough
    }
  };

  return (
    <div className="mx-auto flex h-screen w-full max-w-2xl flex-col bg-slate-950">
      {/* Header: companion identity + controls */}
      <header className="flex shrink-0 items-center gap-3 border-b border-slate-800 bg-slate-900/80 px-4 py-3 backdrop-blur">
        <Avatar name={companionName} size="md" />
        <div className="flex min-w-0 flex-1 flex-col">
          <input
            value={companionName}
            onChange={(e) => setCompanionName(e.target.value)}
            aria-label="Companion name"
            className="w-40 truncate bg-transparent text-sm font-bold text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500 rounded"
          />
          <span className="truncate text-[11px] text-slate-400">
            best-friend · {API_URL}
            {reasoningTokens !== null ? ` · reasoning ${reasoningTokens}` : ""}
          </span>
        </div>
        <label className="flex cursor-pointer items-center gap-1.5 text-xs text-slate-300">
          <input
            type="checkbox"
            checked={streaming}
            onChange={(e) => setStreaming(e.target.checked)}
            className="h-4 w-4 accent-blue-600"
          />
          Stream
        </label>
        <Link
          href="/api-test"
          className="rounded-lg px-2 py-1 text-xs font-semibold text-blue-400 hover:bg-slate-800 hover:text-blue-300"
        >
          API test
        </Link>
      </header>

      {/* Memory / mood strip */}
      {(lastMemory ?? lastMood?.dominantEmotion) && (
        <div className="shrink-0 border-b border-slate-800 bg-slate-900/60 px-4 py-1.5 text-[11px] text-slate-400">
          {lastMemory ? (
            <span>
              remembered: <span className="text-blue-300">{lastMemory}</span>
            </span>
          ) : null}
          {lastMemory && lastMood?.dominantEmotion ? " · " : null}
          {lastMood?.dominantEmotion ? (
            <span>
              mood:{" "}
              <span className="text-slate-200">{lastMood.dominantEmotion}</span>
            </span>
          ) : null}
        </div>
      )}

      {/* Thread */}
      <main className="chat-scroll flex-1 space-y-2 overflow-y-auto px-4 py-4">
        {messages.map((msg) => {
          const isUser = msg.role === "user";
          return (
            <div
              key={msg.id}
              className={cn("flex", isUser ? "justify-end" : "justify-start")}
            >
              <div
                className={cn(
                  "group max-w-[85%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed",
                  isUser
                    ? "rounded-br-md bg-blue-600 text-white"
                    : "rounded-bl-md bg-slate-800 text-slate-100",
                )}
              >
                <p className="whitespace-pre-wrap break-words">
                  {msg.content ||
                    (msg.status === "sending" ? (
                      <span className="animate-pulse text-slate-400">
                        streaming…
                      </span>
                    ) : (
                      ""
                    ))}
                </p>
                <div className="mt-1 flex items-center justify-between gap-3">
                  <span className="text-[10px] opacity-60">
                    {msg.timestamp}
                  </span>
                  {!isUser && msg.content.trim() && (
                    <button
                      type="button"
                      onClick={() => void handlePlayVoice(msg)}
                      disabled={playingId !== null}
                      className="text-[11px] font-semibold text-blue-400 opacity-0 transition-opacity hover:text-blue-300 disabled:opacity-50 group-hover:opacity-100"
                      aria-label={`Play voice for message ${msg.id}`}
                    >
                      {playingId === msg.id ? "playing…" : "▶ voice"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {sending && !streaming && (
          <div className="flex justify-start">
            <div className="animate-pulse rounded-2xl rounded-bl-md bg-slate-800 px-3.5 py-2 text-sm text-slate-400">
              typing…
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </main>

      {error && (
        <div className="shrink-0 border-t border-red-900/60 bg-red-950/60 px-4 py-2 text-xs text-red-300">
          {error}
        </div>
      )}

      {/* Composer */}
      <footer className="shrink-0 border-t border-slate-800 bg-slate-900/80 px-3 py-3">
        <form
          className="flex items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            void handleSend();
          }}
        >
          <Input
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            aria-label="Your name"
            placeholder="You"
            className="w-20 shrink-0"
          />
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={`Message ${companionName || "Sophia"}…`}
            aria-label="Chat message"
            autoComplete="off"
          />
          {sending && streaming ? (
            <Button variant="secondary" onClick={handleStop}>
              Stop
            </Button>
          ) : (
            <Button type="submit" disabled={!draft.trim() || sending}>
              {sending ? "…" : "Send"}
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            title="Clear local thread"
          >
            Clear
          </Button>
        </form>
      </footer>
    </div>
  );
}
