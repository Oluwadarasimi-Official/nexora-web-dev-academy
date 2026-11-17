"use client";
import { useEffect, useState } from "react";
import DashboardShell from "@/components/DashboardShell";
import { Card, Alert } from "@/components/ui";
import CertificateView from "@/components/CertificateView";
import { LEVELS, TOPICS } from "@/lib/curriculum";
import { loadProgress, saveProgress, pushNotification, loadSession } from "@/lib/store";
import { studentPost, studentGet } from "@/lib/studentClient";

type ExamStatusResponse = {
  connected?: boolean;
  attempts?: Record<string, { status: string }>;
  certificates?: { level: number; certificateId: string; title: string; issuedAt: string }[];
  levelComplete?: Record<string, boolean>;
};

export default function MyCertificates() {
 const [p, setP] = useState(loadProgress());
 const [server, setServer] = useState<ExamStatusResponse | null>(null);
 const [msg, setMsg] = useState(""); const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
 const session = loadSession();

 // Server truth: eligibility and issued certificates are read from the
 // database, so a graded exam pass and a certificate issued on another
 // device show up here. Local progress is only the fallback (demo flow).
 async function refreshServer() {
  try {
   const data = await studentGet<ExamStatusResponse>("/api/exam-status");
   if (data.connected) setServer(data);
  } catch { /* offline / demo flow: local progress stands */ }
 }
 useEffect(() => { refreshServer(); }, []);

 const levelCompleteLocal = (level: number) => TOPICS.filter((t) => t.level === level).every((t) => p.completedTopics.includes(t.slug));
 const examPassedLocal = (level: number) => p.examAttempts[`level-${level}`]?.status === "passed";
 const levelComplete = (level: number) => (server?.levelComplete ? server.levelComplete[String(level)] ?? levelCompleteLocal(level) : levelCompleteLocal(level));
 const examPassed = (level: number) => (server?.attempts ? (server.attempts[String(level)]?.status === "passed" || examPassedLocal(level)) : examPassedLocal(level));
 const serverCerts = server?.certificates ?? [];
 const certFor = (level: number): { level: number; id: string; title: string; issuedAt: string } | undefined => {
  const s = serverCerts.find((c) => c.level === level);
  if (s) return { level: s.level, id: s.certificateId, title: s.title, issuedAt: s.issuedAt };
  return p.certificates.find((c) => c.level === level);
 };

 async function issue(level: number) {
 setErr(""); setMsg("");
 if (!levelComplete(level) || !examPassed(level)) return setErr("This certificate requires full level completion and a passed final examination.");
 setBusy(true);
 try {
 const data = await studentPost<{ certificateId: string; title: string; issuedAt: string; persisted?: boolean; alreadyIssued?: boolean }>("/api/issue-certificate", { level, studentName: session?.name || "Student" });
 const next = loadProgress();
 if (!next.certificates.some((c) => c.level === level)) next.certificates.push({ level, id: data.certificateId, title: data.title, issuedAt: data.issuedAt });
 pushNotification(next, `Certificate issued: ${data.title} (Level ${level}). Certificate ID ${data.certificateId}.`);
 saveProgress(next); setP(next);
 setMsg(`Certificate issued: ${data.certificateId}. ${data.persisted ? "Recorded in the academy database — it verifies publicly." : "Recorded on this device."}`);
 await refreshServer();
 } catch (e) { setErr(e instanceof Error ? e.message : "Network error."); } finally { setBusy(false); }
 }
 return (
 <DashboardShell title="My Certificates">
 {msg && <div className="mb-4"><Alert kind="success">{msg}</Alert></div>}
 {err && <div className="mb-4"><Alert kind="error">{err}</Alert></div>}
 <div className="space-y-6">
 {LEVELS.map((l) => {
 const cert = certFor(l.level);
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
