"use client";
import { useState } from "react";
import { Card, Alert } from "@/components/ui";
export default function AdminSetup() {
  const [email, setEmail] = useState(""); const [token, setToken] = useState("");
  const [msg, setMsg] = useState(""); const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setErr(""); setMsg("");
    setBusy(true);
    try {
      const res = await fetch("/api/admin/setup", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: email.trim().toLowerCase(), setupToken: token }) });
      const data = await res.json();
      if (!res.ok) { setErr(data.error || "Bootstrap failed."); return; }
      setMsg(data.message || "Admin role granted.");
    } catch { setErr("Network error."); } finally { setBusy(false); }
  }
  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <Card>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold-dark">One-time Admin Bootstrap</p>
        <h1 className="mt-1 text-2xl font-bold text-navy">Set Up the First Administrator</h1>
        <p className="mt-2 text-sm text-slate-600">This page promotes an <strong>already registered</strong> student account to administrator. It requires the <code>ADMIN_SETUP_TOKEN</code> environment variable, which only the owner sets in Vercel (Production, server-only). No admin password is invented or hardcoded anywhere.</p>
        <div className="mt-4 rounded-lg border border-slate-200 bg-[#fdf8ec] p-4 text-sm text-slate-700">
          <strong>Steps:</strong>
          <ol className="mt-1 list-decimal space-y-1 pl-5">
            <li>Register the future admin as an ordinary student at /register.</li>
            <li>Set <code>ADMIN_SETUP_TOKEN</code> to a long random value in Vercel → Settings → Environment Variables (Production only).</li>
            <li>Enter that email and token below, once. After the first admin exists, use the SQL step in HANDOVER.md to add further admins — this page then refuses new promotions unless the token still matches.</li>
          </ol>
        </div>
        {msg && <div className="mt-4"><Alert kind="success">{msg}</Alert></div>}
        {err && <div className="mt-4"><Alert kind="error">{err}</Alert></div>}
        <form onSubmit={submit} className="mt-4 space-y-3">
          <div><label className="block text-sm font-semibold text-navy" htmlFor="email">Registered email to promote</label><input id="email" type="email" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
          <div><label className="block text-sm font-semibold text-navy" htmlFor="token">ADMIN_SETUP_TOKEN</label><input id="token" type="password" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" value={token} onChange={(e) => setToken(e.target.value)} required autoComplete="off" /></div>
          <button disabled={busy} className="rounded-lg bg-navy px-4 py-2.5 font-semibold text-white disabled:opacity-50">{busy ? "Checking…" : "Promote to Administrator"}</button>
        </form>
        <p className="mt-4 text-xs text-slate-500">The token is checked server-side and is never logged. If ADMIN_SETUP_TOKEN is not set, this page always refuses — that is the safe default.</p>
      </Card>
    </div>
  );
}
