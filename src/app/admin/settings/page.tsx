"use client";
import { useEffect, useState } from "react";
import AdminShell from "@/components/AdminShell";
import { Card, Alert } from "@/components/ui";
import { adminGet, adminPost, AdminApiError } from "@/lib/adminClient";

const FIELDS: { key: string; label: string; type: string; hint: string }[] = [
  { key: "daily_new_topic_limit", label: "Daily new-topic limit", type: "number", hint: "Whole number, 1–10. New topics a student may start per Africa/Lagos calendar day." },
  { key: "timezone", label: "Timezone", type: "text", hint: "Calendar timezone for daily limits, e.g. Africa/Lagos." },
  { key: "quiz_pass_mark", label: "Quiz pass mark (out of 10)", type: "number", hint: "Whole number, 1–10. The quiz pass mark shown to students." },
  { key: "exam_pass_mark_percent", label: "Examination pass mark (%)", type: "number", hint: "Whole number, 1–100. The examination pass mark shown to students." },
  { key: "payment_whatsapp", label: "Payment WhatsApp", type: "text", hint: "Number students pay and confirm through, e.g. +234 813 938 8562." },
];

export default function Page() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const [busyKey, setBusyKey] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const d = await adminGet<{ settings: Record<string, string> }>("/api/admin/settings");
      setSettings(d.settings);
      setDrafts(d.settings);
      setErr("");
    } catch (e: unknown) {
      setErr(e instanceof AdminApiError ? e.message : "Could not load settings.");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, []);

  async function save(key: string) {
    setBusyKey(key);
    setErr("");
    setMsg("");
    try {
      await adminPost("/api/admin/settings", { key, value: drafts[key] ?? "" });
      setMsg(`Setting saved: ${key}.`);
      await load();
    } catch (e: unknown) {
      setErr(e instanceof AdminApiError ? e.message : "Could not save the setting.");
    } finally {
      setBusyKey(null);
    }
  }

  return (
    <AdminShell title="Academy Settings" intro="Daily topic limit, timezone, payment contact and pass marks.">
      {err && <div className="mb-4"><Alert kind="error">{err}</Alert></div>}
      {msg && <div className="mb-4"><Alert kind="success">{msg}</Alert></div>}
      <Card>
        <h3 className="font-bold text-navy">Current settings</h3>
        <p className="mt-2 text-sm text-slate-600">
          Settings are stored in the academy_settings table. Change them deliberately, announce changes to students, and every change is recorded in the audit log.
          {loading ? " Loading…" : ""}
        </p>
        <ul className="mt-4 space-y-4">
          {FIELDS.map((f) => (
            <li key={f.key} className="rounded-2xl border border-slate-200 p-4">
              <label className="block text-sm font-semibold text-navy" htmlFor={`setting-${f.key}`}>{f.label}</label>
              <p className="text-xs text-slate-500">{f.hint}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <input
                  id={`setting-${f.key}`}
                  className="w-full max-w-xs input-std"
                  type={f.type}
                  value={drafts[f.key] ?? ""}
                  onChange={(e) => setDrafts((d) => ({ ...d, [f.key]: e.target.value }))}
                />
                <button
                  className="btn-gold px-3 py-1.5 text-sm disabled:opacity-50"
                  disabled={busyKey === f.key || drafts[f.key] === settings[f.key]}
                  onClick={() => save(f.key)}
                >
                  {busyKey === f.key ? "Saving…" : "Save"}
                </button>
              </div>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-sm text-slate-600">Supabase project: <strong>https://fodwlmprqreheqiskowy.supabase.co</strong></p>
        <h3 className="mt-6 font-bold text-navy">Administrator profile</h3>
        <p className="mt-2 text-sm text-slate-600">Admin accounts are ordinary Supabase Auth accounts promoted to the admin role by the owner-controlled bootstrap (/admin/setup). There is no public admin registration and no hardcoded admin password anywhere in this codebase.</p>
      </Card>
    </AdminShell>
  );
}
