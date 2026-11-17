"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthShell, AuthMessages, inputCls, labelCls, submitCls, useAuthMessage, supabaseSignUp, localRegisterAccount, isConfiguredNote } from "@/components/AuthForm";

export default function Register() {
  const router = useRouter();
  const { error, setError, info, setInfo } = useAuthMessage();
  const [name, setName] = useState(""); const [email, setEmail] = useState("");
  const [password, setPassword] = useState(""); const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setError(""); setInfo("");
    if (name.trim().length < 2) return setError("Enter your full name.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setError("Enter a valid email address.");
    if (password.length < 8) return setError("Password must be at least 8 characters.");
    if (password !== confirm) return setError("Passwords do not match.");
    setBusy(true);
    try {
      const res = await supabaseSignUp(name.trim(), email.trim().toLowerCase(), password);
      if (!res.ok) { setError(res.error || "Registration failed. If you already have an account, try logging in."); return; }
      if (res.local) { if (!localRegisterAccount(name.trim(), email.trim().toLowerCase(), password)) { setError("An account with this email already exists. Try logging in."); return; } }
      setInfo("Account created. Redirecting to your student dashboard…");
      setTimeout(() => router.push("/dashboard"), 600);
    } finally { setBusy(false); }
  }
  return (
    <AuthShell title="Student Registration" intro="Create your student account. After registering, you will pay outside the platform, submit your payment reference, and activate with a single-use access code.">
      <AuthMessages error={error} info={info} />
      <form onSubmit={submit} className="space-y-4" noValidate>
        <div><label className={labelCls} htmlFor="name">Full name</label><input id="name" className={inputCls} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" required /></div>
        <div><label className={labelCls} htmlFor="email">Email address</label><input id="email" type="email" className={inputCls} value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required /></div>
        <div><label className={labelCls} htmlFor="password">Password (at least 8 characters)</label><input id="password" type="password" className={inputCls} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" required /></div>
        <div><label className={labelCls} htmlFor="confirm">Confirm password</label><input id="confirm" type="password" className={inputCls} value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" required /></div>
        <button className={submitCls} disabled={busy}>{busy ? "Creating account…" : "Create Account"}</button>
      </form>
      <p className="mt-4 text-sm text-slate-600">Already registered? <Link className="font-semibold text-sky" href="/login">Log in</Link></p>
      <p className="mt-3 text-xs text-slate-500">{isConfiguredNote()}</p>
    </AuthShell>
  );
}
