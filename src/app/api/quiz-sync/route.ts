import { NextResponse } from "next/server";
import { topicBySlug } from "@/lib/curriculum";
import { getServerSupabase, isSupabaseConfigured, resolveTopicQuiz } from "@/lib/supabase";

// POST /api/quiz-sync — repair path for quiz passes the server marked but
// never persisted. The old quiz-submit lookup (quizzes.topic_id = "L1-T01")
// never matched a quizzes.topic_id UUID, so attempts were lost: the quiz
// page recorded the pass in localStorage only, and the complete-topic gate
// (which reads quiz_attempts) always answered "Pass the topic quiz (7/10)".
// The client only ever holds a local pass AFTER the server returned
// passed:true for it, so syncing it back restores a server-marked result.
// It trusts the client-asserted score — acceptable for this unproctored
// self-assessment academy, and the only way a pass earned before the fix
// can count without retaking the quiz. Idempotent: if a passed attempt
// already exists for this student + topic, nothing is inserted.
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const slug = String(body.slug || "");
    const topic = topicBySlug(slug);
    if (!topic) return NextResponse.json({ error: "Unknown topic." }, { status: 404 });
    const score = Number(body.score);
    if (!Number.isInteger(score) || score < 0 || score > 10) {
      return NextResponse.json({ error: "A valid quiz score (0–10) is required." }, { status: 400 });
    }
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ ok: true, synced: false, note: "Database not connected; nothing to sync." });
    }
    const auth = req.headers.get("authorization") || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
    const client = getServerSupabase(token);
    if (!client) return NextResponse.json({ error: "Service unavailable." }, { status: 503 });
    const { data: { user } } = await client.auth.getUser(token);
    if (!user) return NextResponse.json({ error: "Log in first." }, { status: 401 });
    const passed = score >= 7;
    // Resolve the quiz the same way quiz-submit now does: slug -> topics.id
    // (UUID) -> quizzes.topic_id.
    const { quizId } = await resolveTopicQuiz(client, slug);
    if (!quizId) return NextResponse.json({ error: "No quiz found for this topic." }, { status: 404 });
    const { data: existing } = await client.from("quiz_attempts").select("id").eq("student_id", user.id).eq("topic_slug", slug).eq("passed", true).limit(1);
    if (existing && existing.length > 0) {
      return NextResponse.json({ ok: true, synced: false, alreadyRecorded: true, passed });
    }
    const { data: attempt, error } = await client.from("quiz_attempts").insert({ student_id: user.id, quiz_id: quizId, topic_slug: slug, score, passed }).select("id").single();
    if (error || !attempt) return NextResponse.json({ error: "Could not save your quiz result." }, { status: 500 });
    return NextResponse.json({ ok: true, synced: true, passed });
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
}
