import { createBrowserClient } from "@supabase/ssr";
import { createClient as createJsClient } from "@supabase/supabase-js";

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
export const SUPABASE_PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "";

export function isSupabaseConfigured() {
  return Boolean(SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY);
}

export function getBrowserSupabase() {
  if (!isSupabaseConfigured()) return null;
  return createBrowserClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
}

/** Server/API client (anon key only — never a service-role key in this codebase). */
export function getServerSupabase(accessToken?: string) {
  if (!isSupabaseConfigured()) return null;
  const client = createJsClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: accessToken
      ? { headers: { Authorization: `Bearer ${accessToken}` } }
      : undefined,
  });
  return client;
}

export async function getUserFromRequest(req: Request) {
  const auth = req.headers.get("authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!token) return { user: null, client: null };
  const client = getServerSupabase(token);
  if (!client) return { user: null, client: null };
  const { data, error } = await client.auth.getUser(token);
  if (error || !data.user) return { user: null, client };
  return { user: data.user, client };
}

import type { SupabaseClient } from "@supabase/supabase-js";

export async function isAdmin(client: SupabaseClient, userId: string) {
  if (!client || !userId) return false;
  const { data } = await client
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  return Boolean(data);
}

/* Resolve a topic's database ids by its URL slug.
 * The client curriculum id ("L1-T01") is NOT the database id: public.topics.id
 * is a UUID and public.quizzes.topic_id holds that UUID. The old quiz-submit
 * lookup (quizzes.topic_id = "L1-T01") never matched, so no quiz_attempts row
 * was ever written and the complete-topic gate always 403'd — while the quiz
 * page happily recorded the pass in localStorage. Always resolve by slug.
 * Needs migration 006 (a select policy on public.quizzes) to return rows. */
export async function resolveTopicQuiz(client: SupabaseClient, slug: string) {
  const { data: topicRow } = await client
    .from("topics")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();
  if (!topicRow) return { topicId: null as string | null, quizId: null as string | null };
  const { data: quiz } = await client
    .from("quizzes")
    .select("id")
    .eq("topic_id", topicRow.id)
    .maybeSingle();
  return { topicId: topicRow.id as string, quizId: (quiz?.id as string | undefined) ?? null };
}
