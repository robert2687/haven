/** localStorage-backed user prefs shared by settings + chat + API client. */

export const PREF_BACKEND_URL = "haven-backend-url";
export const PREF_COMPANION_NAME = "haven-companion-name";
export const PREF_USER_NAME = "haven-user-name";

export function readPref(key: string, fallback: string): string {
  try {
    if (typeof window === "undefined") return fallback;
    const v = window.localStorage.getItem(key);
    return v && v.trim() ? v : fallback;
  } catch {
    return fallback;
  }
}

export function writePref(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // storage unavailable: ignore
  }
}
