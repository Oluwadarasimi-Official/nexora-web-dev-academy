import pathlib, textwrap
R = pathlib.Path("/home/hatch/workspace/nexora-web-dev-academy/src")
def w(p, s):
    f = R / p; f.parent.mkdir(parents=True, exist_ok=True); f.write_text(textwrap.dedent(s).lstrip("\n"))
    print("wrote", p)

w("app/dashboard/exams/page.tsx", '''
"use client";
import { useEffect, useState } from "react";
import DashboardShell from "@/components/DashboardShell";
import { Card, Alert } from "@/components/ui";
import { EXAMS, LEVELS, TOPICS } from "@/lib/curriculum";
import { loadProgress, saveProgress, pushNotification } from "@/lib/store";

export default function Exams() {
  const [p, setP] = useState(loadProgress());
  const [started, setStarted] = useState<any>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<any>(null);
  const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);
  useEffect(() => { setP(loadProgress()); }, []);
  useEffect(() => {
    if (!started) return;
    const t = setInterval(() => {
      const left = Math.max(0, Math.floor((new Date(started.expiresAt).getTime() - Date.now()) / 1000));
      setSecondsLeft(left);
      if (left === 0) { clearInterval(t); setErr("Time expired. Submit immediately — the server enforces the expiry time."); }
    }, 1000);
    return () => clearInterval(t);
  }, [started]);
  const levelComplete = (level: number) => TOPICS.filter((t) => t.level === level).every((t) => p.completedTopics.includes(t.slug));
  async function startExam(level: number) {
    setErr(""); setResult(null);
    if (!p.activated) return setErr("Activate your account first.");
    if (!levelComplete(level)) return setErr("This examination opens only when every topic and quiz in the level is complete.");
    setBusy(true);
    try {
      const res = await fetch("/api/exam-start", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ level }) });
      const data = await res.json();
      if (!res.ok) { setErr(data.error || "Could not start the examination."); return; }
      setStarted({ level, ...data });
      setSecondsLeft(data.durationMinutes * 60);
    } catch { setErr("Network error."); } finally { setBusy(false); }
  }
  async function submitExam() {
    if (!started) return;
    setBusy(true);
    try {
      const res = await fetch("/api/exam-submit", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ level: started.level, attemptId: started.attemptId, answers }) });
      const data = await res.json();
      if (!res.ok) { setErr(data.error || "Submission failed."); return; }
      setResult(data);
      const next = loadProgress();
      next.examAttempts[`level-${started.level}`] = { status: data.status, at: new Date().toISOString() };
      pushNotification(next, `Examination submitted: Level ${started.level} — ${data.status}. Objective ${data.objectiveScore}/${data.objectiveTotal}; theory ${data.theoryStatus}.`);
      saveProgress(next);
      setStarted(null);
    } catch { setErr("Network error."); } finally { setBusy(false); }
  }
  const exam = started ? EXAMS.find((e) => e.level === started.level) : null;
  const objectiveQs = exam ? Array.from({ length: exam.objectiveCount }, (_, i) => {
    const topic = TOPICS.filter((t) => t.level === exam.level)[i % TOPICS.filter((t) => t.level === exam.level).length];
    return { key: `obj-${i}`, q: `Objective ${i + 1}: Which statement is correct about “${topic.title}”?`, options: [`${topic.summary}`, "It has no effect on a real project.", "It should never be practised.", "It only matters for examinations."] };
  }) : [];
  const theoryQs = exam ? Array.from({ length: exam.theoryCount }, (_, i) => ({ key: `theory-${i}`, q: `Theory ${i + 1}: Explain, with a worked example, a key idea from Level ${exam.level} and how you would apply it in a real project.` })) : [];
  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, "0"); const ss = String(secondsLeft % 60).padStart(2, "0");
  return (
    <DashboardShell title="Examinations">
      {err && <div className="mb-4"><Alert kind="error">{err}</Alert></div>}
      {result && (
        <Card className="mb-4">
          <h3 className="text-lg font-bold text-navy">Examination result — Level {result.level}</h3>
          <p className="mt-2 text-sm text-slate-700">Objective: {result.objectiveScore}/{result.objectiveTotal} (marked automatically on the server). Theory: {result.theoryStatus} — graded by an authorised examiner against the published rubric; no marks are fabricated. Overall status: <strong>{result.status}</strong>.</p>
          <p className="mt-2 text-sm text-slate-600">{result.status === "passed" ? "Congratulations — your certificate for this level can now be issued from My Certificates." : "You have not passed yet. Revise the level and try again when ready."}</p>
        </Card>
      )}
      {started && exam ? (
        <Card>
          <div className="flex flex-wrap justify-between gap-3">
            <h3 className="text-lg font-bold text-navy">{exam.title}</h3>
            <p className="font-mono text-lg font-bold text-red-700">Time left: {mm}:{ss}</p>
          </div>
          <p className="mt-2 text-sm text-slate-600">{exam.instructions}</p>
          <p className="mt-2 text-sm text-slate-600"><strong>Rubric:</strong> {exam.rubric}</p>
          <h4 className="mt-6 font-bold text-navy">Section A — Objective ({exam.objectiveCount} questions)</h4>
          <div className="mt-3 space-y-3">
            {objectiveQs.map((q, qi) => (
              <div key={q.key} className="rounded-lg border border-slate-200 p-3">
                <p className="text-sm font-semibold text-navy">{q.q}</p>
                <div className="mt-2 space-y-1">{q.options.map((o, oi) => (<label key={oi} className="flex gap-2 text-sm"><input type="radio" name={q.key} checked={answers[q.key] === String(oi)} onChange={() => setAnswers({ ...answers, [q.key]: String(oi) })} />{o}</label>))}</div>
              </div>
            ))}
          </div>
          <h4 className="mt-6 font-bold text-navy">Section B — Theory ({exam.theoryCount} questions)</h4>
          <div className="mt-3 space-y-3">
            {theoryQs.map((q) => (
              <div key={q.key} className="rounded-lg border border-slate-200 p-3">
                <p className="text-sm font-semibold text-navy">{q.q}</p>
                <textarea className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" rows={4} value={answers[q.key] || ""} onChange={(e) => setAnswers({ ...answers, [q.key]: e.target.value })} placeholder="Write your answer here…" />
              </div>
            ))}
          </div>
          <button onClick={submitExam} disabled={busy} className="mt-6 rounded-lg bg-navy px-5 py-2.5 font-semibold text-white disabled:opacity-50">{busy ? "Submitting…" : "Submit Examination"}</button>
        </Card>
      ) : (
        <div className="space-y-4">
          {EXAMS.map((e) => {
            const done = levelComplete(e.level);
            const att = p.examAttempts[`level-${e.level}`];
            return (
              <Card key={e.level}>
                <h3 className="text-lg font-bold text-navy">{e.title}</h3>
                <p className="mt-1 text-sm text-slate-600">{LEVELS[e.level - 1].description}</p>
                <p className="mt-1 text-sm text-slate-600">Duration {e.durationMinutes} minutes · {e.objectiveCount} objective + {e.theoryCount} theory · Pass mark {e.passMarkPercent}% · {done ? "Eligible — all topics and quizzes complete." : "Locked — complete all topics and quizzes in this level first."}</p>
                {att && <p className="mt-1 text-sm text-slate-600">Last attempt: {att.status} · {new Date(att.at).toLocaleString()}</p>}
                <button onClick={() => startExam(e.level)} disabled={!done || busy} className="mt-3 rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Start Examination</button>
              </Card>
            );
          })}
        </div>
      )}
    </DashboardShell>
  );
}
''')

