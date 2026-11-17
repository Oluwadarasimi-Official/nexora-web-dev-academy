"use client";
import { useEffect, useState } from "react";
import AdminShell from "@/components/AdminShell";
import { Card, Alert } from "@/components/ui";
import { adminGet, AdminApiError } from "@/lib/adminClient";

type Overview = {
  studentsTotal: number;
  studentsActivated: number;
  studentsUnactivated: number;
  paymentsPending: number;
  paymentsTotal: number;
  codesTotal: number;
  codesUnused: number;
  codesAssigned: number;
  codesRedeemed: number;
  codesRevoked: number;
  certificatesIssued: number;
  recentActivity: { id: string; action: string; detail: string; created_at: string }[];
};

export default function Page() {
  const [data, setData] = useState<Overview | null>(null);
  const [err, setErr] = useState("");
  useEffect(() => {
    let alive = true;
    adminGet<Overview>("/api/admin/overview")
      .then((d) => { if (alive) setData(d); })
      .catch((e: unknown) => {
        if (alive) setErr(e instanceof AdminApiError ? e.message : "Could not load dashboard data.");
      });
    return () => { alive = false; };
  }, []);
  const metrics: [string, number | null, string][] = [
    ["Registered students", data?.studentsTotal ?? null, "Profiles"],
    ["Activated students", data?.studentsActivated ?? null, "Profiles with activated = true"],
    ["Pending payments", data?.paymentsPending ?? null, "Payments with status = pending"],
    ["Unactivated students", data?.studentsUnactivated ?? null, "Registered minus activated"],
    ["Access codes — total", data?.codesTotal ?? null, "Fresh batch 2 (migration 003)"],
    ["Access codes — redeemed", data?.codesRedeemed ?? null, "From code_redemptions"],
    ["Access codes — unused", data?.codesUnused ?? null, "Unused codes in the batch"],
    ["Certificates issued", data?.certificatesIssued ?? null, "Valid certificates"],
  ];
  return (
    <AdminShell title="Admin Dashboard" intro="Live metrics from the academy database.">
      {err && <div className="mb-4"><Alert kind="error">{err}</Alert></div>}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map(([label, value, note]) => (
          <Card key={label}>
            <p className="text-xs uppercase tracking-widest text-slate-500">{label}</p>
            <p className="mt-1 text-2xl font-bold text-navy">{value === null ? "Loading…" : value}</p>
            <p className="text-xs text-slate-500">{note}</p>
          </Card>
        ))}
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <Card>
          <h3 className="font-bold text-navy">Recent activity</h3>
          {!data ? (
            <p className="mt-2 text-sm text-slate-600">Loading…</p>
          ) : data.recentActivity.length === 0 ? (
            <p className="mt-2 text-sm text-slate-600">No admin actions recorded yet. Approvals, code assignments, suspensions and certificate changes will appear here.</p>
          ) : (
            <ul className="mt-2 space-y-2 text-sm text-slate-700">
              {data.recentActivity.map((a) => (
                <li key={a.id} className="border-b border-slate-200 pb-2">
                  <strong>{a.action}</strong>
                  {a.detail ? ` — ${a.detail}` : ""}
                  <span className="block text-xs text-slate-500">{new Date(a.created_at).toLocaleString()}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card>
          <h3 className="font-bold text-navy">Daily admin routine</h3>
          <p className="mt-2 text-sm text-slate-600">Review pending payments, assign codes only after approval, and check the audit log after every privileged action.</p>
          <p className="mt-2 text-sm text-slate-600">
            Codes: {data ? `${data.codesAssigned} assigned · ${data.codesRevoked} revoked · ${data.codesUnused} unused` : "Loading…"}
          </p>
        </Card>
      </div>
    </AdminShell>
  );
}
