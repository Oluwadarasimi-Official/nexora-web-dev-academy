import AdminShell from "@/components/AdminShell";
import { Card } from "@/components/ui";
export default function Page() {
  return (
    <AdminShell title="Support Requests" intro="Review student support requests and respond. Students see only their own requests.">
      <Card>
  <h3 className="font-bold text-white">Support requests</h3>
  <p className="mt-2 text-sm text-slate-300">Requests live in support_requests (category, message, status, timestamps). Reply in the admin_reply field and set the status to in_progress or resolved. Students see the reply in Dashboard → Help &amp; Support.</p>
  <p className="mt-3 text-sm text-slate-300">No requests loaded: Supabase is not connected in this deployment yet.</p>
</Card>
    </AdminShell>
  );
}
