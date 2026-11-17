import AdminShell from "@/components/AdminShell";
import { Card } from "@/components/ui";
export default function Page() {
 return (
 <AdminShell title="Activity Logs" intro="Audit trail for payment decisions, code assignment/redemption, role changes, suspensions, exam grading and certificate actions.">
 <Card>
 <h3 className="font-bold text-navy">Audit log</h3>
 <p className="mt-2 text-sm text-slate-600">Every privileged action writes a row to admin_activity_logs (administrator, action, target, detail, timestamp). Review it after payment approvals, code assignments, suspensions and certificate changes.</p>
</Card>
 </AdminShell>
 );
}
