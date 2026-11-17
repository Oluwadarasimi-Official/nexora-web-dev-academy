"use client";
import { useEffect, useMemo, useState } from "react";
import AdminShell from "@/components/AdminShell";
import { Card, Alert } from "@/components/ui";
import { adminGet, adminPost, AdminApiError, type AdminCertificate } from "@/lib/adminClient";

const LEVEL_NAMES = ["", "Beginner", "Intermediate", "Advanced"];

export default function Page() {
  const [certs, setCerts] = useState<AdminCertificate[]>([]);
  const [counts, setCounts] = useState({ total: 0, valid: 0, revoked: 0 });
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const [query, setQuery] = useState("");
  const [actId, setActId] = useState<string | null>(null);
  const [actKind, setActKind] = useState<"revoke" | "reissue" | null>(null);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const d = await adminGet<{ certificates: AdminCertificate[]; counts: { total: number; valid: number; revoked: number } }>("/api/admin/certificates");
      setCerts(d.certificates);
      setCounts(d.counts);
      setErr("");
    } catch (e: unknown) {
      setErr(e instanceof AdminApiError ? e.message : "Could not load certificates.");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return certs;
    return certs.filter(
      (c) =>
        c.certificate_id.toLowerCase().includes(q) ||
        c.student_name.toLowerCase().includes(q) ||
        c.title.toLowerCase().includes(q)
    );
  }, [certs, query]);

  async function act(cert: AdminCertificate) {
    if (!actKind) return;
    if (actKind === "revoke" && !reason.trim()) {
      setErr("A reason is required to revoke a certificate.");
      return;
    }
    setBusy(true);
    setErr("");
    setMsg("");
    try {
      await adminPost("/api/admin/certificates", {
        certificateId: cert.certificate_id,
        action: actKind,
        reason: reason.trim(),
      });
      setMsg(
        actKind === "revoke"
          ? `Certificate ${cert.certificate_id} revoked.`
          : `Certificate ${cert.certificate_id} revoked for reissue. The student re-issues a corrected certificate from their dashboard.`
      );
      setActId(null);
      setActKind(null);
      setReason("");
      await load();
    } catch (e: unknown) {
      setErr(e instanceof AdminApiError ? e.message : "Could not update the certificate.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AdminShell title="Certificate Management" intro="Search, inspect, revoke with a reason, and reissue a corrected certificate. Every action is logged.">
      {err && <div className="mb-4"><Alert kind="error">{err}</Alert></div>}
      {msg && <div className="mb-4"><Alert kind="success">{msg}</Alert></div>}
      <Card>
        <h3 className="font-bold text-navy">Certificates ({counts.total} total · {counts.valid} valid · {counts.revoked} revoked)</h3>
        <p className="mt-2 text-sm text-slate-600">Issued certificates live in the certificates table (one valid certificate per student per level, enforced by a unique constraint). Search by certificate ID, student name or level.</p>
        <input
          className="mt-3 w-full max-w-md input-std"
          placeholder="Search by certificate ID or student name…"
          aria-label="Search certificates"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-slate-600">
          <li><strong>Revoke</strong> — requires a reason; the certificate shows as revoked on the public verification page.</li>
          <li><strong>Reissue</strong> — issues a corrected certificate with a new certificate ID; the old record keeps its audit trail.</li>
          <li><strong>Never</strong> issue a certificate for a student who has not completed the level and passed the examination.</li>
        </ul>
        {loading ? (
          <p className="mt-4 text-sm text-slate-600">Loading certificates…</p>
        ) : filtered.length === 0 ? (
          <p className="mt-4 text-sm text-slate-600">No certificates found.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {filtered.map((c) => (
              <li key={c.id} className="rounded-2xl border border-slate-200 p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-bold text-navy">{c.certificate_id}</p>
                    <p className="text-sm text-slate-600">{c.title} — {c.student_name}</p>
                    <p className="text-sm text-slate-600">Level {c.level_id} · {LEVEL_NAMES[c.level_id] ?? ""}</p>
                    <p className="text-xs text-slate-500">Issued {new Date(c.issued_at).toLocaleString()}</p>
                    {c.status === "revoked" && c.revoke_reason && (
                      <p className="mt-1 text-sm text-red-700">Revoked: {c.revoke_reason}</p>
                    )}
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${c.status === "valid" ? "bg-gold/20 text-gold-dark" : "bg-red-50 text-red-700"}`}>
                    {c.status}
                  </span>
                </div>
                {c.status === "valid" && (
                  <div className="mt-3">
                    {actId === c.id ? (
                      <div className="space-y-2">
                        <input
                          className="w-full input-std"
                          value={reason}
                          onChange={(e) => setReason(e.target.value)}
                          placeholder={actKind === "revoke" ? "Reason for revoking (required)" : "Reason for reissue (optional)"}
                          aria-label="Reason"
                        />
                        <div className="flex gap-2">
                          <button className="btn-gold px-3 py-1.5 text-sm disabled:opacity-50" disabled={busy} onClick={() => act(c)}>
                            {busy ? "Working…" : actKind === "revoke" ? "Confirm revoke" : "Confirm reissue"}
                          </button>
                          <button className="btn-sky px-3 py-1.5 text-sm" onClick={() => { setActId(null); setActKind(null); setReason(""); }}>
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <button className="btn-gold px-3 py-1.5 text-sm" onClick={() => { setActId(c.id); setActKind("revoke"); setReason(""); setErr(""); }}>
                          Revoke
                        </button>
                        <button className="btn-sky px-3 py-1.5 text-sm" onClick={() => { setActId(c.id); setActKind("reissue"); setReason(""); setErr(""); }}>
                          Reissue
                        </button>
                      </div>
                    )}
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
