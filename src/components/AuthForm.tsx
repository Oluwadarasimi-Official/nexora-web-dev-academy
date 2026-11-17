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
// Register / login against Supabase. There is no local/demo fallback
// any more (B13 fix): the old one stored plaintext passwords in
// localStorage["nexora-accounts"], and the app is live on Supabase —
// if the database is not configured, auth fails honestly instead of
// silently creating device-local accounts.
export async function supabaseSignUp(name: string, email: string, password: string) {
 const sb = getBrowserSupabase();
 if (!sb) return { ok: false, error: "The academy database is not connected in this deployment yet. Contact the administrator." };
 const { data, error } = await sb.auth.signUp({ email, password, options: { data: { full_name: name } } });
 if (error) return { ok: false, error: error.message };
 if (data.user) {
 try { await sb.from("profiles").upsert({ id: data.user.id, full_name: name, email }); } catch {}
 saveSession({ name, email, id: data.user.id });
 }
 return { ok: true };
}
export async function supabaseSignIn(email: string, password: string) {
 const sb = getBrowserSupabase();
 if (!sb) return { ok: false, error: "The academy database is not connected in this deployment yet. Contact the administrator." };
 const { data, error } = await sb.auth.signInWithPassword({ email, password });
 if (error) return { ok: false, error: error.message };
 const name = (data.user?.user_metadata as { full_name?: string } | undefined)?.full_name || email;
 saveSession({ name, email, id: data.user!.id });
 return { ok: true };
}

/* Post-login routing: administrators go to /admin, students to /dashboard.
 The check reuses the existing admin endpoint (GET /api/admin/overview with
 the caller's session token — 200 means admin).
 B21 fix: a 401/403 genuinely means "not admin" and falls back to
 /dashboard — but a NETWORK error or a 5xx is retried once and then
 THROWN, so the login page shows the error instead of silently landing
 an admin on the student portal. The old code fell back to /dashboard on
 ANY failure, including a flaky connection. */
export async function resolvePostLoginTarget(accessToken: string | null): Promise<string> {
 if (!accessToken) return "/dashboard";
 for (let attempt = 0; attempt < 2; attempt++) {
 try {
 const res = await fetch("/api/admin/overview", { headers: { Authorization: `Bearer ${accessToken}` } });
 if (res.ok) return "/admin";
 if (res.status === 401 || res.status === 403) return "/dashboard";
 // Any other status (e.g. 500): retry once, then throw.
 if (attempt === 0) { await new Promise((r) => setTimeout(r, 500)); continue; }
 throw new Error("Could not confirm your account type. Please try signing in again.");
 } catch (e) {
 if (e instanceof Error && e.message.startsWith("Could not confirm")) throw e;
 // Network error: retry once, then throw.
 if (attempt === 0) { await new Promise((r) => setTimeout(r, 500)); continue; }
 throw new Error("Could not confirm your account type. Check your connection and try signing in again.");
 }
 }
 throw new Error("Could not confirm your account type. Please try signing in again.");
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
export function isConfiguredNote() {
 return isSupabaseConfigured()
 ? "Connected to the academy's Supabase project."
 : "The academy database is not connected in this deployment yet.";
}
