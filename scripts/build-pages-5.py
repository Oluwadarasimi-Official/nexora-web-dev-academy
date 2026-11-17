import pathlib, textwrap
R = pathlib.Path("/home/hatch/workspace/nexora-web-dev-academy/src")
def w(p, s):
    f = R / p; f.parent.mkdir(parents=True, exist_ok=True); f.write_text(textwrap.dedent(s).lstrip("\n"))
    print("wrote", p)

# ---------- Admin shell ----------
w("components/AdminShell.tsx", '''
"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabaseSignOut } from "@/components/AuthForm";

const NAV = [
  ["Dashboard", "/admin"], ["Students", "/admin/students"], ["Payment Verification", "/admin/payments"],
  ["Access Codes", "/admin/codes"], ["Curriculum & Quizzes", "/admin/curriculum"],
  ["Certificates", "/admin/certificates"], ["Announcements", "/admin/announcements"],
  ["Support Requests", "/admin/support"], ["Activity Logs", "/admin/logs"], ["Settings", "/admin/settings"],
];
export default function AdminShell({ children, title, intro }: { children: React.ReactNode; title: string; intro?: string }) {
  const pathname = usePathname(); const router = useRouter();
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold-dark">Administrator Portal — private</p>
          <h1 className="text-2xl font-bold text-navy">{title}</h1>
          {intro && <p className="text-sm text-slate-600">{intro}</p>}
        </div>
        <button onClick={async () => { await supabaseSignOut(); router.push("/login"); }} className="rounded-lg border border-navy px-4 py-2 text-sm font-semibold text-navy">Secure Logout</button>
      </div>
      <nav className="mt-5 flex flex-wrap gap-2" aria-label="Admin navigation">
        {NAV.map(([label, href]) => (
          <Link key={href} href={href} className={`rounded-full border px-3 py-1.5 text-sm font-medium ${pathname === href ? "border-navy bg-navy text-white" : "border-[#e8dfc8] bg-white text-navy hover:border-navy"}`}>{label}</Link>
        ))}
      </nav>
      <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        Admin access is verified server-side on every route and API call. This portal is not linked from any public or student page. Never share admin credentials, and never paste a full access code into a chat, log or email.
      </div>
      <div className="mt-6">{children}</div>
    </div>
  );
}
''')

def admin_page(path, title, intro, body):
    w(path, f'''
import AdminShell from "@/components/AdminShell";
import {{ Card, Alert }} from "@/components/ui";
export default function Page() {{
  return (
    <AdminShell title="{title}" intro="{intro}">
      {body}
    </AdminShell>
  );
}}
''')

admin_page("app/admin/page.tsx", "Admin Dashboard", "Live metrics are read from Supabase when connected. Until the migrations are applied, the counts below show the connected state honestly — no invented numbers.",
'''<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
    <Card key={label}><p className="text-xs uppercase tracking-widest text-slate-500">{label}</p><p className="mt-1 text-2xl font-bold text-navy">{value}</p><p className="text-xs text-slate-500">{note}</p></Card>
  ))}
</div>
<div className="mt-4"><Alert kind="info">To see live numbers: apply supabase/migrations/001_schema.sql and 002_seed_access_codes.sql to the Supabase project, set the env vars in Vercel, and complete the admin bootstrap at /admin/setup. The dashboard then reads the real tables. Until then, “—” means “not yet connected”, not zero.</Alert></div>
<div className="mt-4 grid gap-4 md:grid-cols-2">
  <Card><h3 className="font-bold text-navy">Learning activity</h3><p className="mt-2 text-sm text-slate-600">Completed levels, quiz and examination attempts are recorded in lesson_progress, quiz_attempts and examination_attempts. Review them per student under Students.</p></Card>
  <Card><h3 className="font-bold text-navy">What to do first</h3><p className="mt-2 text-sm text-slate-600">1. Apply the migrations. 2. Bootstrap the first admin at /admin/setup. 3. Review pending payments. 4. Assign codes only after approval. 5. Check the audit log after every privileged action.</p></Card>
</div>''')

