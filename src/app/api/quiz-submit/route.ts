import { NextResponse } from "next/server";
import { topicBySlug, levelUnlocked, PASS_MARK } from "@/lib/curriculum";
import { getServerSupabase, isSupabaseConfigured, resolveTopicQuiz } from "@/lib/supabase";
import { checkSuspension, suspendedMessage } from "@/lib/studentGuard";
import { readAcademySettings } from "@/lib/settings";

// POST /api/quiz-submit — SERVER-SIDE marking. The client only ever receives
// questions without answers (publicQuestions); the keys live here.
// Pass C changes:
// - The pass mark comes from academy_settings (B9), not a hardcoded 7 —
//   the response reports the passMark actually used, so the quiz page can
//   display the number the server enforces.
// - A suspended student is rejected (B8) before anything is persisted.
// - The level lock is enforced server-side (residual from pass A): a
//   direct API call can no longer submit a quiz for a level the student
//   has not unlocked — levelUnlocked() is the single rule (Level 2 needs
//   all 26 Level 1 topics, Level 3 needs 51).
// - Lesson-view gate (this change, owner rule): a quiz submission is
//   rejected (403) until the student has opened the course (lesson) for
//   that topic — lesson_views, or a completed topic (legacy). The quiz
//   page enforces the same rule in the UI.
// In the local demo flow (Supabase not configured) there is no database
// to check suspension or progress against, so the attempt is marked and
// returned honestly with persisted:false, as before.
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
    let passMark = PASS_MARK;
    let passed = score >= passMark;
    let persisted = false;
    if (isSupabaseConfigured()) {
      const auth = req.headers.get("authorization") || "";
      const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
      const client = getServerSupabase(token);
      if (client) {
        const { data: { user } } = await client.auth.getUser(token);
        if (user) {
          const susp = await checkSuspension(client, user.id);
          if (susp.suspended)
            return NextResponse.json({ error: suspendedMessage(susp.reason) }, { status: 403 });
          // Server-side level lock: count completed topics from the
          // database, never trust the client's claim.
          const { data: progress } = await client
            .from("lesson_progress")
            .select("topic_slug")
            .eq("student_id", user.id);
          const completedCount = (progress ?? []).length;
          if (!levelUnlocked(topic.level, completedCount))
            return NextResponse.json(
              { error: `This quiz is locked until Level ${topic.level - 1} is complete.` },
              { status: 403 }
            );
          const settings = await readAcademySettings(client);
          passMark = settings.quizPassMark;
          passed = score >= passMark;
          // Resolve by slug: quizzes.topic_id is the topics UUID, not the
          // curriculum id ("L1-T01"). The old eq(topic_id, topic.id) never
          // matched, so no attempt was ever persisted.
          const { topicId, quizId } = await resolveTopicQuiz(client, slug);
          // Lesson-view gate (owner rule): the quiz must not open until
          // the student has opened the course (lesson) for this topic.
          // A completed topic counts as opened (legacy: topics completed
          // before lesson_views existed, and the parent's Level 1 seed).
          // The quiz page enforces the same rule in the UI; this stops a
          // direct API call from bypassing it.
          if (topicId) {
            const { data: completedRow } = await client
              .from("lesson_progress")
              .select("id")
              .eq("student_id", user.id)
              .eq("topic_id", topicId)
              .maybeSingle();
            if (!completedRow) {
              const { data: view, error: viewError } = await client
                .from("lesson_views")
                .select("id")
                .eq("student_id", user.id)
                .eq("topic_id", topicId)
                .maybeSingle();
              if (viewError) {
                return NextResponse.json(
                  { error: "Lesson tracking is not ready yet. Please try again shortly." },
                  { status: 500 }
                );
              }
              if (!view) {
                return NextResponse.json(
                  { error: "Open the course first — read the lesson, then take its quiz." },
                  { status: 403 }
                );
              }
            }
          }
          // Quiz rows are seeded by supabase/seed-curriculum.sql; if absent,
          // the attempt is still returned honestly with persisted:false.
          if (quizId) {
            const { data: attempt, error } = await client.from("quiz_attempts").insert({ student_id: user.id, quiz_id: quizId, topic_slug: slug, score, passed }).select("id").single();
            if (!error && attempt) persisted = true;
          }
        }
      }
    }
    return NextResponse.json({ ok: true, score, passed, passMark, review, persisted });
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
}
