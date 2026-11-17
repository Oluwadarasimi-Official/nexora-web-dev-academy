"use client";
import { useState } from "react";
import { AuthShell, AuthMessages, inputCls, labelCls, submitCls, useAuthMessage } from "@/components/AuthForm";
import { getBrowserSupabase, isSupabaseConfigured } from "@/lib/supabase";
export default function ForgotPassword() {
  const { error, setError, info, setInfo } = useAuthMessage();
  const [email, setEmail] = useState(""); const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setError("");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setError("Enter a valid email address.");
    setBusy(true);
    try {
      const sb = getBrowserSupabase();
      if (!sb) { setInfo("Password reset by email needs Supabase to be connected. This deployment is not connected yet — contact the academy on WhatsApp for help resetting your password."); return; }
      const { error } = await sb.auth.resetPasswordForEmail(email.trim().toLowerCase(), { redirectTo: `${window.location.origin}/reset-password` });
      if (error) { setError(error.message); return; }
      setInfo("If an account exists for that email, a password reset link has been sent. Check your inbox (and spam folder).");
    } finally { setBusy(false); }
  }
  return (
    <AuthShell title="Forgot Password" intro="Enter your registered email address and we will send you a password reset link.">
      <AuthMessages error={error} info={info} />
      <form onSubmit={submit} className="space-y-4" noValidate>
        <div><label className={labelCls} htmlFor="email">Email address</label><input id="email" type="email" className={inputCls} value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required /></div>
        <button className={submitCls} disabled={busy}>{busy ? "Sending…" : "Send Reset Link"}</button>
      </form>
      <p className="mt-3 text-xs text-slate-500">Supabase connected: {isSupabaseConfigured() ? "yes" : "not yet — see README/HANDOVER for the owner setup steps."}</p>
    </AuthShell>
  );
}