w("app/dashboard/certificates/page.tsx", '''
"use client";
import { useState } from "react";
import DashboardShell from "@/components/DashboardShell";
import { Card, Alert } from "@/components/ui";
import CertificateView from "@/components/CertificateView";
import { LEVELS, TOPICS, CERTIFICATE_TITLES } from "@/lib/curriculum";
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
                  <button onClick={() => window.print()} className="no-print mt-4 rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white">Download / Print Certificate (PDF via print)</button>
                </div>
              ) : (
                <div className="mt-2">
                  <p className="text-sm text-slate-600">{eligible ? "You are eligible. Issue your certificate now." : "Not yet eligible. Complete every topic and quiz in this level and pass the final examination first."}</p>
                  <button onClick={() => issue(l.level)} disabled={!eligible || busy} className="mt-3 rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-navy disabled:opacity-50">Issue My Certificate</button>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </DashboardShell>
  );
}
''')

w("app/dashboard/progress/page.tsx", '''
"use client";
import DashboardShell from "@/components/DashboardShell";
import { Card } from "@/components/ui";
import { TOPICS, LEVELS } from "@/lib/curriculum";
import { loadProgress } from "@/lib/store";
export default function Progress() {
  const p = loadProgress();
  return (
    <DashboardShell title="My Progress">
      <div className="space-y-4">
        {LEVELS.map((l) => {
          const topics = TOPICS.filter((t) => t.level === l.level);
          const done = topics.filter((t) => p.completedTopics.includes(t.slug)).length;
          return (
            <Card key={l.level}>
              <h3 className="font-bold text-navy">Level {l.level} — {l.name}: {done}/{topics.length} topics ({Math.round((done / topics.length) * 100)}%)</h3>
              <div className="mt-2 h-3 overflow-hidden rounded-full bg-slate-200"><div className="h-full bg-sky" style={{ width: `${(done / topics.length) * 100}%` }} /></div>
              <ul className="mt-3 space-y-1 text-sm">
                {topics.map((t) => {
                  const q = p.quizAttempts[t.slug];
                  return <li key={t.slug} className="flex justify-between gap-2"><span>{t.title}</span><span>{p.completedTopics.includes(t.slug) ? "✓ Complete" : q ? `Quiz ${q.score}/10 ${q.passed ? "(passed)" : "(not passed)"}` : "Not started"}</span></li>;
                })}
              </ul>
            </Card>
          );
        })}
        <Card>
          <h3 className="font-bold text-navy">Quiz attempts</h3>
          {Object.keys(p.quizAttempts).length === 0 ? <p className="mt-2 text-sm text-slate-600">No quiz attempts yet.</p>
          : <ul className="mt-2 space-y-1 text-sm">{Object.entries(p.quizAttempts).map(([slug, a]) => (<li key={slug}>{slug}: {a.score}/10 — {a.passed ? "Passed" : "Not passed"} · {new Date(a.at).toLocaleString()}</li>))}</ul>}
        </Card>
      </div>
    </DashboardShell>
  );
}
''')

