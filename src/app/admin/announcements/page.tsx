"use client";
import { useEffect, useState } from "react";
import AdminShell from "@/components/AdminShell";
import { Card, Alert } from "@/components/ui";
import { adminGet, adminPost, AdminApiError, type AdminAnnouncement } from "@/lib/adminClient";

export default function Page() {
  const [items, setItems] = useState<AdminAnnouncement[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [audience, setAudience] = useState("all");
  const [busy, setBusy] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const d = await adminGet<{ announcements: AdminAnnouncement[] }>("/api/admin/announcements");
      setItems(d.announcements);
      setErr("");
    } catch (e: unknown) {
      setErr(e instanceof AdminApiError ? e.message : "Could not load announcements.");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    setMsg("");
    try {
      await adminPost("/api/admin/announcements", { action: "create", title: title.trim(), body: body.trim(), audience });
      setMsg("Announcement published.");
      setTitle("");
      setBody("");
      setAudience("all");
      await load();
    } catch (e2: unknown) {
      setErr(e2 instanceof AdminApiError ? e2.message : "Could not create the announcement.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    setBusy(true);
    setErr("");
    setMsg("");
    try {
      await adminPost("/api/admin/announcements", { action: "delete", id });
      setMsg("Announcement deleted.");
      await load();
    } catch (e: unknown) {
      setErr(e instanceof AdminApiError ? e.message : "Could not delete the announcement.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AdminShell title="Announcements" intro="Announcements shown to students on their dashboard.">
      {err && <div className="mb-4"><Alert kind="error">{err}</Alert></div>}
      {msg && <div className="mb-4"><Alert kind="success">{msg}</Alert></div>}
      <Card>
        <h3 className="font-bold text-navy">New announcement</h3>
        <p className="mt-2 text-sm text-slate-600">Keep announcements short, factual and dated.</p>
        <form onSubmit={create} className="mt-3 space-y-3">
          <div>
            <label className="block text-sm font-semibold text-navy" htmlFor="ann-title">Title</label>
            <input id="ann-title" className="mt-1 w-full input-std" value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={200} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-navy" htmlFor="ann-body">Message</label>
            <textarea id="ann-body" className="mt-1 w-full input-std" rows={3} value={body} onChange={(e) => setBody(e.target.value)} required maxLength={2000} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-navy" htmlFor="ann-audience">Audience</label>
            <select id="ann-audience" className="mt-1 w-full max-w-xs input-std" value={audience} onChange={(e) => setAudience(e.target.value)}>
              <option value="all">All students</option>
              <option value="level-1">Level 1 — Beginner</option>
              <option value="level-2">Level 2 — Intermediate</option>
              <option value="level-3">Level 3 — Advanced</option>
            </select>
          </div>
          <button className="btn-gold px-4 py-2 text-sm disabled:opacity-50" disabled={busy}>
            {busy ? "Working…" : "Publish announcement"}
          </button>
        </form>
      </Card>
      <Card className="mt-4">
        <h3 className="font-bold text-navy">Published announcements</h3>
        {loading ? (
          <p className="mt-2 text-sm text-slate-600">Loading announcements…</p>
        ) : items.length === 0 ? (
          <p className="mt-2 text-sm text-slate-600">No announcements yet.</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {items.map((a) => (
              <li key={a.id} className="rounded-2xl border border-slate-200 p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-bold text-navy">{a.title}</p>
                    <p className="text-sm text-slate-600">{a.body}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      Audience: {a.audience} · {new Date(a.created_at).toLocaleString()}
                    </p>
                  </div>
                  <button className="btn-sky px-3 py-1.5 text-sm disabled:opacity-50" disabled={busy} onClick={() => remove(a.id)}>
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </AdminShell>
  );
}
