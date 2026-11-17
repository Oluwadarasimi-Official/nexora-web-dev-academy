"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { loadSession, loadProgress, hydrateProgressFromServer, type LocalSession } from "@/lib/store";
import { supabaseSignOut } from "@/components/AuthForm";
import { SidebarMenu } from "@/components/Sidebar";
import { WHATSAPP_LINK, WHATSAPP_NUMBER } from "@/lib/data";

/* Primary learning navigation only. Everything secondary — progress,
 certificates, profile, payment & activation, help — lives in the
 sliding sidebar (hamburger, top right). */
const PRIMARY = [
 ["Overview", "/dashboard"], ["My Courses", "/dashboard/courses"], ["Beginner", "/dashboard/level/1"],
 ["Intermediate", "/dashboard/level/2"], ["Advanced", "/dashboard/level/3"], ["Examinations", "/dashboard/exams"],
];
const SECONDARY: [string, string][] = [
 ["My Progress", "/dashboard/progress"],
 ["Quizzes", "/dashboard/quizzes"],
 ["My Certificates", "/dashboard/certificates"],
 ["Payment & Activation", "/dashboard/payment"],
 ["Profile", "/dashboard/profile"],
 ["Help & Support", "/dashboard/help"],
];

export function useStudent() {
 const [session, setSession] = useState<LocalSession | null>(null);
 const [ready, setReady] = useState(false);
 useEffect(() => { setSession(loadSession()); setReady(true); }, []);
 return { session, ready };
}

export default function DashboardShell({ children, title }: { children: React.ReactNode; title: string }) {
 const router = useRouter(); const pathname = usePathname();
 const { session, ready } = useStudent();
 const [progress, setProgress] = useState(loadProgress());
 useEffect(() => { setProgress(loadProgress()); }, [pathname]);
 // B3 fix: read progress back from the academy database on mount, so a
 // new device or a cleared browser shows the real server state (activated,
 // completed topics, quiz passes) instead of an empty local copy. Silent
 // on failure — local progress stays as it is.
 useEffect(() => { hydrateProgressFromServer(); }, []);
 // Progress can change without a navigation (code redeem, quiz submit,
 // topic completion all saveProgress in place) — re-read when it does.
 useEffect(() => {
 const refresh = () => setProgress(loadProgress());
 window.addEventListener("nexora-progress", refresh);
 return () => window.removeEventListener("nexora-progress", refresh);
 }, []);
 if (!ready) return <div className="mx-auto max-w-6xl px-4 py-10 text-slate-600">Loading your dashboard…</div>;
 if (!session) {
 return (
 <div className="mx-auto max-w-2xl px-4 py-10">
 <div className="card rounded-[1.75rem] p-6">
 <h1 className="font-display text-2xl font-semibold text-navy">Please log in</h1>
 <p className="mt-2 text-slate-600">The student portal is for registered students. Log in, or register if you do not have an account yet.</p>
 <div className="mt-4 flex gap-3">
 <Link href="/login" className="btn-gold px-4 py-2 text-sm">Student Login</Link>
 <Link href="/register" className="btn-outline px-4 py-2 text-sm">Register</Link>
 </div>
 </div>
 </div>
 );
 }
 const completed = progress.completedTopics.length;
 const level = completed >= 51 ? 3 : completed >= 26 ? 2 : 1;
 const levelName = level === 1 ? "Beginner" : level === 2 ? "Intermediate" : "Advanced";
 return (
 <div className="mx-auto w-full max-w-6xl px-4 py-4">
 <div className="flex flex-wrap items-start justify-between gap-3">
 {/* Page header — title + identity block ONLY. The logo lives once in
     the top bar above; it is never repeated here. */}
 <div className="min-w-0">
 <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold-dark">Student Portal</p>
 <h1 className="mt-0.5 font-display text-3xl font-semibold text-navy">{title}</h1>
 <p className="mt-1 text-base font-bold leading-snug text-navy">Welcome, {session.name}</p>
 <div className="mt-2 flex flex-wrap items-center gap-1.5">
 <span className="chip rounded-full px-2.5 py-1 text-xs font-medium">{session.email}</span>
 <span className="chip rounded-full px-2.5 py-1 text-xs font-medium">Current level: {levelName}</span>
 <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${progress.activated ? "bg-gold/15 text-gold-dark ring-1 ring-gold/50" : "bg-amber-100 text-amber-800 ring-1 ring-amber-300"}`}>{progress.activated ? "Activated" : "Not yet activated"}</span>
 </div>
 </div>
 <div className="flex shrink-0 items-center gap-2">
 <button onClick={async () => { await supabaseSignOut(); router.push("/login"); }} className="btn-outline px-4 py-2 text-sm">Logout</button>
 <SidebarMenu
 title="Student Menu"
 intro="Progress, certificates, profile & support"
 links={SECONDARY}
 activeHref={pathname}
 extra={
 <div className="space-y-2 text-sm">
 <p className="font-semibold text-navy">{session.name}</p>
 <p className="text-slate-600">{session.email}</p>
 <p className="text-slate-500">Need help with payment? {WHATSAPP_NUMBER}</p>
 <a href={WHATSAPP_LINK} target="_blank" rel="noreferrer" className="btn-gold inline-block px-4 py-2 text-sm">Chat on WhatsApp</a>
 </div>
 }
 />
 </div>
 </div>
 {/* Primary tabs — one clean horizontal scroll row, never wrapping. */}
 <nav className="no-scrollbar -mx-4 mt-3 flex flex-nowrap gap-2 overflow-x-auto px-4 pb-1" aria-label="Student navigation">
 {PRIMARY.map(([label, href]) => (
 <Link key={href + label} href={href} className={`shrink-0 rounded-full border px-3 py-1.5 text-sm font-medium transition ${pathname === href ? "border-gold bg-gold text-ink" : "chip text-navy hover:border-gold hover:text-gold-dark"}`}>{label}</Link>
 ))}
 </nav>
 {!progress.activated && (
 <div className="mt-3 rounded-[1.75rem] border border-gold/40 bg-[#fdf8ec] px-4 py-2.5 text-sm text-navy shadow-[0_8px_24px_rgba(10,42,94,0.05)]">
 Your account is not activated yet — lessons are locked until you redeem an access code. Pay on WhatsApp, get your code from the owner, and redeem it at <Link className="font-semibold underline" href="/dashboard/payment">Payment &amp; Activation</Link>.
 </div>
 )}
 <div className="mt-3">{children}</div>
 </div>
 );
}