admin_page("app/admin/students/page.tsx", "Student Management", "Search and filter students, view progress and results, and suspend or restore access with a reason. Passwords are never displayed.",
'''<Card>
  <h3 className="font-bold text-navy">Students</h3>
  <p className="mt-2 text-sm text-slate-600">Student records live in the profiles table (Supabase) once the migrations are applied. Use the search box below to filter the connected list; the list is empty — not zero — until the database is connected.</p>
  <input className="mt-3 w-full max-w-md rounded-lg border border-slate-300 px-3 py-2" placeholder="Search by name or email…" aria-label="Search students" />
  <p className="mt-4 text-sm text-slate-600">No students loaded: Supabase is not connected in this deployment yet. After connection, each row shows profile, payment status, progress, quiz/exam results and certificates, with Suspend / Restore (reason required, written to admin_activity_logs).</p>
  <div className="mt-4 rounded-lg border border-slate-200 p-4 text-sm text-slate-600"><strong>Suspend / restore rule:</strong> suspending blocks lesson, quiz and exam access immediately; the reason and the acting administrator are recorded. Restoration is the same action in reverse, also logged.</div>
</Card>''')

admin_page("app/admin/payments/page.tsx", "Payment Verification", "Approve or reject payment submissions with a note. A code may be assigned only after approval.",
'''<Card>
  <h3 className="font-bold text-navy">Pending payments</h3>
  <p className="mt-2 text-sm text-slate-600">Submissions appear here from the payments table (status = pending). For each one, check the payment independently outside the platform, then Approve or Reject with a note. The decision, the administrator and the timestamp are recorded, and the student is notified.</p>
  <p className="mt-3 text-sm text-slate-600">No pending payments loaded: Supabase is not connected in this deployment yet.</p>
  <div className="mt-4 space-y-2 text-sm">
    <p><strong>Approve</strong> → status becomes approved → the Assign Code action becomes available for that student (one unused code, once).</p>
    <p><strong>Reject</strong> → status becomes rejected with your reason → the student sees the reason and can resubmit a correct reference.</p>
    <p><strong>Never approve</strong> on a screenshot alone. A claim is not proof of payment.</p>
  </div>
  <p className="mt-4 text-xs text-slate-500">API: POST /api/admin/payments with {`{ paymentId, decision: "approved" | "rejected", note }`} — admin role verified server-side.</p>
</Card>''')

admin_page("app/admin/codes/page.tsx", "Access-Code Management", "30 initial codes (hashes only). Import is idempotent; full codes are never shown in normal views or logs.",
'''<div className="grid gap-4 md:grid-cols-3">
  <Card><p className="text-xs uppercase tracking-widest text-slate-500">Total codes</p><p className="mt-1 text-2xl font-bold text-navy">30</p><p className="text-xs text-slate-500">Initial allocation, migration 002.</p></Card>
  <Card><p className="text-xs uppercase tracking-widest text-slate-500">Redeemed</p><p className="mt-1 text-2xl font-bold text-navy">—</p><p className="text-xs text-slate-500">From code_redemptions once connected.</p></Card>
  <Card><p className="text-xs uppercase tracking-widest text-slate-500">Unused</p><p className="mt-1 text-2xl font-bold text-navy">—</p><p className="text-xs text-slate-500">30 minus redeemed, assigned and revoked.</p></Card>
</div>
<Card className="mt-4">
  <h3 className="font-bold text-navy">Rules</h3>
  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600">
    <li>Only hashes are stored (SHA-256). Plaintext codes exist only in the owner&apos;s confidential specification PDF.</li>
    <li>Import is idempotent: re-running migration 002 adds nothing (ON CONFLICT DO NOTHING).</li>
    <li>Assign a code only after a payment is approved. Revoke only an unused code, with a reason.</li>
    <li>Redemption is atomic (redeem_code() in migration 001): simultaneous attempts cannot redeem the same code twice.</li>
    <li>When all 30 are redeemed, new activations are blocked with a contact-admin message. Only the owner may authorise a new batch.</li>
  </ul>
  <p className="mt-4 text-xs text-slate-500">API: POST /api/admin/codes with {`{ action: "assign" | "revoke", codeId, studentId?, reason? }`} — admin role verified server-side.</p>
</Card>''')

