"use client";
import { useEffect, useMemo, useState } from "react";
import AdminShell from "@/components/AdminShell";
import { Card, Alert } from "@/components/ui";
import { adminGet, adminPost, AdminApiError, type AdminCode, type AdminStudent } from "@/lib/adminClient";

type Filter = "all" | "unused" | "assigned" | "redeemed" | "revoked";

export default function Page() {
  const [codes, setCodes] = useState<AdminCode[]>([]);
  const [counts, setCounts] = useState({ total: 0, unused: 0, assigned: 0, redeemed: 0, revoked: 0, disabled: 0 });
  const [students, setStudents] = useState<AdminStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [assignStudent, setAssignStudent] = useState("");
  const [assignCode, setAssignCode] = useState("");
  const [revokeId, setRevokeId] = useState<string | null>(null);
  const [revokeReason, setRevokeReason] = useState("");
  const [busy, setBusy] = useState(false);
  // B10: freshly generated codes, shown ONCE for the owner to copy.
  const [genCount, setGenCount] = useState(10);
  const [newCodes, setNewCodes] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const [c, s] = await Promise.all([
        adminGet<{ codes: AdminCode[]; counts: { total: number; unused: number; assigned: number; redeemed: number; revoked: number; disabled: number } }>("/api/admin/codes"),
        adminGet<{ students: AdminStudent[] }>("/api/admin/students"),
      ]);
      setCodes(c.codes);
      setCounts(c.counts);
      setStudents(s.students);
      setErr("");
    } catch (e: unknown) {
      setErr(e instanceof AdminApiError ? e.message : "Could not load access codes.");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, []);

  const filtered = useMemo(
    () => (filter === "all" ? codes : codes.filter((c) => c.status === filter)),
    [codes, filter]
  );
  const unused = codes.filter((c) => c.status === "unused");
  const assignableStudents = students.filter((s) => !s.suspended);

  async function generate() {
    setBusy(true);
    setErr("");
    setMsg("");
    setCopied(false);
    try {
      const data = await adminPost<{ codes: string[]; count: number }>("/api/admin/codes", { action: "generate", count: genCount });
      setNewCodes(data.codes);
      setMsg(`${data.count} new access codes generated. Copy them now — they are shown once and never stored.`);
      await load();
    } catch (e: unknown) {
      setErr(e instanceof AdminApiError ? e.message : "Could not generate codes.");
    } finally {
      setBusy(false);
    }
  }

  async function assign() {
    if (!assignStudent || !assignCode) {
      setErr("Choose a student and an unused code first.");
      return;
    }
    setBusy(true);
    setErr("");
    setMsg("");
    try {
      await adminPost("/api/admin/codes", { action: "assign", codeId: assignCode, studentId: assignStudent });
      const name = students.find((s) => s.id === assignStudent)?.full_name ?? "the student";
      setMsg(`Code marked as given to ${name}.`);
      setAssignStudent("");
      setAssignCode("");
      await load();
    } catch (e: unknown) {
      setErr(e instanceof AdminApiError ? e.message : "Could not assign the code.");
    } finally {
      setBusy(false);
    }
  }

  async function revoke(codeId: string) {
    if (!revokeReason.trim()) {
      setErr("A reason is required to revoke a code.");
      return;
    }
    setBusy(true);
    setErr("");
    setMsg("");
    try {
      await adminPost("/api/admin/codes", { action: "revoke", codeId, reason: revokeReason.trim() });
      setMsg("Access code revoked.");
      setRevokeId(null);
      setRevokeReason("");
      await load();
    } catch (e: unknown) {
      setErr(e instanceof AdminApiError ? e.message : "Could not revoke the code.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AdminShell title="Access-Code Management" intro="Access codes (hashes only). Generate a new batch when you run low — full codes are shown once and never stored.">
      {err && <div className="mb-4"><Alert kind="error">{err}</Alert></div>}
      {msg && <div className="mb-4"><Alert kind="success">{msg}</Alert></div>}
      <div className="grid gap-4 md:grid-cols-3">
        <Card><p className="text-xs uppercase tracking-widest text-slate-500">Total codes</p><p className="mt-1 text-2xl font-bold text-navy">{loading ? "…" : counts.total}</p><p className="text-xs text-slate-500">Numbered by creation order — the same number in the list and in the dropdown.</p></Card>
        <Card><p className="text-xs uppercase tracking-widest text-slate-500">Redeemed</p><p className="mt-1 text-2xl font-bold text-navy">{loading ? "…" : counts.redeemed}</p><p className="text-xs text-slate-500">{counts.assigned} assigned and waiting · {counts.revoked} revoked.</p></Card>
        <Card><p className="text-xs uppercase tracking-widest text-slate-500">Unused</p><p className="mt-1 text-2xl font-bold text-navy">{loading ? "…" : counts.unused}</p><p className="text-xs text-slate-500">Available to give out on WhatsApp.</p></Card>
      </div>
      <Card className="mt-4">
        <h3 className="font-bold text-navy">Generate a new batch</h3>
        <p className="mt-2 text-sm text-slate-600">When unused codes run low, mint more here. Only SHA-256 hashes are stored — the codes below are the only time the plaintext ever exists, so copy them before you leave this page. Anyone with a code can activate an account.</p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <label className="text-sm font-semibold text-navy" htmlFor="gen-count">How many?</label>
          <input id="gen-count" type="number" min={1} max={30} className="w-20 input-std" value={genCount} onChange={(e) => setGenCount(Math.min(30, Math.max(1, Number(e.target.value) || 1)))} />
          <button className="btn-gold px-4 py-2 text-sm disabled:opacity-50" disabled={busy} onClick={generate}>
            {busy ? "Working…" : "Generate Codes"}
          </button>
        </div>
        {newCodes.length > 0 && (
          <div className="mt-4 rounded-2xl border border-gold/60 bg-[#fdf8ec] p-4">
            <p className="text-sm font-bold text-navy">New codes — copy them now. They will not be shown again.</p>
            <ol className="mt-2 space-y-1 text-sm font-mono text-navy">
              {newCodes.map((c, i) => (<li key={c}>{i + 1}. {c}</li>))}
            </ol>
            <button
              className="btn-sky mt-3 px-4 py-2 text-sm"
              onClick={async () => { try { await navigator.clipboard.writeText(newCodes.join("\n")); setCopied(true); } catch { setCopied(false); } }}
            >
              {copied ? "Copied ✓" : "Copy All Codes"}
            </button>
            <button className="btn-outline ml-2 px-4 py-2 text-sm" onClick={() => setNewCodes([])}>Hide</button>
          </div>
        )}
      </Card>
      <Card className="mt-4">
        <h3 className="font-bold text-navy">Mark a code as given</h3>
        <p className="mt-2 text-sm text-slate-600">After you give a code to a student on WhatsApp, mark it here so you never hand the same code out twice. Any unused code works for any student — this is only your record.</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <select className="input-std" value={assignStudent} onChange={(e) => setAssignStudent(e.target.value)} aria-label="Student to assign to">
            <option value="">Choose a student…</option>
            {assignableStudents.map((s) => (
              <option key={s.id} value={s.id}>{s.full_name} ({s.email}){s.activated ? " — already activated" : ""}</option>
            ))}
          </select>
          <select className="input-std" value={assignCode} onChange={(e) => setAssignCode(e.target.value)} aria-label="Unused code">
            <option value="">Choose an unused code…</option>
            {unused.map((c) => (
              <option key={c.id} value={c.id}>Code #{codes.findIndex((x) => x.id === c.id) + 1} (created {new Date(c.created_at).toLocaleDateString()})</option>
            ))}
          </select>
        </div>
        <button className="btn-gold mt-3 px-4 py-2 text-sm disabled:opacity-50" disabled={busy} onClick={assign}>
          {busy ? "Working…" : "Mark as given"}
        </button>
      </Card>
      <Card className="mt-4">
        <h3 className="font-bold text-navy">All codes</h3>
        <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Filter codes">
          {(["all", "unused", "assigned", "redeemed", "revoked"] as Filter[]).map((f) => (
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
          <p className="mt-4 text-sm text-slate-600">Loading codes…</p>
        ) : filtered.length === 0 ? (
          <p className="mt-4 text-sm text-slate-600">No codes in this view.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {filtered.map((c) => (
              <li key={c.id} className="rounded-2xl border border-slate-200 p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-bold text-navy">Code #{codes.findIndex((x) => x.id === c.id) + 1} <span className="font-normal text-slate-500">· {c.id.slice(0, 8)}…</span></p>
                    <p className="text-sm text-slate-600">
                      {c.status === "unused" && "Unused — available to give out."}
                      {c.status === "assigned" && `Assigned to ${c.assigned_name ?? "a student"}${c.assigned_at ? ` on ${new Date(c.assigned_at).toLocaleDateString()}` : ""}.`}
                      {c.status === "redeemed" && `Redeemed by ${c.redeemed_by_name ?? "a student"}${c.redeemed_at ? ` on ${new Date(c.redeemed_at).toLocaleDateString()}` : ""}.`}
                      {c.status === "revoked" && "Revoked — can no longer be used."}
                      {c.status === "disabled" && "Disabled."}
                    </p>
                    <p className="text-xs text-slate-500">Created {new Date(c.created_at).toLocaleString()}</p>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${c.status === "unused" ? "bg-sky-50 text-sky-800" : c.status === "redeemed" ? "bg-gold/20 text-gold-dark" : c.status === "revoked" ? "bg-red-50 text-red-700" : "bg-slate-100 text-slate-700"}`}>
                    {c.status}
                  </span>
                </div>
                {c.status === "unused" && (
                  <div className="mt-3">
                    {revokeId === c.id ? (
                      <div className="space-y-2">
                        <input
                          className="w-full input-std"
                          value={revokeReason}
                          onChange={(e) => setRevokeReason(e.target.value)}
                          placeholder="Reason for revoking (required)"
                          aria-label="Reason for revoking"
                        />
                        <div className="flex gap-2">
                          <button className="btn-gold px-3 py-1.5 text-sm disabled:opacity-50" disabled={busy} onClick={() => revoke(c.id)}>
                            {busy ? "Working…" : "Confirm revoke"}
                          </button>
                          <button className="btn-sky px-3 py-1.5 text-sm" onClick={() => { setRevokeId(null); setRevokeReason(""); }}>
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button className="btn-sky px-3 py-1.5 text-sm" onClick={() => { setRevokeId(c.id); setRevokeReason(""); setErr(""); }}>
                        Revoke
                      </button>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>
      <Card className="mt-4">
        <h3 className="font-bold text-navy">Rules</h3>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600">
          <li>Only hashes are stored (SHA-256). Plaintext codes are shown once when a batch is generated — copy them then. If the list is lost, the codes cannot be recovered; generate a new batch instead.</li>
          <li>Import is idempotent: re-running migration 003 adds nothing (ON CONFLICT DO NOTHING).</li>
          <li>Mark a code as given after you hand it out on WhatsApp. Revoke only an unused code, with a reason.</li>
          <li>Redemption is atomic (redeem_code() in migration 005): simultaneous attempts cannot redeem the same code twice.</li>
          <li>When no unused codes remain, new activations are blocked with a contact-admin message. Generate a new batch above.</li>
        </ul>
      </Card>
    </AdminShell>
  );
}
