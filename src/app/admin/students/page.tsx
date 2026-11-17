import AdminShell from "@/components/AdminShell";
import { Card } from "@/components/ui";
export default function Page() {
 return (
 <AdminShell title="Student Management" intro="Search and filter students, view progress and results, and suspend or restore access with a reason. Passwords are never displayed.">
 <Card>
 <h3 className="font-bold text-navy">Students</h3>
 <p className="mt-2 text-sm text-slate-600">Student records live in the profiles table. Use the search box below to filter the list. Each row shows profile, payment status, progress, quiz/exam results and certificates, with Suspend / Restore (reason required, written to admin_activity_logs).</p>
 <input className="mt-3 w-full max-w-md input-std" placeholder="Search by name or email…" aria-label="Search students" />
 <div className="mt-4 card-soft rounded-2xl border border-slate-200 p-4 text-sm text-slate-600"><strong>Suspend / restore rule:</strong> suspending blocks lesson, quiz and exam access immediately; the reason and the acting administrator are recorded. Restoration is the same action in reverse, also logged.</div>
</Card>
 </AdminShell>
 );
}
