"use client";
import { useState } from "react";
import DashboardShell from "@/components/DashboardShell";
import { Card, Alert } from "@/components/ui";
import CertificateView from "@/components/CertificateView";
import { LEVELS, TOPICS } from "@/lib/curriculum";
import { loadProgress, saveProgress, pushNotification, loadSession } from "@/lib/store";

export default function MyCertificates() {
 const [p, setP] = useState(loadProgress());
 const [msg, setMsg] = useState(""); const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
 const session = loadSession();
 const levelComplete = (level: number) => TOPICS.filter((t) => t.level === level).every((t) => p.completedTopics.includes(t.slug));
 const examPassed = (level: number) => p.examAttempts[`level-${level}`]?.status === "passed";
 async function issue(level: number) {
 setErr(""); setMsg("");
 if (!levelComplete(level) || !examPassed(level)) return setErr("This certificate requires full level completion and a passed final examination.");
 setBusy(true);
 try {
 const res = await fetch("/api/issue-certificate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ level, studentName: session?.name || "Student" }) });
 const data = await res.json();
 if (!res.ok) { setErr(data.error || "Certificate could not be issued."); return; }
 const next = loadProgress();
 if (!next.certificates.some((c) => c.level === level)) next.certificates.push({ level, id: data.certificateId, title: data.title, issuedAt: data.issuedAt });
 pushNotification(next, `Certificate issued: ${data.title} (Level ${level}). Certificate ID ${data.certificateId}.`);
 saveProgress(next); setP(next);
 setMsg(`Certificate issued: ${data.certificateId}. ${data.persisted ? "Recorded in the academy database." : "Recorded on this device (database sync pending — see HANDOVER)."}`);
 } catch { setErr("Network error."); } finally { setBusy(false); }
 }
 return (
 <DashboardShell title="My Certificates">
 {msg && <div className="mb-4"><Alert kind="success">{msg}</Alert></div>}
 {err && <div className="mb-4"><Alert kind="error">{err}</Alert></div>}
 <div className="space-y-6">
 {LEVELS.map((l) => {
 const cert = p.certificates.find((c) => c.level === l.level);
 const eligible = levelComplete(l.level) && examPassed(l.level);
 return (
 <Card key={l.level}>
 <h3 className="text-lg font-bold text-navy">Level {l.level} — {l.certificateTitle}</h3>
 {cert ? (
 <div className="mt-4">
 <CertificateView cert={{ certificateId: cert.id, studentName: session?.name || "Student", title: cert.title, level: l.level, levelName: l.name, issuedAt: cert.issuedAt }} />
 <button onClick={() => window.print()} className="no-print mt-4 btn-gold px-4 py-2 text-sm font-semibold">Download / Print Certificate (PDF via print)</button>
 </div>
 ) : (
 <div className="mt-2">
 <p className="text-sm text-slate-600">{eligible ? "You are eligible. Issue your certificate now." : "Not yet eligible. Complete every topic and quiz in this level and pass the final examination first."}</p>
 <button onClick={() => issue(l.level)} disabled={!eligible || busy} className="mt-3 btn-gold px-4 py-2 text-sm font-semibold disabled:opacity-50">Issue My Certificate</button>
 </div>
 )}
 </Card>
 );
 })}
 </div>
 </DashboardShell>
 );
}
