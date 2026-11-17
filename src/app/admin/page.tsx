import AdminShell from "@/components/AdminShell";
import { Card, Alert } from "@/components/ui";
export default function Page() {
  return (
    <AdminShell title="Admin Dashboard" intro="Live metrics are read from Supabase when connected. Until the migrations are applied, the counts below show the connected state honestly — no invented numbers.">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
  {[
    ["Registered students", "—", "Read from profiles when Supabase is connected."],
    ["Activated students", "—", "Profiles with activated = true."],
    ["Pending payments", "—", "Payments with status = pending."],
    ["Unactivated students", "—", "Registered minus activated."],
    ["Access codes — total", "30", "Initial allocation (migration 002)."],
    ["Access codes — redeemed", "—", "From code_redemptions."],
    ["Access codes — unused", "—", "30 minus redeemed/assigned/revoked."],
    ["Certificates issued", "—", "Valid certificates in the certificates table."],
  ].map(([label, value, note]) => (
    <Card key={label}><p className="text-xs uppercase tracking-widest text-slate-400">{label}</p><p className="mt-1 text-2xl font-bold text-white">{value}</p><p className="text-xs text-slate-400">{note}</p></Card>
  ))}
</div>
<div className="mt-4"><Alert kind="info">To see live numbers: apply supabase/migrations/001_schema.sql and 002_seed_access_codes.sql to the Supabase project, set the env vars in Vercel, and complete the admin bootstrap at /admin/setup. The dashboard then reads the real tables. Until then, “—” means “not yet connected”, not zero.</Alert></div>
<div className="mt-4 grid gap-4 md:grid-cols-2">
  <Card><h3 className="font-bold text-white">Learning activity</h3><p className="mt-2 text-sm text-slate-300">Completed levels, quiz and examination attempts are recorded in lesson_progress, quiz_attempts and examination_attempts. Review them per student under Students.</p></Card>
  <Card><h3 className="font-bold text-white">What to do first</h3><p className="mt-2 text-sm text-slate-300">1. Apply the migrations. 2. Bootstrap the first admin at /admin/setup. 3. Review pending payments. 4. Assign codes only after approval. 5. Check the audit log after every privileged action.</p></Card>
</div>
    </AdminShell>
  );
}
