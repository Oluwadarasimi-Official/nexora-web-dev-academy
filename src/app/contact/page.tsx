import { PageHero, Card, SectionTitle, Alert } from "@/components/ui";
import { WHATSAPP_LINK, WHATSAPP_NUMBER } from "@/lib/data";
export default function Contact() {
 return (<div>
 <PageHero title="Contact / Support" intro="For enrolment, payment and general questions, contact the academy on WhatsApp. For learning help after you register, use Help & Support inside your student dashboard." />
 <section className="mx-auto max-w-4xl px-4 py-7">
 <Card>
 <SectionTitle>WhatsApp — the official contact route</SectionTitle>
 <p className="mt-3 text-slate-600">Payment and enrolment enquiries: <strong className="text-navy">{WHATSAPP_NUMBER}</strong></p>
 <a href={WHATSAPP_LINK} target="_blank" rel="noreferrer" className="mt-4 inline-block btn-sky px-5 py-2.5 font-semibold">Chat on WhatsApp</a>
 <div className="mt-6"><Alert kind="info">Please do not send passwords, access codes or bank details in chat. An access code is redeemed only inside your own student account, on the activation screen. The academy will never ask for your password.</Alert></div>
 </Card>
 <Card className="mt-4">
 <h3 className="font-bold text-navy">Support inside the platform</h3>
 <p className="mt-2 text-sm text-slate-600">Registered students can send a support request (category + message) from Dashboard → Help &amp; Support, and track its status. Administrators review and respond there.</p>
 </Card>
 </section>
 </div>);
}
