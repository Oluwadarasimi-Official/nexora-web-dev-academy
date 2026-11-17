import { PageHero, Card } from "@/components/ui";
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
    <section className="mx-auto max-w-6xl px-4 py-7">
      <div className="grid gap-4 md:grid-cols-2">
        {steps.map(([t, d], i) => (<Card key={t}><h3 className="font-bold text-white">{i + 1}. {t}</h3><p className="mt-2 text-sm text-slate-300">{d}</p></Card>))}
      </div>
      <a href={WHATSAPP_LINK} target="_blank" rel="noreferrer" className="mt-8 inline-block rounded-full bg-[#128c4b] px-5 py-2.5 font-semibold text-white">Start on WhatsApp — {WHATSAPP_NUMBER}</a>
    </section>
  </div>);
}
