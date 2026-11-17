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
