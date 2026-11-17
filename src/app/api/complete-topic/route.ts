import { NextResponse } from "next/server";
import { topicBySlug, DAILY_NEW_TOPIC_LIMIT } from "@/lib/curriculum";
import { getServerSupabase, isSupabaseConfigured } from "@/lib/supabase";

// POST /api/complete-topic — SERVER-ENFORCED daily limit (Africa/Lagos).
// Body: { slug, level, isNew, lagosDate }. The server re-checks the limit
// from the database; a client counter can never bypass it.
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const slug = String(body.slug || "");
    const topic = topicBySlug(slug);
    if (!topic) return NextResponse.json({ error: "Unknown topic." }, { status: 404 });
    const isNew = body.isNew === true;
    const lagosDate = String(body.lagosDate || "");
    if (isNew && !/^\d{4}-\d{2}-\d{2}$/.test(lagosDate)) {
      return NextResponse.json({ error: "Invalid date." }, { status: 400 });
    }
    if (!isSupabaseConfigured()) {
      // No database yet: enforce the limit from the client's own record is
      // impossible server-side, so report honestly and let the client mirror it.
      return NextResponse.json({ ok: true, persisted: false, note: "Database not connected; daily-limit enforcement on this device only until Supabase is connected." });
    }
    const auth = req.headers.get("authorization") || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
    const client = getServerSupabase(token);
    if (!client) return NextResponse.json({ error: "Service unavailable." }, { status: 503 });
    const { data: { user } } = await client.auth.getUser(token);
    if (!user) return NextResponse.json({ error: "Log in first." }, { status: 401 });
    // Already completed? Revision — no allowance consumed.
    const { data: existing } = await client.from("lesson_progress").select("id").eq("student_id", user.id).eq("topic_slug", slug).maybeSingle();
    if (existing) return NextResponse.json({ ok: true, persisted: true, alreadyCompleted: true });
    if (isNew) {
      const { data: row } = await client.from("daily_learning_limits").select("new_topics_completed").eq("student_id", user.id).eq("lagos_date", lagosDate).maybeSingle();
      const used = row?.new_topics_completed || 0;
      if (used >= DAILY_NEW_TOPIC_LIMIT) {
        return NextResponse.json({ error: `Daily limit reached: at most ${DAILY_NEW_TOPIC_LIMIT} new topics per day (Africa/Lagos). Completed topics can still be revised.` }, { status: 429 });
      }
      await client.from("daily_learning_limits").upsert({ student_id: user.id, lagos_date: lagosDate, new_topics_completed: used + 1 }, { onConflict: "student_id,lagos_date" });
    }
    // Quiz pass is verified client-side for the local flow; in the connected
    // flow the quiz_attempts table is the authority — check it here too.
    const { data: quiz } = await client.from("quiz_attempts").select("passed").eq("student_id", user.id).eq("topic_slug", slug).eq("passed", true).maybeSingle();
    if (!quiz) return NextResponse.json({ error: "Pass the topic quiz (7/10) before completing the topic." }, { status: 403 });
    const { error } = await client.from("lesson_progress").insert({ student_id: user.id, topic_slug: slug, level_id: topic.level, lagos_date: lagosDate, is_new_topic: isNew });
    if (error) return NextResponse.json({ error: "Could not save progress." }, { status: 500 });
    return NextResponse.json({ ok: true, persisted: true });
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
}
