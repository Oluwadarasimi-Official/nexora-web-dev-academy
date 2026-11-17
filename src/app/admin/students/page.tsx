"use client";
import { useEffect, useMemo, useState } from "react";
import AdminShell from "@/components/AdminShell";
import { Card, Alert } from "@/components/ui";
import { adminGet, adminPost, AdminApiError, type AdminStudent } from "@/lib/adminClient";

const LEVEL_NAMES = ["", "Beginner", "Intermediate", "Advanced"];

export default function Page() {
  const [students, setStudents] = useState<AdminStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const [query, setQuery] = useState("");
  const [suspendId, setSuspendId] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const d = await adminGet<{ students: AdminStudent[] }>("/api/admin/students");
      setStudents(d.students);
      setErr("");
    } catch (e: unknown) {
      setErr(e instanceof AdminApiError ? e.message : "Could not load students.");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return students;
    return students.filter(
      (s) => s.full_name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q)
    );
  }, [students, query]);

  async function act(student: AdminStudent, action: "suspend" | "restore") {
    if (action === "suspend" && !reason.trim()) {
      setErr("A reason is required to suspend a student.");
      return;
    }
    setBusyId(student.id);
    setErr("");
    setMsg("");
    try {
      await adminPost("/api/admin/students", {
        studentId: student.id,
        action,
        reason: action === "suspend" ? reason.trim() : "",
      });
      setMsg(`${student.full_name} ${action === "suspend" ? "suspended" : "restored"}.`);
      setSuspendId(null);
      setReason("");
      await load();
    } catch (e: unknown) {
      setErr(e instanceof AdminApiError ? e.message : "Could not update the student.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <AdminShell title="Student Management" intro="Search and filter students, view progress and results, and suspend or restore access with a reason. Passwords are never displayed.">
      {err && <div className="mb-4"><Alert kind="error">{err}</Alert></div>}
      {msg && <div className="mb-4"><Alert kind="success">{msg}</Alert></div>}
      <Card>
        <h3 className="font-bold text-navy">Students</h3>
        <p className="mt-2 text-sm text-slate-600">
          {loading ? "Loading students…" : `${filtered.length} student${filtered.length === 1 ? "" : "s"}${query ? " matching your search" : " registered"}.`}
          {" "}Each row shows profile, payment status, progress and certificates, with Suspend / Restore (reason required, written to admin_activity_logs).
        </p>
        <input
          className="mt-3 w-full max-w-md input-std"
          placeholder="Search by name or email…"
          aria-label="Search students"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="mt-4 card-soft rounded-2xl border border-slate-200 p-4 text-sm text-slate-600">
          <strong>Suspend / restore rule:</strong> suspending blocks lesson, quiz and exam access immediately; the reason and the acting administrator are recorded. Restoration is the same action in reverse, also logged.
        </div>
        {!loading && filtered.length === 0 && (
          <p className="mt-4 text-sm text-slate-600">No students found.</p>
        )}
        <ul className="mt-4 space-y-3">
          {filtered.map((s) => (
            <li key={s.id} className="rounded-2xl border border-slate-200 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-bold text-navy">
                    {s.full_name}{" "}
                    {s.suspended && <span className="ml-1 rounded-full bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-700">Suspended</span>}
                    {s.activated && !s.suspended && <span className="ml-1 rounded-full bg-sky-50 px-2 py-0.5 text-xs font-semibold text-sky-800">Activated</span>}
                  </p>
                  <p className="text-sm text-slate-600">{s.email}</p>
                  <p className="mt-1 text-sm text-slate-600">
                    Level {s.current_level} · {LEVEL_NAMES[s.current_level] ?? ""} · {s.completedTopics} / 73 topics · {s.certificates} certificate{s.certificates === 1 ? "" : "s"} · Payment: {s.paymentStatus}
                  </p>
                  {s.suspended && s.suspension_reason && (
                    <p className="mt-1 text-sm text-red-700">Reason: {s.suspension_reason}</p>
                  )}
                  <p className="text-xs text-slate-500">Joined {new Date(s.created_at).toLocaleDateString()}</p>
                </div>
                <div className="flex gap-2">
                  {s.suspended ? (
                    <button
                      className="btn-sky px-3 py-1.5 text-sm disabled:opacity-50"
                      disabled={busyId === s.id}
                      onClick={() => act(s, "restore")}
                    >
                      {busyId === s.id ? "Working…" : "Restore"}
                    </button>
                  ) : (
                    <button
                      className="btn-gold px-3 py-1.5 text-sm disabled:opacity-50"
                      disabled={busyId === s.id}
                      onClick={() => { setSuspendId(s.id); setReason(""); setErr(""); }}
                    >
                      Suspend
                    </button>
                  )}
                </div>
              </div>
              {suspendId === s.id && !s.suspended && (
                <div className="mt-3 space-y-2">
                  <label className="block text-sm font-semibold text-navy" htmlFor={`reason-${s.id}`}>Reason for suspension (required)</label>
                  <input
                    id={`reason-${s.id}`}
                    className="w-full input-std"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="e.g. Payment dispute — under review"
                  />
                  <div className="flex gap-2">
                    <button
                      className="btn-gold px-3 py-1.5 text-sm disabled:opacity-50"
                      disabled={busyId === s.id}
                      onClick={() => act(s, "suspend")}
                    >
                      {busyId === s.id ? "Working…" : "Confirm suspension"}
                    </button>
                    <button
                      className="btn-sky px-3 py-1.5 text-sm"
                      onClick={() => { setSuspendId(null); setReason(""); }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      </Card>
    </AdminShell>
  );
}
