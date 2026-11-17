"use client";
import { useState } from "react";
import DashboardShell from "@/components/DashboardShell";
import { Card, Alert } from "@/components/ui";
import { loadSession, saveSession, useSyncedProgress } from "@/lib/store";
import { studentPost, StudentApiError } from "@/lib/studentClient";

// Profile — the display name is saved to the academy database (B14 fix:
// "Save Name" used to update only the localStorage session, so the admin
// students page and certificates kept showing the old name).
export default function Profile() {
 const session = loadSession();
 const p = useSyncedProgress();
 const [name, setName] = useState(session?.name || "");
 const [msg, setMsg] = useState("");
 const [err, setErr] = useState("");
 const [busy, setBusy] = useState(false);
 async function save() {
 if (!session || name.trim().length < 2) return;
 setMsg(""); setErr(""); setBusy(true);
 try {
 const data = await studentPost<{ name: string }>("/api/profile", { name: name.trim() });
 saveSession({ ...session, name: data.name });
 setMsg("Profile name updated.");
 } catch (e: unknown) {
 setErr(e instanceof StudentApiError ? e.message : "Could not update your profile. Try again.");
 } finally { setBusy(false); }
 }
 return (
 <DashboardShell title="Profile">
 <Card>
 <p className="text-sm text-slate-600"><strong>Name:</strong> {session?.name}</p>
 <p className="mt-1 text-sm text-slate-600"><strong>Email:</strong> {session?.email}</p>
 <p className="mt-1 text-sm text-slate-600"><strong>Activation:</strong> {p.activated ? "Activated" : "Not activated"}</p>
 <p className="mt-1 text-sm text-slate-600"><strong>Topics completed:</strong> {p.completedTopics.length} · <strong>Certificates:</strong> {p.certificates.length}</p>
 <div className="mt-4">
 <label className="block text-sm font-semibold text-navy" htmlFor="name">Update display name</label>
 <input id="name" className="mt-1 w-full max-w-md input-std" value={name} onChange={(e) => setName(e.target.value)} />
 <button onClick={save} disabled={busy} className="mt-3 btn-gold px-4 py-2 text-sm font-semibold disabled:opacity-50">{busy ? "Saving…" : "Save Name"}</button>
 {msg && <div className="mt-3"><Alert kind="success">{msg}</Alert></div>}
 {err && <div className="mt-3"><Alert kind="error">{err}</Alert></div>}
 </div>
 <p className="mt-4 text-xs text-slate-500">Your password is managed by Supabase Auth and is never shown here. Use Forgot Password on the login page to change it.</p>
 </Card>
 </DashboardShell>
 );
}
