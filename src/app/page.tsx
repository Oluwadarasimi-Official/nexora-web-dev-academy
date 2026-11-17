import Link from "next/link";
import { Card, SectionTitle, GoldButton } from "@/components/ui";
import { LEVELS, TOPICS } from "@/lib/curriculum";
import { FAQS, WHATSAPP_LINK, WHATSAPP_NUMBER, AUTHORITIES } from "@/lib/data";

export default function Home() {
 return (
 <div>
 <section className="border-b border-slate-200 bg-white">
 <div className="mx-auto max-w-6xl px-4 py-10">
 <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold-dark">Nexora Web Dev. Academy</p>
 <h1 className="mt-2 max-w-3xl text-4xl font-extrabold leading-tight tracking-tight text-navy sm:text-5xl">Learn. Build. Innovate.</h1>
 <p className="mt-4 max-w-3xl text-lg text-slate-600">A structured web development programme that takes you from your first HTML tag to a production full-stack application — with real lessons, real quizzes, real examinations and real certificates.</p>
 <div className="mt-6 flex flex-wrap gap-3">
 <GoldButton href="/register">Register as a Student</GoldButton>
 <Link href="/curriculum" className="btn-sky px-5 py-2.5">See the Curriculum</Link>
 </div>
 <p className="mt-4 max-w-3xl text-sm text-slate-500">Academy authorities: {AUTHORITIES.join(" & ")}. Payment is made outside this platform via WhatsApp: {WHATSAPP_NUMBER}.</p>
 </div>
 </section>

 <section className="mx-auto max-w-6xl px-4 py-8">
 <SectionTitle>Three levels. One clear path.</SectionTitle>
 <p className="mt-2 text-slate-600">Start at Beginner. Each level unlocks only when the previous level is fully complete — every lesson read, every quiz passed, every examination passed.</p>
 <div className="mt-6 grid gap-4 md:grid-cols-3">
 {LEVELS.map((l) => {
 const n = TOPICS.filter((t) => t.level === l.level).length;
 return (
 <Card key={l.level}>
 <p className="text-xs font-bold uppercase tracking-widest text-gold-dark">Level {l.level}</p>
 <h3 className="mt-1 text-xl font-bold text-navy">{l.name}</h3>
 <p className="mt-2 text-sm text-slate-600">{l.description}</p>
 <p className="mt-3 text-sm font-semibold text-navy">{n} topics · 10-question quiz per topic · Final examination</p>
 <p className="mt-1 text-sm text-slate-600">Certificate: {l.certificateTitle}</p>
 </Card>
 );
 })}
 </div>
 </section>

 <section className="mx-auto max-w-6xl px-4 py-6">
 <SectionTitle>How enrolment works</SectionTitle>
 <div className="mt-6 grid gap-4 md:grid-cols-4">
 {[
 ["1. Register", "Create your student account with your full name, email and password."],
 ["2. Pay outside the platform", "Contact the academy on WhatsApp and pay through the method the academy communicates. This site never receives or holds funds."],
 ["3. Submit your reference", "Send your payment confirmation/reference from your student dashboard. An administrator verifies it independently."],
 ["4. Activate with your code", "After approval, an administrator assigns you one single-use access code. Redeem it once and start learning."],
 ].map(([t, d]) => (<Card key={t}><h3 className="font-bold text-navy">{t}</h3><p className="mt-2 text-sm text-slate-600">{d}</p></Card>))}
 </div>
 <div className="mt-6 flex flex-wrap gap-3">
 <a href={WHATSAPP_LINK} target="_blank" rel="noreferrer" className="btn-sky px-5 py-2.5 font-semibold">Contact the Academy on WhatsApp</a>
 </div>
 </section>

 <section className="mx-auto max-w-6xl px-4 py-6">
 <SectionTitle>Learning rules, in plain language</SectionTitle>
 <div className="mt-6 grid gap-4 md:grid-cols-2">
 <Card><h3 className="font-bold text-navy">Daily limit — 3 new topics</h3><p className="mt-2 text-sm text-slate-600">You may complete at most three new topics per calendar day (Africa/Lagos time). The limit is enforced on the server, so refreshing, logging out or switching devices cannot bypass it. Topics you have already completed can be revised any time.</p></Card>
 <Card><h3 className="font-bold text-navy">Quizzes — 70% to pass</h3><p className="mt-2 text-sm text-slate-600">Every topic has exactly 10 multiple-choice questions. You need at least 7 correct to pass and complete the topic. A failed quiz does not complete the topic — you may try again, and every attempt is saved.</p></Card>
 <Card><h3 className="font-bold text-navy">Examinations — objective + theory</h3><p className="mt-2 text-sm text-slate-600">Each level ends in a final examination, available only when that level&apos;s topics and quizzes are complete. Objective questions are marked automatically; theory answers are graded by an authorised examiner against a published rubric. The pass mark is 70%.</p></Card>
 <Card><h3 className="font-bold text-navy">Certificates — earned, not bought</h3><p className="mt-2 text-sm text-slate-600">A certificate is issued only after real completion and a passed examination — one per student per level. Anyone can verify a certificate ID on the public verification page.</p></Card>
 </div>
 </section>

 <section className="mx-auto max-w-6xl px-4 py-6">
 <SectionTitle>What you will be able to do</SectionTitle>
 <p className="mt-2 text-slate-600">By the end of the programme you will be able to build semantic, responsive websites with HTML and CSS; write modern JavaScript and React applications; work with Git and GitHub; build REST APIs with Node.js; model data in PostgreSQL; secure an application with authentication and Row Level Security; and deploy a production full-stack project on Vercel.</p>
 <p className="mt-3 text-sm text-slate-500">This programme teaches skills. It does not claim government accreditation, university affiliation or any external endorsement.</p>
 </section>

 <section className="mx-auto max-w-6xl px-4 py-6">
 <SectionTitle>Frequently asked questions</SectionTitle>
 <div className="mt-6 space-y-3">
 {FAQS.map((f) => (
 <details key={f.q} className="rounded-xl border border-slate-200 card p-4">
 <summary className="cursor-pointer font-semibold text-navy">{f.q}</summary>
 <p className="mt-2 text-sm text-slate-600">{f.a}</p>
 </details>
 ))}
 </div>
 </section>
 </div>
 );
}
