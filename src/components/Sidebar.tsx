"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import {
  Award, BadgeCheck, BookOpen, ChevronDown, ChevronRight, CreditCard,
  HelpCircle, Inbox, LifeBuoy, ListChecks, LogIn, Megaphone, MessageCircle,
  PanelRight, ScrollText, Settings, TrendingUp, User, UserPlus, X,
} from "lucide-react";
import { FAQS } from "@/lib/data";

/**
 * Sliding hidden sidebar (drawer) — the one consistent pattern for extra /
 * secondary things across the whole academy: public pages, student portal
 * and admin portal. Primary content stays on the page; everything extra
 * (secondary links, tools, help, announcements, settings, extra actions)
 * lives here until the user opens it with the sidebar trigger.
 *
 * Behaviour (same everywhere): a realistic panel icon at the far right of
 * the top bar, real frosted-glass drawer slides in from the right, dimmed
 * backdrop, close button, closes on backdrop click, on link click, and on
 * Escape. The FAQ lives ONLY here — tap a question to expand its answer.
 */

// One realistic, recognisable icon per sidebar link, keyed by its label.
const LINK_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  "How It Works": HelpCircle,
  "Certificates": Award,
  "Contact": MessageCircle,
  "Verify Certificate": BadgeCheck,
  "Student Login": LogIn,
  "Register": UserPlus,
  "My Progress": TrendingUp,
  "Quizzes": ListChecks,
  "My Certificates": Award,
  "Payment & Activation": CreditCard,
  "Profile": User,
  "Help & Support": LifeBuoy,
  "Curriculum & Quizzes": BookOpen,
  "Announcements": Megaphone,
  "Support Requests": Inbox,
  "Activity Logs": ScrollText,
  "Settings": Settings,
};

export function SidebarMenu({
  links,
  title,
  intro,
  extra,
  activeHref,
  showFaq = true,
}: {
  links: [string, string][];
  title: string;
  intro?: string;
  extra?: React.ReactNode;
  activeHref?: string;
  showFaq?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [open]);
  // The drawer + backdrop are portalled to <body> so a sticky/filtered
  // ancestor can never shrink the fixed drawer to the header's height.
  const drawer = (
    <>
      <div className={`drawer-backdrop fixed inset-0 z-50 bg-slate-900/50 ${open ? "opacity-100" : "pointer-events-none opacity-0"}`} onClick={() => setOpen(false)} aria-hidden="true" />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`drawer-panel fixed right-0 top-0 z-50 flex h-full w-[86vw] max-w-sm flex-col ${open ? "translate-x-0" : "translate-x-full drawer-closed"}`}
      >
        <div className="flex items-center justify-between gap-3 border-b border-white/60 px-5 py-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold-dark">{title}</p>
            {intro && <p className="mt-0.5 text-xs text-slate-500">{intro}</p>}
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/70 bg-white/70 text-navy backdrop-blur transition hover:border-gold"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="flex-1 space-y-1.5 overflow-y-auto px-4 py-4" aria-label={title}>
          {links.map(([label, href]) => {
            const Icon = LINK_ICONS[label] ?? ChevronRight;
            return (
              <Link key={href + label} href={href} onClick={() => setOpen(false)} className={`drawer-link ${activeHref === href ? "active" : ""}`}>
                <Icon className="h-[18px] w-[18px] text-sky-700" aria-hidden="true" />
                <span>{label}</span>
              </Link>
            );
          })}
          {showFaq && (
            <div className="pt-4">
              <p className="px-2 text-xs font-bold uppercase tracking-[0.2em] text-gold-dark">Frequently asked questions</p>
              <div className="mt-2 space-y-2">
                {FAQS.map((f) => (
                  <details key={f.q} className="glass-faq card rounded-xl p-3">
                    <summary className="flex items-center justify-between gap-2 text-sm font-semibold text-navy">
                      <span>{f.q}</span>
                      <ChevronDown className="faq-chevron h-4 w-4 shrink-0 text-sky-700" aria-hidden="true" />
                    </summary>
                    <p className="mt-2 text-sm text-slate-600">{f.a}</p>
                  </details>
                ))}
              </div>
            </div>
          )}
        </nav>
        {extra && <div className="border-t border-white/60 px-5 py-4">{extra}</div>}
      </aside>
    </>
  );
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Open ${title} menu`}
        aria-expanded={open}
        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/70 bg-white/70 text-navy shadow-sm backdrop-blur transition hover:border-gold hover:text-sky-700"
      >
        <PanelRight className="h-5 w-5" aria-hidden="true" />
      </button>
      {mounted && createPortal(drawer, document.body)}
    </>
  );
}
