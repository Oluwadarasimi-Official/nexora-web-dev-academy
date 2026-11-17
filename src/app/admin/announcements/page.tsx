import AdminShell from "@/components/AdminShell";
import { Card } from "@/components/ui";
export default function Page() {
 return (
 <AdminShell title="Announcements" intro="Announcements shown to students on their dashboard.">
 <Card>
 <h3 className="font-bold text-navy">Announcements</h3>
 <p className="mt-2 text-sm text-slate-600">Create announcements in the announcements table (title, body, audience). Students see them on their dashboard. Keep announcements short, factual and dated.</p>
</Card>
 </AdminShell>
 );
}
