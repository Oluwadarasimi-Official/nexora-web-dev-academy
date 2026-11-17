import { TOPICS, EXAMS } from "@/lib/curriculum";
import type { SupabaseClient } from "@supabase/supabase-js";

/* Shared server-side exam helpers (fix pass B). The client also gates
 * exams on local progress, but the server never trusts it: eligibility
 * is re-checked here from the database on every start, submit and
 * certificate issue. */

export function levelSlugs(level: number): string[] {
  return TOPICS.filter((t) => t.level === level).map((t) => t.slug);
}

/* A level is complete when every topic has a lesson_progress row AND a
 * passed quiz_attempts row for this student. (A topic cannot be completed
 * without a passed quiz, so the progress rows alone would imply it — the
 * quiz check is kept explicit so a half-written state can never pass.) */
export async function isLevelComplete(
  client: SupabaseClient,
  userId: string,
  level: number
): Promise<boolean> {
  const slugs = levelSlugs(level);
  if (slugs.length === 0) return false;
  const { data: progress } = await client
    .from("lesson_progress")
    .select("topic_slug")
    .eq("student_id", userId)
    .in("topic_slug", slugs);
  const done = new Set((progress ?? []).map((r) => r.topic_slug as string));
  if (slugs.some((s) => !done.has(s))) return false;
  const { data: quizzes } = await client
    .from("quiz_attempts")
    .select("topic_slug")
    .eq("student_id", userId)
    .eq("passed", true)
    .in("topic_slug", slugs);
  const passed = new Set((quizzes ?? []).map((r) => r.topic_slug as string));
  return slugs.every((s) => passed.has(s));
}

/* Rubric totals: objective 1 mark each + theory 10 marks each.
 * Pass mark is 70% of the total (35/50 for every level today). */
export function examTotals(level: number): { totalPossible: number; passThreshold: number } {
  const exam = EXAMS.find((e) => e.level === level);
  if (!exam) return { totalPossible: 0, passThreshold: 0 };
  const totalPossible = exam.objectiveCount * 1 + exam.theoryCount * 10;
  const passThreshold = Math.ceil((totalPossible * exam.passMarkPercent) / 100);
  return { totalPossible, passThreshold };
}
