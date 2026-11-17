"use client";
import { useEffect, useState } from "react";
import DashboardShell from "@/components/DashboardShell";
import { Card, Alert } from "@/components/ui";
import { WHATSAPP_LINK, WHATSAPP_NUMBER } from "@/lib/data";
import { studentGet, studentPost, StudentApiError } from "@/lib/studentClient";

type SupportRequest = {
  id: string;
  category: string;
  message: string;
  status: string;
  admin_reply: string | null;
  created_at: string;
  updated_at: string;
};

// Help & Support — requests are filed to the academy database and the
// admin's reply shows here (B6 fix: submit used to push to local React
// state only, so the request went nowhere and "Support request recorded"
// was false — nothing ever reached the admin).
export default function Help() {
 const [category, setCategory] = useState("Payment"); const [message, setMessage] = useState("");
 const [msg, setMsg] = useState(""); const [err, setErr] = useState("");
 const [sent, setSent] = useState<SupportRequest[]>([]);
 const [loading, setLoading] = useState(true);
 const [busy, setBusy] = useState(false);
 useEffect(() => {
  (async () => {
   try {
    const data = await studentGet<{ requests: SupportRequest[] }>("/api/support");
    setSent(data.requests ?? []);
   } catch { /* offline / demo flow: the form still shows, errors surface on submit */ }
   finally { setLoading(false); }
  })();
 }, []);
 async function submit(e: React.FormEvent) {
 e.preventDefault(); setErr(""); setMsg("");
 if (message.trim().length < 5) return setErr("Describe the problem in at least 5 characters.");
 setBusy(true);
 try {
 const data = await studentPost<{ request: SupportRequest }>("/api/support", { category, message: message.trim() });
 setSent([data.request, ...sent]); setMessage(""); setMsg("Support request recorded. An administrator will review it.");
 } catch (e: unknown) {
 setErr(e instanceof StudentApiError ? e.message : "Could not send your request. Try again.");
 } finally { setBusy(false); }
 }
 return (
 <DashboardShell title="Help & Support">
 <Card>
 <h3 className="font-bold text-navy">Send a support request</h3>
 <form onSubmit={submit} className="mt-3 space-y-3">
 <div><label className="block text-sm font-semibold text-navy" htmlFor="cat">Category</label>
 <select id="cat" className="mt-1 w-full input-std" value={category} onChange={(e) => setCategory(e.target.value)}>
 {["Payment", "Activation / Access Code", "Lesson / Quiz", "Examination", "Certificate", "Account", "Other"].map((c) => (<option key={c}>{c}</option>))}
 </select></div>
 <div><label className="block text-sm font-semibold text-navy" htmlFor="msg">Message</label>
 <textarea id="msg" rows={4} className="mt-1 w-full input-std" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Describe the problem clearly…" /></div>
 <button disabled={busy} className="btn-gold px-4 py-2 text-sm font-semibold disabled:opacity-50">{busy ? "Sending…" : "Send Request"}</button>
 </form>
 {msg && <div className="mt-3"><Alert kind="success">{msg}</Alert></div>}
 {err && <div className="mt-3"><Alert kind="error">{err}</Alert></div>}
 </Card>
 <Card className="mt-4">
 <h3 className="font-bold text-navy">Your requests</h3>
 {loading ? <p className="mt-2 text-sm text-slate-600">Loading your requests…</p>
 : sent.length === 0 ? <p className="mt-2 text-sm text-slate-600">No requests yet. Anything you send here reaches the administrator, and their reply appears below the request.</p>
 : <ul className="mt-2 space-y-3 text-sm">{sent.map((s) => (
 <li key={s.id} className="rounded-2xl border border-slate-200 p-3">
 <p><strong>{s.category}</strong> — {s.status} · {new Date(s.created_at).toLocaleString()}</p>
 <p className="mt-1 text-slate-700">{s.message}</p>
 {s.admin_reply ? <p className="mt-2 rounded-xl bg-[#fdf8ec] px-3 py-2 text-slate-700"><strong>Admin reply:</strong> {s.admin_reply}</p> : <p className="mt-1 text-xs text-slate-500">No reply yet.</p>}
 </li>))}</ul>}
 </Card>
 <Card className="mt-4">
 <h3 className="font-bold text-navy">Urgent payment help</h3>
 <p className="mt-2 text-sm text-slate-600">WhatsApp the academy: {WHATSAPP_NUMBER}</p>
 <a href={WHATSAPP_LINK} target="_blank" rel="noreferrer" className="mt-3 inline-block btn-sky px-4 py-2 text-sm font-semibold">Chat on WhatsApp</a>
 </Card>
 </DashboardShell>
 );
}