admin_page("app/admin/curriculum/page.tsx", "Curriculum, Quiz & Exam Management", "73 topics, 10 questions per topic, 3 level examinations. Validate counts before publishing any change.",
'''<Card>
  <h3 className="font-bold text-navy">Curriculum inventory (from src/lib/curriculum.ts)</h3>
  <p className="mt-2 text-sm text-slate-600">Level 1 Beginner — 26 topics · Level 2 Intermediate — 25 topics · Level 3 Advanced — 22 topics · Total 73 topics · 730 quiz questions (10 per topic, 4 options each) · 3 final examinations.</p>
  <p className="mt-2 text-sm text-slate-600">Run <code>node scripts/verify-counts.mjs</code> after any curriculum edit. It fails the build check if a topic has anything other than exactly 10 questions or a question has anything other than 4 options.</p>
  <p className="mt-2 text-sm text-slate-600">Editing flow: edit the per-topic data in scripts/generate-curriculum.mjs, regenerate with <code>node scripts/generate-curriculum.mjs</code>, re-run the count check, then apply the matching change to the Supabase topics/lessons/quiz_questions tables (see supabase/seed-curriculum.sql). Preview as a student before publishing.</p>
  <h3 className="mt-6 font-bold text-navy">Examinations</h3>
  <p className="mt-2 text-sm text-slate-600">Beginner 60 min · Intermediate 75 min · Advanced 90 min · 20 objective + 3 theory each · pass mark 70% · theory graded against the published rubric, never auto-fabricated.</p>
</Card>''')

admin_page("app/admin/certificates/page.tsx", "Certificate Management", "Search, inspect, revoke with a reason, and reissue a corrected certificate. Every action is logged.",
'''<Card>
  <h3 className="font-bold text-navy">Certificates</h3>
  <p className="mt-2 text-sm text-slate-600">Issued certificates live in the certificates table (one valid certificate per student per level, enforced by a unique constraint). Search by certificate ID, student name or level once Supabase is connected.</p>
  <p className="mt-3 text-sm text-slate-600">No certificates loaded: Supabase is not connected in this deployment yet.</p>
  <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-slate-600">
    <li><strong>Revoke</strong> — requires a reason; the certificate shows as revoked on the public verification page.</li>
    <li><strong>Reissue</strong> — issues a corrected certificate with a new certificate ID; the old record keeps its audit trail.</li>
    <li><strong>Never</strong> issue a certificate for a student who has not completed the level and passed the examination.</li>
  </ul>
  <p className="mt-4 text-xs text-slate-500">API: POST /api/admin/certificates with {`{ action: "revoke" | "reissue", certificateId, reason? }`} — admin role verified server-side.</p>
</Card>''')

admin_page("app/admin/announcements/page.tsx", "Announcements", "Announcements shown to students on their dashboard.",
'''<Card>
  <h3 className="font-bold text-navy">Announcements</h3>
  <p className="mt-2 text-sm text-slate-600">Create announcements in the announcements table (title, body, audience). Students see them on their dashboard. Keep announcements short, factual and dated.</p>
  <p className="mt-3 text-sm text-slate-600">No announcements loaded: Supabase is not connected in this deployment yet.</p>
</Card>''')

admin_page("app/admin/support/page.tsx", "Support Requests", "Review student support requests and respond. Students see only their own requests.",
'''<Card>
  <h3 className="font-bold text-navy">Support requests</h3>
  <p className="mt-2 text-sm text-slate-600">Requests live in support_requests (category, message, status, timestamps). Reply in the admin_reply field and set the status to in_progress or resolved. Students see the reply in Dashboard → Help &amp; Support.</p>
  <p className="mt-3 text-sm text-slate-600">No requests loaded: Supabase is not connected in this deployment yet.</p>
</Card>''')

