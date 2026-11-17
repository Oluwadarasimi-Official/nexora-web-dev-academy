"use client";
import { useEffect, useState } from "react";
import AdminShell from "@/components/AdminShell";
import { Card, Alert } from "@/components/ui";
import { adminGet, AdminApiError, type AdminLog } from "@/lib/adminClient";

export default function Page() {
  const [logs, setLogs] = useState<AdminLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    let alive = true;
    adminGet<{ logs: AdminLog[] }>("/api/admin/logs")
      .then((d) => { if (alive) setLogs(d.logs); })
      .catch((e: unknown) => {
        if (alive) setErr(e instanceof AdminApiError ? e.message : "Could not load the audit log.");
      })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  return (
    <AdminShell title="Activity Logs" intro="Audit trail for payment decisions, code assignment/redemption, role changes, suspensions, exam grading and certificate actions.">
      {err && <div className="mb-4"><Alert kind="error">{err}</Alert></div>}
      <Card>
        <h3 className="font-bold text-navy">Audit log</h3>
        <p className="mt-2 text-sm text-slate-600">Every privileged action writes a row to admin_activity_logs (administrator, action, target, detail, timestamp). Review it after code assignments, revocations, suspensions and certificate changes.</p>
        {loading ? (
          <p className="mt-4 text-sm text-slate-600">Loading the audit log…</p>
        ) : logs.length === 0 ? (
          <p className="mt-4 text-sm text-slate-600">No admin actions recorded yet.</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {logs.map((l) => (
              <li key={l.id} className="rounded-2xl border border-slate-200 p-4 text-sm">
                <p className="font-bold text-navy">
                  {l.action}
                  {l.target_type ? <span className="font-normal text-slate-500"> · {l.target_type}{l.target_id ? ` ${l.target_id.slice(0, 8)}…` : ""}</span> : ""}
                </p>
                {l.detail && <p className="text-slate-600">{l.detail}</p>}
                <p className="mt-1 text-xs text-slate-500">
                  {l.admin_name ?? "System"} · {new Date(l.created_at).toLocaleString()}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </AdminShell>
  );
}
