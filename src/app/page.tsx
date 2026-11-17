import Link from "next/link";
import { Check } from "lucide-react";
import { DiamondRule, SectionTitle, GoldButton } from "@/components/ui";
import { LEVELS, TOPICS } from "@/lib/curriculum";
import { WHATSAPP_LINK, WHATSAPP_NUMBER, AUTHORITIES } from "@/lib/data";

const STATS: [string, string][] = [
 ["73", "topics, start to finish"],
 ["730", "quiz questions"],
 ["3", "level examinations"],
 ["3", "real certificates"],
];

const CHAPTERS = ["Chapter One", "Chapter Two", "Chapter Three"];

const STEPS: [string, string][] = [
 ["Register", "Make your student account — name, email, password. Two minutes, and no payment happens here."],
 ["Pay on WhatsApp", "Chat with the academy on WhatsApp and pay the way they tell you. This site never touches your money."],
 ["Send your reference", "Drop your payment reference in your dashboard. A real person checks it — not a machine."],
 ["Redeem your code", "Once approved, you get one single-use code. Enter it once and the lessons open."],
];

const RULES: [string, string][] = [
 ["3 new topics a day", "Three fresh topics per day, Lagos time. Topics you have already finished? Revise them as often as you like."],
 ["Quizzes — 7 out of 10", "Every topic ends with 10 questions. Get 7 right and the topic is yours. Miss, and you simply try again."],
 ["Exams — objective + theory", "Each level ends with a final exam. The objective part is marked instantly; a real examiner grades your theory answers. Pass mark: 70%."],
 ["Certificates — earned, not bought", "One certificate per level, only after the work is done. Anyone can check it with your certificate ID."],
];

const OUTCOMES = [
 "Semantic HTML & CSS that works on any screen",
 "Modern JavaScript and React apps",
 "Git & GitHub, the way real teams use them",
 "REST APIs with Node.js",
 "PostgreSQL data modelling",
 "Authentication & Row Level Security",
 "Shipping a full-stack app on Vercel",
 "Reading docs and debugging like a developer",
];

