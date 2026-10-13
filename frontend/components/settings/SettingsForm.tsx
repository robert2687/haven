"use client";

import { useEffect, useState } from "react";
import { API_URL } from "../../lib/api";
import {
  PREF_BACKEND_URL,
  PREF_COMPANION_NAME,
  PREF_USER_NAME,
  readPref,
  writePref,
} from "../../lib/prefs";

/** /settings — localStorage-backed companion + backend URL prefs. */
export function SettingsForm(): React.JSX.Element {
  const [companion, setCompanion] = useState("Sophia");
  const [user, setUser] = useState("Alex");
  const [backendUrl, setBackendUrl] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setCompanion(readPref(PREF_COMPANION_NAME, "Sophia"));
    setUser(readPref(PREF_USER_NAME, "Alex"));
    setBackendUrl(readPref(PREF_BACKEND_URL, ""));
  }, []);

  const handleSave = (e: React.FormEvent): void => {
    e.preventDefault();
    writePref(PREF_COMPANION_NAME, companion.trim() || "Sophia");
    writePref(PREF_USER_NAME, user.trim() || "Alex");
    writePref(PREF_BACKEND_URL, backendUrl.trim());
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const field =
    "w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100";

  return (
    <form onSubmit={handleSave} className="space-y-4">
      <div>
        <label htmlFor="settings-companion" className="mb-1 block text-xs font-semibold text-slate-300">
          Companion name
        </label>
        <input
          id="settings-companion"
          value={companion}
          onChange={(e) => setCompanion(e.target.value)}
          className={field}
        />
      </div>
      <div>
        <label htmlFor="settings-user" className="mb-1 block text-xs font-semibold text-slate-300">
          Your name
        </label>
        <input
          id="settings-user"
          value={user}
          onChange={(e) => setUser(e.target.value)}
          className={field}
        />
      </div>
      <div>
        <label htmlFor="settings-backend" className="mb-1 block text-xs font-semibold text-slate-300">
          Backend URL override
        </label>
        <input
          id="settings-backend"
          value={backendUrl}
          onChange={(e) => setBackendUrl(e.target.value)}
          placeholder={API_URL}
          className={field}
        />
        <p className="mt-1 text-[11px] text-slate-500">
          Empty = build default (<code>{API_URL}</code>). Takes effect immediately, no rebuild needed.
        </p>
      </div>
      <button
        type="submit"
        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
      >
        Save
      </button>
      {saved && <p className="text-xs text-emerald-300">Saved.</p>}
    </form>
  );
}
