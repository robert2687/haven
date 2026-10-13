"use client";

import { useState } from "react";
import Link from "next/link";

/**
 * /auth — placeholder for Supabase Auth.
 * Backend uses SUPABASE_URL/KEY for memories/storage; wire this form to
 * supabase-js signInWithPassword / signUp when auth is introduced.
 */
export default function AuthPage(): React.JSX.Element {
  const [email, setEmail] = useState("");
  const [notice, setNotice] = useState<string | null>(null);

  return (
    <div className="mx-auto flex h-screen w-full max-w-md flex-col bg-slate-950">
      <header className="flex items-center gap-3 border-b border-slate-800 bg-slate-900/80 px-4 py-3">
        <Link href="/" className="text-xs font-semibold text-blue-400 hover:text-blue-300">
          ← chat
        </Link>
        <h1 className="text-sm font-bold text-slate-100">Sign in</h1>
      </header>
      <main className="flex-1 space-y-3 px-4 py-6">
        <p className="text-xs text-slate-400">
          Auth is not wired yet. Enter an email to stage the Supabase flow; the
          session will live in localStorage under{" "}
          <code>haven-auth-email</code>.
        </p>
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const v = email.trim();
            if (!v) return;
            try {
              window.localStorage.setItem("haven-auth-email", v);
            } catch {
              // storage unavailable
            }
            setNotice(`Staged sign-in for ${v} (Supabase wiring pending).`);
          }}
        >
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            aria-label="Email"
            className="flex-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100"
          />
          <button
            type="submit"
            className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-500"
          >
            Continue
          </button>
        </form>
        {notice && <p className="text-xs text-emerald-300">{notice}</p>}
      </main>
    </div>
  );
}
