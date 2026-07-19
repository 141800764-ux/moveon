"use client";

import { useState } from "react";
import { Loader2, ArrowLeftRight } from "lucide-react";
import { toast } from "sonner";

export default function RoleSwitcher({ currentRole }: { currentRole: string }) {
  const [loading, setLoading] = useState(false);

  const targetRole = currentRole === "DRIVER" ? "CARRIER_ADMIN" : "DRIVER";
  const label = currentRole === "DRIVER" ? "Switch to Admin" : "Switch to Driver";

  async function handleSwitch() {
    setLoading(true);
    try {
      const res = await fetch("/api/user/switch-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetRole }),
      });

      if (!res.ok) {
        toast.error("Cannot switch role");
        return;
      }

      toast.success(`Switched to ${targetRole.replace(/_/g, " ")}`);
      window.location.href = targetRole === "DRIVER" ? "/driver" : "/dashboard";
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleSwitch}
      disabled={loading}
      className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition hover:bg-white/5"
      style={{ color: "var(--gold)", border: "1px solid rgba(200,146,42,0.3)" }}
    >
      {loading ? <Loader2 size={14} className="animate-spin" /> : <ArrowLeftRight size={14} />}
      {label}
    </button>
  );
}