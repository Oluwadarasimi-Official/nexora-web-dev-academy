import Link from "next/link";
import Image from "next/image";
import { ACADEMY_NAME, AUTHORITIES, WHATSAPP_LINK, WHATSAPP_NUMBER } from "@/lib/data";

export function Logo({ size = 56 }: { size?: number }) {
  return (
    <span className="inline-flex items-center gap-3">
      {/* Official logo, unchanged, aspect ratio preserved */}
      <Image src="/logo.png" alt="Nexora Web Dev. Academy logo" width={size} height={size} className="rounded-xl object-contain" priority />
      <span className="leading-tight">
        <span className="block text-lg font-extrabold tracking-tight text-navy">NEXORA</span>
        <span className="block text-[11px] font-semibold uppercase tracking-[0.18em] text-gold-dark">Web Dev. Academy</span>
      </span>
    </span>
  );
}

export function Header() {
  const links = [
    ["About", "/about"], ["Programme", "/programme"], ["Curriculum", "/curriculum"],
    ["How It Works", "/how-it-works"], ["Certificates", "/certificates"], ["Contact", "/contact"],
  ];
  return (
    <header className="sticky top-0 z-40 border-b border-[#e8dfc8] bg-[#fffdf5]/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <Link href="/" aria-label="Nexora Web Dev. Academy — home"><Logo /></Link>
        <nav className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm font-medium text-navy" aria-label="Main navigation">
          {links.map(([label, href]) => (<Link key={href} className="hover:text-sky" href={href}>{label}</Link>))}
          <Link href="/verify-certificate" className="hover:text-sky">Verify Certificate</Link>
          <Link href="/login" className="hover:text-sky">Student Login</Link>
          <Link href="/register" className="rounded-lg bg-navy px-4 py-2 text-white hover:bg-sky">Register</Link>
        </nav>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="mt-16 border-t border-[#e8dfc8] bg-[#fdf8ec]">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-3">
        <div>
          <Logo size={48} />
          <p className="mt-3 text-sm text-slate-600">Learn. Build. Innovate. A structured web development programme from first HTML tag to production full-stack work.</p>
          <p className="mt-2 text-sm text-slate-600">Academy authorities: {AUTHORITIES.join(" & ")}.</p>
        </div>
        <div>
          <h3 className="font-bold text-navy">Explore</h3>
          <ul className="mt-2 space-y-1 text-sm">
            {[["About the Academy","/about"],["Learning Programme","/programme"],["Curriculum","/curriculum"],["How It Works","/how-it-works"],["Certificate Information","/certificates"],["Verify a Certificate","/verify-certificate"]].map(([l,h]) => (
              <li key={h}><Link className="text-slate-600 hover:text-sky" href={h}>{l}</Link></li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="font-bold text-navy">Contact &amp; Support</h3>
          <p className="mt-2 text-sm text-slate-600">Payment and enrolment enquiries are handled on WhatsApp.</p>
          <p className="mt-1 text-sm font-semibold text-navy">{WHATSAPP_NUMBER}</p>
          <a href={WHATSAPP_LINK} target="_blank" rel="noreferrer" className="mt-3 inline-block rounded-lg bg-[#128c4b] px-4 py-2 text-sm font-semibold text-white">Chat on WhatsApp</a>
          <p className="mt-3 text-xs text-slate-500">{ACADEMY_NAME} does not claim government accreditation, university affiliation or external endorsement.</p>
        </div>
      </div>
      <div className="border-t border-[#e8dfc8] py-4 text-center text-xs text-slate-500">© {new Date().getFullYear()} {ACADEMY_NAME} — Official Darax &amp; Official Obafemix.</div>
    </footer>
  );
}

export function PageHero({ title, intro }: { title: string; intro: string }) {
  return (
    <section className="border-b border-[#e8dfc8] bg-[#fdf8ec]">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <h1 className="text-3xl font-extrabold tracking-tight text-navy sm:text-4xl">{title}</h1>
        <p className="mt-3 max-w-3xl text-slate-600">{intro}</p>
      </div>
    </section>
  );
}

export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-2xl border border-[#e8dfc8] bg-white p-5 shadow-sm ${className}`}>{children}</div>;
}
export function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-2xl font-bold tracking-tight text-navy">{children}</h2>;
}
export function GoldButton({ children, href }: { children: React.ReactNode; href: string }) {
  return <Link href={href} className="inline-block rounded-lg bg-gold px-5 py-2.5 font-semibold text-navy hover:bg-gold-dark hover:text-white">{children}</Link>;
}
export function Alert({ kind, children }: { kind: "error" | "success" | "info"; children: React.ReactNode }) {
  const cls = kind === "error" ? "border-red-200 bg-red-50 text-red-800" : kind === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-sky-200 bg-sky-50 text-sky-900";
  return <div role="status" className={`rounded-lg border px-4 py-3 text-sm ${cls}`}>{children}</div>;
}
