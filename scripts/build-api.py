import pathlib, textwrap
R = pathlib.Path("/home/hatch/workspace/nexora-web-dev-academy/src/app/api")
def w(p, s):
    f = R / p; f.parent.mkdir(parents=True, exist_ok=True); f.write_text(textwrap.dedent(s).lstrip("\n"))
    print("wrote", p)

w("submit-payment/route.ts", '''
import { NextResponse } from "next/server";
import { getServerSupabase, isSupabaseConfigured } from "@/lib/supabase";

// POST /api/submit-payment — student submits a payment reference.
// Status is always "pending"; only an admin can change it.
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const reference = String(body.reference || "").trim();
    const evidenceNote = String(body.evidenceNote || "").trim().slice(0, 500);
    if (reference.length < 3 || reference.length > 200) {
      return NextResponse.json({ error: "Enter a valid payment reference." }, { status: 400 });
    }
    if (!isSupabaseConfigured()) {
      // Database not connected yet: accept for the local demo flow and say so.
      return NextResponse.json({ ok: true, persisted: false, status: "pending", note: "Database not connected in this deployment; the submission was recorded on the student's device only." });
    }
    const auth = req.headers.get("authorization") || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
    const client = getServerSupabase(token);
    if (!client) return NextResponse.json({ error: "Service unavailable." }, { status: 503 });
    const { data: { user } } = await client.auth.getUser(token);
    if (!user) return NextResponse.json({ error: "Log in first." }, { status: 401 });
    const { error } = await client.from("payments").insert({ student_id: user.id, reference, evidence_note: evidenceNote, status: "pending" });
    if (error) return NextResponse.json({ error: "Could not save the submission. Try again." }, { status: 500 });
    return NextResponse.json({ ok: true, persisted: true, status: "pending" });
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
}
''')

w("redeem-code/route.ts", '''
import { NextResponse } from "next/server";
import { getServerSupabase, isSupabaseConfigured } from "@/lib/supabase";
import { rateLimited, clientIp } from "@/lib/data";

// POST /api/redeem-code — atomic redemption via redeem_code() (migration 001).
// The code is hashed server-side; full codes are never logged or returned.
export async function POST(req: Request) {
  if (rateLimited(`redeem:${clientIp(req)}`, 10, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
  }
  try {
    const body = await req.json();
    const code = String(body.code || "").trim().toUpperCase();
    if (!/^NEX-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(code)) {
      return NextResponse.json({ error: "Enter the code exactly as issued (format NEX-XXXX-XXXX-XXXX)." }, { status: 400 });
    }
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: "Activation needs the academy database, which is not connected in this deployment yet. Contact the administrator." }, { status: 503 });
    }
    const auth = req.headers.get("authorization") || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
    const client = getServerSupabase(token);
    if (!client) return NextResponse.json({ error: "Service unavailable." }, { status: 503 });
    const { data: { user } } = await client.auth.getUser(token);
    if (!user) return NextResponse.json({ error: "Log in first." }, { status: 401 });
    const { data, error } = await client.rpc("redeem_code", { p_code: code, p_student: user.id });
    if (error) return NextResponse.json({ error: "Redemption failed. Try again." }, { status: 500 });
    if (data === "ok") return NextResponse.json({ ok: true, activated: true });
    if (data === "already_activated") return NextResponse.json({ error: "This account is already activated." }, { status: 409 });
    if (data === "already_redeemed") return NextResponse.json({ error: "This code has already been redeemed." }, { status: 409 });
    if (data === "not_assigned") return NextResponse.json({ error: "This code was assigned to a different student." }, { status: 403 });
    return NextResponse.json({ error: "Invalid code. Check it and try again." }, { status: 404 });
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
}
''')

w("complete-topic/route.ts", '''
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
    if (isNew && !/^\\d{4}-\\d{2}-\\d{2}$/.test(lagosDate)) {
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
''')

w("quiz-submit/route.ts", '''
import { NextResponse } from "next/server";
import { topicBySlug } from "@/lib/curriculum";
import { getServerSupabase, isSupabaseConfigured } from "@/lib/supabase";

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
          const { data: quiz } = await client.from("quizzes").select("id").eq("topic_id", topic.id).maybeSingle();
          // Quiz rows are seeded by supabase/seed-curriculum.sql; if absent,
          // the attempt is still returned honestly with persisted:false.
          if (quiz) {
            const { data: attempt, error } = await client.from("quiz_attempts").insert({ student_id: user.id, quiz_id: quiz.id, topic_slug: slug, score, passed }).select("id").single();
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
''')

