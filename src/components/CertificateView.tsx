import Image from "next/image";
import { ACADEMY_NAME, AUTHORITIES } from "@/lib/data";

export type CertData = { certificateId: string; studentName: string; title: string; level: number; levelName: string; issuedAt: string; status?: string };

export default function CertificateView({ cert }: { cert: CertData }) {
 return (
 <div className="print-area mx-auto max-w-3xl rounded-2xl border-2 border-[#c9a227] bg-white p-8 text-center shadow-sm sm:p-10">
 <Image src="/logo-circle.png" alt="Nexora Web Dev. Academy logo" width={88} height={88} className="mx-auto h-[88px] w-[88px] rounded-full object-cover ring-1 ring-slate-900/10" />
 <p className="mt-4 text-xs font-bold uppercase tracking-[0.25em] text-gold-dark">{ACADEMY_NAME}</p>
 <h2 className="mt-2 text-3xl font-extrabold text-navy sm:text-4xl">{cert.title}</h2>
 <p className="mt-1 text-sm font-semibold uppercase tracking-widest text-sky">Level {cert.level} — {cert.levelName}</p>
 <p className="mt-6 text-slate-600">This is to certify that</p>
 <p className="mt-1 text-3xl font-bold text-navy">{cert.studentName}</p>
 <p className="mx-auto mt-4 max-w-xl text-slate-600">has successfully completed the Level {cert.level} ({cert.levelName}) programme of {ACADEMY_NAME} — including all required topics, quizzes and the final examination — and is awarded this {cert.title}.</p>
 <div className="mx-auto mt-8 grid max-w-xl gap-4 border-t border-[#e8dfc8] pt-6 text-left sm:grid-cols-2">
 <div><p className="text-xs uppercase tracking-widest text-slate-500">Certificate ID</p><p className="font-mono font-bold text-navy">{cert.certificateId}</p></div>
 <div><p className="text-xs uppercase tracking-widest text-slate-500">Date of Issue</p><p className="font-bold text-navy">{new Date(cert.issuedAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</p></div>
 <div><p className="text-xs uppercase tracking-widest text-slate-500">Academy Authority</p><p className="font-bold text-navy">{AUTHORITIES[0]}</p></div>
 <div><p className="text-xs uppercase tracking-widest text-slate-500">Academy Authority</p><p className="font-bold text-navy">{AUTHORITIES[1]}</p></div>
 </div>
 {cert.status === "revoked" && <p className="mt-6 font-bold text-red-700">This certificate has been REVOKED.</p>}
 <p className="mt-6 text-xs text-slate-500">Verify this certificate at nexorawebdevacademy.vercel.app/verify-certificate using the certificate ID above.</p>
 </div>
 );
}
