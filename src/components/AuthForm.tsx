"use client";
import { useState } from "react";
import { getBrowserSupabase, isSupabaseConfigured } from "@/lib/supabase";
import { saveSession } from "@/lib/store";
import { Alert } from "@/components/ui";

/* Auth pages are one clean full-screen composition: the card is centred
 in the viewport (header top, tidy footer pinned at the bottom), so the
 whole card is visible at once on a 390px phone — no scrolling, no dead
 empty space, no footer floating mid-page. */
export function AuthShell({ title, intro, children }: { title: string; intro: string; children: React.ReactNode }) {
 return (
 <section className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center px-4 py-2">
 <div className="card w-full rounded-2xl p-4 sm:p-6">
 <h1 className="text-center text-xl font-bold tracking-tight text-navy sm:text-2xl">{title}</h1>
 <p className="mt-1 text-center text-sm leading-relaxed text-slate-600">{intro}</p>
 <div className="mt-4">{children}</div>
 </div>
 {/* Tall-viewport ornament only (hidden below 900px height, so the exact
     844px phone fit is untouched): fills the dead space under the card. */}
 <div className="auth-ornament" aria-hidden="true">
 <span className="dot" style={{ background: "#c9a227" }} />
 <span>Learn. Build. Innovate.</span>
 <span className="dot" style={{ background: "#c9a227" }} />
 </div>
 </section>
 );
}
export const inputCls = "input-std mt-1";
export const labelCls = "block text-sm font-semibold text-slate-700";
export const submitCls = "btn-gold w-full px-4 py-2.5 disabled:opacity-50";

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
 const accounts: { email: string; password: string; name: string; id: string }[] = raw ? JSON.parse(raw) : [];
 const acc = accounts.find((a) => a.email === email);
 if (!acc || acc.password !== password) return { ok: false, error: "Invalid email or password." };
 saveSession({ name: acc.name, email, id: acc.id });
 return { ok: true, local: true };
 }
 const { data, error } = await sb.auth.signInWithPassword({ email, password });
 if (error) return { ok: false, error: error.message };
 const name = (data.user?.user_metadata as { full_name?: string } | undefined)?.full_name || email;
 saveSession({ name, email, id: data.user!.id });
 return { ok: true, local: false };
}

/* Post-login routing: administrators go to /admin, students to /dashboard.
 The check reuses the existing admin endpoint (GET /api/admin/overview with
 the caller's session token — 200 means admin). ANY failure (no token, 401,
 403, network error) falls back to /dashboard, so the student flow can
 never break because of this check. */
export async function resolvePostLoginTarget(accessToken: string | null): Promise<string> {
 if (!accessToken) return "/dashboard";
 try {
 const res = await fetch("/api/admin/overview", { headers: { Authorization: `Bearer ${accessToken}` } });
 return res.ok ? "/admin" : "/dashboard";
 } catch {
 return "/dashboard";
 }
}
export async function supabaseSignOut() {
 const sb = getBrowserSupabase();
 if (sb) { try { await sb.auth.signOut(); } catch {} }
 saveSession(null);
 // NOTE (B3 fix): do NOT delete the local progress here. Progress lives
 // in the academy database and is re-hydrated from GET /api/progress on
 // the next sign-in; wiping it on logout destroyed a student's record on
 // that device with no way back (a fresh sign-in used to show "Not yet
 // activated, 0 progress" even though the server had them activated).
}
export function localRegisterAccount(name: string, email: string, password: string) {
 const raw = localStorage.getItem("nexora-accounts");
 const accounts: { email: string; password: string; name: string; id: string }[] = raw ? JSON.parse(raw) : [];
 if (accounts.some((a) => a.email === email)) return false;
 accounts.push({ id: "local-" + Date.now(), name, email, password });
 localStorage.setItem("nexora-accounts", JSON.stringify(accounts));
 return true;
}
export function isConfiguredNote() {
 return isSupabaseConfigured()
 ? "Connected to the academy's Supabase project."
 : "Your account is stored on this device for now.";
}
