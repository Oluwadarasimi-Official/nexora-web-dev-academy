import AdminShell from "@/components/AdminShell";
import { Card } from "@/components/ui";
export default function Page() {
  return (
    <AdminShell title="Payment Verification" intro="Approve or reject payment submissions with a note. A code may be assigned only after approval.">
      <Card>
  <h3 className="font-bold text-white">Pending payments</h3>
  <p className="mt-2 text-sm text-slate-300">Submissions appear here from the payments table (status = pending). For each one, check the payment independently outside the platform, then Approve or Reject with a note. The decision, the administrator and the timestamp are recorded, and the student is notified.</p>
  <p className="mt-3 text-sm text-slate-300">No pending payments loaded: Supabase is not connected in this deployment yet.</p>
  <div className="mt-4 space-y-2 text-sm">
    <p><strong>Approve</strong> → status becomes approved → the Assign Code action becomes available for that student (one unused code, once).</p>
    <p><strong>Reject</strong> → status becomes rejected with your reason → the student sees the reason and can resubmit a correct reference.</p>
    <p><strong>Never approve</strong> on a screenshot alone. A claim is not proof of payment.</p>
  </div>
  <p className="mt-4 text-xs text-slate-400">API: POST /api/admin/payments with {`{ paymentId, decision: "approved" | "rejected", note }`} — admin role verified server-side.</p>
</Card>
    </AdminShell>
  );
}
