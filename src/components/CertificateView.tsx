"use client";
import { useRef, useState } from "react";
import Image from "next/image";
import { Download } from "lucide-react";
import { ACADEMY_NAME, AUTHORITIES } from "@/lib/data";
import { VerifiedName } from "@/components/VerifiedName";

export type CertData = { certificateId: string; studentName: string; title: string; level: number; levelName: string; issuedAt: string; status?: string };

// CertificateView — renders one certificate card, plus a "Download as
// Image" button that saves the card itself as a PNG. The button sits
// OUTSIDE the captured card, so it never appears in the downloaded image.
// Uses html-to-image (toPng at 2x) on the real rendered DOM, so the image
// matches the certificate exactly — logo, gold border, blue verification
// badges and all — with no server round-trip. The file is named after the
// certificate ID, e.g. Nexora-Certificate-NEX-B1-2026-782233.png.
export default function CertificateView({ cert }: { cert: CertData }) {
 const cardRef = useRef<HTMLDivElement>(null);
 const [busy, setBusy] = useState(false);
 const [error, setError] = useState("");

 async function downloadImage() {
  if (!cardRef.current || busy) return;
  setBusy(true); setError("");
  try {
   const { toPng } = await import("html-to-image");
   const dataUrl = await toPng(cardRef.current, { pixelRatio: 2, cacheBust: true, backgroundColor: "#ffffff" });
   const a = document.createElement("a");
   a.href = dataUrl;
   a.download = `Nexora-Certificate-${cert.certificateId}.png`;
   document.body.appendChild(a);
   a.click();
   a.remove();
  } catch {
   setError("Could not create the image. Try again.");
  } finally {
   setBusy(false);
  }
 }

 return (
 <div className="mx-auto max-w-3xl">
 <div ref={cardRef} className="print-area rounded-2xl border-2 border-[#c9a227] bg-white p-8 text-center shadow-sm sm:p-10">
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
 <div><p className="text-xs uppercase tracking-widest text-slate-500">Academy Authority</p><p className="font-bold text-navy"><VerifiedName name={AUTHORITIES[0]} /></p></div>
 <div><p className="text-xs uppercase tracking-widest text-slate-500">Academy Authority</p><p className="font-bold text-navy"><VerifiedName name={AUTHORITIES[1]} /></p></div>
 </div>
 {cert.status === "revoked" && <p className="mt-6 font-bold text-red-700">This certificate has been REVOKED.</p>}
 <p className="mt-6 text-xs text-slate-500">Verify this certificate at nexdevacad.vercel.app/verify-certificate using the certificate ID above.</p>
 </div>
 <div className="mt-5 text-center">
 <button type="button" onClick={downloadImage} disabled={busy} className="btn-gold inline-flex items-center gap-2">
 <Download size={18} /> {busy ? "Preparing image…" : "Download as Image"}
 </button>
 {error && <p className="mt-3 text-sm font-semibold text-red-700">{error}</p>}
 </div>
 </div>
 );
}
