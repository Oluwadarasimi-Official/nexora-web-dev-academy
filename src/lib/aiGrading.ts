// Server-only AI theory grading (Groq). Same model and endpoint the
// owner's JAMB Prep tutor and CodeRex use: openai/gpt-oss-120b via
// https://api.groq.com/openai/v1/chat/completions.
//
// The API key is read ONLY from process.env.GROQ_API_KEY (server-only
// env var, set in Vercel Production by the owner). It is never exposed
// to the client, never logged, and never written to any file. The base
// URL may be overridden with GROQ_API_BASE_URL for local testing only;
// it defaults to the real Groq endpoint.
//
// NEVER FABRICATE MARKS: gradeTheoryWithGroq() returns null whenever
// the key is missing, the call fails, the reply is empty, or the JSON
// will not parse/validate after one retry. Callers must then leave the
// attempt as "submitted" (awaiting grading) — a null here is not an
// error to work around, it is the designed fallback.

import type { SupabaseClient } from "@supabase/supabase-js";

export const GROQ_MODEL = "openai/gpt-oss-120b";
export const GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";
// One call must stay well inside Vercel's 60s serverless limit even
// with the single retry (2 x 25s worst case).
const GROQ_TIMEOUT_MS = 25_000;
const GROQ_MAX_TOKENS = 1024;

export type AiGradingResult = { marks: number[]; feedback: string[] };
export type TheoryAnswerInput = { question: string; answer: string };

/* Exact prompt shape (kept in one place so the submit route and the
 * admin "AI grade" action grade identically). The model is told to
 * reply with JSON ONLY, in exactly the shape below. */
export function buildGradingPrompt(
  examTitle: string,
  rubric: string,
  theoryCount: number,
  answers: TheoryAnswerInput[]
): { system: string; user: string } {
  const system =
    `You are an examiner for the Nexora Web Dev. Academy. Mark each theory answer against the published rubric below. ` +
    `Award whole-number marks only, 0-10 per question. A blank, missing, or off-topic answer scores 0. ` +
    `Reply with JSON ONLY - no other text, no markdown fences, no explanation outside the JSON - in exactly this shape: ` +
    `{"marks": [n, n, n], "feedback": ["one short sentence per answer", "...", "..."]}. ` +
    `The marks array and the feedback array must each have exactly ${theoryCount} entries, in the same order as the questions. ` +
    `Each feedback sentence must say briefly what the answer got right or wrong.`;
  const qa = answers
    .map(
      (a, i) =>
        `Question ${i + 1}: ${a.question}\nStudent answer ${i + 1}: ${a.answer.trim() ? a.answer.trim().slice(0, 3000) : "(no answer given)"}`
    )
    .join("\n\n");
  const user = `Examination: ${examTitle}\nRubric: ${rubric}\n\n${qa}`;
  return { system, user };
}

/* Strict parse + validate of the model's reply. Returns null on ANY
 * deviation: not JSON, wrong shape, wrong number of marks/feedback,
 * a mark that is not a whole number 0-10. Feedback entries are trimmed
 * and capped; an empty feedback string is kept empty (the admin page
 * renders it as "No AI feedback") rather than inventing one. */
export function parseGradingJson(text: string, theoryCount: number): AiGradingResult | null {
  if (!text || typeof text !== "string") return null;
  let cleaned = text.trim();
  // Tolerate a fenced code block even though the prompt forbids it.
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "");
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
  const { marks, feedback } = parsed as { marks?: unknown; feedback?: unknown };
  if (!Array.isArray(marks) || marks.length !== theoryCount) return null;
  if (!Array.isArray(feedback) || feedback.length !== theoryCount) return null;
  if (marks.some((m) => typeof m !== "number" || !Number.isInteger(m) || m < 0 || m > 10))
    return null;
  if (feedback.some((f) => typeof f !== "string")) return null;
  return {
    marks: marks as number[],
    feedback: (feedback as string[]).map((f) => f.trim().slice(0, 400)),
  };
}

export type GradeTheoryOptions = {
  examTitle: string;
  rubric: string;
  theoryCount: number;
  answers: TheoryAnswerInput[];
  /** Test hook only: a fetch implementation (the mock-Groq tests use it). */
  fetchFn?: typeof fetch;
  /** Test hook only: overrides the endpoint (GROQ_API_BASE_URL env var). */
  baseUrl?: string;
  /** Test hook only: overrides process.env.GROQ_API_KEY. Pass null to simulate no key. */
  apiKey?: string | null;
};

