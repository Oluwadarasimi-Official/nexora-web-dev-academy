// Client-side session + progress store.
// Supabase Auth is the source of truth for identity. Learning progress is
// written to Supabase via the API routes when the database is available;
// localStorage mirrors it so the portal stays usable and so a failed sync
// is visible (not silently lost) — the API response reports persisted:true/false.
export type LocalProgress = {
  completedTopics: string[];
  // Lagos calendar date -> count of NEW topics completed that day
  daily: Record<string, number>;
  quizAttempts: Record<string, { score: number; passed: boolean; at: string }>;
  examAttempts: Record<string, { status: string; at: string }>;
  certificates: { level: number; id: string; title: string; issuedAt: string }[];
  notifications: { id: string; text: string; at: string; read: boolean }[];
  activated: boolean;
};

const KEY = "nexora-progress-v1";
const SESSION_KEY = "nexora-session-v1";

export function defaultProgress(): LocalProgress {
  return {
    completedTopics: [], daily: {}, quizAttempts: {}, examAttempts: {},
    certificates: [], notifications: [], activated: false,
  };
}
export function loadProgress(): LocalProgress {
  if (typeof window === "undefined") return defaultProgress();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultProgress();
    return { ...defaultProgress(), ...JSON.parse(raw) };
  } catch { return defaultProgress(); }
}
export function saveProgress(p: LocalProgress) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(p));
  // Tell every mounted shell/page that progress changed, so header badges
  // (e.g. "Activated" after a code redeem) refresh without a navigation.
  // DashboardShell listens for this; without it the badge kept showing the
  // pre-redeem state until the next page change.
  window.dispatchEvent(new Event("nexora-progress"));
}
export function lagosDate(d = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Lagos", year: "numeric", month: "2-digit", day: "2-digit",
  }).format(d);
}
export function pushNotification(p: LocalProgress, text: string) {
  p.notifications = [{ id: `n-${Date.now()}`, text, at: new Date().toISOString(), read: false }, ...p.notifications].slice(0, 50);
  return p;
}
// Demo/local session fallback used only when Supabase is not yet configured.
// Real auth (Supabase) takes precedence everywhere it is available.
export type LocalSession = { name: string; email: string; id: string };
export function loadSession(): LocalSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}
export function saveSession(s: LocalSession | null) {
  if (typeof window === "undefined") return;
  if (s) localStorage.setItem(SESSION_KEY, JSON.stringify(s));
  else localStorage.removeItem(SESSION_KEY);
}
