// Academy settings, read from the academy_settings table (fix pass C, B9).
// The stored values used to be read by NOBODY: the admin settings page
// edited them, but the quiz/exam/daily-limit code enforced its own
// hardcoded marks (7/10, 70%, 3/day). Now every server route reads the
// stored values through readAcademySettings() and falls back to the
// documented defaults when a key is missing or unparseable.
// NOTE: students have no select policy on academy_settings in migration
// 001 (only the admin "admins manage" policy from 004 exists), so a
// student-token read returned zero rows. Migration 008 adds a public
// read policy — the values are not sensitive (the same numbers are
// already published in the FAQ and on student pages), while writes stay
// admin-only via is_admin().
import type { SupabaseClient } from "@supabase/supabase-js";

export type AcademySettings = {
  dailyNewTopicLimit: number;
  quizPassMark: number;
  examPassMarkPercent: number;
  timezone: string;
  paymentWhatsapp: string;
};

export const DEFAULT_SETTINGS: AcademySettings = {
  dailyNewTopicLimit: 3,
  quizPassMark: 7,
  examPassMarkPercent: 70,
  timezone: "Africa/Lagos",
  paymentWhatsapp: "+234 813 938 8562",
};

function clampInt(raw: string | undefined, fallback: number, min: number, max: number): number {
  const n = Number(raw);
  if (!Number.isInteger(n) || n < min || n > max) return fallback;
  return n;
}

/* Server-side read. `client` is the caller's own token client (student or
 * admin) — RLS applies, and migration 008 lets any signed-in user read
 * these values. Returns defaults on any failure; callers must never break
 * on a settings read failing. */
export async function readAcademySettings(
  client: SupabaseClient
): Promise<AcademySettings> {
  try {
    const { data, error } = await client
      .from("academy_settings")
      .select("key,value");
    if (error || !data) return { ...DEFAULT_SETTINGS };
    const values: Record<string, string> = {};
    for (const row of data) values[row.key as string] = row.value as string;
    return {
      dailyNewTopicLimit: clampInt(
        values.daily_new_topic_limit,
        DEFAULT_SETTINGS.dailyNewTopicLimit,
        1,
        10
      ),
      quizPassMark: clampInt(
        values.quiz_pass_mark,
        DEFAULT_SETTINGS.quizPassMark,
        1,
        10
      ),
      examPassMarkPercent: clampInt(
        values.exam_pass_mark_percent,
        DEFAULT_SETTINGS.examPassMarkPercent,
        1,
        100
      ),
      timezone: (values.timezone || DEFAULT_SETTINGS.timezone).slice(0, 100),
      // The seed row uses the key "whatsapp"; the admin settings page
      // writes "payment_whatsapp". Accept either, preferring the page's key.
      paymentWhatsapp: (
        values.payment_whatsapp ||
        values.whatsapp ||
        DEFAULT_SETTINGS.paymentWhatsapp
      ).slice(0, 50),
    };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

/* Client-side read of the public settings endpoint (GET /api/settings).
 * Cached per page load — student pages that display a rule (quiz pass
 * mark, daily limit, exam pass mark) call this on mount and fall back to
 * the constants when the call fails, so the displayed number is the
 * number the server actually enforces. */
let cachedSettings: Promise<AcademySettings> | null = null;
export function getPublicSettings(): Promise<AcademySettings> {
  if (typeof window === "undefined") return Promise.resolve({ ...DEFAULT_SETTINGS });
  if (!cachedSettings) {
    cachedSettings = fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => ({
        dailyNewTopicLimit: clampInt(d.dailyNewTopicLimit, DEFAULT_SETTINGS.dailyNewTopicLimit, 1, 10),
        quizPassMark: clampInt(d.quizPassMark, DEFAULT_SETTINGS.quizPassMark, 1, 10),
        examPassMarkPercent: clampInt(d.examPassMarkPercent, DEFAULT_SETTINGS.examPassMarkPercent, 1, 100),
        timezone: typeof d.timezone === "string" ? d.timezone : DEFAULT_SETTINGS.timezone,
        paymentWhatsapp: typeof d.paymentWhatsapp === "string" ? d.paymentWhatsapp : DEFAULT_SETTINGS.paymentWhatsapp,
      }))
      .catch(() => ({ ...DEFAULT_SETTINGS }));
  }
  return cachedSettings;
}
