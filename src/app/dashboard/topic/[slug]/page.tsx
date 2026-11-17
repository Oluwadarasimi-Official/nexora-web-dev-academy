"use client";
import { Check, Lock } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import DashboardShell from "@/components/DashboardShell";
import { Card, Alert } from "@/components/ui";
import { topicBySlug, topicsForLevel, levelUnlocked } from "@/lib/curriculum";
import type { Topic } from "@/lib/curriculum";
import { loadProgress, saveProgress, lagosDate, pushNotification, useSyncedProgress } from "@/lib/store";
import { studentPost } from "@/lib/studentClient";

// Lesson slideshow (JAMB Prep pattern, academy gold-only classic look):
// the lesson is split at render time from its natural structure — one slide
// per part — and shown one slide at a time, with Next / Previous buttons,
// dots, swipe and keyboard arrows. No curriculum data changes, no content
// changes; only how the lesson is displayed.
type Slide =
  | { kind: "objectives"; label: string }
  | { kind: "lesson"; label: string; index: number }
  | { kind: "example"; label: string }
  | { kind: "activity"; label: string }
  | { kind: "mistakes"; label: string }
  | { kind: "recap"; label: string };

function buildSlides(topic: Topic | undefined): Slide[] {
  if (!topic) return [];
  const slides: Slide[] = [{ kind: "objectives", label: "Learning objectives" }];
  topic.explanation.forEach((_, i) =>
    slides.push({ kind: "lesson", label: `Lesson · Part ${i + 1}`, index: i })
  );
  slides.push(
    { kind: "example", label: "Worked example" },
    { kind: "activity", label: "Practical activity" },
    { kind: "mistakes", label: "Common mistakes" },
    { kind: "recap", label: "Recap" },
  );
  return slides;
}