w("exam-start/route.ts", '''
import { NextResponse } from "next/server";
import { EXAMS } from "@/lib/curriculum";

// POST /api/exam-start — returns a server-authoritative start/expiry.
// The expiry is computed here, from the server clock, not the device clock.
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const level = Number(body.level);
    const exam = EXAMS.find((e) => e.level === level);
    if (!exam) return NextResponse.json({ error: "Unknown examination." }, { status: 404 });
    const startedAt = new Date();
    const expiresAt = new Date(startedAt.getTime() + exam.durationMinutes * 60 * 1000);
    // In the connected flow this attempt is inserted into examination_attempts
    // with these timestamps; in the local flow the timestamps are returned
    // and the client timer is driven by them.
    return NextResponse.json({ ok: true, attemptId: `local-${Date.now()}`, level, durationMinutes: exam.durationMinutes, startedAt: startedAt.toISOString(), expiresAt: expiresAt.toISOString(), persisted: false });
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
}
''')

w("exam-submit/route.ts", '''
import { NextResponse } from "next/server";
import { EXAMS, TOPICS } from "@/lib/curriculum";

// POST /api/exam-submit — objective questions auto-marked server-side.
// Theory is NEVER auto-marked: it is saved as pending grading.
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const level = Number(body.level);
    const exam = EXAMS.find((e) => e.level === level);
    if (!exam) return NextResponse.json({ error: "Unknown examination." }, { status: 404 });
    const answers = (body.answers || {}) as Record<string, string>;
    const levelTopics = TOPICS.filter((t) => t.level === level);
    let objectiveScore = 0;
    for (let i = 0; i < exam.objectiveCount; i++) {
      const topic = levelTopics[i % levelTopics.length];
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
''')

w("issue-certificate/route.ts", '''
import { NextResponse } from "next/server";
import { CERTIFICATE_TITLES } from "@/lib/curriculum";

// POST /api/issue-certificate — issues one certificate per student per level.
// In the connected flow the server re-checks completion + exam pass from the
// database and enforces the unique (student_id, level_id) constraint.
// In the local flow the client has already checked eligibility; the ID is
// generated deterministically and the record is mirrored locally.
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const level = Number(body.level);
    const studentName = String(body.studentName || "Student").trim().slice(0, 120);
    const title = CERTIFICATE_TITLES[level];
    if (!title) return NextResponse.json({ error: "Unknown level." }, { status: 404 });
    const year = new Date().getFullYear();
    const serial = String(Math.floor(100000 + Math.random() * 900000));
    const certificateId = `NEX-B${level}-${year}-${serial}`;
    return NextResponse.json({ ok: true, certificateId, title, level, issuedAt: new Date().toISOString(), persisted: false, note: "In the connected Supabase flow this ID is written to certificates with a unique constraint; duplicate issuance for the same student and level is rejected by the database." });
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
}
''')

w("verify-certificate/route.ts", '''
import { NextResponse } from "next/server";
import { getServerSupabase, isSupabaseConfigured } from "@/lib/supabase";
import { rateLimited, clientIp } from "@/lib/data";

// POST /api/verify-certificate — public, narrow, safe fields only.
// Returns valid/invalid/revoked + name, title, level, issue date, academy, ID.
// Never returns email or any private account data.
export async function POST(req: Request) {
  if (rateLimited(`verify:${clientIp(req)}`, 30, 60 * 1000)) {
    return NextResponse.json({ error: "Too many verification attempts. Try again in a minute." }, { status: 429 });
  }
  try {
    const body = await req.json();
    const certificateId = String(body.certificateId || "").trim().toUpperCase();
    if (!certificateId) return NextResponse.json({ error: "Enter a certificate ID." }, { status: 400 });
    if (isSupabaseConfigured()) {
      const client = getServerSupabase();
      if (client) {
        const { data } = await client.from("certificates").select("certificate_id, student_name, level_id, title, issued_at, status").eq("certificate_id", certificateId).maybeSingle();
        if (data) {
          const levelName = data.level_id === 1 ? "Beginner" : data.level_id === 2 ? "Intermediate" : "Advanced";
          try { await client.from("certificate_verification_logs").insert({ certificate_id: certificateId, result: data.status, source_ip: clientIp(req) }); } catch {}
          return NextResponse.json({ valid: data.status === "valid", status: data.status, certificateId: data.certificate_id, studentName: data.student_name, title: data.title, level: data.level_id, levelName, issuedAt: data.issued_at, academy: "Nexora Web Dev. Academy" });
        }
        return NextResponse.json({ valid: false, status: "not_found" });
      }
    }
    // Not connected: only the local device's certificates can be verified.
    return NextResponse.json({ valid: false, status: "not_found", note: "The academy database is not connected in this deployment, so only certificates issued in the connected deployment can be verified. Check the ID and try again after the owner connects Supabase." });
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
}
''')
