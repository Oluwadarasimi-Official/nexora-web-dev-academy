import { getBrowserSupabase } from "@/lib/supabase";

/* Client-side helper for admin pages: every admin API call sends the
 signed-in admin's session token as a Bearer token, so the server route
 can verify the session and the admin role under RLS. Without the token
 the server only sees the anon key and RLS hides every row. */

export class AdminApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export async function getAdminToken(): Promise<string | null> {
  const sb = getBrowserSupabase();
  if (!sb) return null;
  const { data } = await sb.auth.getSession();
  return data.session?.access_token ?? null;
}

export async function adminFetch(
  path: string,
  init: RequestInit = {}
): Promise<Response> {
  const token = await getAdminToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((init.headers as Record<string, string> | undefined) ?? {}),
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  return fetch(path, { ...init, headers });
}

export async function adminGet<T>(path: string): Promise<T> {
  const res = await adminFetch(path);
  const data = (await res.json().catch(() => ({}))) as { error?: string };
  if (!res.ok)
    throw new AdminApiError(res.status, data.error || "Request failed.");
  return data as T;
}

export async function adminPost<T>(path: string, body: unknown): Promise<T> {
  const res = await adminFetch(path, {
    method: "POST",
    body: JSON.stringify(body),
  });
  const data = (await res.json().catch(() => ({}))) as { error?: string };
  if (!res.ok)
    throw new AdminApiError(res.status, data.error || "Request failed.");
  return data as T;
}

/* Payload shapes returned by the /api/admin GET routes. */
export type AdminStudent = {
  id: string;
  full_name: string;
  email: string;
  activated: boolean;
  suspended: boolean;
  suspension_reason: string | null;
  current_level: number;
  created_at: string;
  completedTopics: number;
  certificates: number;
};

export type AdminCode = {
  id: string;
  status: string;
  assigned_to: string | null;
  assigned_name: string | null;
  assigned_email: string | null;
  assigned_at: string | null;
  created_at: string;
  redeemed_at: string | null;
  redeemed_by_name: string | null;
};

export type AdminCertificate = {
  id: string;
  certificate_id: string;
  student_id: string;
  student_name: string;
  level_id: number;
  title: string;
  status: string;
  issued_at: string;
  revoke_reason: string | null;
};

export type AdminAnnouncement = {
  id: string;
  title: string;
  body: string;
  audience: string;
  created_at: string;
};

export type AdminSupport = {
  id: string;
  student_id: string;
  student_name: string;
  student_email: string;
  category: string;
  message: string;
  status: string;
  admin_reply: string | null;
  created_at: string;
  updated_at: string;
};

export type AdminLog = {
  id: string;
  admin_id: string | null;
  admin_name: string | null;
  action: string;
  target_type: string | null;
  target_id: string | null;
  detail: string;
  created_at: string;
};
