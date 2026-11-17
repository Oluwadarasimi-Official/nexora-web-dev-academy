"use client";
import { useEffect, useState } from "react";
import AdminShell from "@/components/AdminShell";
import { Card, Alert } from "@/components/ui";
import { adminGet, adminPost, AdminApiError, type AdminSupport } from "@/lib/adminClient";

type Status = "open" | "in_progress" | "resolved";

export default function Page() {
  const [items, setItems] = useState<AdminSupport[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const [replies, setReplies] = useState<Record<string, string>>({});
  const [statuses, setStatuses] = useState<Record<string, Status>>({});
  const [busyId, setBusyId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const d = await adminGet<{ requests: AdminSupport[] }>("/api/admin/support");
      setItems(d.requests);
      setErr("");
      const r: Record<string, string> = {};
      const s: Record<string, Status> = {};
      for (const item of d.requests) {
        r[item.id] = item.admin_reply ?? "";
        s[item.id] = item.status as Status;
      }
      setReplies(r);
      setStatuses(s);
    } catch (e: unknown) {
      setErr(e instanceof AdminApiError ? e.message : "Could not load support requests.");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, []);

  async function save(item: AdminSupport) {
    setBusyId(item.id);
    setErr("");
    setMsg("");
    try {
      await adminPost("/api/admin/support", {
        requestId: item.id,
        reply: (replies[item.id] ?? "").trim(),
        status: statuses[item.id] ?? item.status,
      });
      setMsg(`Reply saved for ${item.student_name}.`);
      await load();
    } catch (e: unknown) {
      setErr(e instanceof AdminApiError ? e.message : "Could not save the reply.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <AdminShell title="Support Requests" intro="Review student support requests and respond. Students see only their own requests.">
      {err && <div className="mb-4"><Alert kind="error">{err}</Alert></div>}
      {msg && <div className="mb-4"><Alert kind="success">{msg}</Alert></div>}
      <Card>
        <h3 className="font-bold text-navy">Support requests</h3>
        <p className="mt-2 text-sm text-slate-600">Reply in the admin reply field and set the status to in_progress or resolved. Students see the reply in Dashboard → Help &amp; Support.</p>
        {loading ? (
          <p className="mt-4 text-sm text-slate-600">Loading requests…</p>
        ) : items.length === 0 ? (
          <p className="mt-4 text-sm text-slate-600">No support requests yet.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {items.map((item) => (
              <li key={item.id} className="rounded-2xl border border-slate-200 p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-bold text-navy">{item.student_name} <span className="font-normal text-slate-500">· {item.student_email}</span></p>
                    <p className="text-sm text-slate-600">Category: {item.category}</p>
                    <p className="mt-1 text-sm text-slate-700">{item.message}</p>
                    <p className="mt-1 text-xs text-slate-500">Opened {new Date(item.created_at).toLocaleString()}</p>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${item.status === "resolved" ? "bg-gold/20 text-gold-dark" : item.status === "in_progress" ? "bg-sky-50 text-sky-800" : "bg-red-50 text-red-700"}`}>
                    {item.status.replace("_", " ")}
                  </span>
                </div>
                <div className="mt-3 space-y-2">
                  <label className="block text-sm font-semibold text-navy" htmlFor={`reply-${item.id}`}>Admin reply</label>
                  <textarea
                    id={`reply-${item.id}`}
                    className="w-full input-std"
                    rows={2}
                    value={replies[item.id] ?? ""}
                    onChange={(e) => setReplies((r) => ({ ...r, [item.id]: e.target.value }))}
                    placeholder="Write your reply to the student…"
                  />
                  <div className="flex flex-wrap gap-2">
                    <select
                      className="input-std"
                      value={statuses[item.id] ?? item.status}
                      onChange={(e) => setStatuses((s) => ({ ...s, [item.id]: e.target.value as Status }))}
                      aria-label="Request status"
                    >
                      <option value="open">Open</option>
                      <option value="in_progress">In progress</option>
                      <option value="resolved">Resolved</option>
                    </select>
                    <button className="btn-gold px-3 py-1.5 text-sm disabled:opacity-50" disabled={busyId === item.id} onClick={() => save(item)}>
                      {busyId === item.id ? "Working…" : "Save reply"}
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </AdminShell>
  );
}
