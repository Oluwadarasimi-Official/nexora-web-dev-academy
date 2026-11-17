import AdminShell from "@/components/AdminShell";
import { Card } from "@/components/ui";
export default function Page() {
  return (
    <AdminShell title="Certificate Management" intro="Search, inspect, revoke with a reason, and reissue a corrected certificate. Every action is logged.">
      <Card>
  <h3 className="font-bold text-navy">Certificates</h3>
  <p className="mt-2 text-sm text-slate-600">Issued certificates live in the certificates table (one valid certificate per student per level, enforced by a unique constraint). Search by certificate ID, student name or level once Supabase is connected.</p>
  <p className="mt-3 text-sm text-slate-600">No certificates loaded: Supabase is not connected in this deployment yet.</p>
  <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-slate-600">
    <li><strong>Revoke</strong> — requires a reason; the certificate shows as revoked on the public verification page.</li>
    <li><strong>Reissue</strong> — issues a corrected certificate with a new certificate ID; the old record keeps its audit trail.</li>
    <li><strong>Never</strong> issue a certificate for a student who has not completed the level and passed the examination.</li>
  </ul>
  <p className="mt-4 text-xs text-slate-500">API: POST /api/admin/certificates with {`{ action: "revoke" | "reissue", certificateId, reason? }`} — admin role verified server-side.</p>
</Card>
    </AdminShell>
  );
}
