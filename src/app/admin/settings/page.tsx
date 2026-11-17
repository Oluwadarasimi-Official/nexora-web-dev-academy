import AdminShell from "@/components/AdminShell";
import { Card } from "@/components/ui";
export default function Page() {
 return (
 <AdminShell title="Academy Settings" intro="Daily topic limit, timezone, payment contact and pass marks.">
 <Card>
 <h3 className="font-bold text-navy">Current settings</h3>
 <ul className="mt-2 space-y-1 text-sm text-slate-700">
 <li>Daily new-topic limit: <strong>3</strong> (Africa/Lagos calendar day)</li>
 <li>Timezone: <strong>Africa/Lagos</strong></li>
 <li>Quiz pass mark: <strong>7/10 (70%)</strong></li>
 <li>Examination pass mark: <strong>70%</strong></li>
 <li>Payment WhatsApp: <strong>+234 813 938 8562</strong></li>
 <li>Supabase project: <strong>https://fodwlmprqreheqiskowy.supabase.co</strong></li>
 </ul>
 <p className="mt-3 text-sm text-slate-600">Settings are stored in academy_settings. Changing the daily limit or pass mark changes what the server enforces — do it deliberately, announce it to students, and record it in the audit log.</p>
 <h3 className="mt-6 font-bold text-navy">Administrator profile</h3>
 <p className="mt-2 text-sm text-slate-600">Admin accounts are ordinary Supabase Auth accounts promoted to the admin role by the owner-controlled bootstrap (/admin/setup). There is no public admin registration and no hardcoded admin password anywhere in this codebase.</p>
</Card>
 </AdminShell>
 );
}
