"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

/**
 * Sliding glass sidebar (drawer) — the one consistent pattern for extra /
 * secondary things across the whole academy: public pages, student portal
 * and admin portal. Primary content stays on the page; everything extra
 * (secondary links, tools, help, announcements, settings, extra actions)
 * lives here until the user opens it with the hamburger trigger.
 *
 * Behaviour (same everywhere): hamburger at the far right of the top bar,
 * drawer slides in from the right, glass panel + dimmed backdrop, close
 * button, closes on backdrop click, on link click, and on Escape.
 */
export function SidebarMenu({
  links,
  title,
  intro,
  extra,
  activeHref,
}: {
  links: [string, string][];
  title: string;
  intro?: string;
  extra?: React.ReactNode;
  activeHref?: string;
}) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [open ]);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Open ${title} menu`}
        aria-expanded={open}
        className="glass-chip inline-flex h-10 w-10 shrink-0 flex-col items-center justify-center gap-[5px] rounded-full transition hover:border-amber-300/60"
      >
        <span className="block h-[2px] w-5 rounded bg-white" />
        <span className="block h-[2px] w-5 rounded bg-amber-300" />
        <span className="block h-[2px] w-5 rounded bg-white" />
      </button>
      <div className={`drawer-backdrop fixed inset-0 z-50 bg-black/60 backdrop-blur-sm ${open ? "opacity-100" : "pointer-events-none opacity-0"}`} onClick={() => setOpen(false)} aria-hidden="true" />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`drawer-panel fixed right-0 top-0 z-50 flex h-full w-[86vw] max-w-sm flex-col ${open ? "translate-x-0" : "translate-x-full drawer-closed"}`}
      >
        <div className="flex items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-300">{title}</p>
            {intro && <p className="mt-0.5 text-xs text-slate-400">{intro}</p>}
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
            className="glass-chip inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-lg leading-none text-white transition hover:border-amber-300/60"
          >
            ×
          </button>
        </div>
        <nav className="flex-1 space-y-1.5 overflow-y-auto px-4 py-4" aria-label={title}>
          {links.map(([label, href]) => (
            <Link key={href + label} href={href} onClick={() => setOpen(false)} className={`drawer-link ${activeHref === href ? "active" : ""}`}>
              <span>{label}</span><span aria-hidden="true" className="text-slate-500">→</span>
            </Link>
          ))}
        </nav>
        {extra && <div className="border-t border-white/10 px-5 py-4">{extra}</div>}
      </aside>
    </>
  );
}
