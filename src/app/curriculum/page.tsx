import Link from "next/link";
import { PageHero } from "@/components/ui";
import { LEVELS, TOPICS } from "@/lib/curriculum";
export default function Curriculum() {
 return (<div>
 <PageHero title="Curriculum" intro="Every lesson, every question, in order. Pick a level below — each topic is one full lesson with a 10-question quiz at the end. Full lessons, quizzes and examinations open to activated students in the student portal." />
 <section className="mx-auto max-w-6xl space-y-12 px-4 py-10">
 {LEVELS.map((l, i) => {
 const topics = TOPICS.filter((t) => t.level === l.level);
 const modules = Array.from(new Set(topics.map((t) => t.module)));
 return (
 <div key={l.level}>
 <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
 <p className="level-num">0{i + 1}</p>
 <div>
 <h2 className="font-display text-3xl font-semibold leading-tight text-navy">Level {l.level} — {l.name}</h2>
 <p className="mt-1 text-sm font-semibold text-gold-dark">{topics.length} topics · {topics.length * 10} questions · Final examination · {l.certificateTitle}</p>
 </div>
 </div>
 <div className="mt-6 space-y-5">
 {modules.map((m) => (
 <div key={m} className="card-soft p-5 sm:p-6">
 <h3 className="font-display text-xl font-semibold text-navy">{m}</h3>
 <ol className="mt-3 space-y-2.5">
 {topics.filter((t) => t.module === m).map((t, j) => (
 <li key={t.slug} className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-sm">
 <span className="inline-flex h-6 w-6 shrink-0 translate-y-0.5 items-center justify-center rounded-full bg-gold/15 text-xs font-bold text-gold-dark ring-1 ring-gold/40">{j + 1}</span>
 <Link className="font-medium text-navy hover:text-gold-dark" href={`/dashboard/topic/${t.slug}`}>{t.title}</Link>
 <span className="text-slate-500">— {t.summary}</span>
 <span className="ml-auto rounded-full border border-gold/50 bg-white px-2 py-0.5 text-xs font-semibold text-gold-dark">10 questions</span>
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
