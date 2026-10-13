"use client";

import { useEffect, useRef, useState } from "react";
import { transcribeAudio } from "../../lib/api";

/** /voice — record via MediaRecorder, transcribe via POST /api/stt. */
export function VoiceRecorder(): React.JSX.Element {
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [transcript, setTranscript] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [working, setWorking] = useState(false);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const start = async (): Promise<void> => {
    setError(null);
    setTranscript(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Microphone recording is not supported in this browser.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];
      const rec = new MediaRecorder(stream);
      mediaRef.current = rec;
      rec.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      rec.onstop = () => void finish();
      rec.start(250);
      setRecording(true);
      setElapsed(0);
      timerRef.current = setInterval(() => setElapsed((s) => s + 1), 1000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not access the microphone.");
    }
  };

  const stop = (): void => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    mediaRef.current?.stop();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    setRecording(false);
  };

  const finish = async (): Promise<void> => {
    const blob = new Blob(chunksRef.current, { type: mediaRef.current?.mimeType || "audio/webm" });
    chunksRef.current = [];
    if (blob.size === 0) {
      setError("Recording was empty.");
      return;
    }
    setWorking(true);
    try {
      const result = await transcribeAudio(blob);
      setTranscript(result.text || "(no speech detected)");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Transcription failed.");
    } finally {
      setWorking(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        {!recording ? (
          <button
            type="button"
            onClick={() => void start()}
            className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-500"
          >
            ● Record
          </button>
        ) : (
          <button
            type="button"
            onClick={stop}
            className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-600"
          >
            ■ Stop ({elapsed}s)
          </button>
        )}
        {working && <span className="text-xs text-slate-400">Transcribing…</span>}
      </div>
      {error && <p className="text-xs text-rose-300">{error}</p>}
      {transcript && (
        <div className="rounded-xl border border-slate-700 bg-slate-900 p-3">
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Transcript</p>
          <p className="whitespace-pre-wrap text-sm text-slate-100">{transcript}</p>
        </div>
      )}
    </div>
  );
}
