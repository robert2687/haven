"use client";

import Link from "next/link";
import ChatPage from "../page";

/**
 * Canonical chat route.
 * `/` already hosts the full Haven chat UI; `/chat` reuses it so both
 * URLs from the target tree resolve to the same component.
 */
export default function ChatRoute(): React.JSX.Element {
  return (
    <div>
      <div className="border-b border-slate-800 bg-slate-900/60 px-4 py-1.5 text-[11px] text-slate-400">
        <Link href="/" className="text-blue-400 hover:text-blue-300">
          ← home
        </Link>
        <span className="ml-2">/chat — canonical thread (same as /)</span>
      </div>
      <ChatPage />
    </div>
  );
}
