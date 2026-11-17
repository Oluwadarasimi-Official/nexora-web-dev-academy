"use client";
import { Check } from "lucide-react";
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
 <div className="grid gap-3 md:grid-cols-2">
 <Card className="p-4">
 <h3 className="font-bold text-navy">1. Pay outside the platform</h3>
 <p className="mt-1.5 text-sm leading-relaxed text-slate-600">Contact the academy on WhatsApp and pay through the method the academy communicates. This website never receives or holds funds.</p>
 <p className="mt-2 text-sm font-semibold text-navy">{WHATSAPP_NUMBER}</p>
 <a href={WHATSAPP_LINK} target="_blank" rel="noreferrer" className="mt-3 inline-block btn-sky px-4 py-2 text-sm font-semibold">Chat on WhatsApp</a>
 </Card>
 <Card className="p-4">
 <h3 className="font-bold text-navy">2. Submit your payment reference</h3>
 <p className="mt-1.5 text-sm leading-relaxed text-slate-600">Current status: <strong>{p.paymentStatus}</strong>{p.paymentRef ? ` · Reference: ${p.paymentRef}` : ""}. A claim or screenshot is not automatic proof — an administrator verifies every payment.</p>
 <form onSubmit={submitPayment} className="mt-3 space-y-3">
 <div><label className="block text-sm font-semibold text-navy" htmlFor="ref">Payment confirmation / reference</label><input id="ref" className="mt-1 w-full input-std" value={ref} onChange={(e) => setRef(e.target.value)} placeholder="e.g. transfer reference" /></div>
 <div><label className="block text-sm font-semibold text-navy" htmlFor="note">Evidence note (optional)</label><input id="note" className="mt-1 w-full input-std" value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. bank, date, amount" /></div>
 <button disabled={busy} className="btn-gold px-4 py-2 text-sm font-semibold disabled:opacity-50">Submit Payment Confirmation</button>
 </form>
 </Card>
 <Card className="p-4">
 <h3 className="font-bold text-navy">3. Redeem your access code</h3>
 <p className="mt-1.5 text-sm leading-relaxed text-slate-600">Your code is assigned by an administrator only after your payment is approved. Enter it once — one code, one student, one use.</p>
 {p.activated ? <p className="mt-3 font-semibold text-sky-600">Your account is activated <Check className="inline h-4 w-4" /></p> : (
 <form onSubmit={redeem} className="mt-3 space-y-3">
 <div><label className="block text-sm font-semibold text-navy" htmlFor="code">Access code</label><input id="code" className="mt-1 w-full input-std font-mono" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="NEX-XXXX-XXXX-XXXX" /></div>
 <button disabled={busy} className="btn-gold px-4 py-2 text-sm font-semibold disabled:opacity-50">Redeem Code &amp; Activate</button>
 </form>
 )}
 <p className="mt-3 text-xs text-slate-500">If all 30 initial codes are redeemed, new activations are blocked and you will be asked to contact the administrator. Only the owner may authorise an additional batch.</p>
 </Card>
 <Card className="p-4">
 <h3 className="font-bold text-navy">What happens next</h3>
 <p className="mt-1.5 text-sm leading-relaxed text-slate-600">Pending → administrator approves or rejects with a reason → if approved, a code is assigned to you → you redeem it here → lessons unlock. You will see each step as a notification on your dashboard.</p>
 </Card>
 </div>
 </DashboardShell>
 );
}
