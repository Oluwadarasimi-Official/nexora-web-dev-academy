"use client";
import { useState } from "react";
import DashboardShell from "@/components/DashboardShell";
import { Card, Alert } from "@/components/ui";
import { loadSession, saveSession, loadProgress } from "@/lib/store";
export default function Profile() {
  const session = loadSession();
  const p = loadProgress();
  const [name, setName] = useState(session?.name || "");
  const [msg, setMsg] = useState("");
  function save() {
    if (!session || name.trim().length < 2) return;
    saveSession({ ...session, name: name.trim() });
    setMsg("Profile name updated on this device. (In the connected Supabase setup, profile updates are written to the profiles table via the API.)");
  }
  return (
    <DashboardShell title="Profile">
      <Card>
        <p className="text-sm text-slate-600"><strong>Name:</strong> {session?.name}</p>
        <p className="mt-1 text-sm text-slate-600"><strong>Email:</strong> {session?.email}</p>
        <p className="mt-1 text-sm text-slate-600"><strong>Activation:</strong> {p.activated ? "Activated" : "Not activated"} · <strong>Payment status:</strong> {p.paymentStatus}</p>
        <p className="mt-1 text-sm text-slate-600"><strong>Topics completed:</strong> {p.completedTopics.length} · <strong>Certificates:</strong> {p.certificates.length}</p>
        <div className="mt-4">
          <label className="block text-sm font-semibold text-navy" htmlFor="name">Update display name</label>
          <input id="name" className="mt-1 w-full max-w-md rounded-lg border border-slate-300 px-3 py-2" value={name} onChange={(e) => setName(e.target.value)} />
          <button onClick={save} className="mt-3 rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white">Save Name</button>
          {msg && <div className="mt-3"><Alert kind="success">{msg}</Alert></div>}
        </div>
        <p className="mt-4 text-xs text-slate-500">Your password is managed by Supabase Auth and is never shown here. Use Forgot Password on the login page to change it.</p>
      </Card>
    </DashboardShell>
  );
}
