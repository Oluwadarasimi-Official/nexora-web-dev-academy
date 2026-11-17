import AdminShell from "@/components/AdminShell";
import { Card } from "@/components/ui";
/* Metric cards stay — the live numbers behind them are wired separately.
   A metric with no number yet shows no value at all (never a dash). */
const METRICS: [string, string | null, string][] = [
 ["Registered students", null, "Profiles"],
 ["Activated students", null, "Profiles with activated = true"],
 ["Pending payments", null, "Payments with status = pending"],
 ["Unactivated students", null, "Registered minus activated"],
 ["Access codes — total", "30", "Fresh batch 2 (migration 003)"],
 ["Access codes — redeemed", null, "From code_redemptions"],
 ["Access codes — unused", null, "30 minus redeemed, assigned and revoked"],
 ["Certificates issued", null, "Valid certificates"],
];
export default function Page() {
 return (
 <AdminShell title="Admin Dashboard" intro="Live metrics from the academy database.">
 <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
 {METRICS.map(([label, value, note]) => (
 <Card key={label}><p className="text-xs uppercase tracking-widest text-slate-500">{label}</p>{value !== null && <p className="mt-1 text-2xl font-bold text-navy">{value}</p>}<p className="text-xs text-slate-500">{note}</p></Card>
 ))}
</div>
<div className="mt-4 grid gap-4 md:grid-cols-2">
 <Card><h3 className="font-bold text-navy">Learning activity</h3><p className="mt-2 text-sm text-slate-600">Completed levels, quiz and examination attempts are recorded in lesson_progress, quiz_attempts and examination_attempts. Review them per student under Students.</p></Card>
 <Card><h3 className="font-bold text-navy">Daily admin routine</h3><p className="mt-2 text-sm text-slate-600">Review pending payments, assign codes only after approval, and check the audit log after every privileged action.</p></Card>
</div>
 </AdminShell>
 );
}
