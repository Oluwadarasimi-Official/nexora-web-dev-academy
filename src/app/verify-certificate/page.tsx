"use client";
import { useState } from "react";
import { AuthShell, AuthMessages, inputCls, labelCls, submitCls, useAuthMessage } from "@/components/AuthForm";
import CertificateView from "@/components/CertificateView";

export default function VerifyCertificate() {
  const { error, setError, info, setInfo } = useAuthMessage();
  const [id, setId] = useState(""); const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ valid: boolean; status?: string; certificateId?: string; studentName?: string; title?: string; level?: number; levelName?: string; issuedAt?: string } | null>(null);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setError(""); setResult(null);
    if (!id.trim()) return setError("Enter a certificate ID.");
    setBusy(true);
    try {
      const res = await fetch("/api/verify-certificate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ certificateId: id.trim() }) });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Verification failed. Try again."); return; }
      setResult(data);
      setInfo(data.valid ? "Certificate found." : "No valid certificate matches that ID.");
    } catch { setError("Network error. Check your connection and try again."); }
    finally { setBusy(false); }
  }
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <AuthShell title="Verify a Certificate" intro="Enter the certificate ID exactly as printed on the certificate. Only safe public fields are shown — never email or private account data.">
        <AuthMessages error={error} info={info} />
        <form onSubmit={submit} className="space-y-4" noValidate>
          <div><label className={labelCls} htmlFor="cid">Certificate ID</label><input id="cid" className={inputCls} value={id} onChange={(e) => setId(e.target.value)} placeholder="e.g. NEX-B1-2026-000001" /></div>
          <button className={submitCls} disabled={busy}>{busy ? "Verifying…" : "Verify Certificate"}</button>
        </form>
      </AuthShell>
      {result && result.valid && (
        <div className="mt-8">
          <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
            Status: {result.status === "revoked" ? "REVOKED — this certificate is no longer valid." : "VALID"}
          </div>
          <CertificateView cert={{ certificateId: result.certificateId || "", studentName: result.studentName || "", title: result.title || "", level: result.level || 1, levelName: result.levelName || "Beginner", issuedAt: result.issuedAt || new Date().toISOString(), status: result.status }} />
        </div>
      )}
      {result && !result.valid && <p className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">Invalid: no certificate with that ID was found, or it has been revoked. Check the ID and try again.</p>}
    </div>
  );
}
