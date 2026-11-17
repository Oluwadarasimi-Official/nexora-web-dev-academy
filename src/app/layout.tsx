import type { Metadata } from "next";
import "./globals.css";
import { Header, Footer } from "@/components/ui";

export const metadata: Metadata = {
  title: "Nexora Web Dev. Academy — Learn. Build. Innovate.",
  description: "A structured web development programme: Beginner, Intermediate and Advanced levels, 73 topics, quizzes, examinations and level certificates.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="relative min-h-screen text-slate-100">
        <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
          <div className="orb orb-a" />
          <div className="orb orb-b" />
          <div className="orb orb-c" />
        </div>
        <Header />
        <main className="relative">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
