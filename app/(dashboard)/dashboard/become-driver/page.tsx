"use client";

import { useState } from "react";
import { Truck, Loader2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function BecomeDriverPage() {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleBecomeDriver() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/become-driver", {
        method: "POST",
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || "Something went wrong");
        return;
      }

      toast.success("Driver profile created! Switching to driver mode...");
      setDone(true);
      setTimeout(() => {
        window.location.href = "/driver";
      }, 1500);
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center space-y-4">
          <CheckCircle size={48} className="mx-auto" style={{ color: "#10b981" }} />
          <p className="text-white font-semibold">Driver profile created!</p>
          <p style={{ color: "var(--muted-foreground)" }}>Redirecting to driver portal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Become a Driver</h1>
        <p className="mt-1" style={{ color: "var(--muted-foreground)" }}>
          Add a driver profile to your admin account
        </p>
      </div>

      <div
        className="rounded-2xl p-6 space-y-4"
        style={{ background: "var(--card)", border: "1px solid var(--border)" }}
      >
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center"
          style={{ background: "rgba(200,146,42,0.1)" }}
        >
          <Truck size={28} style={{ color: "var(--gold)" }} />
        </div>

        <div>
          <h2 className="text-lg font-semibold text-white">Switch to Driver Mode</h2>
          <p className="mt-2 text-sm" style={{ color: "var(--muted-foreground)" }}>
            This will create a driver profile linked to your admin account. You'll be able to switch between admin and driver mode at any time. Your admin access will not be affected.
          </p>
        </div>

        <div
          className="rounded-xl p-4 space-y-2"
          style={{ background: "var(--background)" }}
        >
          <p className="text-sm font-semibold text-white">What you'll get:</p>
          <ul className="space-y-1 text-sm" style={{ color: "var(--muted-foreground)" }}>
            <li>✓ Access to the driver portal</li>
            <li>✓ Ability to accept and deliver orders</li>
            <li>✓ Weekly earnings tracking</li>
            <li>✓ Switch back to admin at any time</li>
          </ul>
        </div>

        <Button
          onClick={handleBecomeDriver}
          disabled={loading}
          className="w-full h-12 font-semibold text-white"
          style={{ background: "var(--gold)" }}
        >
          {loading && <Loader2 size={18} className="animate-spin mr-2" />}
          {loading ? "Setting up..." : "Become a Driver"}
        </Button>
      </div>
    </div>
  );
}