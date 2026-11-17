import Link from "next/link";
import Image from "next/image";
import { ACADEMY_NAME, AUTHORITIES, WHATSAPP_LINK, WHATSAPP_NUMBER } from "@/lib/data";
import { SidebarMenu } from "@/components/Sidebar";

/* Official logo, unchanged (public/logo.png), set inside a circular glass
   card: the round container is `size` wide, the logo image itself is 70%
   of that diameter and perfectly centred, so the square artwork fits fully
   inside the circle — no stretching, no cropping, nothing touching the edge. */
export function Logo({ size = 52 }: { size?: number }) {
  const img = Math.round(size * 0.7);
  return (
    <span className="inline-flex shrink-0 items-center gap-3">
      <span
        className="glass-chip flex items-center justify-center rounded-full shadow-lg"
        style={{ width: size, height: size }}
      >
        <Image
          src="/logo.png"
          alt="Nexora Web Dev. Academy logo"
          width={img}
          height={img}
          style={{ width: img, height: img }}
          className="object-contain"
          priority
        />
      </span>
      <span className="leading-tight">
        <span className="block whitespace-nowrap text-lg font-extrabold tracking-tight text-white">NEXORA</span>
        <span className="block whitespace-nowrap text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-300">Web Dev. Academy</span>
      </span>
    </span>
  );
}

/* Public header — primary links only. Everything secondary (How It Works,
   Certificates, Contact, Verify Certificate, WhatsApp) lives in the
   sliding glass sidebar, opened from the hamburger at the far right. */
export function Header() {
  const primary = [["About", "/about"], ["Programme", "/programme"], ["Curriculum", "/curriculum"]];
  const secondary: [string, string][] = [
    ["How It Works", "/how-it-works"],
    ["Certificates", "/certificates"],
    ["Contact", "/contact"],
    ["Verify Certificate", "/verify-certificate"],
    ["Student Login", "/login"],
    ["Register", "/register"],
  ];
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#070b1d]/75 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-2.5">
        <Link href="/" aria-label="Nexora Web Dev. Academy — home"><Logo /></Link>
        <div className="flex flex-wrap items-center gap-2">
          <nav className="hidden items-center gap-x-5 text-sm font-medium text-slate-200 md:flex" aria-label="Main navigation">
            {primary.map(([label, href]) => (<Link key={href} className="transition hover:text-cyan-300" href={href}>{label}</Link>))}
            <Link href="/login" className="transition hover:text-cyan-300">Student Login</Link>
            <Link href="/register" className="btn-gold px-4 py-2 text-sm">Register</Link>
          </nav>
          <SidebarMenu
            title="Academy Menu"
            intro="More from Nexora Web Dev. Academy"
            links={secondary}
            extra={
              <div className="space-y-2 text-sm">
                <p className="font-semibold text-white">Payment &amp; enrolment — WhatsApp</p>
                <p className="text-slate-300">{WHATSAPP_NUMBER}</p>
                <a href={WHATSAPP_LINK} target="_blank" rel="noreferrer" className="btn-gold inline-block px-4 py-2 text-sm">Chat on WhatsApp</a>
                <p className="pt-1 text-xs text-slate-400">Academy authorities: {AUTHORITIES.join(" & ")}.</p>
              </div>
            }
          />
        </div>
      </div>
    </header>
  );
}

/* Slim footer — brand, tagline and the legal line only. All Explore /
   contact links live in the sidebar, so the footer stays short. */
export function Footer() {
  return (
    <footer className="mt-10 border-t border-white/10 bg-white/[0.03] backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-6">
        <div className="flex items-center gap-4">
          <Logo size={44} />
          <p className="max-w-md text-sm text-slate-300">Learn. Build. Innovate. — {AUTHORITIES.join(" & ")}.</p>
        </div>
        <p className="max-w-md text-xs text-slate-400">{ACADEMY_NAME} does not claim government accreditation, university affiliation or external endorsement.</p>
      </div>
      <div className="border-t border-white/10 py-3 text-center text-xs text-slate-400">© {new Date().getFullYear()} {ACADEMY_NAME} — Official Darax &amp; Official Obafemix.</div>
    </footer>
  );
}

export function PageHero({ title, intro }: { title: string; intro: string }) {
  return (
    <section className="border-b border-white/10">
      <div className="mx-auto max-w-6xl px-4 py-7">
        <h1 className="grad-text text-3xl font-extrabold tracking-tight sm:text-4xl">{title}</h1>
        <p className="mt-2 max-w-3xl text-slate-300">{intro}</p>
      </div>
    </section>
  );
}

export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`glass glass-hover rounded-3xl p-5 ${className}`}>{children}</div>;
}
export function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-2xl font-bold tracking-tight text-white">{children}</h2>;
}
export function GoldButton({ children, href }: { children: React.ReactNode; href: string }) {
  return <Link href={href} className="btn-gold px-5 py-2.5">{children}</Link>;
}
export function Alert({ kind, children }: { kind: "error" | "success" | "info"; children: React.ReactNode }) {
  const cls = kind === "error" ? "border-rose-400/30 bg-rose-500/10 text-rose-200" : kind === "success" ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-200" : "border-cyan-400/30 bg-cyan-500/10 text-cyan-200";
  return <div role="status" className={`glass-soft rounded-xl border px-4 py-3 text-sm ${cls}`}>{children}</div>;
}