w("app/dashboard/profile/page.tsx", '''
"use client";
import { useState } from "react";
import DashboardShell from "@/components/DashboardShell";
import { Card, Alert } from "@/components/ui";
import { loadSession, saveSession, loadProgress } from "@/lib/store";
export default function Profile() {
  const session = loadSession();
  const p = loadProgress();
  const [name, setName] = useState(session?.name || "");
  const [msg, setMsg] = useState("");
  function save() {
    if (!session || name.trim().length < 2) return;
    saveSession({ ...session, name: name.trim() });
    setMsg("Profile name updated on this device. (In the connected Supabase setup, profile updates are written to the profiles table via the API.)");
  }
  return (
    <DashboardShell title="Profile">
      <Card>
        <p className="text-sm text-slate-600"><strong>Name:</strong> {session?.name}</p>
        <p className="mt-1 text-sm text-slate-600"><strong>Email:</strong> {session?.email}</p>
        <p className="mt-1 text-sm text-slate-600"><strong>Activation:</strong> {p.activated ? "Activated" : "Not activated"} · <strong>Payment status:</strong> {p.paymentStatus}</p>
        <p className="mt-1 text-sm text-slate-600"><strong>Topics completed:</strong> {p.completedTopics.length} · <strong>Certificates:</strong> {p.certificates.length}</p>
        <div className="mt-4">
          <label className="block text-sm font-semibold text-navy" htmlFor="name">Update display name</label>
          <input id="name" className="mt-1 w-full max-w-md rounded-lg border border-slate-300 px-3 py-2" value={name} onChange={(e) => setName(e.target.value)} />
          <button onClick={save} className="mt-3 rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white">Save Name</button>
          {msg && <div className="mt-3"><Alert kind="success">{msg}</Alert></div>}
        </div>
        <p className="mt-4 text-xs text-slate-500">Your password is managed by Supabase Auth and is never shown here. Use Forgot Password on the login page to change it.</p>
      </Card>
    </DashboardShell>
  );
}
''')

