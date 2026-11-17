import { NextResponse } from "next/server";
import { requireAdmin, logAdmin } from "@/lib/adminApi";

// GET /api/admin/announcements — real announcements, newest first.
// POST — create or delete an announcement. Admin only.
// Body: { action: "create", title, body, audience } | { action: "delete", id }
export async function GET(req: Request) {
  const guard = await requireAdmin(req);
  if ("error" in guard) return guard.error;
  const { client } = guard.ctx;
  try {
    const { data, error } = await client
      .from("announcements")
      .select("id,title,body,audience,created_at")
      .order("created_at", { ascending: false });
    if (error)
      return NextResponse.json(
        { error: "Could not load announcements." },
        { status: 500 }
      );
    return NextResponse.json({ announcements: data ?? [] });
  } catch {
    return NextResponse.json(
      { error: "Could not load announcements." },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const guard = await requireAdmin(req);
  if ("error" in guard) return guard.error;
  const { client, user } = guard.ctx;
  try {
    const body = await req.json();
    const action = String(body.action || "");
    if (action === "create") {
      const title = String(body.title || "").trim().slice(0, 200);
      const bodyText = String(body.body || "").trim().slice(0, 2000);
      const audience = String(body.audience || "all").trim().slice(0, 50);
      if (!title || !bodyText)
        return NextResponse.json(
          { error: "A title and a message are required." },
          { status: 400 }
        );
      const { error } = await client.from("announcements").insert({
        title,
        body: bodyText,
        audience,
        created_by: user.id,
      });
      if (error)
        return NextResponse.json(
          { error: "Could not create the announcement." },
          { status: 500 }
        );
      await logAdmin(
        client,
        user.id,
        "announcement_created",
        "announcement",
        null,
        title
      );
      return NextResponse.json({ ok: true });
    }
    if (action === "delete") {
      const id = String(body.id || "");
      if (!id)
        return NextResponse.json(
          { error: "Provide an announcement ID." },
          { status: 400 }
        );
      const { data, error } = await client
        .from("announcements")
        .delete()
        .eq("id", id)
        .select("id");
      if (error || !data || data.length === 0)
        return NextResponse.json(
          { error: "Could not delete the announcement (it may not exist)." },
          { status: 409 }
        );
      await logAdmin(
        client,
        user.id,
        "announcement_deleted",
        "announcement",
        id,
        ""
      );
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
}
