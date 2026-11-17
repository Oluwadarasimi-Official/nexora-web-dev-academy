export const ACADEMY_NAME = "Nexora Web Dev. Academy";
export const AUTHORITIES = ["Official Darax", "Official Obafemix"];
export const WHATSAPP_NUMBER = "+2348139388562";
export const WHATSAPP_LINK =
  "https://wa.me/2348139388562?text=" +
  encodeURIComponent("Hello Nexora Web Dev. Academy, I would like to enrol and confirm payment.");
export const SITE_URL = "https://nexdevacad.vercel.app";
export const SUPABASE_URL = "https://fodwlmprqreheqiskowy.supabase.co";
export const DAILY_LIMIT = 3;
export const PASS_MARK = 7;

export const FAQS = [
  { q: "Who can enrol?", a: "Anyone who wants to learn web development from the beginning. No prior coding experience is required for the Beginner level." },
  { q: "How do I pay?", a: "Payment is made outside this platform. Contact the academy on WhatsApp (+234 813 938 8562), follow the payment method the academy communicates, and the owner will give you your access code." },
  { q: "How do access codes work?", a: "After you pay on WhatsApp, the owner gives you one single-use access code. You redeem it once on the activation screen and your lessons unlock instantly. Each code works for one student only and cannot be reused." },
  { q: "How many topics can I study per day?", a: "Three new topics per calendar day (Africa/Lagos time). Topics you have already completed can be revised any time without using your daily allowance." },
  { q: "What do I need to pass a topic?", a: "Complete the lesson and score at least 7 out of 10 (70%) in the topic quiz. A failed quiz does not complete the topic — you may try again." },
  { q: "How do I earn a certificate?", a: "Complete every topic and quiz in a level, pass that level's final examination (objective + theory, 70% pass mark), and your certificate for that level is issued. There is one certificate per level: Certificate of Completion (Beginner), Certificate of Achievement (Intermediate), and Advanced Web Development Certification (Advanced)." },
  { q: "How can someone verify my certificate?", a: "Anyone can enter the certificate ID on the public Certificate Verification page. It returns only the name, certificate title, level, issue date and validity status — no private account data." },
  { q: "Is the academy accredited by a government or university?", a: "No. Nexora Web Dev. Academy does not claim government accreditation, university affiliation or any external endorsement. Certificates certify completion of the academy's own programme." },
];

export const RATE_LIMITS = { login: { max: 10, windowMs: 15 * 60 * 1000 }, redeem: { max: 10, windowMs: 60 * 60 * 1000 }, verify: { max: 30, windowMs: 60 * 1000 } };

// Simple in-memory rate limiter for API routes (per process; Vercel may run
// several instances — this is a first line of defence, not the only one.
// Database constraints and server-side checks remain authoritative).
const buckets = new Map<string, { count: number; resetAt: number }>();
export function rateLimited(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || now > b.resetAt) { buckets.set(key, { count: 1, resetAt: now + windowMs }); return false; }
  b.count += 1;
  return b.count > max;
}
export function clientIp(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}