w("app/dashboard/help/page.tsx", '''
"use client";
import { useState } from "react";
import DashboardShell from "@/components/DashboardShell";
import { Card, Alert } from "@/components/ui";
import { WHATSAPP_LINK, WHATSAPP_NUMBER } from "@/lib/data";
export default function Help() {
  const [category, setCategory] = useState("Payment"); const [message, setMessage] = useState("");
  const [msg, setMsg] = useState(""); const [sent, setSent] = useState<any[]>([]);
  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (message.trim().length < 5) return;
    const item = { category, message: message.trim(), status: "open", at: new Date().toISOString() };
    setSent([item, ...sent]); setMessage(""); setMsg("Support request recorded. An administrator will review it. (Stored on this device until the Supabase support_requests table is connected — see HANDOVER.)");
  }
  return (
    <DashboardShell title="Help & Support">
      <Card>
        <h3 className="font-bold text-navy">Send a support request</h3>
        <form onSubmit={submit} className="mt-3 space-y-3">
          <div><label className="block text-sm font-semibold text-navy" htmlFor="cat">Category</label>
            <select id="cat" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" value={category} onChange={(e) => setCategory(e.target.value)}>
              {["Payment", "Activation / Access Code", "Lesson / Quiz", "Examination", "Certificate", "Account", "Other"].map((c) => (<option key={c}>{c}</option>))}
            </select></div>
          <div><label className="block text-sm font-semibold text-navy" htmlFor="msg">Message</label>
            <textarea id="msg" rows={4} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Describe the problem clearly…" /></div>
          <button className="rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white">Send Request</button>
        </form>
        {msg && <div className="mt-3"><Alert kind="success">{msg}</Alert></div>}
      </Card>
      {sent.length > 0 && <Card className="mt-4"><h3 className="font-bold text-navy">Your requests (this device)</h3><ul className="mt-2 space-y-2 text-sm">{sent.map((s, i) => (<li key={i}><strong>{s.category}</strong> — {s.status} · {s.message}</li>))}</ul></Card>}
      <Card className="mt-4">
        <h3 className="font-bold text-navy">Urgent payment help</h3>
        <p className="mt-2 text-sm text-slate-600">WhatsApp the academy: {WHATSAPP_NUMBER}</p>
        <a href={WHATSAPP_LINK} target="_blank" rel="noreferrer" className="mt-3 inline-block rounded-lg bg-[#128c4b] px-4 py-2 text-sm font-semibold text-white">Chat on WhatsApp</a>
      </Card>
    </DashboardShell>
  );
}
''')

