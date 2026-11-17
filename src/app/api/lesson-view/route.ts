import { NextResponse } from "next/server";
import { getUserFromRequest, isSupabaseConfigured, resolveTopicQuiz } from "@/lib/supabase";

// POST /api/lesson-view — record that the signed-in student opened a
// lesson (the topic page calls this on mount, so deep-linking straight to
// the lesson still records it). Bearer token required; idempotent — one
// row per student+topic (upsert, duplicates ignored).
// The quiz gate reads this table: the quiz page refuses to open, and
// /api/quiz-submit 403s, until the lesson for that topic has been opened.
// In the local demo flow (Supabase not configured) the answer is
// { ok: true, configured: false, viewed: true } and the client records
// the view locally instead (see the topic page).
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const slug = String(body.slug || "");
    if (!slug) return NextResponse.json({ error: "A topic is required." }, { status: 400 });
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ ok: true, configured: false, viewed: true });
    }
    const { user, client } = await getUserFromRequest(req);
    if (!user || !client) {
      return NextResponse.json({ error: "Log in first." }, { status: 401 });
    }
    const { topicId } = await resolveTopicQuiz(client, slug);
    if (!topicId) return NextResponse.json({ error: "Unknown topic." }, { status: 404 });
    const { error } = await client
      .from("lesson_views")
      .upsert(
        { student_id: user.id, topic_id: topicId, topic_slug: slug },
        { onConflict: "student_id,topic_id", ignoreDuplicates: true }
      );
    if (error) {
      return NextResponse.json({ error: "Could not record the lesson view." }, { status: 500 });
    }
    return NextResponse.json({ ok: true, viewed: true });
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
}
