import Link from "next/link";
import { PageHero, SectionTitle } from "@/components/ui";
import { LEVELS, TOPICS } from "@/lib/curriculum";
export default function Curriculum() {
  return (<div>
    <PageHero title="Curriculum" intro="The complete curriculum: 73 topics across three levels. Select a topic to see its lesson outline. Full lessons, quizzes and examinations are available to activated students in the student portal." />
    <section className="mx-auto max-w-6xl space-y-8 px-4 py-10">
      {LEVELS.map((l) => {
        const topics = TOPICS.filter((t) => t.level === l.level);
        const modules = Array.from(new Set(topics.map((t) => t.module)));
        return (
          <div key={l.level}>
            <SectionTitle>Level {l.level} — {l.name} ({topics.length} topics)</SectionTitle>
            {modules.map((m) => (
              <div key={m} className="mt-4">
                <h3 className="font-bold text-navy">{m}</h3>
                <ol className="mt-2 list-decimal space-y-1 pl-6 text-sm text-slate-700">
                  {topics.filter((t) => t.module === m).map((t) => (
                    <li key={t.slug}><Link className="hover:text-sky" href={`/dashboard/topic/${t.slug}`}>{t.title}</Link> <span className="text-slate-400">— {t.summary}</span></li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
        );
      })}
    </section>
  </div>);
}
