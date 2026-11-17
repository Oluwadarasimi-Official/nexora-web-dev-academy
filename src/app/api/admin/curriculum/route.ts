import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminApi";

// GET /api/admin/curriculum — live curriculum counts straight from the
// database (topics by level, lessons, quizzes, quiz questions,
// examinations). Admin only.
export async function GET(req: Request) {
  const guard = await requireAdmin(req);
  if ("error" in guard) return guard.error;
  const { client } = guard.ctx;
  try {
    const [topics, modules, lessons, quizzes, questions, exams] =
      await Promise.all([
        client.from("topics").select("id,module_id"),
        client.from("modules").select("id,level_id"),
        client.from("lessons").select("id", { count: "exact", head: true }),
        client.from("quizzes").select("id", { count: "exact", head: true }),
        client
          .from("quiz_questions")
          .select("id", { count: "exact", head: true }),
        client
          .from("examinations")
          .select("id,level_id,title,duration_minutes,pass_mark_percent")
          .order("level_id", { ascending: true }),
      ]);
    const err =
      topics.error ||
      modules.error ||
      lessons.error ||
      quizzes.error ||
      questions.error ||
      exams.error;
    if (err)
      return NextResponse.json(
        { error: "Could not load curriculum data." },
        { status: 500 }
      );
    const levelOfModule = new Map(
      (modules.data ?? []).map((m) => [m.id, m.level_id] as const)
    );
    const byLevel: Record<number, number> = { 1: 0, 2: 0, 3: 0 };
    for (const t of topics.data ?? []) {
      const lvl = levelOfModule.get(t.module_id);
      if (lvl && lvl in byLevel) byLevel[lvl] += 1;
    }
    return NextResponse.json({
      topicsTotal: topics.data?.length ?? 0,
      topicsByLevel: byLevel,
      lessonsTotal: lessons.count ?? 0,
      quizzesTotal: quizzes.count ?? 0,
      questionsTotal: questions.count ?? 0,
      examinations: exams.data ?? [],
    });
  } catch {
    return NextResponse.json(
      { error: "Could not load curriculum data." },
      { status: 500 }
    );
  }
}
