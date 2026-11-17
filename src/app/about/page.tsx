import Image from "next/image";
import { PageHero, Card, SectionTitle } from "@/components/ui";
import { AUTHORITIES } from "@/lib/data";
export default function About() {
  return (<div>
    <PageHero title="About the Academy" intro="Nexora Web Dev. Academy is a structured online learning programme for people who want to learn web development properly — from the first principles of the web to a deployed, production full-stack application." />
    <section className="mx-auto max-w-6xl px-4 py-10">
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <SectionTitle>Who we are</SectionTitle>
          <p className="mt-3 text-slate-600">The academy is led by {AUTHORITIES.join(" and ")}. The programme is organised in three levels — Beginner, Intermediate and Advanced — with 73 topics in total. Every topic has a full lesson and a 10-question quiz; every level ends in a final examination; every level earns its own certificate when the work is genuinely complete.</p>
          <p className="mt-3 text-slate-600">We teach by building. Lessons explain ideas in plain language, show correct code, warn about common mistakes, and end in a practical activity. Progress is measured by completed work, not by time spent on a page.</p>
        </div>
        <div className="flex justify-center"><Image src="/logo.png" alt="Nexora Web Dev. Academy official logo" width={360} height={360} className="h-auto w-full max-w-sm rounded-2xl border border-[#e8dfc8] bg-white object-contain p-4" /></div>
      </div>
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <Card><h3 className="font-bold text-navy">Structured</h3><p className="mt-2 text-sm text-slate-600">Levels unlock in order. You cannot skip ahead to Advanced without completing Beginner and Intermediate.</p></Card>
        <Card><h3 className="font-bold text-navy">Measured</h3><p className="mt-2 text-sm text-slate-600">Three new topics per day, 70% quiz pass mark, 70% examination pass mark. Every attempt is recorded.</p></Card>
        <Card><h3 className="font-bold text-navy">Honest</h3><p className="mt-2 text-sm text-slate-600">No fake progress, no invented results, no accreditation claims. Certificates are issued only for work actually done.</p></Card>
      </div>
    </section>
  </div>);
}
