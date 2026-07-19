"use client";

import { useEffect, useState } from "react";
import { Users, Send, CheckCircle, XCircle, Loader2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import Image from "next/image";

export default function DriverApplicationsPage() {
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [generatedLink, setGeneratedLink] = useState("");
  const [approving, setApproving] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/driver-applications")
      .then((r) => r.json())
      .then((d) => {
        setApplications(d.applications || []);
        setLoading(false);
      });
  }, []);

  async function handleSendInvite() {
    if (!email) return;
    setSending(true);
    try {
      const res = await fetch("/api/driver-applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message || "Failed to create invite");
        return;
      }
      const link = `${window.location.origin}/apply/${data.token}`;
      setGeneratedLink(link);
      toast.success("Application link created!");
      setEmail("");
      setApplications((prev) => [data.application, ...prev]);
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSending(false);
    }
  }

  async function handleApprove(token: string) {
    setApproving(token);
    try {
      const res = await fetch(`/api/driver-applications/${token}/approve`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message || "Failed to approve");
        return;
      }
      toast.success("Driver approved and account created! Temp password: MoveOn2024!");
      setApplications((prev) =>
        prev.map((a) => a.token === token ? { ...a, status: "APPROVED" } : a)
      );
    } catch {
      toast.error("Something went wrong");
    } finally {
      setApproving(null);
    }
  }

  const STATUS_COLORS: Record<string, string> = {
    PENDING: "#eab308",
    SUBMITTED: "#3b82f6",
    APPROVED: "#10b981",
    REJECTED: "#ef4444",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Driver Applications</h1>
        <p className="mt-1" style={{ color: "var(--muted-foreground)" }}>
          Invite and manage driver applications
        </p>
      </div>

      {/* Invite form */}
      <div className="rounded-2xl p-6 space-y-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
        <h2 className="font-semibold text-white">Send Application Link</h2>
        <div className="flex gap-3">
          <Input
            type="email"
            placeholder="driver@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ background: "var(--input)", border: "1px solid var(--border)", color: "var(--foreground)" }}
          />
          <Button onClick={handleSendInvite} disabled={sending || !email} className="font-semibold text-white shrink-0" style={{ background: "var(--gold)" }}>
            {sending ? <Loader2 size={16} className="animate-spin mr-2" /> : <Send size={16} className="mr-2" />}
            Generate Link
          </Button>
        </div>

        {generatedLink && (
          <div className="rounded-xl p-4 space-y-2" style={{ background: "rgba(200,146,42,0.1)", border: "1px solid rgba(200,146,42,0.3)" }}>
            <p className="text-sm font-semibold" style={{ color: "var(--gold)" }}>Application Link Generated:</p>
            <div className="flex items-center gap-2">
              <p className="text-sm text-white break-all flex-1">{generatedLink}</p>
              <Button
                onClick={() => { navigator.clipboard.writeText(generatedLink); toast.success("Copied!"); }}
                className="shrink-0 text-white text-xs"
                style={{ background: "var(--gold)" }}
              >
                Copy
              </Button>
            </div>
            <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
              Send this link to the applicant via WhatsApp, SMS, or email.
            </p>
          </div>
        )}
      </div>

      {/* Applications list */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-8"><Loader2 size={32} className="animate-spin mx-auto" style={{ color: "var(--gold)" }} /></div>
        ) : applications.length === 0 ? (
          <div className="rounded-2xl p-16 text-center" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <Users size={48} className="mx-auto mb-4" style={{ color: "var(--gold)" }} />
            <p className="text-white font-semibold">No applications yet</p>
          </div>
        ) : (
          applications.map((app) => (
            <div key={app.id} className="rounded-2xl p-6" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-4">
                  {app.profilePhotoUrl ? (
                    <img src={app.profilePhotoUrl} alt={app.fullName} className="w-14 h-14 rounded-full object-cover" />
                  ) : (
                    <div className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold" style={{ background: "rgba(200,146,42,0.15)", color: "var(--gold)" }}>
                      {app.fullName?.[0] || app.email[0].toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="text-white font-semibold">{app.fullName || "Pending..."}</p>
                    <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>{app.email}</p>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: `${STATUS_COLORS[app.status]}20`, color: STATUS_COLORS[app.status] }}>
                      {app.status}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/apply/${app.token}`); toast.success("Link copied!"); }}
                    className="text-xs"
                    style={{ background: "var(--input)", border: "1px solid var(--border)", color: "var(--muted-foreground)" }}
                  >
                    <ExternalLink size={14} className="mr-1" />
                    Copy Link
                  </Button>
                  {app.status === "SUBMITTED" && (
                    <Button
                      onClick={() => handleApprove(app.token)}
                      disabled={approving === app.token}
                      className="text-xs font-semibold text-white"
                      style={{ background: "#10b981" }}
                    >
                      {approving === app.token ? <Loader2 size={14} className="animate-spin mr-1" /> : <CheckCircle size={14} className="mr-1" />}
                      Approve
                    </Button>
                  )}
                </div>
              </div>

              {app.status === "SUBMITTED" && (
                <div className="mt-4 pt-4 grid grid-cols-2 sm:grid-cols-4 gap-4" style={{ borderTop: "1px solid var(--border)" }}>
                  {app.profilePhotoUrl && <div><p className="text-xs mb-1" style={{ color: "var(--muted-foreground)" }}>Profile</p><img src={app.profilePhotoUrl} className="w-full h-20 object-cover rounded-lg" /></div>}
                  {app.idPhotoUrl && <div><p className="text-xs mb-1" style={{ color: "var(--muted-foreground)" }}>ID</p><img src={app.idPhotoUrl} className="w-full h-20 object-cover rounded-lg" /></div>}
                  {app.vehiclePhotoUrl && <div><p className="text-xs mb-1" style={{ color: "var(--muted-foreground)" }}>Vehicle</p><img src={app.vehiclePhotoUrl} className="w-full h-20 object-cover rounded-lg" /></div>}
                  <div className="space-y-1 text-sm">
                    <p style={{ color: "var(--muted-foreground)" }}>Vehicle: {app.vehicleMake} {app.vehicleModel} ({app.vehicleYear})</p>
                    <p style={{ color: "var(--muted-foreground)" }}>Reg: {app.vehicleReg}</p>
                    <p style={{ color: "var(--muted-foreground)" }}>License: {app.licenseNumber}</p>
                    <p style={{ color: "var(--muted-foreground)" }}>Bank: {app.bankName}</p>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}