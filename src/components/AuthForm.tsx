"use client";
import { useState } from "react";
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
export async function supabaseSignOut() {
  const sb = getBrowserSupabase();
  if (sb) { try { await sb.auth.signOut(); } catch {} }
  saveSession(null);
  localStorage.removeItem("nexora-progress-v1");
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
    : "Supabase is not configured in this deployment yet — your account is stored locally on this device until the owner connects Supabase (see README). Your learning progress is still saved on this device.";
}
