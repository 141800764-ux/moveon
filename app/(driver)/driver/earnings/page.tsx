"use client";

import { useEffect, useState } from "react";
import { DollarSign, TrendingUp, Clock, CheckCircle } from "lucide-react";

export default function DriverEarningsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/driver/earnings")
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div
          className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: "var(--gold)", borderTopColor: "transparent" }}
        />
      </div>
    );
  }

  const weekStart = data?.weekStart
    ? new Date(data.weekStart).toLocaleDateString("en-ZA", {
        day: "numeric",
        month: "short",
      })
    : "";
  const weekEnd = data?.weekEnd
    ? new Date(data.weekEnd).toLocaleDateString("en-ZA", {
        day: "numeric",
        month: "short",
      })
    : "";

  return (
    <div className="space-y-6 py-8">
      <div>
        <h1 className="text-2xl font-bold text-white">My Earnings</h1>
        <p className="mt-1 text-sm" style={{ color: "var(--muted-foreground)" }}>
          Week: {weekStart} — {weekEnd} · Resets every Sunday
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div
          className="rounded-2xl p-5"
          style={{ background: "var(--card)", border: "1px solid var(--border)" }}
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
            style={{ background: "rgba(200,146,42,0.1)" }}
          >
            <DollarSign size={20} style={{ color: "var(--gold)" }} />
          </div>
          <p className="text-2xl font-bold" style={{ color: "var(--gold)" }}>
            R{data?.weekTotal?.toFixed(2) ?? "0.00"}
          </p>
          <p className="text-sm mt-0.5" style={{ color: "var(--muted-foreground)" }}>
            This Week
          </p>
        </div>
        <div
          className="rounded-2xl p-5"
          style={{ background: "var(--card)", border: "1px solid var(--border)" }}
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
            style={{ background: "rgba(239,68,68,0.1)" }}
          >
            <Clock size={20} style={{ color: "#ef4444" }} />
          </div>
          <p className="text-2xl font-bold text-white">
            R{data?.totalUnpaid?.toFixed(2) ?? "0.00"}
          </p>
          <p className="text-sm mt-0.5" style={{ color: "var(--muted-foreground)" }}>
            Awaiting Payout
          </p>
        </div>
        <div
          className="rounded-2xl p-5 col-span-2"
          style={{ background: "var(--card)", border: "1px solid var(--border)" }}
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
            style={{ background: "rgba(16,185,129,0.1)" }}
          >
            <CheckCircle size={20} style={{ color: "#10b981" }} />
          </div>
          <p className="text-2xl font-bold text-white">
            R{data?.allTimePaid?.toFixed(2) ?? "0.00"}
          </p>
          <p className="text-sm mt-0.5" style={{ color: "var(--muted-foreground)" }}>
            Total Paid Out
          </p>
        </div>
      </div>

      {/* This week's deliveries */}
      <div
        className="rounded-2xl p-5"
        style={{ background: "var(--card)", border: "1px solid var(--border)" }}
      >
        <h2 className="font-semibold text-white mb-4">
          This Week's Deliveries ({data?.weekEarnings?.length ?? 0})
        </h2>
        {!data?.weekEarnings?.length ? (
          <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
            No deliveries yet this week.
          </p>
        ) : (
          <div className="space-y-3">
            {data.weekEarnings.map((earning: any) => {
              const destination = earning.order?.destination as any;
              return (
                <div
                  key={earning.id}
                  className="flex items-center justify-between py-3"
                  style={{ borderBottom: "1px solid var(--border)" }}
                >
                  <div>
                    <p className="text-white text-sm font-medium">
                      {earning.order?.recipientName}
                    </p>
                    <p
                      className="text-xs mt-0.5"
                      style={{ color: "var(--muted-foreground)" }}
                    >
                      {destination?.city} ·{" "}
                      {new Date(earning.createdAt).toLocaleDateString("en-ZA")}
                    </p>
                  </div>
                  <span
                    className="font-bold"
                    style={{ color: "var(--gold)" }}
                  >
                    R{Number(earning.amount).toFixed(2)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}