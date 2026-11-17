import pathlib, textwrap
R = pathlib.Path("/home/hatch/workspace/nexora-web-dev-academy/src")
def w(p, s):
    f = R / p; f.parent.mkdir(parents=True, exist_ok=True); f.write_text(textwrap.dedent(s).lstrip("\n"))
    print("wrote", p)

# ---- shared auth helper (client) ----
w("components/AuthForm.tsx", '''
"use client";
import { useState } from "react";
import Link from "next/link";
import { getBrowserSupabase, isSupabaseConfigured } from "@/lib/supabase";
import { saveSession } from "@/lib/store";
import { Alert } from "@/components/ui";

export function AuthShell({ title, intro, children }: { title: string; intro: string; children: React.ReactNode }) {
  return (
    <section className="mx-auto max-w-lg px-4 py-12">
      <div className="rounded-2xl border border-[#e8dfc8] bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-navy">{title}</h1>
        <p className="mt-2 text-sm text-slate-600">{intro}</p>
        <div className="mt-6">{children}</div>
      </div>
    </section>
  );
}
export const inputCls = "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2";
export const labelCls = "block text-sm font-semibold text-navy";
export const submitCls = "w-full rounded-lg bg-navy px-4 py-2.5 font-semibold text-white hover:bg-sky disabled:opacity-50";

export function useAuthMessage() {
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  return { error, setError, info, setInfo };
}
export function AuthMessages({ error, info }: { error: string; info: string }) {
  return (<>
    {error && <div className="mb-4"><Alert kind="error">{error}</Alert></div>}
    {info && <div className="mb-4"><Alert kind="success">{info}</Alert></div>}
  </>);
}
// Register / login against Supabase when configured; otherwise a local
// account is created so the portal can be demonstrated before the owner
// applies the migrations and sets env vars (see HANDOVER.md).
export async function supabaseSignUp(name: string, email: string, password: string) {
  const sb = getBrowserSupabase();
  if (!sb) { saveSession({ name, email, id: "local-" + btoa(email).replace(/[^a-zA-Z0-9]/g, "") }); return { ok: true, local: true }; }
  const { data, error } = await sb.auth.signUp({ email, password, options: { data: { full_name: name } } });
  if (error) return { ok: false, error: error.message };
  if (data.user) {
    try { await sb.from("profiles").upsert({ id: data.user.id, full_name: name, email }); } catch {}
    saveSession({ name, email, id: data.user.id });
  }
  return { ok: true, local: false };
}
export async function supabaseSignIn(email: string, password: string) {
  const sb = getBrowserSupabase();
  if (!sb) {
    const raw = localStorage.getItem("nexora-accounts");
    const accounts: any[] = raw ? JSON.parse(raw) : [];
    const acc = accounts.find((a) => a.email === email);
    if (!acc || acc.password !== password) return { ok: false, error: "Invalid email or password." };
    saveSession({ name: acc.name, email, id: acc.id });
    return { ok: true, local: true };
  }
  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  if (error) return { ok: false, error: error.message };
  const name = (data.user?.user_metadata as any)?.full_name || email;
  saveSession({ name, email, id: data.user!.id });
  return { ok: true, local: false };
}
export async function supabaseSignOut() {
  const sb = getBrowserSupabase();
  if (sb) { try { await sb.auth.signOut(); } catch {} }
  saveSession(null);
  localStorage.removeItem("nexora-progress-v1");
}
export function localRegisterAccount(name: string, email: string, password: string) {
  const raw = localStorage.getItem("nexora-accounts");
  const accounts: any[] = raw ? JSON.parse(raw) : [];
  if (accounts.some((a) => a.email === email)) return false;
  accounts.push({ id: "local-" + Date.now(), name, email, password });
  localStorage.setItem("nexora-accounts", JSON.stringify(accounts));
  return true;
}
export function isConfiguredNote() {
  return isSupabaseConfigured()
    ? "Connected to the academy's Supabase project."
    : "Supabase is not configured in this deployment yet — your account is stored locally on this device until the owner connects Supabase (see README). Your learning progress is still saved on this device.";
}
''')

w("app/register/page.tsx", '''
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
    if (!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email)) return setError("Enter a valid email address.");
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
''')

w("app/login/page.tsx", '''
"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthShell, AuthMessages, inputCls, labelCls, submitCls, useAuthMessage, supabaseSignIn } from "@/components/AuthForm";

export default function Login() {
  const router = useRouter();
  const { error, setError, info, setInfo } = useAuthMessage();
  const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setError("");
    if (!email || !password) return setError("Enter your email and password.");
    setBusy(true);
    try {
      const res = await supabaseSignIn(email.trim().toLowerCase(), password);
      if (!res.ok) { setError(res.error || "Login failed."); return; }
      setInfo("Logged in. Redirecting…");
      setTimeout(() => router.push("/dashboard"), 500);
    } finally { setBusy(false); }
  }
  return (
    <AuthShell title="Student Login" intro="Log in to your student portal. Administrators use the separate /admin portal.">
      <AuthMessages error={error} info={info} />
      <form onSubmit={submit} className="space-y-4" noValidate>
        <div><label className={labelCls} htmlFor="email">Email address</label><input id="email" type="email" className={inputCls} value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required /></div>
        <div><label className={labelCls} htmlFor="password">Password</label><input id="password" type="password" className={inputCls} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required /></div>
        <button className={submitCls} disabled={busy}>{busy ? "Logging in…" : "Log In"}</button>
      </form>
      <p className="mt-4 text-sm text-slate-600"><Link className="font-semibold text-sky" href="/forgot-password">Forgot your password?</Link> · <Link className="font-semibold text-sky" href="/register">Register</Link></p>
    </AuthShell>
  );
}
''')