export default function Home() {
 return (
 <div>
 {/* Hero — a title page, not a SaaS banner: centred, framed by a gold
     rule with a diamond, the one word "Build" in gold italic with the
     hand-drawn squiggle under it. */}
 <section className="hero-band">
 <div className="mx-auto max-w-3xl px-4 pb-12 pt-10 text-center sm:pb-14 sm:pt-14">
 <DiamondRule className="mx-auto max-w-xs" />
 <p className="mt-5 text-xs font-bold uppercase tracking-[0.2em] text-gold-dark">Nexora Web Dev. Academy</p>
 <h1 className="mt-3 font-display text-5xl font-semibold leading-[1.05] text-navy sm:text-6xl">
 Learn. <em className="text-gold-dark"><span className="squiggle">Build<svg viewBox="0 0 120 12" preserveAspectRatio="none" aria-hidden="true"><path d="M3 8 Q 20 3 40 7 T 78 7 T 117 6" fill="none" stroke="#c9a227" strokeWidth="3.5" strokeLinecap="round" /></svg></span></em>. Innovate.
 </h1>
 <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-slate-600">
 73 lessons. 730 questions. Three levels, three real certificates. Read a lesson, pass its quiz, sit the exam — and walk away with something you can actually prove.
 </p>
 <div className="mt-7 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
 <GoldButton href="/register" className="w-full max-w-xs text-center sm:w-auto">Register as a Student</GoldButton>
 <Link href="/curriculum" className="btn-outline w-full max-w-xs px-5 py-2.5 text-center sm:w-auto">See the Curriculum</Link>
 </div>
 <p className="mx-auto mt-5 max-w-xl text-sm text-slate-500">Run by {AUTHORITIES.join(" & ")}. Payment is made outside this platform on WhatsApp: {WHATSAPP_NUMBER}.</p>
 </div>
 </section>

 {/* The numbers as a ledger strip — serif figures on the bare page,
     divided by gold hairlines. No card, no widget. */}
 <section className="mx-auto max-w-6xl px-4 pt-8">
 <div className="ledger border-y border-[#ece2bd]">
 {STATS.map(([n, label]) => (
 <div key={label} className="ledger-cell">
 <p className="stat-num">{n}</p>
 <p className="mt-1 text-sm text-slate-600">{label}</p>
 </div>
 ))}
 </div>
 </section>

 {/* The levels as chapters on one gold spine — a journey, not a grid. */}
 <section className="mx-auto max-w-6xl px-4 py-12">
 <SectionTitle kicker="The Programme">Three levels. One clear path.</SectionTitle>
 <p className="mt-4 max-w-2xl text-slate-600">Start at Beginner. A level opens only when the one before it is fully done — every lesson read, every quiz passed, every exam passed. No skipping, no shortcuts.</p>
 <div className="journey mt-10 space-y-10">
 {LEVELS.map((l, i) => {
 const n = TOPICS.filter((t) => t.level === l.level).length;
 return (
 <div key={l.level} className="flex gap-4 sm:gap-6">
 <div className="w-16 shrink-0 text-center sm:w-24">
 <span className="journey-num">0{i + 1}</span>
 </div>
 <div className="min-w-0 pt-1 sm:pt-3">
 <p className="text-xs font-bold uppercase tracking-[0.18em] text-gold-dark">{CHAPTERS[i]} · Level {l.level}</p>
 <h3 className="mt-1 font-display text-2xl font-semibold text-navy sm:text-3xl">{l.name}</h3>
 <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">{l.description}</p>
 <p className="mt-3 text-sm font-semibold text-navy">{n} topics · {n * 10} questions · Final exam</p>
 <p className="mt-1 text-sm text-slate-600">Certificate: {l.certificateTitle}</p>
 </div>
 </div>
 );
 })}
 </div>
 <p className="mt-12 text-center font-display text-xl italic text-navy">Finish all three chapters, and you hold three certificates — each one verifiable by its ID.</p>
 </section>

 {/* Enrolment — a handbook procedure: big serif numerals, each step
     opened by a gold rule. No dots on a rail. */}
 <section className="mx-auto max-w-6xl px-4 py-4 pb-12">
 <SectionTitle kicker="Enrolment">How enrolment works</SectionTitle>
 <p className="mt-4 max-w-2xl text-slate-600">Four steps, and you are in. Nothing hidden, nothing automatic — a person handles your payment and your code.</p>
 <div className="mt-10 grid gap-8 md:grid-cols-4 md:gap-5">
 {STEPS.map(([t, d], i) => (
 <div key={t} className="border-t-2 border-[#e7cd7a] pt-4">
 <p className="step-num">{i + 1}</p>
 <h3 className="mt-2 font-display text-xl font-semibold text-navy">{t}</h3>
 <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{d}</p>
 </div>
 ))}
 </div>
 <div className="mt-10">
 <a href={WHATSAPP_LINK} target="_blank" rel="noreferrer" className="btn-outline px-5 py-2.5 font-semibold">Contact the Academy on WhatsApp</a>
 </div>
 </section>

 {/* The rules as a charter: one calm column of numbered rules, divided
     by hairlines. No cards. */}
 <section className="mx-auto max-w-6xl px-4 py-4 pb-12">
 <SectionTitle kicker="The House Rules">The rules, in plain language</SectionTitle>
 <div className="mt-8 max-w-3xl">
 {RULES.map(([t, d], i) => (
 <div key={t} className="flex gap-4 border-t border-[#ece2bd] py-5 first:border-t-0">
 <p className="step-num shrink-0">0{i + 1}</p>
 <div>
 <h3 className="font-display text-xl font-semibold text-navy">{t}</h3>
 <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{d}</p>
 </div>
 </div>
 ))}
 </div>
 </section>

 <section className="mx-auto max-w-6xl px-4 py-4 pb-14">
 <SectionTitle kicker="The Outcome">What you&apos;ll walk away able to do</SectionTitle>
 <p className="mt-4 max-w-2xl text-slate-600">By the end of the programme, these are not things you have read about — they are things you have built.</p>
 <div className="mt-8 grid gap-x-8 gap-y-3 md:grid-cols-2">
 {OUTCOMES.map((o) => (
 <p key={o} className="flex items-start gap-2.5 text-slate-700">
 <Check className="mt-0.5 h-5 w-5 shrink-0 text-gold-dark" aria-hidden="true" />
 <span>{o}</span>
 </p>
 ))}
 </div>
 {/* Colophon — the sign-off, centred, like the last page of a book. */}
 <div className="mt-14 text-center">
 <DiamondRule className="mx-auto max-w-xs" />
 <p className="mt-4 font-display text-2xl italic text-navy">Learn. Build. Innovate.</p>
 <p className="mx-auto mt-3 max-w-xl text-sm text-slate-500">This programme teaches skills. It does not claim government accreditation, university affiliation or any external endorsement.</p>
 </div>
 </section>

 </div>
 );
}
