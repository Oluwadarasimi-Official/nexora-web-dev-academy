import pathlib, textwrap
R = pathlib.Path("/home/hatch/workspace/nexora-web-dev-academy/src/app")
def w(p, s):
    f = R / p; f.parent.mkdir(parents=True, exist_ok=True); f.write_text(textwrap.dedent(s).lstrip("\n"))
    print("wrote", p)

w("page.tsx", '''
import Link from "next/link";
import Image from "next/image";
import { Card, SectionTitle, GoldButton } from "@/components/ui";
import { LEVELS, TOPICS } from "@/lib/curriculum";
import { FAQS, WHATSAPP_LINK, WHATSAPP_NUMBER, AUTHORITIES } from "@/lib/data";

export default function Home() {
  return (
    <div>
      <section className="border-b border-[#e8dfc8] bg-[#fdf8ec]">
        <div className="mx-auto grid max-w-6xl items-center gap-8 px-4 py-12 sm:grid-cols-2">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold-dark">Nexora Web Dev. Academy</p>
            <h1 className="mt-2 text-4xl font-extrabold leading-tight tracking-tight text-navy sm:text-5xl">Learn. Build. Innovate.</h1>
            <p className="mt-4 text-lg text-slate-600">A structured web development programme that takes you from your first HTML tag to a production full-stack application — with real lessons, real quizzes, real examinations and real certificates.</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <GoldButton href="/register">Register as a Student</GoldButton>
              <Link href="/curriculum" className="rounded-lg border border-navy px-5 py-2.5 font-semibold text-navy hover:bg-navy hover:text-white">See the Curriculum</Link>
            </div>
            <p className="mt-4 text-sm text-slate-500">Academy authorities: {AUTHORITIES.join(" & ")}. Payment is made outside this platform via WhatsApp: {WHATSAPP_NUMBER}.</p>
          </div>
          <div className="flex justify-center">
            <Image src="/logo.png" alt="Nexora Web Dev. Academy official logo" width={420} height={420} className="h-auto w-full max-w-md rounded-2xl border border-[#e8dfc8] bg-white object-contain p-4 shadow-sm" priority />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
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
          <a href={WHATSAPP_LINK} target="_blank" rel="noreferrer" className="rounded-lg bg-[#128c4b] px-5 py-2.5 font-semibold text-white">Contact the Academy on WhatsApp</a>
          <GoldButton href="/how-it-works">Read How It Works</GoldButton>
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
            <details key={f.q} className="rounded-xl border border-[#e8dfc8] bg-white p-4">
              <summary className="cursor-pointer font-semibold text-navy">{f.q}</summary>
              <p className="mt-2 text-sm text-slate-600">{f.a}</p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
''')

w("about/page.tsx", '''
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
''')

w("programme/page.tsx", '''
import Link from "next/link";
import { PageHero, Card, SectionTitle, GoldButton } from "@/components/ui";
import { LEVELS, TOPICS, EXAMS } from "@/lib/curriculum";
export default function Programme() {
  return (<div>
    <PageHero title="Learning Programme" intro="Three levels, 73 topics, a quiz for every topic, a final examination for every level, and a certificate for every level you genuinely complete." />
    <section className="mx-auto max-w-6xl space-y-6 px-4 py-10">
      {LEVELS.map((l) => {
        const topics = TOPICS.filter((t) => t.level === l.level);
        const exam = EXAMS.find((e) => e.level === l.level);
        const modules = [...new Set(topics.map((t) => t.module))];
        return (
          <Card key={l.level}>
            <h2 className="text-xl font-bold text-navy">Level {l.level} — {l.name} · {topics.length} topics</h2>
            <p className="mt-2 text-slate-600">{l.description}</p>
            <p className="mt-2 text-sm text-slate-600"><strong>Modules:</strong> {modules.join(" · ")}</p>
            <p className="mt-1 text-sm text-slate-600"><strong>Examination:</strong> {exam?.title} — {exam?.durationMinutes} minutes, {exam?.objectiveCount} objective + {exam?.theoryCount} theory questions, pass mark {exam?.passMarkPercent}%.</p>
            <p className="mt-1 text-sm text-slate-600"><strong>Certificate on completion:</strong> {l.certificateTitle}</p>
            <Link href={`/dashboard/level/${l.level}`} className="mt-3 inline-block font-semibold text-sky">Open Level {l.level} →</Link>
          </Card>
        );
      })}
      <div><GoldButton href="/register">Register to Start Learning</GoldButton></div>
    </section>
  </div>);
}
''')

w("curriculum/page.tsx", '''
import Link from "next/link";
import { PageHero, SectionTitle } from "@/components/ui";
import { LEVELS, TOPICS } from "@/lib/curriculum";
export default function Curriculum() {
  return (<div>
    <PageHero title="Curriculum" intro="The complete curriculum: 73 topics across three levels. Select a topic to see its lesson outline. Full lessons, quizzes and examinations are available to activated students in the student portal." />
    <section className="mx-auto max-w-6xl space-y-8 px-4 py-10">
      {LEVELS.map((l) => {
        const topics = TOPICS.filter((t) => t.level === l.level);
        const modules = [...new Set(topics.map((t) => t.module))];
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
''')