w("app/forgot-password/page.tsx", '''
"use client";
import { useState } from "react";
import { AuthShell, AuthMessages, inputCls, labelCls, submitCls, useAuthMessage } from "@/components/AuthForm";
import { getBrowserSupabase, isSupabaseConfigured } from "@/lib/supabase";
export default function ForgotPassword() {
  const { error, setError, info, setInfo } = useAuthMessage();
  const [email, setEmail] = useState(""); const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setError("");
    if (!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email)) return setError("Enter a valid email address.");
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
''')

w("app/reset-password/page.tsx", '''
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
      <form onSubmit={submit} className="space-y-4" noValidate>
        <div><label className={labelCls} htmlFor="password">New password (at least 8 characters)</label><input id="password" type="password" className={inputCls} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" required /></div>
        <div><label className={labelCls} htmlFor="confirm">Confirm new password</label><input id="confirm" type="password" className={inputCls} value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" required /></div>
        <button className={submitCls} disabled={busy}>{busy ? "Updating…" : "Update Password"}</button>
      </form>
    </AuthShell>
  );
}
''')

w("components/CertificateView.tsx", '''
import Image from "next/image";
import { ACADEMY_NAME, AUTHORITIES } from "@/lib/data";

export type CertData = { certificateId: string; studentName: string; title: string; level: number; levelName: string; issuedAt: string; status?: string };

export default function CertificateView({ cert }: { cert: CertData }) {
  return (
    <div className="print-area mx-auto max-w-3xl rounded-2xl border-2 border-[#c9a227] bg-white p-8 text-center shadow-sm sm:p-10">
      <Image src="/logo.png" alt="Nexora Web Dev. Academy logo" width={150} height={150} className="mx-auto h-auto w-36 object-contain" />
      <p className="mt-4 text-xs font-bold uppercase tracking-[0.25em] text-gold-dark">{ACADEMY_NAME}</p>
      <h2 className="mt-2 text-3xl font-extrabold text-navy sm:text-4xl">{cert.title}</h2>
      <p className="mt-1 text-sm font-semibold uppercase tracking-widest text-sky">Level {cert.level} — {cert.levelName}</p>
      <p className="mt-6 text-slate-600">This is to certify that</p>
      <p className="mt-1 text-3xl font-bold text-navy">{cert.studentName}</p>
      <p className="mx-auto mt-4 max-w-xl text-slate-600">has successfully completed the Level {cert.level} ({cert.levelName}) programme of {ACADEMY_NAME} — including all required topics, quizzes and the final examination — and is awarded this {cert.title}.</p>
      <div className="mx-auto mt-8 grid max-w-xl gap-4 border-t border-[#e8dfc8] pt-6 text-left sm:grid-cols-2">
        <div><p className="text-xs uppercase tracking-widest text-slate-500">Certificate ID</p><p className="font-mono font-bold text-navy">{cert.certificateId}</p></div>
        <div><p className="text-xs uppercase tracking-widest text-slate-500">Date of Issue</p><p className="font-bold text-navy">{new Date(cert.issuedAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</p></div>
        <div><p className="text-xs uppercase tracking-widest text-slate-500">Academy Authority</p><p className="font-bold text-navy">{AUTHORITIES[0]}</p></div>
        <div><p className="text-xs uppercase tracking-widest text-slate-500">Academy Authority</p><p className="font-bold text-navy">{AUTHORITIES[1]}</p></div>
      </div>
      {cert.status === "revoked" && <p className="mt-6 font-bold text-red-700">This certificate has been REVOKED.</p>}
      <p className="mt-6 text-xs text-slate-500">Verify this certificate at nexorawebdevacademy.vercel.app/verify-certificate using the certificate ID above.</p>
    </div>
  );
}
''')

w("app/verify-certificate/page.tsx", '''
"use client";
import { useState } from "react";
import { AuthShell, AuthMessages, inputCls, labelCls, submitCls, useAuthMessage } from "@/components/AuthForm";
import CertificateView from "@/components/CertificateView";

export default function VerifyCertificate() {
  const { error, setError, info, setInfo } = useAuthMessage();
  const [id, setId] = useState(""); const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<any>(null);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setError(""); setResult(null);
    if (!id.trim()) return setError("Enter a certificate ID.");
    setBusy(true);
    try {
      const res = await fetch("/api/verify-certificate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ certificateId: id.trim() }) });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Verification failed. Try again."); return; }
      setResult(data);
      setInfo(data.valid ? "Certificate found." : "No valid certificate matches that ID.");
    } catch { setError("Network error. Check your connection and try again."); }
    finally { setBusy(false); }
  }
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <AuthShell title="Verify a Certificate" intro="Enter the certificate ID exactly as printed on the certificate. Only safe public fields are shown — never email or private account data.">
        <AuthMessages error={error} info={info} />
        <form onSubmit={submit} className="space-y-4" noValidate>
          <div><label className={labelCls} htmlFor="cid">Certificate ID</label><input id="cid" className={inputCls} value={id} onChange={(e) => setId(e.target.value)} placeholder="e.g. NEX-B1-2026-000001" /></div>
          <button className={submitCls} disabled={busy}>{busy ? "Verifying…" : "Verify Certificate"}</button>
        </form>
      </AuthShell>
      {result && result.valid && (
        <div className="mt-8">
          <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
            Status: {result.status === "revoked" ? "REVOKED — this certificate is no longer valid." : "VALID"}
          </div>
          <CertificateView cert={{ certificateId: result.certificateId, studentName: result.studentName, title: result.title, level: result.level, levelName: result.levelName, issuedAt: result.issuedAt, status: result.status }} />
        </div>
      )}
      {result && !result.valid && <p className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">Invalid: no certificate with that ID was found, or it has been revoked. Check the ID and try again.</p>}
    </div>
  );
}
''')
