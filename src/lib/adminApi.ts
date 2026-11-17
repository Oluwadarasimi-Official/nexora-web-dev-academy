import { NextResponse } from "next/server";
import { getUserFromRequest, isAdmin } from "@/lib/supabase";
import type { SupabaseClient, User } from "@supabase/supabase-js";

export type AdminContext = { user: User; client: SupabaseClient };

/* Shared admin-only route guard: verifies the caller's session from the
 Bearer token, then the admin role, server-side, on every call.
 Deny by default. Every /api/admin route must use this — never the anon
 client with no token, which RLS hides all rows from. */
export async function requireAdmin(
  req: Request
): Promise<{ ctx: AdminContext } | { error: NextResponse }> {
  const { user, client } = await getUserFromRequest(req);
  if (!user || !client)
    return { error: NextResponse.json({ error: "Log in first." }, { status: 401 }) };
  if (!(await isAdmin(client, user.id)))
    return {
      error: NextResponse.json(
        { error: "Administrator access required." },
        { status: 403 }
      ),
    };
  return { ctx: { user, client } };
}

/* Best-effort audit write; a logging failure must never fail the action. */
export async function logAdmin(
  client: SupabaseClient,
  adminId: string,
  action: string,
  targetType: string | null,
  targetId: string | null,
  detail: string
) {
  try {
    await client.from("admin_activity_logs").insert({
      admin_id: adminId,
      action,
      target_type: targetType,
      target_id: targetId,
      detail,
    });
  } catch {}
}