w("how-it-works/page.tsx", '''
import { PageHero, Card, SectionTitle } from "@/components/ui";
import { WHATSAPP_NUMBER, WHATSAPP_LINK } from "@/lib/data";
export default function HowItWorks() {
  const steps = [
    ["Register", "Create your account with your full name, email and a secure password. Your profile is linked to your account and only you can see your private records."],
    ["Contact the academy and pay", `Payment happens outside this platform. Message the academy on WhatsApp (${WHATSAPP_NUMBER}) and pay through the method the academy communicates. This website never receives or holds your money, and a screenshot alone is not proof of payment.`],
    ["Submit your payment reference", "From your student dashboard, submit your payment confirmation/reference. It stays pending until an administrator reviews it."],
    ["Administrator verification", "An authorised administrator independently checks the payment and approves or rejects it, with a reason and a timestamp. Only after approval is a code assigned to you."],
    ["Activate with your code", "Enter your single-use access code on the activation screen. The server validates it, checks it is unused, and redeems it atomically against your account. One code, one student, once."],
    ["Learn — 3 new topics a day", "Start at Beginner. Complete a lesson, pass its 10-question quiz (7/10), and the topic is complete. At most three new topics per calendar day (Africa/Lagos). Completed topics can be revised any time."],
    ["Pass the level examination", "When a level's topics and quizzes are complete, its final examination opens: objective questions marked automatically, theory questions graded by an examiner against a published rubric. Pass mark 70%."],
    ["Receive your certificate", "Pass the examination and your certificate for that level is issued — downloadable and printable, with a unique certificate ID anyone can verify on this site."],
  ];
  return (<div>
    <PageHero title="How It Works" intro="Eight steps from registration to certificate. Every step is enforced by the system — not by trust alone." />
    <section className="mx-auto max-w-6xl px-4 py-10">
      <div className="grid gap-4 md:grid-cols-2">
        {steps.map(([t, d], i) => (<Card key={t}><h3 className="font-bold text-navy">{i + 1}. {t}</h3><p className="mt-2 text-sm text-slate-600">{d}</p></Card>))}
      </div>
      <a href={WHATSAPP_LINK} target="_blank" rel="noreferrer" className="mt-8 inline-block rounded-lg bg-[#128c4b] px-5 py-2.5 font-semibold text-white">Start on WhatsApp — {WHATSAPP_NUMBER}</a>
    </section>
  </div>);
}
''')

w("certificates/page.tsx", '''
import Link from "next/link";
import { PageHero, Card, SectionTitle, GoldButton } from "@/components/ui";
import { LEVELS } from "@/lib/curriculum";
export default function CertificatesPage() {
  return (<div>
    <PageHero title="Certificate Information" intro="Three level-specific certificates, earned by completing real work. Each certificate carries a unique ID that anyone can verify." />
    <section className="mx-auto max-w-6xl px-4 py-10">
      <div className="grid gap-4 md:grid-cols-3">
        {LEVELS.map((l) => (
          <Card key={l.level}>
            <p className="text-xs font-bold uppercase tracking-widest text-gold-dark">Level {l.level} — {l.name}</p>
            <h3 className="mt-1 text-lg font-bold text-navy">{l.certificateTitle}</h3>
            <p className="mt-2 text-sm text-slate-600">Issued only after every topic and quiz in Level {l.level} is complete and the Level {l.level} final examination is passed (70%). One valid certificate per student per level.</p>
          </Card>
        ))}
      </div>
      <div className="mt-8">
        <SectionTitle>What appears on a certificate</SectionTitle>
        <p className="mt-2 text-slate-600">Academy name and logo, your full name, the exact certificate title, the completed level, a concise achievement statement, the issue date, a unique certificate ID, and the academy authorities — Official Darax and Official Obafemix. Certificates use an elegant white/ivory layout with restrained gold and sky-blue accents. No signatures are fabricated: authority name spaces are used unless approved signature artwork is supplied.</p>
        <p className="mt-3 text-slate-600">Certificates can be downloaded and printed from your student dashboard. A certificate that is revoked by an administrator (for example, after a correction) shows as revoked on the verification page.</p>
      </div>
      <div className="mt-8 flex flex-wrap gap-3">
        <GoldButton href="/verify-certificate">Verify a Certificate</GoldButton>
        <Link href="/register" className="rounded-lg border border-navy px-5 py-2.5 font-semibold text-navy">Register to Earn One</Link>
      </div>
    </section>
  </div>);
}
''')

w("contact/page.tsx", '''
import { PageHero, Card, SectionTitle, Alert } from "@/components/ui";
import { WHATSAPP_LINK, WHATSAPP_NUMBER } from "@/lib/data";
export default function Contact() {
  return (<div>
    <PageHero title="Contact / Support" intro="For enrolment, payment and general questions, contact the academy on WhatsApp. For learning help after you register, use Help & Support inside your student dashboard." />
    <section className="mx-auto max-w-4xl px-4 py-10">
      <Card>
        <SectionTitle>WhatsApp — the official contact route</SectionTitle>
        <p className="mt-3 text-slate-600">Payment and enrolment enquiries: <strong className="text-navy">{WHATSAPP_NUMBER}</strong></p>
        <a href={WHATSAPP_LINK} target="_blank" rel="noreferrer" className="mt-4 inline-block rounded-lg bg-[#128c4b] px-5 py-2.5 font-semibold text-white">Chat on WhatsApp</a>
        <div className="mt-6"><Alert kind="info">Please do not send passwords, access codes or bank details in chat. An access code is redeemed only inside your own student account, on the activation screen. The academy will never ask for your password.</Alert></div>
      </Card>
      <Card className="mt-4">
        <h3 className="font-bold text-navy">Support inside the platform</h3>
        <p className="mt-2 text-sm text-slate-600">Registered students can send a support request (category + message) from Dashboard → Help &amp; Support, and track its status. Administrators review and respond there.</p>
      </Card>
    </section>
  </div>);
}
''')
