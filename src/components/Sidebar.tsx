"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { ChevronRight, X } from "lucide-react";

/**
 * Sliding hidden sidebar (drawer) — the one consistent pattern for extra /
 * secondary things across the whole academy: public pages, student portal
 * and admin portal. Primary content stays on the page; everything extra
 * (secondary links, tools, help, announcements, settings, extra actions)
 * lives here until the user opens it with the hamburger trigger.
 *
 * Behaviour (same everywhere): hamburger at the far right of the top bar,
 * drawer slides in from the right, clean white panel + dimmed backdrop,
 * close button, closes on backdrop click, on link click, and on Escape.
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
 const [mounted, setMounted] = useState(false);
 useEffect(() => { setMounted(true); }, []);
 useEffect(() => {
 if (!open) return;
 const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
 document.addEventListener("keydown", onKey);
 document.body.style.overflow = "hidden";
 return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
 }, [open ]);
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
 <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
 <div>
 <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold-dark">{title}</p>
 {intro && <p className="mt-0.5 text-xs text-slate-500">{intro}</p>}
 </div>
 <button
 type="button"
 onClick={() => setOpen(false)}
 aria-label="Close menu"
 className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-300 bg-white text-navy transition hover:border-gold"
 >
 <X className="h-5 w-5" />
 </button>
 </div>
 <nav className="flex-1 space-y-1.5 overflow-y-auto px-4 py-4" aria-label={title}>
 {links.map(([label, href]) => (
 <Link key={href + label} href={href} onClick={() => setOpen(false)} className={`drawer-link ${activeHref === href ? "active" : ""}`}>
 <span>{label}</span><ChevronRight className="h-4 w-4 shrink-0 text-slate-500" aria-hidden="true" />
 </Link>
 ))}
 </nav>
 {extra && <div className="border-t border-slate-200 px-5 py-4">{extra}</div>}
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
 className="inline-flex h-10 w-10 shrink-0 flex-col items-center justify-center gap-[5px] rounded-full border border-slate-300 bg-white transition hover:border-gold"
 >
 <span className="block h-[2px] w-5 rounded bg-navy" />
 <span className="block h-[2px] w-5 rounded bg-gold" />
 <span className="block h-[2px] w-5 rounded bg-navy" />
 </button>
 {mounted && createPortal(drawer, document.body)}
 </>
 );
}
