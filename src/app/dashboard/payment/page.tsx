"use client";
import { Check } from "lucide-react";
import { useState } from "react";
import DashboardShell from "@/components/DashboardShell";
import { Card, Alert } from "@/components/ui";
import { WHATSAPP_LINK, WHATSAPP_NUMBER } from "@/lib/data";
import { loadProgress, saveProgress, pushNotification } from "@/lib/store";
import { studentPost } from "@/lib/studentClient";

export default function Payment() {
 const [p, setP] = useState(loadProgress());
 const [code, setCode] = useState("");
 const [msg, setMsg] = useState(""); const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
 async function redeem(e: React.FormEvent) {
 e.preventDefault(); setErr(""); setMsg("");
 if (!/^NEX-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(code.trim().toUpperCase())) return setErr("This code is not valid. It should look like NEX-XXXX-XXXX-XXXX.");
 setBusy(true);
 try {
 await studentPost<Record<string, unknown>>("/api/redeem-code", { code: code.trim().toUpperCase() });
 const next = loadProgress(); next.activated = true;
 pushNotification(next, "Your access code was redeemed. Your account is now activated.");
 saveProgress(next); setP(next);
 setMsg("Activation successful — welcome to Nexora Web Dev. Academy. Your lessons are now unlocked.");
 } catch (e) { setErr(e instanceof Error ? e.message : "Network error."); } finally { setBusy(false); }
 }
 return (
 <DashboardShell title="Payment & Activation">
 {msg && <div className="mb-4"><Alert kind="success">{msg}</Alert></div>}
 {err && <div className="mb-4"><Alert kind="error">{err}</Alert></div>}
 <div className="grid gap-3 md:grid-cols-2">
 <Card className="p-4">
 <h3 className="font-bold text-navy">1. Pay on WhatsApp</h3>
 <p className="mt-1.5 text-sm leading-relaxed text-slate-600">Contact the academy on WhatsApp and pay through the method the academy communicates. This website never receives or holds funds.</p>
 <p className="mt-2 text-sm font-semibold text-navy">{WHATSAPP_NUMBER}</p>
 <a href={WHATSAPP_LINK} target="_blank" rel="noreferrer" className="mt-3 inline-block btn-sky px-4 py-2 text-sm font-semibold">Chat on WhatsApp</a>
 </Card>
 <Card className="p-4">
 <h3 className="font-bold text-navy">2. Redeem your code</h3>
 <p className="mt-1.5 text-sm leading-relaxed text-slate-600">After you pay, the owner will give you your access code. Enter it once — one code, one student, one use — and your account activates instantly.</p>
 {p.activated ? <p className="mt-3 font-semibold text-sky-600">Your account is activated <Check className="inline h-4 w-4" /></p> : (
 <form onSubmit={redeem} className="mt-3 space-y-3">
 <div><label className="block text-sm font-semibold text-navy" htmlFor="code">Access code</label><input id="code" className="mt-1 w-full input-std font-mono" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="NEX-XXXX-XXXX-XXXX" /></div>
 <button disabled={busy} className="btn-gold px-4 py-2 text-sm font-semibold disabled:opacity-50">Redeem Code &amp; Activate</button>
 </form>
 )}
 <p className="mt-3 text-xs text-slate-500">If all 30 initial codes are redeemed, new activations are blocked and you will be asked to contact the administrator. Only the owner may authorise an additional batch.</p>
 </Card>
 <Card className="p-4">
 <h3 className="font-bold text-navy">How it works</h3>
 <p className="mt-1.5 text-sm leading-relaxed text-slate-600">Pay on WhatsApp → the owner gives you a code → redeem it here → your lessons unlock instantly. No waiting, no approval step.</p>
 </Card>
 </div>
 </DashboardShell>
 );
}
