import type { Metadata } from "next";
import { Fraunces } from "next/font/google";
import "./globals.css";
import { Header, Footer } from "@/components/ui";

/* Fraunces — a warm classic serif with a wink of character — for display
   headings only. Loaded at build time and bundled; no runtime dependency. */
const fraunces = Fraunces({
 subsets: ["latin"],
 weight: ["500", "600", "700"],
 style: ["normal", "italic"],
 variable: "--font-display",
});

export const metadata: Metadata = {
 title: "Nexora Web Dev. Academy — Learn. Build. Innovate.",
 description: "73 lessons, 730 quiz questions, three levels, three real certificates. Learn web development properly — read a lesson, pass its quiz, sit the exam.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
 return (
 <html lang="en" className={fraunces.variable}>
 <body className="flex min-h-dvh flex-col bg-ivory text-slate-700">
 <Header />
 <main className="flex flex-1 flex-col">{children}</main>
 <Footer />
 </body>
 </html>
 );
}
