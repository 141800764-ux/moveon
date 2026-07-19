"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function CancelOrderButton({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [confirm, setConfirm] = useState(false);

  async function handleCancel() {
    if (!confirm) {
      setConfirm(true);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/cancel`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message || "Failed to cancel");
        return;
      }
      toast.success("Order cancelled");
      router.refresh();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
      setConfirm(false);
    }
  }

  return (
    <div className="rounded-2xl p-5" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
      <h2 className="font-semibold text-white mb-3">Cancel Order</h2>
      <p className="text-sm mb-4" style={{ color: "var(--muted-foreground)" }}>
        Orders can only be cancelled before pickup.
      </p>
      <Button
        onClick={handleCancel}
        disabled={loading}
        className="w-full font-semibold text-white"
        style={{ background: confirm ? "#ef4444" : "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", color: confirm ? "white" : "#ef4444" }}
      >
        {loading ? (
          <Loader2 size={16} className="animate-spin mr-2" />
        ) : (
          <XCircle size={16} className="mr-2" />
        )}
        {confirm ? "Confirm Cancel" : "Cancel Order"}
      </Button>
      {confirm && (
        <button onClick={() => setConfirm(false)} className="w-full mt-2 text-sm text-center" style={{ color: "var(--muted-foreground)" }}>
          Never mind, keep order
        </button>
      )}
    </div>
  );
}