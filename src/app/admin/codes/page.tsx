import AdminShell from "@/components/AdminShell";
import { Card } from "@/components/ui";
export default function Page() {
  return (
    <AdminShell title="Access-Code Management" intro="30 initial codes (hashes only). Import is idempotent; full codes are never shown in normal views or logs.">
      <div className="grid gap-4 md:grid-cols-3">
  <Card><p className="text-xs uppercase tracking-widest text-slate-400">Total codes</p><p className="mt-1 text-2xl font-bold text-white">30</p><p className="text-xs text-slate-400">Initial allocation, migration 002.</p></Card>
  <Card><p className="text-xs uppercase tracking-widest text-slate-400">Redeemed</p><p className="mt-1 text-2xl font-bold text-white">—</p><p className="text-xs text-slate-400">From code_redemptions once connected.</p></Card>
  <Card><p className="text-xs uppercase tracking-widest text-slate-400">Unused</p><p className="mt-1 text-2xl font-bold text-white">—</p><p className="text-xs text-slate-400">30 minus redeemed, assigned and revoked.</p></Card>
</div>
<Card className="mt-4">
  <h3 className="font-bold text-white">Rules</h3>
  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-300">
    <li>Only hashes are stored (SHA-256). Plaintext codes exist only in the owner&apos;s confidential specification PDF.</li>
    <li>Import is idempotent: re-running migration 002 adds nothing (ON CONFLICT DO NOTHING).</li>
    <li>Assign a code only after a payment is approved. Revoke only an unused code, with a reason.</li>
    <li>Redemption is atomic (redeem_code() in migration 001): simultaneous attempts cannot redeem the same code twice.</li>
    <li>When all 30 are redeemed, new activations are blocked with a contact-admin message. Only the owner may authorise a new batch.</li>
  </ul>
  <p className="mt-4 text-xs text-slate-400">API: POST /api/admin/codes with {`{ action: "assign" | "revoke", codeId, studentId?, reason? }`} — admin role verified server-side.</p>
</Card>
    </AdminShell>
  );
}
