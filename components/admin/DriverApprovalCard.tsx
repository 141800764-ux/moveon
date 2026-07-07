"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Check, X, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type Document = {
  id: string;
  type: string;
  fileUrl: string;
};

type DriverApplication = {
  id: string;
  fullName: string;
  phone: string;
  licenseNumber: string;
  licenseExpiresAt: string;
  licenseClasses: string[];
  appliedAt: string;
  documents: Document[];
  user: { name: string | null; email: string | null; image: string | null };
};

export default function DriverApprovalCard({ driver }: { driver: DriverApplication }) {
  const router = useRouter();
  const [loading, setLoading] = useState<"APPROVE" | "REJECT" | null>(null);
  const [showRejectReason, setShowRejectReason] = useState(false);
  const [reason, setReason] = useState("");

  async function submitDecision(decision: "APPROVE" | "REJECT") {
    setLoading(decision);
    try {
      const res = await fetch(`/api/admin/drivers/${driver.id}/decision`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision, rejectionReason: reason }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message || "Something went wrong");
        return;
      }

      toast.success(decision === "APPROVE" ? "Driver approved" : "Application rejected");
      router.refresh();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="p-4 rounded-lg border space-y-3" style={{ borderColor: "var(--border)" }}>
      <div className="flex items-center justify-between">
        <div>
          <p className="font-semibold">{driver.fullName}</p>
          <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
            {driver.user.email} · {driver.phone}
          </p>
        </div>
        <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
          Applied {new Date(driver.appliedAt).toLocaleDateString()}
        </p>
      </div>

      <div className="text-sm">
        <p>License: {driver.licenseNumber} (expires {new Date(driver.licenseExpiresAt).toLocaleDateString()})</p>
        <p>Classes: {driver.licenseClasses.join(", ") || "None specified"}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {driver.documents.map((doc) => (
          <a                                    
            key={doc.id}
            href={doc.fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs border"
            style={{ borderColor: "var(--border)" }}
          >
            <FileText size={14} />
            {doc.type.replace(/_/g, " ")}
          </a>
        ))}
      </div>

      {showRejectReason && (
        <input
          type="text"
          placeholder="Reason for rejection (shown to applicant)"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="w-full text-sm px-3 py-2 rounded-md border"
          style={{ borderColor: "var(--border)", background: "var(--input)" }}
        />
      )}

      <div className="flex gap-2">
        <Button
          onClick={() => submitDecision("APPROVE")}
          disabled={loading !== null}
          className="font-semibold text-white flex-1"
          style={{ background: "var(--gold)" }}
        >
          {loading === "APPROVE" ? <Loader2 size={16} className="animate-spin mr-2" /> : <Check size={16} className="mr-2" />}
          Approve
        </Button>
        <Button
          onClick={() => (showRejectReason ? submitDecision("REJECT") : setShowRejectReason(true))}
          disabled={loading !== null}
          variant="outline"
          className="flex-1"
        >
          {loading === "REJECT" ? <Loader2 size={16} className="animate-spin mr-2" /> : <X size={16} className="mr-2" />}
          {showRejectReason ? "Confirm Reject" : "Reject"}
        </Button>
      </div>
    </div>
  );
}