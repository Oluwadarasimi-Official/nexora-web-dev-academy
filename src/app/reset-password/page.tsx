"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { AuthShell, AuthMessages, inputCls, labelCls, submitCls, useAuthMessage } from "@/components/AuthForm";
import { getBrowserSupabase } from "@/lib/supabase";
export default function ResetPassword() {
 const router = useRouter();
 const { error, setError, info, setInfo } = useAuthMessage();
 const [password, setPassword] = useState(""); const [confirm, setConfirm] = useState(""); const [busy, setBusy] = useState(false);
 async function submit(e: React.FormEvent) {
 e.preventDefault(); setError("");
 if (password.length < 8) return setError("Password must be at least 8 characters.");
 if (password !== confirm) return setError("Passwords do not match.");
 const sb = getBrowserSupabase();
 if (!sb) return setError("Password reset needs Supabase to be connected. Contact the academy for help.");
 setBusy(true);
 try {
 const { error } = await sb.auth.updateUser({ password });
 if (error) { setError(error.message); return; }
 setInfo("Password updated. Redirecting to login…");
 setTimeout(() => router.push("/login"), 800);
 } finally { setBusy(false); }
 }
 return (
 <AuthShell title="Reset Password" intro="Choose a new password for your account. Open this page from the reset link sent to your email.">
 <AuthMessages error={error} info={info} />
 <form onSubmit={submit} className="space-y-3" noValidate>
 <div><label className={labelCls} htmlFor="password">New password (at least 8 characters)</label><input id="password" type="password" className={inputCls} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" required /></div>
 <div><label className={labelCls} htmlFor="confirm">Confirm new password</label><input id="confirm" type="password" className={inputCls} value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" required /></div>
 <button className={submitCls} disabled={busy}>{busy ? "Updating…" : "Update Password"}</button>
 </form>
 </AuthShell>
 );
}
