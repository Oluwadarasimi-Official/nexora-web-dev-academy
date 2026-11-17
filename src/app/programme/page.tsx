import Link from "next/link";
import { PageHero, Card, GoldButton } from "@/components/ui";
import { LEVELS, TOPICS, EXAMS } from "@/lib/curriculum";
export default function Programme() {
  return (<div>
    <PageHero title="Learning Programme" intro="Three levels, 73 topics, a quiz for every topic, a final examination for every level, and a certificate for every level you genuinely complete." />
    <section className="mx-auto max-w-6xl space-y-6 px-4 py-7">
      {LEVELS.map((l) => {
        const topics = TOPICS.filter((t) => t.level === l.level);
        const exam = EXAMS.find((e) => e.level === l.level);
        const modules = Array.from(new Set(topics.map((t) => t.module)));
        return (
          <Card key={l.level}>
            <h2 className="text-xl font-bold text-white">Level {l.level} — {l.name} · {topics.length} topics</h2>
            <p className="mt-2 text-slate-300">{l.description}</p>
            <p className="mt-2 text-sm text-slate-300"><strong>Modules:</strong> {modules.join(" · ")}</p>
            <p className="mt-1 text-sm text-slate-300"><strong>Examination:</strong> {exam?.title} — {exam?.durationMinutes} minutes, {exam?.objectiveCount} objective + {exam?.theoryCount} theory questions, pass mark {exam?.passMarkPercent}%.</p>
            <p className="mt-1 text-sm text-slate-300"><strong>Certificate on completion:</strong> {l.certificateTitle}</p>
            <Link href={`/dashboard/level/${l.level}`} className="mt-3 inline-block font-semibold text-cyan-300">Open Level {l.level} →</Link>
          </Card>
        );
      })}
      <div><GoldButton href="/register">Register to Start Learning</GoldButton></div>
    </section>
  </div>);
}
