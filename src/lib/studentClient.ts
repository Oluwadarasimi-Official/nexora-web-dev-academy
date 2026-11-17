import { getBrowserSupabase, isSupabaseConfigured } from "@/lib/supabase";

/* Client-side helper for student pages: every student API call sends the
 signed-in student's session token as a Bearer token, so the server route
 can verify the session and the student under RLS. Without the token the
 server only sees the anon key and answers 401 "Log in first." — even
 though the page renders the student as signed in, because the page reads
 the local session while the server never sees the token. This was the
 live-verified bug behind every student payment claim and code redemption
 failing with "Log in first." while signed in. Student equivalent of
 adminClient.ts (adminFetch + getAdminToken). */

export class StudentApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export const SESSION_EXPIRED_MESSAGE =
  "Your session has expired. Please sign in again.";

export async function getStudentToken(): Promise<string | null> {
  const sb = getBrowserSupabase();
  if (!sb) return null;
  const { data } = await sb.auth.getSession();
  return data.session?.access_token ?? null;
}

export async function studentFetch(
  path: string,
  init: RequestInit = {}
): Promise<Response> {
  const token = await getStudentToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((init.headers as Record<string, string> | undefined) ?? {}),
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  return fetch(path, { ...init, headers });
}

/* POST helper used by all student pages. Throws StudentApiError on failure
 so call sites can show the message directly.
 - Connected deployment with no session: the server would answer 401
   "Log in first." — throw the plain "sign in again" message instead of
   surfacing the raw server error.
 - Local demo flow (Supabase not configured): there is no token by design
   and the server accepts the call without one, so do not block it.
 - A 401 from the server (e.g. expired token) is mapped to the same
   "sign in again" message; other failures surface the server's message. */
export async function studentPost<T>(
  path: string,
  body: unknown
): Promise<T> {
  if (isSupabaseConfigured()) {
    const token = await getStudentToken();
    if (!token) throw new StudentApiError(401, SESSION_EXPIRED_MESSAGE);
  }
  const res = await studentFetch(path, {
    method: "POST",
    body: JSON.stringify(body),
  });
  const data = (await res.json().catch(() => ({}))) as { error?: string };
  if (!res.ok) {
    const message =
      res.status === 401 ? SESSION_EXPIRED_MESSAGE : data.error || "Request failed.";
    throw new StudentApiError(res.status, message);
  }
  return data as T;
}
