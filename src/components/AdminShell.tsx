"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabaseSignOut } from "@/components/AuthForm";
import { SidebarMenu } from "@/components/Sidebar";
import { adminFetch } from "@/lib/adminClient";

/* Admin gate: every /admin page renders inside this shell, so the check
 lives here once. On mount it asks the server (with the signed-in admin's
 session token) whether the caller is an administrator; anyone else is
 sent to /login. Until the check answers, only a loading card is shown —
 no admin content leaks to a signed-out or non-admin visitor. */

/* Primary admin navigation only. Everything secondary — curriculum,
 certificates, announcements, support, logs, settings — lives in the
 sliding sidebar (hamburger, top right). The server-side
 verification notice moved into the sidebar too. */
const PRIMARY = [
 ["Dashboard", "/admin"], ["Students", "/admin/students"], ["Payment Verification", "/admin/payments"],
 ["Access Codes", "/admin/codes"],
];
const SECONDARY: [string, string][] = [
 ["Curriculum & Quizzes", "/admin/curriculum"],
 ["Certificates", "/admin/certificates"],
 ["Announcements", "/admin/announcements"],
 ["Support Requests", "/admin/support"],
 ["Activity Logs", "/admin/logs"],
 ["Settings", "/admin/settings"],
];
export default function AdminShell({ children, title, intro }: { children: React.ReactNode; title: string; intro?: string }) {
 const pathname = usePathname(); const router = useRouter();
 const [allowed, setAllowed] = useState(false);
 useEffect(() => {
  let alive = true;
  (async () => {
   try {
    const res = await adminFetch("/api/admin/overview");
    if (!alive) return;
    if (!res.ok) { router.replace("/login"); return; }
    setAllowed(true);
   } catch { router.replace("/login"); }
  })();
  return () => { alive = false; };
 }, [router]);
 if (!allowed) {
  return (
   <div className="mx-auto max-w-6xl px-4 py-6">
    <div className="card rounded-2xl p-5 text-sm text-slate-600">Checking administrator access…</div>
   </div>
  );
 }
 return (
 <div className="mx-auto w-full max-w-6xl px-4 py-4">
 <div className="flex flex-wrap items-start justify-between gap-3">
 {/* Page header — title + intro ONLY. The logo lives once in the top
     bar above; it is never repeated here. */}
 <div className="min-w-0">
 <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold-dark">Administrator Portal — private</p>
 <h1 className="mt-0.5 font-display text-3xl font-semibold text-navy">{title}</h1>
 {intro && <p className="mt-1 text-sm leading-relaxed text-slate-600">{intro}</p>}
 </div>
 <div className="flex shrink-0 items-center gap-2">
 <button onClick={async () => { await supabaseSignOut(); router.push("/login"); }} className="btn-outline px-4 py-2 text-sm">Secure Logout</button>
 <SidebarMenu
 title="Admin Menu"
 intro="Curriculum, certificates, support & settings"
 links={SECONDARY}
 activeHref={pathname}
 extra={
 <p className="text-sm text-slate-600">Admin access is verified server-side on every route and API call. This portal is not linked from any public or student page. Never share admin credentials, and never paste a full access code into a chat, log or email.</p>
 }
 />
 </div>
 </div>
 {/* Primary tabs — one clean horizontal scroll row, never wrapping. */}
 <nav className="no-scrollbar -mx-4 mt-4 flex flex-nowrap gap-2 overflow-x-auto px-4 pb-1" aria-label="Admin navigation">
 {PRIMARY.map(([label, href]) => (
 <Link key={href} href={href} className={`shrink-0 rounded-full border px-3 py-1.5 text-sm font-medium transition ${pathname === href ? "border-gold bg-gold text-ink" : "chip text-navy hover:border-gold hover:text-gold-dark"}`}>{label}</Link>
 ))}
 </nav>
 <div className="mt-4">{children}</div>
 </div>
 );
}
