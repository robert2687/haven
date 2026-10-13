"use client";

import Link from "next/link";
import { SettingsForm } from "../../components/settings/SettingsForm";

/** /settings — localStorage-backed companion + backend URL prefs. */
export default function SettingsPage(): React.JSX.Element {
  return (
    <div className="mx-auto flex h-screen w-full max-w-2xl flex-col bg-slate-950">
      <header className="flex items-center gap-3 border-b border-slate-800 bg-slate-900/80 px-4 py-3">
        <Link href="/" className="text-xs font-semibold text-blue-400 hover:text-blue-300">
          ← chat
        </Link>
        <h1 className="text-sm font-bold text-slate-100">Settings</h1>
      </header>
      <main className="flex-1 overflow-y-auto px-4 py-6">
        <SettingsForm />
      </main>
    </div>
  );
}