w("app/dashboard/payment/page.tsx", '''
"use client";
import { useState } from "react";
import DashboardShell from "@/components/DashboardShell";
import { Card, Alert } from "@/components/ui";
import { WHATSAPP_LINK, WHATSAPP_NUMBER } from "@/lib/data";
import { loadProgress, saveProgress, pushNotification } from "@/lib/store";

export default function Payment() {
  const [p, setP] = useState(loadProgress());
  const [ref, setRef] = useState(""); const [note, setNote] = useState("");
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState(""); const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
  async function submitPayment(e: React.FormEvent) {
    e.preventDefault(); setErr(""); setMsg("");
    if (ref.trim().length < 3) return setErr("Enter your payment confirmation/reference.");
    setBusy(true);
    try {
      const res = await fetch("/api/submit-payment", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reference: ref.trim(), evidenceNote: note.trim() }) });
      const data = await res.json();
      if (!res.ok) { setErr(data.error || "Submission failed."); return; }
      const next = loadProgress(); next.paymentStatus = "pending"; next.paymentRef = ref.trim();
      pushNotification(next, "Payment confirmation submitted. Status: pending administrator review.");
      saveProgress(next); setP(next);
      setMsg(`Payment confirmation submitted. Status: pending. ${data.persisted ? "Recorded in the academy database." : "Recorded on this device (database sync pending)."} An administrator will verify it independently.`);
    } catch { setErr("Network error."); } finally { setBusy(false); }
  }
  async function redeem(e: React.FormEvent) {
    e.preventDefault(); setErr(""); setMsg("");
    if (!/^NEX-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(code.trim().toUpperCase())) return setErr("Enter the code exactly as issued (format NEX-XXXX-XXXX-XXXX).");
    setBusy(true);
    try {
      const res = await fetch("/api/redeem-code", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code: code.trim().toUpperCase() }) });
      const data = await res.json();
      if (!res.ok) { setErr(data.error || "Redemption failed."); return; }
      const next = loadProgress(); next.activated = true;
      pushNotification(next, "Your access code was redeemed. Your account is now activated.");
      saveProgress(next); setP(next);
      setMsg("Activation successful — welcome to Nexora Web Dev. Academy. Your lessons are now unlocked.");
    } catch { setErr("Network error."); } finally { setBusy(false); }
  }
  return (
    <DashboardShell title="Payment & Activation">
      {msg && <div className="mb-4"><Alert kind="success">{msg}</Alert></div>}
      {err && <div className="mb-4"><Alert kind="error">{err}</Alert></div>}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <h3 className="font-bold text-navy">1. Pay outside the platform</h3>
          <p className="mt-2 text-sm text-slate-600">Contact the academy on WhatsApp and pay through the method the academy communicates. This website never receives or holds funds.</p>
          <p className="mt-2 text-sm font-semibold text-navy">{WHATSAPP_NUMBER}</p>
          <a href={WHATSAPP_LINK} target="_blank" rel="noreferrer" className="mt-3 inline-block rounded-lg bg-[#128c4b] px-4 py-2 text-sm font-semibold text-white">Chat on WhatsApp</a>
        </Card>
        <Card>
          <h3 className="font-bold text-navy">2. Submit your payment reference</h3>
          <p className="mt-2 text-sm text-slate-600">Current status: <strong>{p.paymentStatus}</strong>{p.paymentRef ? ` · Reference: ${p.paymentRef}` : ""}. A claim or screenshot is not automatic proof — an administrator verifies every payment.</p>
          <form onSubmit={submitPayment} className="mt-3 space-y-3">
            <div><label className="block text-sm font-semibold text-navy" htmlFor="ref">Payment confirmation / reference</label><input id="ref" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" value={ref} onChange={(e) => setRef(e.target.value)} placeholder="e.g. transfer reference" /></div>
            <div><label className="block text-sm font-semibold text-navy" htmlFor="note">Evidence note (optional)</label><input id="note" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. bank, date, amount" /></div>
            <button disabled={busy} className="rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Submit Payment Confirmation</button>
          </form>
        </Card>
        <Card>
          <h3 className="font-bold text-navy">3. Redeem your access code</h3>
          <p className="mt-2 text-sm text-slate-600">Your code is assigned by an administrator only after your payment is approved. Enter it once — one code, one student, one use.</p>
          {p.activated ? <p className="mt-3 font-semibold text-emerald-700">Your account is activated ✓</p> : (
            <form onSubmit={redeem} className="mt-3 space-y-3">
              <div><label className="block text-sm font-semibold text-navy" htmlFor="code">Access code</label><input id="code" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="NEX-XXXX-XXXX-XXXX" /></div>
              <button disabled={busy} className="rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-navy disabled:opacity-50">Redeem Code &amp; Activate</button>
            </form>
          )}
          <p className="mt-3 text-xs text-slate-500">If all 30 initial codes are redeemed, new activations are blocked and you will be asked to contact the administrator. Only the owner may authorise an additional batch.</p>
        </Card>
        <Card>
          <h3 className="font-bold text-navy">What happens next</h3>
          <p className="mt-2 text-sm text-slate-600">Pending → administrator approves or rejects with a reason → if approved, a code is assigned to you → you redeem it here → lessons unlock. You will see each step as a notification on your dashboard.</p>
        </Card>
      </div>
    </DashboardShell>
  );
}
''')
