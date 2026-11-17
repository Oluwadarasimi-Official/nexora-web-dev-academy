"use client";
import { useEffect, useMemo, useState } from "react";
import AdminShell from "@/components/AdminShell";
import { Card, Alert } from "@/components/ui";
import { adminGet, adminPost, AdminApiError, type AdminPayment, type AdminCode } from "@/lib/adminClient";

type Filter = "all" | "pending" | "approved" | "rejected";

export default function Page() {
  const [payments, setPayments] = useState<AdminPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const [filter, setFilter] = useState<Filter>("pending");
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const d = await adminGet<{ payments: AdminPayment[] }>("/api/admin/payments");
      setPayments(d.payments);
      setErr("");
    } catch (e: unknown) {
      setErr(e instanceof AdminApiError ? e.message : "Could not load payments.");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, []);

  const filtered = useMemo(
    () => (filter === "all" ? payments : payments.filter((p) => p.status === filter)),
    [payments, filter]
  );
  const pendingCount = payments.filter((p) => p.status === "pending").length;

  async function decide(p: AdminPayment, decision: "approved" | "rejected") {
    setBusyId(p.id);
    setErr("");
    setMsg("");
    try {
      await adminPost("/api/admin/payments", {
        paymentId: p.id,
        decision,
        note: (notes[p.id] ?? "").trim(),
      });
      setMsg(`Payment from ${p.student_name} ${decision}.`);
      await load();
    } catch (e: unknown) {
      setErr(e instanceof AdminApiError ? e.message : "Could not update the payment.");
    } finally {
      setBusyId(null);
    }
  }

  async function assignCode(p: AdminPayment) {
    setBusyId(p.id);
    setErr("");
    setMsg("");
    try {
      const d = await adminGet<{ codes: AdminCode[]; counts: { unused: number } }>("/api/admin/codes");
      const unused = d.codes.find((c) => c.status === "unused");
      if (!unused) {
        setErr("No unused access codes left. A new batch must be authorised by the owner.");
        return;
      }
      await adminPost("/api/admin/codes", {
        action: "assign",
        codeId: unused.id,
        studentId: p.student_id,
      });
      setMsg(`Access code assigned to ${p.student_name}. They can now activate at Dashboard → Payment & Activation.`);
    } catch (e: unknown) {
      setErr(e instanceof AdminApiError ? e.message : "Could not assign a code.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <AdminShell title="Payment Verification" intro="Approve or reject payment submissions with a note. A code may be assigned only after approval.">
      {err && <div className="mb-4"><Alert kind="error">{err}</Alert></div>}
      {msg && <div className="mb-4"><Alert kind="success">{msg}</Alert></div>}
      <Card>
        <h3 className="font-bold text-navy">Pending payments ({pendingCount})</h3>
        <p className="mt-2 text-sm text-slate-600">
          For each submission, check the payment independently outside the platform, then Approve or Reject with a note. The decision, the administrator and the timestamp are recorded.
        </p>
        <div className="mt-4 space-y-2 text-sm">
          <p><strong>Approve</strong> → status becomes approved → the Assign Code action becomes available for that student (one unused code, once).</p>
          <p><strong>Reject</strong> → status becomes rejected with your reason → the student sees the reason and can resubmit a correct reference.</p>
          <p><strong>Never approve</strong> on a screenshot alone. A claim is not proof of payment.</p>
        </div>
        <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Filter payments">
          {(["all", "pending", "approved", "rejected"] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${filter === f ? "border-gold bg-gold text-ink" : "chip text-navy hover:border-gold hover:text-sky"}`}
            >
              {f === "all" ? "All" : f[0].toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        {loading ? (
          <p className="mt-4 text-sm text-slate-600">Loading payments…</p>
        ) : filtered.length === 0 ? (
          <p className="mt-4 text-sm text-slate-600">No payments in this view.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {filtered.map((p) => (
              <li key={p.id} className="rounded-2xl border border-slate-200 p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-bold text-navy">{p.student_name} <span className="font-normal text-slate-500">· {p.student_email}</span></p>
                    <p className="text-sm text-slate-600">Reference: <strong>{p.reference}</strong>{p.amount_text ? ` · ${p.amount_text}` : ""}</p>
                    {p.evidence_note && <p className="text-sm text-slate-600">Note: {p.evidence_note}</p>}
                    <p className="text-xs text-slate-500">Submitted {new Date(p.created_at).toLocaleString()}</p>
                    {p.status !== "pending" && (
                      <p className="mt-1 text-sm text-slate-600">
                        {p.status === "approved" ? "Approved" : "Rejected"}
                        {p.review_note ? ` — ${p.review_note}` : ""}
                        {p.reviewed_at ? ` · ${new Date(p.reviewed_at).toLocaleString()}` : ""}
                      </p>
                    )}
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${p.status === "pending" ? "bg-sky-50 text-sky-800" : p.status === "approved" ? "bg-gold/20 text-gold-dark" : "bg-red-50 text-red-700"}`}>
                    {p.status}
                  </span>
                </div>
                {p.status === "pending" && (
                  <div className="mt-3 space-y-2">
                    <input
                      className="w-full input-std"
                      value={notes[p.id] ?? ""}
                      onChange={(e) => setNotes((n) => ({ ...n, [p.id]: e.target.value }))}
                      placeholder="Decision note (shown to the student)"
                      aria-label="Decision note"
                    />
                    <div className="flex flex-wrap gap-2">
                      <button className="btn-gold px-3 py-1.5 text-sm disabled:opacity-50" disabled={busyId === p.id} onClick={() => decide(p, "approved")}>
                        {busyId === p.id ? "Working…" : "Approve"}
                      </button>
                      <button className="btn-sky px-3 py-1.5 text-sm disabled:opacity-50" disabled={busyId === p.id} onClick={() => decide(p, "rejected")}>
                        Reject
                      </button>
                    </div>
                  </div>
                )}
                {p.status === "approved" && (
                  <div className="mt-3">
                    <button className="btn-gold px-3 py-1.5 text-sm disabled:opacity-50" disabled={busyId === p.id} onClick={() => assignCode(p)}>
                      {busyId === p.id ? "Working…" : "Assign access code"}
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </AdminShell>
  );
}
