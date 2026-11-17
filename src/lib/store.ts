// Client-side session + progress store.
// Supabase Auth is the source of truth for identity. Learning progress is
// written to Supabase via the API routes when the database is available;
// localStorage mirrors it so the portal stays usable and so a failed sync
// is visible (not silently lost) — the API response reports persisted:true/false.
//
// READ-BACK (B3 fix): localStorage used to be the ONLY read path — the
// academy database was write-only. GET /api/progress now returns the
// server's copy (activation, completed topics, quiz passes, certificates,
// daily counts, notifications) and hydrateProgressFromServer() merges it
// into localStorage, so a new device or a cleared browser shows the real
// server state on sign-in instead of "Not yet activated, 0 progress".
// The merge NEVER destroys local data: server truth wins where it exists,
// local-only records (e.g. a quiz attempt the server never persisted) are
// kept. Sign-out no longer deletes progress either (see AuthForm) — the
// next sign-in re-hydrates from the server.
import { useEffect, useState } from "react";
import { studentGet } from "@/lib/studentClient";
export type LocalProgress = {
  completedTopics: string[];
  // Lagos calendar date -> count of NEW topics completed that day
  daily: Record<string, number>;
  quizAttempts: Record<string, { score: number; passed: boolean; at: string }>;
  examAttempts: Record<string, { status: string; at: string }>;
  certificates: { level: number; id: string; title: string; issuedAt: string }[];
  notifications: { id: string; text: string; at: string; read: boolean }[];
  activated: boolean;
  // Lesson-view gate (owner rule): topic slugs whose lesson (course) the
  // student has opened. The quiz for a topic stays locked until its slug
  // is here (or the topic is completed — completion implies the lesson
  // was opened). Merged from GET /api/progress (server) + local records.
  openedLessons: string[];
  // B8: suspension state from the server (GET /api/progress). The shell
  // shows a banner when true; the action routes enforce it server-side.
  suspended: boolean;
  suspensionReason: string | null;
};

const KEY = "nexora-progress-v1";
const SESSION_KEY = "nexora-session-v1";

export function defaultProgress(): LocalProgress {
  return {
    completedTopics: [], daily: {}, quizAttempts: {}, examAttempts: {},
    certificates: [], notifications: [], activated: false,
    openedLessons: [],
    suspended: false, suspensionReason: null,
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

// ---------------------------------------------------------------------------
// Server progress read-back (B3 fix)
// ---------------------------------------------------------------------------

/* Shape of GET /api/progress. Quiz attempts are keyed by topic slug with
 the BEST attempt per slug (highest score; latest wins a tie) — the same
 rule the server's complete-topic gate uses (any passed attempt counts). */
export type ServerProgress = {
  ok?: boolean;
  configured?: boolean;
  activated: boolean;
  suspended?: boolean;
  suspensionReason?: string | null;
  completedTopics: string[];
  // Topic slugs whose lesson the student has opened (lesson_views).
  openedLessons?: string[];
  daily: Record<string, number>;
  quizAttempts: Record<string, { score: number; passed: boolean; at: string }>;
  certificates: { level: number; id: string; title: string; issuedAt: string }[];
  notifications: { id: string; text: string; at: string; read: boolean }[];
};

/* Fetch the server's copy of this student's progress and merge it into
 localStorage. Returns true when a merge happened, false when there was
 nothing to merge (demo mode, no session, network/server error) — callers
 must never break the page on a false: local progress stays as it is.
 Merge rules (server is the authority, local is never destroyed):
 - activated: OR — once the server says activated, the device shows it.
 - completedTopics: union of server + local slugs.
 - daily: server counts overwrite local ones for the same Lagos date
   (the server enforces the limit); local-only dates are kept.
 - quizAttempts: per slug keep the best attempt (highest score, latest on
   a tie) across server + local, so a local-only pass is never lost.
 - certificates: union by certificate id.
 - notifications: server notifications first, then local ones whose text
   is not already present, capped at 50. */
export async function hydrateProgressFromServer(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  let data: ServerProgress;
  try {
    data = await studentGet<ServerProgress>("/api/progress");
  } catch {
    return false;
  }
  if (!data || data.configured === false || data.ok === false) return false;
  const local = loadProgress();
  const next: LocalProgress = { ...local };
  next.activated = Boolean(local.activated || data.activated);
  // Suspension is server-authoritative: the server's value replaces the
  // local one (a lifted suspension must clear the banner on next sync).
  if (typeof data.suspended === "boolean") {
    next.suspended = data.suspended;
    next.suspensionReason = data.suspensionReason ?? null;
  }
  const completed = new Set([...local.completedTopics, ...(data.completedTopics || [])]);
  next.completedTopics = Array.from(completed);
  // Lesson views: union of server + local slugs — a locally recorded open
  // (e.g. demo mode, or a view posted just before a failed sync) is never lost.
  const opened = new Set([...(local.openedLessons || []), ...(data.openedLessons || [])]);
  next.openedLessons = Array.from(opened);
  next.daily = { ...(local.daily || {}), ...(data.daily || {}) };
  const attempts: LocalProgress["quizAttempts"] = { ...(local.quizAttempts || {}) };
  for (const [slug, a] of Object.entries(data.quizAttempts || {})) {
    const cur = attempts[slug];
    if (!cur || a.score > cur.score || (a.score === cur.score && a.at > cur.at)) {
      attempts[slug] = { score: a.score, passed: a.passed, at: a.at };
    }
  }
  next.quizAttempts = attempts;
  const certIds = new Set((local.certificates || []).map((c) => c.id));
  next.certificates = [
    ...(local.certificates || []),
    ...(data.certificates || []).filter((c) => !certIds.has(c.id)),
  ];
  const seenTexts = new Set((data.notifications || []).map((n) => n.text));
  next.notifications = [
    ...(data.notifications || []),
    ...(local.notifications || []).filter((n) => !seenTexts.has(n.text)),
  ].slice(0, 50);
  saveProgress(next);
  return true;
}

/* Progress state that stays in sync: reads localStorage on mount and
 re-reads whenever progress is saved anywhere (redeem, quiz submit, topic
 completion, server hydration all call saveProgress, which dispatches
 "nexora-progress"). Pages that display progress should use this instead
 of a bare loadProgress() call, or they will keep showing stale values
 after a background hydration. */
export function useSyncedProgress(): LocalProgress {
  const [p, setP] = useState<LocalProgress>(loadProgress());
  useEffect(() => {
    const refresh = () => setP(loadProgress());
    refresh();
    window.addEventListener("nexora-progress", refresh);
    return () => window.removeEventListener("nexora-progress", refresh);
  }, []);
  return p;
}
