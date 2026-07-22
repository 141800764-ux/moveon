"use client";

import { useEffect, useState } from "react";
import {
  Users, Send, CheckCircle, XCircle,
  Loader2, ExternalLink, Copy
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export default function DriverApplicationsPage() {
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [generatedLink, setGeneratedLink] = useState("");
  const [approving, setApproving] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectToken, setRejectToken] = useState<string | null>(null);
  const [approvedInfo, setApprovedInfo] = useState<any>(null);

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
      toast.success("Driver approved!");
      setApprovedInfo(data);
      setApplications((prev) =>
        prev.map((a) =>
          a.token === token ? { ...a, status: "APPROVED" } : a
        )
      );
    } catch {
      toast.error("Something went wrong");
    } finally {
      setApproving(null);
    }
  }

  async function handleReject(token: string) {
    setRejecting(token);
    try {
      const res = await fetch(`/api/driver-applications/${token}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: rejectReason }),
      });
      if (!res.ok) {
        toast.error("Failed to reject");
        return;
      }
      toast.success("Application rejected");
      setApplications((prev) =>
        prev.map((a) =>
          a.token === token ? { ...a, status: "REJECTED" } : a
        )
      );
      setRejectToken(null);
      setRejectReason("");
    } catch {
      toast.error("Something went wrong");
    } finally {
      setRejecting(null);
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

      {/* Approved info banner */}
      {approvedInfo && (
        <div
          className="rounded-2xl p-5 space-y-3"
          style={{
            background: "rgba(16,185,129,0.1)",
            border: "1px solid rgba(16,185,129,0.3)",
          }}
        >
          <div className="flex items-center gap-2">
            <CheckCircle size={20} style={{ color: "#10b981" }} />
            <p className="font-semibold text-white">Driver Approved Successfully!</p>
          </div>
          <div
            className="rounded-xl p-4 space-y-2"
            style={{ background: "var(--background)" }}
          >
            <p className="text-sm text-white">
              Send these login details to the driver:
            </p>
            <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
              Email: <span className="text-white">{approvedInfo.message?.split(" ")[8]}</span>
            </p>
            <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
              Temporary Password: <span className="font-mono text-white">MoveOn2024!</span>
            </p>
            <p className="text-xs mt-1" style={{ color: "var(--muted-foreground)" }}>
              Driver should change their password after first login.
            </p>
          </div>
          <button
            onClick={() => setApprovedInfo(null)}
            className="text-xs"
            style={{ color: "var(--muted-foreground)" }}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Invite form */}
      <div
        className="rounded-2xl p-6 space-y-4"
        style={{ background: "var(--card)", border: "1px solid var(--border)" }}
      >
        <h2 className="font-semibold text-white">Send Application Link</h2>
        <div className="flex gap-3">
          <Input
            type="email"
            placeholder="driver@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSendInvite()}
            style={{
              background: "var(--input)",
              border: "1px solid var(--border)",
              color: "var(--foreground)",
            }}
          />
          <Button
            onClick={handleSendInvite}
            disabled={sending || !email}
            className="font-semibold text-white shrink-0"
            style={{ background: "var(--gold)" }}
          >
            {sending ? (
              <Loader2 size={16} className="animate-spin mr-2" />
            ) : (
              <Send size={16} className="mr-2" />
            )}
            Generate Link
          </Button>
        </div>

        {generatedLink && (
          <div
            className="rounded-xl p-4 space-y-3"
            style={{
              background: "rgba(200,146,42,0.1)",
              border: "1px solid rgba(200,146,42,0.3)",
            }}
          >
            <p
              className="text-sm font-semibold"
              style={{ color: "var(--gold)" }}
            >
              Application Link Generated:
            </p>
            <div className="flex items-center gap-2">
              <p className="text-sm text-white break-all flex-1">
                {generatedLink}
              </p>
              <Button
                onClick={() => {
                  navigator.clipboard.writeText(generatedLink);
                  toast.success("Copied!");
                }}
                className="shrink-0 text-white text-xs"
                style={{ background: "var(--gold)" }}
              >
                <Copy size={14} className="mr-1" />
                Copy
              </Button>
            </div>
            <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
              Send this link via WhatsApp, SMS, or email to the applicant.
            </p>
          </div>
        )}
      </div>

      {/* Applications list */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-8">
            <Loader2
              size={32}
              className="animate-spin mx-auto"
              style={{ color: "var(--gold)" }}
            />
          </div>
        ) : applications.length === 0 ? (
          <div
            className="rounded-2xl p-16 text-center"
            style={{ background: "var(--card)", border: "1px solid var(--border)" }}
          >
            <Users
              size={48}
              className="mx-auto mb-4"
              style={{ color: "var(--gold)" }}
            />
            <p className="text-white font-semibold">No applications yet</p>
            <p className="text-sm mt-1" style={{ color: "var(--muted-foreground)" }}>
              Send an invite link above to get started
            </p>
          </div>
        ) : (
          applications.map((app) => (
            <div
              key={app.id}
              className="rounded-2xl p-6"
              style={{ background: "var(--card)", border: "1px solid var(--border)" }}
            >
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-4">
                  {app.profilePhotoUrl ? (
                    <img
                      src={app.profilePhotoUrl}
                      alt={app.fullName}
                      className="w-14 h-14 rounded-full object-cover"
                    />
                  ) : (
                    <div
                      className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold"
                      style={{
                        background: "rgba(200,146,42,0.15)",
                        color: "var(--gold)",
                      }}
                    >
                      {app.fullName?.[0] || app.email[0].toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="text-white font-semibold text-lg">
                      {app.fullName || "Application Pending..."}
                    </p>
                    <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
                      {app.email}
                    </p>
                    {app.phone && (
                      <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
                        {app.phone}
                      </p>
                    )}
                    <span
                      className="inline-block text-xs font-semibold px-2 py-0.5 rounded-full mt-1"
                      style={{
                        background: `${STATUS_COLORS[app.status] || "#6b7280"}20`,
                        color: STATUS_COLORS[app.status] || "#6b7280",
                      }}
                    >
                      {app.status}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <Button
                    onClick={() => {
                      const link = `${window.location.origin}/apply/${app.token}`;
                      navigator.clipboard.writeText(link);
                      toast.success("Link copied!");
                    }}
                    className="text-xs"
                    style={{
                      background: "var(--input)",
                      border: "1px solid var(--border)",
                      color: "var(--muted-foreground)",
                    }}
                  >
                    <ExternalLink size={14} className="mr-1" />
                    Copy Link
                  </Button>

                  {app.status === "SUBMITTED" && (
                    <>
                      <Button
                        onClick={() => handleApprove(app.token)}
                        disabled={approving === app.token}
                        className="text-xs font-semibold text-white"
                        style={{ background: "#10b981" }}
                      >
                        {approving === app.token ? (
                          <Loader2 size={14} className="animate-spin mr-1" />
                        ) : (
                          <CheckCircle size={14} className="mr-1" />
                        )}
                        Approve
                      </Button>
                      <Button
                        onClick={() => setRejectToken(app.token)}
                        className="text-xs font-semibold text-white"
                        style={{ background: "#ef4444" }}
                      >
                        <XCircle size={14} className="mr-1" />
                        Reject
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {/* Reject form */}
              {rejectToken === app.token && (
                <div
                  className="mt-4 pt-4 space-y-3"
                  style={{ borderTop: "1px solid var(--border)" }}
                >
                  <p className="text-sm font-semibold text-white">
                    Rejection Reason (optional)
                  </p>
                  <Textarea
                    placeholder="Tell the applicant why they were rejected..."
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    style={{
                      background: "var(--input)",
                      border: "1px solid var(--border)",
                      color: "var(--foreground)",
                    }}
                    rows={2}
                  />
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleReject(app.token)}
                      disabled={rejecting === app.token}
                      className="font-semibold text-white"
                      style={{ background: "#ef4444" }}
                    >
                      {rejecting === app.token ? (
                        <Loader2 size={14} className="animate-spin mr-1" />
                      ) : null}
                      Confirm Reject
                    </Button>
                    <Button
                      onClick={() => {
                        setRejectToken(null);
                        setRejectReason("");
                      }}
                      style={{
                        background: "var(--input)",
                        border: "1px solid var(--border)",
                        color: "var(--muted-foreground)",
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {/* Application details */}
              {app.status === "SUBMITTED" && (
                <div
                  className="mt-4 pt-4 space-y-4"
                  style={{ borderTop: "1px solid var(--border)" }}
                >
                  {/* Photos */}
                  <div className="grid grid-cols-3 gap-3">
                    {app.profilePhotoUrl && (
                      <div>
                        <p
                          className="text-xs mb-1 font-semibold uppercase"
                          style={{ color: "var(--muted-foreground)" }}
                        >
                          Profile
                        </p>
                        <img
                          src={app.profilePhotoUrl}
                          className="w-full h-24 object-cover rounded-xl"
                          alt="Profile"
                        />
                      </div>
                    )}
                    {app.idPhotoUrl && (
                      <div>
                        <p
                          className="text-xs mb-1 font-semibold uppercase"
                          style={{ color: "var(--muted-foreground)" }}
                        >
                          ID Document
                        </p>
                        <img
                          src={app.idPhotoUrl}
                          className="w-full h-24 object-cover rounded-xl"
                          alt="ID"
                        />
                      </div>
                    )}
                    {app.vehiclePhotoUrl && (
                      <div>
                        <p
                          className="text-xs mb-1 font-semibold uppercase"
                          style={{ color: "var(--muted-foreground)" }}
                        >
                          Vehicle
                        </p>
                        <img
                          src={app.vehiclePhotoUrl}
                          className="w-full h-24 object-cover rounded-xl"
                          alt="Vehicle"
                        />
                      </div>
                    )}
                  </div>

                  {/* Details grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {[
                      { label: "Vehicle", value: `${app.vehicleMake || ""} ${app.vehicleModel || ""} (${app.vehicleYear || ""})` },
                      { label: "Registration", value: app.vehicleReg },
                      { label: "License No.", value: app.licenseNumber },
                      { label: "Bank", value: app.bankName?.replace(/_/g, " ") },
                      { label: "Account No.", value: app.accountNumber },
                      { label: "Branch Code", value: app.branchCode },
                    ].filter((item) => item.value).map((item) => (
                      <div
                        key={item.label}
                        className="rounded-xl p-3"
                        style={{ background: "var(--background)" }}
                      >
                        <p
                          className="text-xs font-semibold uppercase mb-0.5"
                          style={{ color: "var(--muted-foreground)" }}
                        >
                          {item.label}
                        </p>
                        <p className="text-sm text-white font-medium">
                          {item.value}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Show approved details */}
              {app.status === "APPROVED" && (
                <div
                  className="mt-3 pt-3 flex items-center gap-2"
                  style={{ borderTop: "1px solid var(--border)" }}
                >
                  <CheckCircle size={16} style={{ color: "#10b981" }} />
                  <p className="text-sm" style={{ color: "#10b981" }}>
                    Approved — driver account created
                  </p>
                </div>
              )}

              {/* Show rejected */}
              {app.status === "REJECTED" && (
                <div
                  className="mt-3 pt-3 flex items-center gap-2"
                  style={{ borderTop: "1px solid var(--border)" }}
                >
                  <XCircle size={16} style={{ color: "#ef4444" }} />
                  <p className="text-sm" style={{ color: "#ef4444" }}>
                    Application rejected
                  </p>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}