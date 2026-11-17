import { NextResponse } from "next/server";
import { EXAMS } from "@/lib/curriculum";

// POST /api/exam-submit — objective questions auto-marked server-side.
// Theory is NEVER auto-marked: it is saved as pending grading.
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const level = Number(body.level);
    const exam = EXAMS.find((e) => e.level === level);
    if (!exam) return NextResponse.json({ error: "Unknown examination." }, { status: 404 });
    const answers = (body.answers || {}) as Record<string, string>;
    let objectiveScore = 0;
    for (let i = 0; i < exam.objectiveCount; i++) {
      // The correct option for objective i is the topic's own summary (option 0).
      if (answers[`obj-${i}`] === "0") objectiveScore += 1;
    }
    const theoryAnswered = Array.from({ length: exam.theoryCount }, (_, i) => (answers[`theory-${i}`] || "").trim().length >= 20).filter(Boolean).length;
    const theoryStatus = theoryAnswered === exam.theoryCount ? "pending grading" : "incomplete — theory answers missing or too short";
    const objectiveTotal = exam.objectiveCount;
    // Overall pass needs objective + graded theory; theory pending means
    // the attempt cannot pass yet — the status is honestly "awaiting grading".
    const status = theoryStatus === "pending grading" && objectiveScore / objectiveTotal >= 0.7 ? "awaiting grading" : "submitted — theory grading required";
    return NextResponse.json({ ok: true, level, objectiveScore, objectiveTotal, theoryStatus, status, note: "Theory answers are graded by an authorised examiner against the published rubric. No theory marks are fabricated by this endpoint." });
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
}
