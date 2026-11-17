"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { loadSession, loadProgress, type LocalSession } from "@/lib/store";
import { supabaseSignOut } from "@/components/AuthForm";

const NAV = [
  ["Overview", "/dashboard"], ["My Courses", "/dashboard/courses"], ["Beginner", "/dashboard/level/1"],
  ["Intermediate", "/dashboard/level/2"], ["Advanced", "/dashboard/level/3"], ["My Progress", "/dashboard/progress"],
  ["Quizzes", "/dashboard/courses"], ["Examinations", "/dashboard/exams"], ["My Certificates", "/dashboard/certificates"],
  ["Profile", "/dashboard/profile"], ["Help & Support", "/dashboard/help"],
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
  if (!ready) return <div className="mx-auto max-w-6xl px-4 py-12 text-slate-600">Loading your dashboard…</div>;
  if (!session) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12">
        <div className="rounded-2xl border border-[#e8dfc8] bg-white p-6">
          <h1 className="text-2xl font-bold text-navy">Please log in</h1>
          <p className="mt-2 text-slate-600">The student portal is for registered students. Log in, or register if you do not have an account yet.</p>
          <div className="mt-4 flex gap-3">
            <Link href="/login" className="rounded-lg bg-navy px-4 py-2 font-semibold text-white">Student Login</Link>
            <Link href="/register" className="rounded-lg border border-navy px-4 py-2 font-semibold text-navy">Register</Link>
          </div>
        </div>
      </div>
    );
  }
  const completed = progress.completedTopics.length;
  const level = completed >= 51 ? 3 : completed >= 26 ? 2 : 1;
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-navy">{title}</h1>
          <p className="text-sm text-slate-600">Welcome, {session.name} · {session.email} · Current level: {level === 1 ? "Beginner" : level === 2 ? "Intermediate" : "Advanced"} · {progress.activated ? "Activated" : "Not yet activated"}</p>
        </div>
        <button onClick={async () => { await supabaseSignOut(); router.push("/login"); }} className="rounded-lg border border-navy px-4 py-2 text-sm font-semibold text-navy">Logout</button>
      </div>
      <nav className="mt-5 flex flex-wrap gap-2" aria-label="Student navigation">
        {NAV.map(([label, href]) => (
          <Link key={href + label} href={href} className={`rounded-full border px-3 py-1.5 text-sm font-medium ${pathname === href ? "border-navy bg-navy text-white" : "border-[#e8dfc8] bg-white text-navy hover:border-navy"}`}>{label}</Link>
        ))}
      </nav>
      {!progress.activated && (
        <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Your account is not activated yet. Lesson content is locked until you redeem an access code. Go to <Link className="font-semibold underline" href="/dashboard/payment">Payment &amp; Activation</Link> to submit your payment reference and redeem your code.
        </div>
      )}
      <div className="mt-6">{children}</div>
    </div>
  );
}
