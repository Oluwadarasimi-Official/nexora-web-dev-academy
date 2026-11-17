import Link from "next/link";
import Image from "next/image";
import { ACADEMY_NAME, AUTHORITIES, WHATSAPP_LINK, WHATSAPP_NUMBER } from "@/lib/data";
import { SidebarMenu } from "@/components/Sidebar";

/* Official logo — the true circular-cropped image (public/logo-circle.png,
 made from public/logo.png, which is untouched). The image itself is the
 circle: no padded card, no wrapper ring. It appears ONLY as this small
 circle in the top-left of the header, aligned with the brand text. */
export function Logo({ size = 40 }: { size?: number }) {
 return (
 <span className="inline-flex shrink-0 items-center gap-2.5">
 <Image
 src="/logo-circle.png"
 alt="Nexora Web Dev. Academy logo"
 width={size}
 height={size}
 style={{ width: size, height: size }}
 className="rounded-full object-cover ring-1 ring-slate-900/10"
 priority
 />
 <span className="leading-tight">
 <span className="block whitespace-nowrap text-lg font-extrabold tracking-tight text-navy">NEXORA</span>
 <span className="block whitespace-nowrap text-[11px] font-semibold uppercase tracking-[0.18em] text-gold-dark">Web Dev. Academy</span>
 </span>
 </span>
 );
}

/* Public header — small circular logo top-left, standard nav links,
 actions on the right. Everything secondary (How It Works, Certificates,
 Contact, Verify Certificate, WhatsApp) lives in the sliding sidebar,
 opened from the hamburger at the far right. */
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
 <header className="glass-header sticky top-0 z-40">
 <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-2.5">
 <Link href="/" aria-label="Nexora Web Dev. Academy — home"><Logo /></Link>
 <div className="flex flex-wrap items-center gap-2">
 <nav className="hidden items-center gap-x-5 text-sm font-medium text-navy md:flex" aria-label="Main navigation">
 {primary.map(([label, href]) => (<Link key={href} className="transition hover:text-sky" href={href}>{label}</Link>))}
 <Link href="/login" className="transition hover:text-sky">Student Login</Link>
 <Link href="/register" className="btn-gold px-4 py-2 text-sm">Register</Link>
 </nav>
 <SidebarMenu
 title="Academy Menu"
 intro="More from Nexora Web Dev. Academy"
 links={secondary}
 extra={
 <div className="space-y-2 text-sm">
 <p className="font-semibold text-navy">Payment &amp; enrolment — WhatsApp</p>
 <p className="text-slate-600">{WHATSAPP_NUMBER}</p>
 <a href={WHATSAPP_LINK} target="_blank" rel="noreferrer" className="btn-gold inline-block px-4 py-2 text-sm">Chat on WhatsApp</a>
 <p className="pt-1 text-xs text-slate-500">Academy authorities: {AUTHORITIES.join(" & ")}.</p>
 </div>
 }
 />
 </div>
 </div>
 </header>
 );
}

/* Slim navy footer — brand name, tagline and the legal line only.
 No logo here: the logo appears only as the small circle in the
 top-left of the header. All Explore / contact links live in the sidebar. */
export function Footer() {
 return (
 <footer className="mt-10 bg-navy text-white">
 <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-6">
 <div>
 <p className="text-lg font-extrabold tracking-tight">NEXORA <span className="font-semibold text-champagne">Web Dev. Academy</span></p>
 <p className="mt-1 max-w-md text-sm text-sky-100">Learn. Build. Innovate. — {AUTHORITIES.join(" & ")}.</p>
 </div>
 <p className="max-w-md text-xs text-sky-100">{ACADEMY_NAME} does not claim government accreditation, university affiliation or external endorsement.</p>
 </div>
 <div className="border-t border-white/15 py-3 text-center text-xs text-sky-100">© {new Date().getFullYear()} {ACADEMY_NAME} — Official Darax &amp; Official Obafemix.</div>
 </footer>
 );
}

export function PageHero({ title, intro }: { title: string; intro: string }) {
 return (
 <section className="glass-hero">
 <div className="mx-auto max-w-6xl px-4 py-7">
 <h1 className="text-3xl font-extrabold tracking-tight text-navy sm:text-4xl">{title}</h1>
 <p className="mt-2 max-w-3xl text-slate-600">{intro}</p>
 </div>
 </section>
 );
}

export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
 return <div className={`card card-hover rounded-2xl p-5 ${className}`}>{children}</div>;
}
export function SectionTitle({ children }: { children: React.ReactNode }) {
 return <h2 className="text-2xl font-bold tracking-tight text-navy">{children}</h2>;
}
export function GoldButton({ children, href }: { children: React.ReactNode; href: string }) {
 return <Link href={href} className="btn-gold px-5 py-2.5">{children}</Link>;
}
export function Alert({ kind, children }: { kind: "error" | "success" | "info"; children: React.ReactNode }) {
 const cls = kind === "error" ? "border-red-200 bg-red-50 text-red-700" : kind === "success" ? "border-sky-200 bg-sky-50 text-sky-800" : "border-sky-200 bg-sky-50 text-sky-800";
 return <div role="status" className={`rounded-xl border px-4 py-3 text-sm ${cls}`}>{children}</div>;
}
