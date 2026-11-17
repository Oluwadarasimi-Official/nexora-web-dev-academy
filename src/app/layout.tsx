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
 <body className="flex min-h-dvh flex-col bg-ivory text-slate-700">
 <Header />
 <main className="flex flex-1 flex-col">{children}</main>
 <Footer />
 </body>
 </html>
 );
}
