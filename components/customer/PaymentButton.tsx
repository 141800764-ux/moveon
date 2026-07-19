"use client";

import { useState } from "react";
import { CreditCard, Banknote, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function PaymentButton({
  orderId,
  amount,
}: {
  orderId: string;
  amount: number;
}) {
  const [loading, setLoading] = useState<string | null>(null);

  async function handlePayment(method: "CASH" | "CARD") {
    setLoading(method);
    try {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, method }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message || "Payment failed");
        return;
      }

      if (method === "CARD" && data.payfastUrl) {
        window.location.href = data.payfastUrl;
      } else {
        toast.success("Cash payment selected. Pay the driver on delivery.");
        window.location.reload();
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="rounded-2xl p-5 space-y-4" style={{ background: "rgba(200,146,42,0.08)", border: "1px solid rgba(200,146,42,0.3)" }}>
      <div>
        <h2 className="font-semibold text-white">Payment Required</h2>
        <p className="text-2xl font-bold mt-1" style={{ color: "var(--gold)" }}>
          R{amount.toFixed(2)}
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Button
          onClick={() => handlePayment("CASH")}
          disabled={!!loading}
          className="font-semibold text-white flex items-center justify-center gap-2"
          style={{ background: "#10b981" }}
        >
          {loading === "CASH" ? <Loader2 size={16} className="animate-spin" /> : <Banknote size={16} />}
          Pay Cash
        </Button>
        <Button
          onClick={() => handlePayment("CARD")}
          disabled={!!loading}
          className="font-semibold text-white flex items-center justify-center gap-2"
          style={{ background: "var(--gold)" }}
        >
          {loading === "CARD" ? <Loader2 size={16} className="animate-spin" /> : <CreditCard size={16} />}
          Pay by Card
        </Button>
      </div>
      <p className="text-xs text-center" style={{ color: "var(--muted-foreground)" }}>
        Cash: pay the driver on delivery · Card: secure payment via PayFast
      </p>
    </div>
  );
}