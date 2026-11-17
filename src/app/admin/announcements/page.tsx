import AdminShell from "@/components/AdminShell";
import { Card } from "@/components/ui";
export default function Page() {
  return (
    <AdminShell title="Announcements" intro="Announcements shown to students on their dashboard.">
      <Card>
  <h3 className="font-bold text-white">Announcements</h3>
  <p className="mt-2 text-sm text-slate-300">Create announcements in the announcements table (title, body, audience). Students see them on their dashboard. Keep announcements short, factual and dated.</p>
  <p className="mt-3 text-sm text-slate-300">No announcements loaded: Supabase is not connected in this deployment yet.</p>
</Card>
    </AdminShell>
  );
}
