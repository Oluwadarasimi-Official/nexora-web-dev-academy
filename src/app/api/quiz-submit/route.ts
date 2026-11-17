import { NextResponse } from "next/server";
import { topicBySlug } from "@/lib/curriculum";
import { getServerSupabase, isSupabaseConfigured, resolveTopicQuiz } from "@/lib/supabase";

// POST /api/quiz-submit — SERVER-SIDE marking. The client only ever receives
// questions without answers (publicQuestions); the keys live here.
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const slug = String(body.slug || "");
    const topic = topicBySlug(slug);
    if (!topic) return NextResponse.json({ error: "Unknown topic." }, { status: 404 });
    const answers = body.answers as Record<string, number>;
    if (!answers || typeof answers !== "object") return NextResponse.json({ error: "Answers are required." }, { status: 400 });
    let score = 0;
    const review = topic.questions.map((q, i) => {
      const chosen = answers[String(i)];
      const correct = chosen === q.answer;
      if (correct) score += 1;
      return { q: q.q, correct, yourAnswer: typeof chosen === "number" ? q.options[chosen] : null, correctAnswer: q.options[q.answer], explanation: q.explanation };
    });
    const passed = score >= 7;
    let persisted = false;
    if (isSupabaseConfigured()) {
      const auth = req.headers.get("authorization") || "";
      const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
      const client = getServerSupabase(token);
      if (client) {
        const { data: { user } } = await client.auth.getUser(token);
        if (user) {
          // Resolve by slug: quizzes.topic_id is the topics UUID, not the
          // curriculum id ("L1-T01"). The old eq(topic_id, topic.id) never
          // matched, so no attempt was ever persisted.
          const { quizId } = await resolveTopicQuiz(client, slug);
          // Quiz rows are seeded by supabase/seed-curriculum.sql; if absent,
          // the attempt is still returned honestly with persisted:false.
          if (quizId) {
            const { data: attempt, error } = await client.from("quiz_attempts").insert({ student_id: user.id, quiz_id: quizId, topic_slug: slug, score, passed }).select("id").single();
            if (!error && attempt) persisted = true;
          }
        }
      }
    }
    return NextResponse.json({ ok: true, score, passed, review, persisted });
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
}
