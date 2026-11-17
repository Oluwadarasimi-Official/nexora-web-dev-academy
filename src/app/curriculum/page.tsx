import Link from "next/link";
import { PageHero, DiamondRule } from "@/components/ui";
import { LEVELS, TOPICS } from "@/lib/curriculum";

const CHAPTERS = ["Chapter One", "Chapter Two", "Chapter Three"];

/* The curriculum as a contents page from a fine book: each level is a
   chapter, each module a headed section, and each topic an index line —
   a serif index number, the title, a dotted gold leader, and "10
   questions" at the right. No uniform cards, no pills. */
export default function Curriculum() {
 return (<div>
 <PageHero title="Curriculum" intro="Every lesson, every question, in order. Pick a level below — each topic is one full lesson with a 10-question quiz at the end. Full lessons, quizzes and examinations open to activated students in the student portal." />
 <section className="mx-auto max-w-6xl px-4 py-6">
 {LEVELS.map((l, i) => {
 const topics = TOPICS.filter((t) => t.level === l.level);
 const modules = Array.from(new Set(topics.map((t) => t.module)));
 return (
 <div key={l.level} className="border-t border-[#ece2bd] py-10 first:border-t-0 first:pt-4">
 <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold-dark">{CHAPTERS[i]}</p>
 <h2 className="mt-2 font-display text-3xl font-semibold leading-tight text-navy">Level {l.level} — {l.name}</h2>
 <p className="mt-1 text-sm font-semibold text-gold-dark">{topics.length} topics · {topics.length * 10} questions · Final examination · {l.certificateTitle}</p>
 <DiamondRule className="mt-4 max-w-40" />
 <div className="mt-8 space-y-10">
 {modules.map((m) => (
 <div key={m}>
 <h3 className="font-display text-xl font-semibold text-navy">{m}</h3>
 <span className="rule-gold mt-2" aria-hidden="true" />
 <ol className="mt-4 space-y-3.5">
 {topics.filter((t) => t.module === m).map((t, j) => (
 <li key={t.slug}>
 <div className="flex items-baseline gap-2">
 <span className="shrink-0 font-display text-base font-semibold text-gold-dark">{j + 1}.</span>
 <Link className="min-w-0 font-medium leading-snug text-navy hover:text-gold-dark" href={`/dashboard/topic/${t.slug}`}>{t.title}</Link>
 <span aria-hidden="true" className="index-leader" />
 <span className="shrink-0 text-xs font-bold uppercase tracking-wide text-gold-dark">10 questions</span>
 </div>
 <p className="ml-6 mt-0.5 text-sm leading-relaxed text-slate-500">{t.summary}</p>
 </li>
 ))}
 </ol>
 </div>
 ))}
 </div>
 </div>
 );
 })}
 </section>
 </div>);
}
