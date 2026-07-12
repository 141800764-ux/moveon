"use client";

import { useEffect, useState } from "react";
import { DollarSign, Loader2, CheckCircle, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function PayoutsPage() {
  const [payouts, setPayouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/payouts")
      .then((r) => r.json())
      .then((d) => {
        setPayouts(d.payouts || []);
        setLoading(false);
      });
  }, []);

  async function handlePayout(driverId: string) {
    setPaying(driverId);
    try {
      const res = await fetch("/api/admin/payouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ driverId }),
      });

      if (!res.ok) {
        toast.error("Failed to mark as paid");
        return;
      }

      toast.success("Payout marked as complete!");
      setPayouts((prev) =>
        prev.filter((p) => p.driverId !== driverId)
      );
    } catch {
      toast.error("Something went wrong");
    } finally {
      setPaying(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2
          size={32}
          className="animate-spin"
          style={{ color: "var(--gold)" }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Driver Payouts</h1>
        <p className="mt-1" style={{ color: "var(--muted-foreground)" }}>
          Pay out drivers for their completed deliveries
        </p>
      </div>

      {payouts.length === 0 ? (
        <div
          className="rounded-2xl p-16 text-center"
          style={{ background: "var(--card)", border: "1px solid var(--border)" }}
        >
          <CheckCircle
            size={48}
            className="mx-auto mb-4"
            style={{ color: "#10b981" }}
          />
          <h2 className="text-xl font-bold text-white mb-2">
            All drivers paid!
          </h2>
          <p style={{ color: "var(--muted-foreground)" }}>
            No pending payouts at the moment.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {payouts.map((payout) => (
            <div
              key={payout.driverId}
              className="rounded-2xl p-6"
              style={{
                background: "var(--card)",
                border: "1px solid var(--border)",
              }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold shrink-0"
                    style={{
                      background: "rgba(200,146,42,0.15)",
                      color: "var(--gold)",
                    }}
                  >
                    {payout.fullName[0]}
                  </div>
                  <div>
                    <p className="text-white font-semibold">{payout.fullName}</p>
                    <p
                      className="text-sm"
                      style={{ color: "var(--muted-foreground)" }}
                    >
                      {payout.phone} · {payout.unpaidEarnings} deliveries
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p
                    className="text-2xl font-bold"
                    style={{ color: "var(--gold)" }}
                  >
                    R{payout.totalOwed.toFixed(2)}
                  </p>
                  <p
                    className="text-xs"
                    style={{ color: "var(--muted-foreground)" }}
                  >
                    owed
                  </p>
                </div>
              </div>

              {/* Banking details */}
              {payout.bankingDetails ? (
                <div
                  className="mt-4 pt-4 rounded-xl p-4"
                  style={{
                    borderTop: "1px solid var(--border)",
                    background: "var(--background)",
                  }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <CreditCard
                      size={14}
                      style={{ color: "var(--gold)" }}
                    />
                    <span
                      className="text-xs font-semibold uppercase"
                      style={{ color: "var(--muted-foreground)" }}
                    >
                      Banking Details
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p
                        className="text-xs"
                        style={{ color: "var(--muted-foreground)" }}
                      >
                        Bank
                      </p>
                      <p className="text-white font-medium">
                        {payout.bankingDetails.bankName}
                      </p>
                    </div>
                    <div>
                      <p
                        className="text-xs"
                        style={{ color: "var(--muted-foreground)" }}
                      >
                        Account Holder
                      </p>
                      <p className="text-white font-medium">
                        {payout.bankingDetails.accountHolder}
                      </p>
                    </div>
                    <div>
                      <p
                        className="text-xs"
                        style={{ color: "var(--muted-foreground)" }}
                      >
                        Account Number
                      </p>
                      <p className="text-white font-medium">
                        {payout.bankingDetails.accountNumber}
                      </p>
                    </div>
                    <div>
                      <p
                        className="text-xs"
                        style={{ color: "var(--muted-foreground)" }}
                      >
                        Branch Code
                      </p>
                      <p className="text-white font-medium">
                        {payout.bankingDetails.branchCode}
                      </p>
                    </div>
                    <div>
                      <p
                        className="text-xs"
                        style={{ color: "var(--muted-foreground)" }}
                      >
                        Account Type
                      </p>
                      <p className="text-white font-medium">
                        {payout.bankingDetails.accountType}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  className="mt-4 pt-4 text-sm"
                  style={{
                    borderTop: "1px solid var(--border)",
                    color: "#ef4444",
                  }}
                >
                  ⚠ No banking details on file
                </div>
              )}

              <Button
                onClick={() => handlePayout(payout.driverId)}
                disabled={paying === payout.driverId || !payout.bankingDetails}
                className="mt-4 w-full font-semibold text-white"
                style={{ background: "var(--gold)" }}
              >
                {paying === payout.driverId ? (
                  <Loader2 size={16} className="animate-spin mr-2" />
                ) : (
                  <DollarSign size={16} className="mr-2" />
                )}
                Mark R{payout.totalOwed.toFixed(2)} as Paid
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}