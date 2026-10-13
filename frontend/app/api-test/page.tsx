"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { callSubagent, synthEdgeTTS } from "../../lib/api";
import type { SubagentResult } from "../../lib/types";

function toErrorMessage(e: unknown): string {
  if (e instanceof Error) return e.message;
  return "Request failed";
}

function pretty(value: unknown): string {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

/** Extract a reasoning-token count from usage when the provider reports it. */
function reasoningTokensOf(
  usage: SubagentResult["usage"],
): number | null {
  if (typeof usage !== "object" || usage === null) return null;
  const u = usage as Record<string, unknown>;
  const snake = u["completion_tokens_details"];
  if (typeof snake === "object" && snake !== null) {
    const rt = (snake as Record<string, unknown>)["reasoning_tokens"];
    if (typeof rt === "number") return rt;
  }
  const camel = u["completionTokensDetails"];
  if (typeof camel === "object" && camel !== null) {
    const rt = (camel as Record<string, unknown>)["reasoningTokens"];
    if (typeof rt === "number") return rt;
  }
  return null;
}

function truncate(text: string, max = 4000): string {
  return text.length > max ? `${text.slice(0, max)}\n…(truncated)` : text;
}

export default function ApiTestPage(): React.JSX.Element {
  const [subQuery, setSubQuery] = useState(
    "Why are strawberries red? Reply in exactly one short sentence.",
  );
  const [subLoading, setSubLoading] = useState(false);
  const [subError, setSubError] = useState<string | null>(null);
  const [subResult, setSubResult] = useState<SubagentResult | null>(null);

  const [ttsText, setTtsText] = useState("Hey! This is a Haven voice test.");
  const [ttsVoice, setTtsVoice] = useState("Kore");
  const [ttsLoading, setTtsLoading] = useState(false);
  const [ttsError, setTtsError] = useState<string | null>(null);
  const [ttsMeta, setTtsMeta] = useState<{
    voice: string;
    format: string;
    bytes: number;
  } | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const runSubagent = async (): Promise<void> => {
    if (!subQuery.trim() || subLoading) return;
    setSubLoading(true);
    setSubError(null);
    setSubResult(null);
    try {
      const result = await callSubagent({
        query: subQuery.trim(),
        system: "You are a concise test assistant. Follow instructions exactly.",
      });
      setSubResult(result);
    } catch (e) {
      setSubError(toErrorMessage(e));
    } finally {
      setSubLoading(false);
    }
  };

  const runTts = async (): Promise<void> => {
    if (!ttsText.trim() || ttsLoading) return;
    setTtsLoading(true);
    setTtsError(null);
    setTtsMeta(null);
    try {
      const { audioUrl, voice, format } = await synthEdgeTTS({
        text: ttsText.trim(),
        voice: ttsVoice,
      });
      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        await audioRef.current.play().catch(() => {
          // autoplay blocked: user can press play on the <audio> element
        });
      }
      setTtsMeta({
        voice,
        format,
        bytes: audioUrl.length,
      });
    } catch (e) {
      setTtsError(toErrorMessage(e));
    } finally {
      setTtsLoading(false);
    }
  };

  const reasoningTokens = subResult
    ? reasoningTokensOf(subResult.usage)
    : null;

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-2xl flex-col gap-4 bg-slate-950 px-4 py-6">
      <header className="flex items-center justify-between">
        <h1 className="text-lg font-black tracking-tight text-white">
          API test bench
        </h1>
        <Link
          href="/"
          className="rounded-lg px-2 py-1 text-xs font-semibold text-blue-400 hover:bg-slate-800 hover:text-blue-300"
        >
          ← back to chat
        </Link>
      </header>

      {/* Subagent strawberry test */}
      <Card>
        <CardHeader>
          <CardTitle>POST /api/subagent · strawberry test</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Input
            value={subQuery}
            onChange={(e) => setSubQuery(e.target.value)}
            aria-label="Subagent query"
          />
          <div>
            <Button onClick={() => void runSubagent()} disabled={subLoading}>
              {subLoading ? "Asking…" : "Ask subagent"}
            </Button>
          </div>
          {subError && (
            <p className="rounded-xl bg-red-950/60 px-3 py-2 text-xs text-red-300">
              {subError}
            </p>
          )}
          {subResult && (
            <div className="flex flex-col gap-2">
              <div className="rounded-xl bg-slate-950 px-3 py-2 text-sm text-slate-100">
                {subResult.message.content || "(empty reply)"}
              </div>
              <p className="text-[11px] text-slate-400">
                model: {subResult.model || "n/a"} · reasoning tokens:{" "}
                {reasoningTokens !== null ? reasoningTokens : "n/a"}
              </p>
              <details className="rounded-xl border border-slate-800 bg-slate-950 p-3">
                <summary className="cursor-pointer text-xs font-semibold text-slate-300">
                  reasoning_details (raw)
                </summary>
                <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap text-[11px] text-slate-400">
                  {truncate(pretty(subResult.message.reasoning_details))}
                </pre>
              </details>
              <details className="rounded-xl border border-slate-800 bg-slate-950 p-3">
                <summary className="cursor-pointer text-xs font-semibold text-slate-300">
                  full JSON (raw)
                </summary>
                <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap text-[11px] text-slate-400">
                  {truncate(pretty(subResult))}
                </pre>
              </details>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edge TTS test */}
      <Card>
        <CardHeader>
          <CardTitle>POST /api/edge-tts · voice test</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Input
            value={ttsText}
            onChange={(e) => setTtsText(e.target.value)}
            aria-label="Text to synthesize"
          />
          <div className="flex items-center gap-2">
            <label htmlFor="tts-voice" className="text-xs text-slate-400">
              Voice
            </label>
            <select
              id="tts-voice"
              value={ttsVoice}
              onChange={(e) => setTtsVoice(e.target.value)}
              className="h-10 rounded-xl border border-slate-700 bg-slate-950 px-3 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Kore">Kore</option>
              <option value="Zephyr">Zephyr</option>
              <option value="Puck">Puck</option>
              <option value="Fenrir">Fenrir</option>
              <option value="Charon">Charon</option>
              <option value="en-US-AriaNeural">en-US-AriaNeural</option>
            </select>
            <Button onClick={() => void runTts()} disabled={ttsLoading}>
              {ttsLoading ? "Synthesizing…" : "Synthesize + play"}
            </Button>
          </div>
          {ttsError && (
            <p className="rounded-xl bg-red-950/60 px-3 py-2 text-xs text-red-300">
              {ttsError}
            </p>
          )}
          {ttsMeta && (
            <p className="text-[11px] text-slate-400">
              voice: {ttsMeta.voice} · format: {ttsMeta.format} · data URI
              chars: {ttsMeta.bytes}
            </p>
          )}
          {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
          <audio ref={audioRef} controls className="w-full" />
        </CardContent>
      </Card>
    </div>
  );
}
