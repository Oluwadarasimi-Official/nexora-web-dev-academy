import { EXAMS, TOPICS } from "@/lib/curriculum";

/* Shared exam question builder + seeded shuffle (fix pass B).
 *
 * The old client built objective options itself with the correct answer
 * ALWAYS at index 0 ("It has no effect on a real project." etc. as the
 * fixed wrong options) and the server marked `answers[obj-i] === "0"` —
 * so picking the first option on every question scored 20/20.
 *
 * Now the questions are built HERE, server-side, and each question's
 * options are shuffled with a deterministic seeded shuffle. The client
 * only ever receives the shuffled options; the key (which shuffled
 * position holds the correct answer) is re-derived server-side at
 * marking time from the same seed and never leaves the server.
 *
 * The seed is a per-attempt random secret stored on the attempt row
 * (migration 007) in the connected flow. In the local demo flow there is
 * no database, so the seed derives from the attempt id (demo-only). */

export type ExamObjectiveQuestion = { key: string; q: string; options: string[] };
export type ExamTheoryQuestion = { key: string; q: string };

const WRONG_OPTIONS = [
  "It has no effect on a real project.",
  "It should never be practised.",
  "It only matters for examinations.",
];

/* The exam's questions, exactly as the old client built them: one
 * objective question per topic (cycling the level's topics), correct
 * answer = the topic's own summary first, then the three fixed wrong
 * statements; theory questions are generic prompts. */
export function buildExamQuestions(level: number): {
  objective: { key: string; q: string; options: string[] }[];
  theory: ExamTheoryQuestion[];
} {
  const exam = EXAMS.find((e) => e.level === level);
  if (!exam) return { objective: [], theory: [] };
  const levelTopics = TOPICS.filter((t) => t.level === level);
  const objective = Array.from({ length: exam.objectiveCount }, (_, i) => {
    const topic = levelTopics[i % levelTopics.length];
    return {
      key: `obj-${i}`,
      q: `Objective ${i + 1}: Which statement is correct about “${topic.title}”?`,
      options: [topic.summary, ...WRONG_OPTIONS],
    };
  });
  const theory = Array.from({ length: exam.theoryCount }, (_, i) => ({
    key: `theory-${i}`,
    q: `Theory ${i + 1}: Explain, with a worked example, a key idea from Level ${level} and how you would apply it in a real project.`,
  }));
  return { objective, theory };
}

/* Deterministic shuffle: FNV-1a hash of (seed + ":" + key) feeds mulberry32,
 * Fisher–Yates over a copy. The same (seed, key) always yields the same
 * order, so exam-start and exam-submit agree without storing the order. */
function hashSeed(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(a: number): () => number {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* Shuffle one question's options. `options[0]` is the correct answer
 * before shuffling; the returned `correctIndex` is where it landed.
 * Never send `correctIndex` to the client — it is for marking only. */
export function shuffleOptions(
  seed: string,
  key: string,
  options: string[]
): { options: string[]; correctIndex: number } {
  const rand = mulberry32(hashSeed(`${seed}:${key}`));
  const arr = options.map((text, idx) => ({ text, idx }));
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    const tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
  }
  return {
    options: arr.map((o) => o.text),
    correctIndex: arr.findIndex((o) => o.idx === 0),
  };
}

/* Re-derive the correct shuffled index for marking. */
export function correctShuffledIndex(
  seed: string,
  key: string,
  optionCount: number
): number {
  const base = Array.from({ length: optionCount }, (_, i) => `option-${i}`);
  return shuffleOptions(seed, key, base).correctIndex;
}
