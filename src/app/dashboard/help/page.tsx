"use client";
import { useState } from "react";
import DashboardShell from "@/components/DashboardShell";
import { Card, Alert } from "@/components/ui";
import { WHATSAPP_LINK, WHATSAPP_NUMBER } from "@/lib/data";
export default function Help() {
 const [category, setCategory] = useState("Payment"); const [message, setMessage] = useState("");
 const [msg, setMsg] = useState(""); const [sent, setSent] = useState<{ category: string; message: string; status: string; at: string }[]>([]);
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
 <select id="cat" className="mt-1 w-full input-std" value={category} onChange={(e) => setCategory(e.target.value)}>
 {["Payment", "Activation / Access Code", "Lesson / Quiz", "Examination", "Certificate", "Account", "Other"].map((c) => (<option key={c}>{c}</option>))}
 </select></div>
 <div><label className="block text-sm font-semibold text-navy" htmlFor="msg">Message</label>
 <textarea id="msg" rows={4} className="mt-1 w-full input-std" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Describe the problem clearly…" /></div>
 <button className="btn-gold px-4 py-2 text-sm font-semibold">Send Request</button>
 </form>
 {msg && <div className="mt-3"><Alert kind="success">{msg}</Alert></div>}
 </Card>
 {sent.length > 0 && <Card className="mt-4"><h3 className="font-bold text-navy">Your requests (this device)</h3><ul className="mt-2 space-y-2 text-sm">{sent.map((s, i) => (<li key={i}><strong>{s.category}</strong> — {s.status} · {s.message}</li>))}</ul></Card>}
 <Card className="mt-4">
 <h3 className="font-bold text-navy">Urgent payment help</h3>
 <p className="mt-2 text-sm text-slate-600">WhatsApp the academy: {WHATSAPP_NUMBER}</p>
 <a href={WHATSAPP_LINK} target="_blank" rel="noreferrer" className="mt-3 inline-block btn-sky px-4 py-2 text-sm font-semibold">Chat on WhatsApp</a>
 </Card>
 </DashboardShell>
 );
}