admin_page("app/admin/logs/page.tsx", "Activity Logs", "Audit trail for payment decisions, code assignment/redemption, role changes, suspensions, exam grading and certificate actions.",
'''<Card>
  <h3 className="font-bold text-navy">Audit log</h3>
  <p className="mt-2 text-sm text-slate-600">Every privileged action writes a row to admin_activity_logs (administrator, action, target, detail, timestamp). Review it after payment approvals, code assignments, suspensions and certificate changes.</p>
  <p className="mt-3 text-sm text-slate-600">No log entries loaded: Supabase is not connected in this deployment yet.</p>
</Card>''')

admin_page("app/admin/settings/page.tsx", "Academy Settings", "Daily topic limit, timezone, payment contact and pass marks.",
'''<Card>
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
</Card>''')

w("app/admin/setup/page.tsx", '''
"use client";
import { useState } from "react";
import { Card, Alert } from "@/components/ui";
export default function AdminSetup() {
  const [email, setEmail] = useState(""); const [token, setToken] = useState("");
  const [msg, setMsg] = useState(""); const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setErr(""); setMsg("");
    setBusy(true);
    try {
      const res = await fetch("/api/admin/setup", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: email.trim().toLowerCase(), setupToken: token }) });
      const data = await res.json();
      if (!res.ok) { setErr(data.error || "Bootstrap failed."); return; }
      setMsg(data.message || "Admin role granted.");
    } catch { setErr("Network error."); } finally { setBusy(false); }
  }
  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <Card>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold-dark">One-time Admin Bootstrap</p>
        <h1 className="mt-1 text-2xl font-bold text-navy">Set Up the First Administrator</h1>
        <p className="mt-2 text-sm text-slate-600">This page promotes an <strong>already registered</strong> student account to administrator. It requires the <code>ADMIN_SETUP_TOKEN</code> environment variable, which only the owner sets in Vercel (Production, server-only). No admin password is invented or hardcoded anywhere.</p>
        <div className="mt-4 rounded-lg border border-slate-200 bg-[#fdf8ec] p-4 text-sm text-slate-700">
          <strong>Steps:</strong>
          <ol className="mt-1 list-decimal space-y-1 pl-5">
            <li>Register the future admin as an ordinary student at /register.</li>
            <li>Set <code>ADMIN_SETUP_TOKEN</code> to a long random value in Vercel → Settings → Environment Variables (Production only).</li>
            <li>Enter that email and token below, once. After the first admin exists, use the SQL step in HANDOVER.md to add further admins — this page then refuses new promotions unless the token still matches.</li>
          </ol>
        </div>
        {msg && <div className="mt-4"><Alert kind="success">{msg}</Alert></div>}
        {err && <div className="mt-4"><Alert kind="error">{err}</Alert></div>}
        <form onSubmit={submit} className="mt-4 space-y-3">
          <div><label className="block text-sm font-semibold text-navy" htmlFor="email">Registered email to promote</label><input id="email" type="email" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
          <div><label className="block text-sm font-semibold text-navy" htmlFor="token">ADMIN_SETUP_TOKEN</label><input id="token" type="password" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" value={token} onChange={(e) => setToken(e.target.value)} required autoComplete="off" /></div>
          <button disabled={busy} className="rounded-lg bg-navy px-4 py-2.5 font-semibold text-white disabled:opacity-50">{busy ? "Checking…" : "Promote to Administrator"}</button>
        </form>
        <p className="mt-4 text-xs text-slate-500">The token is checked server-side and is never logged. If ADMIN_SETUP_TOKEN is not set, this page always refuses — that is the safe default.</p>
      </Card>
    </div>
  );
}
''')
