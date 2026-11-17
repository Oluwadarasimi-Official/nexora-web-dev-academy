// Suspension enforcement (fix pass C, B8). Suspending a student used to
// do nothing: /api/admin/students set profiles.suspended, but no student
// route or page ever checked it, so a suspended student could still
// redeem, learn, take exams and get certificates exactly as before.
// Every student action route now calls checkSuspension() after
// authenticating and answers 403 before doing anything else.
import type { SupabaseClient } from "@supabase/supabase-js";

export async function checkSuspension(
  client: SupabaseClient,
  userId: string
): Promise<{ suspended: boolean; reason: string | null }> {
  try {
    const { data } = await client
      .from("profiles")
      .select("suspended,suspension_reason")
      .eq("id", userId)
      .maybeSingle();
    return {
      suspended: Boolean(data?.suspended),
      reason: (data?.suspension_reason as string | null) ?? null,
    };
  } catch {
    return { suspended: false, reason: null };
  }
}

export function suspendedMessage(reason: string | null): string {
  return reason
    ? `Your account is suspended: ${reason}. Contact the academy on WhatsApp if you think this is a mistake.`
    : "Your account is suspended. Contact the academy on WhatsApp if you think this is a mistake.";
}
