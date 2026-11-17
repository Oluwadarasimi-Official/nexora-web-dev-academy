"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getBrowserSupabase } from "@/lib/supabase";
import { AuthShell, AuthMessages, inputCls, labelCls, submitCls, useAuthMessage, supabaseSignIn, resolvePostLoginTarget } from "@/components/AuthForm";

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
 // Admins are routed to the admin portal, students to the dashboard.
 const sb = getBrowserSupabase();
 const { data } = sb ? await sb.auth.getSession() : { data: { session: null } };
 // B21: a network/5xx failure while checking "am I admin?" throws here
 // and is shown as an error — an admin is never silently landed on the
 // student portal because of a flaky connection.
 let target: string;
 try {
 target = await resolvePostLoginTarget(data?.session?.access_token ?? null);
 } catch (e) {
 setError(e instanceof Error ? e.message : "Could not confirm your account type. Try signing in again.");
 return;
 }
 setTimeout(() => router.push(target), 300);
 } finally { setBusy(false); }
 }
 return (
 <AuthShell title="Student Login" intro="Log in to your portal. Administrators are taken to the admin portal automatically.">
 <AuthMessages error={error} info={info} />
 <form onSubmit={submit} className="space-y-3" noValidate>
 <div><label className={labelCls} htmlFor="email">Email address</label><input id="email" type="email" className={inputCls} value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required /></div>
 <div><label className={labelCls} htmlFor="password">Password</label><input id="password" type="password" className={inputCls} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required /></div>
 <button className={submitCls} disabled={busy}>{busy ? "Logging in…" : "Log In"}</button>
 </form>
 <p className="mt-2 text-sm text-slate-600"><Link className="font-semibold text-sky" href="/forgot-password">Forgot your password?</Link> · <Link className="font-semibold text-sky" href="/register">Register</Link></p>
 </AuthShell>
 );
}
