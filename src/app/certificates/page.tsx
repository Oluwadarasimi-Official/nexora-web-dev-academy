import Link from "next/link";
import { PageHero, Card, SectionTitle, GoldButton } from "@/components/ui";
import { VerifiedName } from "@/components/VerifiedName";
import { LEVELS } from "@/lib/curriculum";
export default function CertificatesPage() {
 return (<div>
 <PageHero title="Certificate Information" intro="Three level-specific certificates, earned by completing real work. Each certificate carries a unique ID that anyone can verify." />
 <section className="mx-auto max-w-6xl px-4 py-7">
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
 <p className="mt-2 text-slate-600">Academy name and logo, your full name, the exact certificate title, the completed level, a concise achievement statement, the issue date, a unique certificate ID, and the academy authorities — <VerifiedName name="Official Darax" /> and <VerifiedName name="Official Obafemix" />. Certificates use an elegant white/ivory layout with restrained gold accents. No signatures are fabricated: authority name spaces are used unless approved signature artwork is supplied.</p>
 <p className="mt-3 text-slate-600">Certificates can be downloaded and printed from your student dashboard. A certificate that is revoked by an administrator (for example, after a correction) shows as revoked on the verification page.</p>
 </div>
 <div className="mt-8 flex flex-wrap gap-3">
 <GoldButton href="/verify-certificate">Verify a Certificate</GoldButton>
 <Link href="/register" className="btn-sky px-5 py-2.5">Register to Earn One</Link>
 </div>
 </section>
 </div>);
}
