"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabaseSignOut } from "@/components/AuthForm";
import { Logo } from "@/components/ui";
import { SidebarMenu } from "@/components/Sidebar";

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
 return (
 <div className="mx-auto max-w-6xl px-4 py-6">
 <div className="flex flex-wrap items-center justify-between gap-3">
 <div className="flex items-center gap-3">
 <Logo />
 <div>
 <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold-dark">Administrator Portal — private</p>
 <h1 className="text-2xl font-bold text-navy">{title}</h1>
 {intro && <p className="text-sm text-slate-600">{intro}</p>}
 </div>
 </div>
 <div className="flex items-center gap-2">
 <button onClick={async () => { await supabaseSignOut(); router.push("/login"); }} className="btn-sky px-4 py-2 text-sm">Secure Logout</button>
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
 <nav className="mt-4 flex flex-wrap gap-2" aria-label="Admin navigation">
 {PRIMARY.map(([label, href]) => (
 <Link key={href} href={href} className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${pathname === href ? "border-gold bg-gold text-ink" : "chip text-navy hover:border-gold hover:text-sky"}`}>{label}</Link>
 ))}
 </nav>
 <div className="mt-5">{children}</div>
 </div>
 );
}