/* Mark theory answers with Groq. Returns the marks + feedback, or null
 * when grading could not be done (no key / request failed / bad reply).
 * Retries ONCE, and only on a bad parse — a failed request is not
 * retried, it is a fallback. Never throws for a grading failure. */
export async function gradeTheoryWithGroq(opts: GradeTheoryOptions): Promise<AiGradingResult | null> {
  const apiKey = opts.apiKey !== undefined ? opts.apiKey : process.env.GROQ_API_KEY;
  if (!apiKey) return null; // No key = awaiting grading (the designed fallback).
  const baseUrl =
    opts.baseUrl ?? process.env.GROQ_API_BASE_URL ?? GROQ_ENDPOINT;
  const fetchFn = opts.fetchFn ?? fetch;
  const { system, user } = buildGradingPrompt(
    opts.examTitle,
    opts.rubric,
    opts.theoryCount,
    opts.answers
  );
  const callOnce = async (): Promise<
    | { kind: "ok"; result: AiGradingResult }
    | { kind: "request_failed" }
    | { kind: "bad_parse" }
  > => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), GROQ_TIMEOUT_MS);
    try {
      const res = await fetchFn(baseUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: GROQ_MODEL,
          messages: [
            { role: "system", content: system },
            { role: "user", content: user },
          ],
          temperature: 0.2,
          max_tokens: GROQ_MAX_TOKENS,
          response_format: { type: "json_object" },
        }),
        signal: controller.signal,
      });
      if (!res.ok) {
        // Log the status only — never the key, never the body.
        console.warn(`[ai-grading] Groq request failed (HTTP ${res.status}); attempt stays awaiting grading.`);
        return { kind: "request_failed" };
      }
      const data = (await res.json().catch(() => null)) as {
        choices?: { message?: { content?: string } }[];
      } | null;
      const content = data?.choices?.[0]?.message?.content?.trim();
      if (!content) {
        console.warn("[ai-grading] Groq returned an empty reply; attempt stays awaiting grading.");
        return { kind: "bad_parse" };
      }
      const parsed = parseGradingJson(content, opts.theoryCount);
      if (!parsed) {
        console.warn("[ai-grading] Groq reply did not parse as grading JSON.");
        return { kind: "bad_parse" };
      }
      return { kind: "ok", result: parsed };
    } catch (e) {
      // Network error / timeout / abort: fallback, never a fabricated mark.
      console.warn(`[ai-grading] Groq request error (${e instanceof Error ? e.name : "unknown"}); attempt stays awaiting grading.`);
      return { kind: "request_failed" };
    } finally {
      clearTimeout(timer);
    }
  };
  // Retry ONCE, and only on a bad parse (a reply arrived but was not
  // valid grading JSON). A failed request is not retried — the attempt
  // simply stays awaiting grading.
  const first = await callOnce();
  if (first.kind === "ok") return first.result;
  if (first.kind === "bad_parse") {
    const second = await callOnce();
    if (second.kind === "ok") return second.result;
  }
  return null;
}

/* Pure grading maths, shared by the submit route and the admin route so
 * both compute the same total and pass/fail from the same numbers. */
export function computeExamResult(
  objectiveScore: number,
  theoryScore: number,
  totalPossible: number,
  examPassMarkPercent: number
): { totalScore: number; totalPossible: number; passThreshold: number; status: "passed" | "failed" } {
  const totalScore = objectiveScore + theoryScore;
  const passThreshold = Math.ceil((totalPossible * examPassMarkPercent) / 100);
  return {
    totalScore,
    totalPossible,
    passThreshold,
    status: totalScore >= passThreshold ? "passed" : "failed",
  };
}

/* Persist a grading onto an examination attempt. The update only
 * touches rows still in one of the allowed statuses, so a concurrent
 * grading can never double-apply. Returns true iff a row was updated. */
export async function persistGrading(
  client: SupabaseClient,
  attemptId: string,
  allowedStatuses: string[],
  patch: {
    theory_answers: unknown;
    theory_score: number;
    total_score: number;
    status: string;
  }
): Promise<boolean> {
  const { data, error } = await client
    .from("examination_attempts")
    .update(patch)
    .eq("id", attemptId)
    .in("status", allowedStatuses)
    .select("id");
  if (error || !data || data.length === 0) return false;
  return true;
}