export default function TopicPage({ params }: { params: { slug: string } }) {
 const topic = topicBySlug(params.slug);
 const [msg, setMsg] = useState(""); const [err, setErr] = useState("");
 const [busy, setBusy] = useState(false);
 // Hooks must run before the early return below (rules of hooks).
 const p = useSyncedProgress();
 const [slide, setSlide] = useState(0);
 const touchX = useRef<number | null>(null);
 const slideBoxRef = useRef<HTMLDivElement | null>(null);
 const firstSlideRun = useRef(true);
 const slides = useMemo(() => buildSlides(topic), [topic]);
 const total = slides.length;
 const go = useCallback(
   (n: number) => setSlide(Math.min(Math.max(0, n), Math.max(0, total - 1))),
   [total]
 );
 const next = useCallback(() => go(slide + 1), [go, slide]);
 const prev = useCallback(() => go(slide - 1), [go, slide]);
 // Lesson-view gate: record that this lesson was opened, so its quiz can
 // open. Runs on mount (deep-linking straight here still mounts the page,
 // so the view cannot be skipped) and again after server hydration
 // confirms the account is activated / the level unlocked. Fire-and-
 // forget: a failed record simply leaves the quiz locked until the lesson
 // is opened again. On success — or in the local demo flow (no server) —
 // also record the view locally so the quiz unlocks on this device.
 useEffect(() => {
   if (!topic) return;
   if (!p.activated) return;
   if (!levelUnlocked(topic.level, p.completedTopics.length)) return;
   let cancelled = false;
   studentPost<{ ok?: boolean }>("/api/lesson-view", { slug: topic.slug })
     .then(() => {
       if (cancelled) return;
       const next = loadProgress();
       if (!next.openedLessons.includes(topic.slug)) {
         next.openedLessons = [...next.openedLessons, topic.slug];
         saveProgress(next);
       }
     })
     .catch(() => {});
   return () => { cancelled = true; };
 }, [topic, p.activated, p.completedTopics.length]);
 // Keyboard navigation (JAMB Prep pattern): ← / → move between slides.
 // No-op while the lesson is locked (the slideshow is not rendered).
 useEffect(() => {
   const onKey = (e: KeyboardEvent) => {
     if (!topic) return;
     if (!p.activated) return;
     if (!levelUnlocked(topic.level, p.completedTopics.length)) return;
     if (e.key === "ArrowRight") { e.preventDefault(); next(); }
     if (e.key === "ArrowLeft") { e.preventDefault(); prev(); }
   };
   window.addEventListener("keydown", onKey);
   return () => window.removeEventListener("keydown", onKey);
 }, [next, prev, topic, p.activated, p.completedTopics.length]);
 // Bring the new slide into view when the student moves (the controls sit
 // below the slide; without this the next slide can start off-screen on a
 // phone). Skipped on first mount, where the page is already at the top.
 useEffect(() => {
   if (firstSlideRun.current) { firstSlideRun.current = false; return; }
   slideBoxRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
 }, [slide]);
 // Reset to the first slide when the lesson changes.
 useEffect(() => { setSlide(0); }, [topic?.slug]);
 if (!topic) return <DashboardShell title="Topic not found"><p className="text-slate-600">That topic does not exist. Return to <Link className="text-sky" href="/dashboard/courses">My Courses</Link>.</p></DashboardShell>;
 const done = p.completedTopics.includes(topic.slug);
 const isNew = !done;
 const today = lagosDate();
 const remaining = Math.max(0, 3 - (p.daily[today] || 0));
 const levelDone = topicsForLevel(topic.level).filter((t) => p.completedTopics.includes(t.slug)).length;
 const levelTotal = topicsForLevel(topic.level).length;
 const unlocked = levelUnlocked(topic.level, p.completedTopics.length);
 const locked = !p.activated || !unlocked;

 const topicSlug = topic.slug; const topicLevel = topic.level; const topicTitle = topic.title;
 async function completeTopic() {
 setErr(""); setMsg("");
 if (!p.activated) return setErr("Your account is not activated yet. Redeem your access code first.");
 if (!unlocked) return setErr("This level is locked. Complete the previous level first.");
 const quiz = p.quizAttempts[topicSlug];
 if (!quiz?.passed) return setErr("Complete this topic's quiz first and score at least 7/10. A passed quiz is required before a topic can be marked complete.");
 setBusy(true);
 try {
 // No client-score sync step any more: the old repair endpoint that
 // trusted client-asserted scores was deleted. The server's
 // complete-topic gate reads the persisted quiz_attempts table directly,
 // and quiz-submit persists the attempt when the quiz is marked — a
 // passed quiz is already on the server by the time the student gets here.
 const data = await studentPost<{ persisted?: boolean }>("/api/complete-topic", { slug: topicSlug, level: topicLevel, isNew, lagosDate: today });
 const next = loadProgress();
 if (!next.completedTopics.includes(topicSlug)) next.completedTopics.push(topicSlug);
 if (isNew) next.daily[today] = (next.daily[today] || 0) + 1;
 pushNotification(next, `Topic completed: ${topicTitle} (Level ${topicLevel}).`);
 saveProgress(next);
 setMsg(`Topic completed. ${data.persisted ? "Saved to the academy database." : "Saved on this device."} Remaining new topics today: ${isNew ? Math.max(0, remaining - 1) : remaining}.`);
 } catch (e) { setErr(e instanceof Error ? e.message : "Network error. Try again."); }
 finally { setBusy(false); }
 }

 // Clamp for the transient render after the lesson changes, before the
 // reset effect above runs (the previous lesson may have had more slides).
 const shown = Math.min(slide, Math.max(0, total - 1));
 const current = slides[shown];
 const onTouchStart = (e: React.TouchEvent) => { touchX.current = e.touches[0].clientX; };
 const onTouchEnd = (e: React.TouchEvent) => {
   if (touchX.current === null) return;
   const dx = e.changedTouches[0].clientX - touchX.current;
   touchX.current = null;
   if (dx < -50) next();
   else if (dx > 50) prev();
 };

 return (
 <DashboardShell title={topic.title}>
 <p className="text-sm text-slate-600">Level {topic.level} · {topic.module} · {done ? (<>Completed <Check className="inline h-4 w-4 text-sky-600" /></>) : "Not yet completed"} · Level progress: {levelDone}/{levelTotal}</p>
 {locked ? (
 <Card className="mt-4">
 <h3 className="font-bold text-navy"><Lock className="inline h-5 w-5 text-amber-700" /> This lesson is locked</h3>
 <p className="mt-2 text-sm leading-relaxed text-slate-700">{!p.activated ? "Your account is not activated yet. Pay on WhatsApp, get your access code from the owner, and redeem it to unlock this lesson and its quiz." : `This level is locked. Complete Level ${topic.level - 1} (all topics and quizzes) first.`}</p>
 {!p.activated && <Link href="/dashboard/payment" className="mt-4 inline-block btn-gold px-4 py-2 text-sm font-semibold">Go to Payment &amp; Activation</Link>}
 </Card>
 ) : (
 <div className="mt-4 space-y-5">
 {/* Slide progress: step indicator, gold bar, and dots. */}
 <Card>
 <div className="flex items-center justify-between gap-3 flex-wrap">
 <p className="text-sm font-semibold text-navy">Slide {shown + 1} of {total}: {current?.label}</p>
 <span className="shrink-0 text-sm text-slate-500">{shown + 1}/{total}</span>
 </div>
 <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#f3e9c8]">
 <div className="h-full rounded-full bg-gold transition-all" style={{ width: `${((shown + 1) / total) * 100}%` }} />
 </div>
 <div className="mt-3 flex flex-wrap gap-1.5" role="tablist" aria-label="Lesson slides">
 {slides.map((s, i) => (
 <button key={i} role="tab" aria-selected={i === shown} aria-label={`Go to slide ${i + 1}: ${s.label}`} onClick={() => go(i)}
 className={`min-w-0 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors ${i === shown ? "border-gold bg-gold text-navy" : "border-[#e7cd7a] bg-white text-slate-600 hover:bg-[#fbf6e4]"}`}>
 {i + 1}. {s.label}
 </button>
 ))}
 </div>
 </Card>

 {/* One slide at a time — swipe left/right to move. */}
 <div key={shown} ref={slideBoxRef} className="slide-enter" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
 <Card>
 {current?.kind === "objectives" && (
 <div>
 <h3 className="font-bold text-navy">Learning objectives</h3>
 <p className="mt-1 text-sm text-slate-600">By the end of this lesson, you should be able to:</p>
 <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">{topic.objectives.map((o, i) => (<li key={i}>{o}</li>))}</ul>
 </div>
 )}
 {current?.kind === "lesson" && (
 <div>
 <h3 className="font-bold text-navy">Lesson · Part {current.index + 1} of {topic.explanation.length}</h3>
 <p className="mt-2 text-sm leading-relaxed text-slate-700">{topic.explanation[current.index]}</p>
 </div>
 )}
 {current?.kind === "example" && (
 <div>
 <h3 className="font-bold text-navy">Worked example — {topic.codeLang}</h3>
 <pre className="mt-2 overflow-x-auto rounded-lg bg-[#0a2a5e] p-4 text-sm text-white">{topic.code}</pre>
 <p className="mt-2 text-sm text-slate-600">{topic.codeExplanation}</p>
 </div>
 )}
 {current?.kind === "activity" && (
 <div>
 <h3 className="font-bold text-navy">Practical activity / assignment</h3>
 <p className="mt-2 text-sm text-slate-700">{topic.activity}</p>
 </div>
 )}
 {current?.kind === "mistakes" && (
 <div>
 <h3 className="font-bold text-navy">Common mistakes &amp; corrections</h3>
 <ul className="mt-2 space-y-3">{topic.mistakes.map((m, i) => (<li key={i} className="text-sm"><span className="font-semibold text-red-700">Mistake:</span> <span className="text-slate-700">{m.mistake}</span><br /><span className="font-semibold text-sky-600">Correction:</span> <span className="text-slate-700">{m.correction}</span></li>))}</ul>
 </div>
 )}
 {current?.kind === "recap" && (
 <div>
 <h3 className="font-bold text-navy">Recap</h3>
 <p className="mt-2 text-sm text-slate-700">{topic.recap}</p>
 </div>
 )}
 </Card>
 </div>

 {/* Slide controls — big enough to tap on a phone. */}
 <div className="flex items-center justify-between gap-3 flex-wrap">
 <button onClick={prev} disabled={shown === 0} className="btn-outline px-5 py-2.5 text-sm font-semibold disabled:opacity-40">← Previous</button>
 <p className="text-xs text-slate-500 text-center">Swipe left/right, or use ← → on your keyboard.</p>
 {shown < total - 1 ? (
 <button onClick={next} className="btn-gold px-5 py-2.5 text-sm font-semibold">Next →</button>
 ) : (
 <Link href={`/dashboard/quiz/${topic.slug}`} className="btn-gold px-5 py-2.5 text-sm font-semibold">Take the Quiz →</Link>
 )}
 </div>

 {msg && <Alert kind="success">{msg}</Alert>}
 {err && <Alert kind="error">{err}</Alert>}
 <div className="flex flex-wrap gap-3">
 <Link href={`/dashboard/quiz/${topic.slug}`} className="btn-gold px-5 py-2.5 font-semibold">Take the 10-Question Quiz</Link>
 <button onClick={completeTopic} disabled={busy || done} className="btn-gold px-5 py-2.5 font-semibold disabled:opacity-50">{done ? (<>Topic Completed <Check className="inline h-4 w-4" /></>) : busy ? "Saving…" : "Mark Topic Complete (after passing the quiz)"}</button>
 </div>
 <p className="text-sm text-slate-500">Today&apos;s new-topic allowance: {remaining} left (Africa/Lagos, {today}). Completing a new topic uses one allowance; revising a completed topic uses none. The limit is enforced server-side in /api/complete-topic.</p>
 </div>
 )}
 </DashboardShell>
 );
}
