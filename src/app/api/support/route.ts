import { NextResponse } from "next/server";
import { getUserFromRequest, isSupabaseConfigured } from "@/lib/supabase";

// GET /api/support — this student's own support requests, newest first,
// with the admin's reply on each. Bearer token required; RLS ("own
// support" policy) returns only the caller's rows.
// POST /api/support — file a support request. Bearer token required.
// Body: { category, message }. The request is inserted into
// support_requests, which the admin reads and replies to from
// /api/admin/support — the student then sees the reply here (B6 fix:
// submit used to push to local React state only, so the request went
// nowhere and "Support request recorded" was false).
const CATEGORIES = [
  "Payment",
  "Activation / Access Code",
  "Lesson / Quiz",
  "Examination",
  "Certificate",
  "Account",
  "Other",
];

export async function GET(req: Request) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ ok: true, configured: false, requests: [] });
    }
    const { user, client } = await getUserFromRequest(req);
    if (!user || !client) {
      return NextResponse.json({ error: "Log in first." }, { status: 401 });
    }
    const { data, error } = await client
      .from("support_requests")
      .select("id,category,message,status,admin_reply,created_at,updated_at")
      .eq("student_id", user.id)
      .order("created_at", { ascending: false });
    if (error)
      return NextResponse.json(
        { error: "Could not load your support requests." },
        { status: 500 }
      );
    return NextResponse.json({ ok: true, requests: data ?? [] });
  } catch {
    return NextResponse.json(
      { error: "Could not load your support requests." },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        {
          error:
            "Support requests need the academy database, which is not connected in this deployment yet. Contact the administrator on WhatsApp.",
        },
        { status: 503 }
      );
    }
    const { user, client } = await getUserFromRequest(req);
    if (!user || !client) {
      return NextResponse.json({ error: "Log in first." }, { status: 401 });
    }
    const body = await req.json();
    const category = String(body.category || "");
    const message = String(body.message || "").trim();
    if (!CATEGORIES.includes(category))
      return NextResponse.json(
        { error: "Choose a valid category." },
        { status: 400 }
      );
    if (message.length < 5 || message.length > 2000)
      return NextResponse.json(
        { error: "Describe the problem in 5–2000 characters." },
        { status: 400 }
      );
    const { data, error } = await client
      .from("support_requests")
      .insert({ student_id: user.id, category, message })
      .select("id,category,message,status,admin_reply,created_at,updated_at")
      .single();
    if (error || !data)
      return NextResponse.json(
        { error: "Could not record your request. Try again." },
        { status: 500 }
      );
    return NextResponse.json({ ok: true, request: data });
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
}
