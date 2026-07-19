"use client";

import { useState } from "react";
import { Bot, Loader2, AlertTriangle, CheckCircle, Phone, RotateCcw, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type Recommendation = {
  action: string;
  reason: string;
  customerMessage: string;
  priority: string;
  notes: string;
};

const ACTION_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  RETRY_TOMORROW: { label: "Retry Tomorrow", color: "#c8922a", icon: RotateCcw },
  RETURN_TO_SENDER: { label: "Return to Sender", color: "#ef4444", icon: Package },
  CONTACT_CUSTOMER: { label: "Contact Customer", color: "#3b82f6", icon: Phone },
  HOLD_AT_HUB: { label: "Hold at Hub", color: "#a855f7", icon: Package },
};

const PRIORITY_COLORS: Record<string, string> = {
  LOW: "#10b981",
  MEDIUM: "#eab308",
  HIGH: "#ef4444",
};

export default function AIDispatcher({
  stopId,
  failureReason,
  onClose,
}: {
  stopId: string;
  failureReason?: string;
  onClose?: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);

  async function getRecommendation() {
    setLoading(true);
    try {
      const res = await fetch("/api/ai/dispatcher", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stopId, failureReason }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error("Failed to get AI recommendation");
        return;
      }

      setRecommendation(data.recommendation);
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  const config = recommendation
    ? ACTION_CONFIG[recommendation.action] ?? ACTION_CONFIG.RETRY_TOMORROW
    : null;

  return (
    <div
      className="rounded-2xl p-5 space-y-4"
      style={{ background: "var(--card)", border: "1px solid var(--border)" }}
    >
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: "rgba(200,146,42,0.1)" }}
        >
          <Bot size={20} style={{ color: "var(--gold)" }} />
        </div>
        <div>
          <h3 className="font-semibold text-white">AI Dispatcher</h3>
          <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
            Get an AI recommendation for this failed delivery
          </p>
        </div>
      </div>

      {!recommendation ? (
        <Button
          onClick={getRecommendation}
          disabled={loading}
          className="w-full font-semibold text-white"
          style={{ background: "var(--gold)" }}
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin mr-2" />
              Analysing...
            </>
          ) : (
            <>
              <Bot size={16} className="mr-2" />
              Get AI Recommendation
            </>
          )}
        </Button>
      ) : (
        <div className="space-y-3">
          {/* Action */}
          <div
            className="rounded-xl p-4 flex items-center gap-3"
            style={{
              background: `${config?.color}15`,
              border: `1px solid ${config?.color}40`,
            }}
          >
            {config?.icon && (
              <config.icon size={20} style={{ color: config.color }} />
            )}
            <div>
              <p
                className="font-bold text-sm"
                style={{ color: config?.color }}
              >
                {config?.label}
              </p>
              <p
                className="text-xs mt-0.5"
                style={{ color: "var(--muted-foreground)" }}
              >
                {recommendation.reason}
              </p>
            </div>
            <span
              className="ml-auto text-xs font-semibold px-2 py-0.5 rounded-full"
              style={{
                background: `${PRIORITY_COLORS[recommendation.priority]}20`,
                color: PRIORITY_COLORS[recommendation.priority],
              }}
            >
              {recommendation.priority}
            </span>
          </div>

          {/* Customer message */}
          <div
            className="rounded-xl p-3"
            style={{ background: "var(--background)" }}
          >
            <p
              className="text-xs font-semibold uppercase mb-1"
              style={{ color: "var(--muted-foreground)" }}
            >
              Customer SMS
            </p>
            <p className="text-sm text-white">{recommendation.customerMessage}</p>
          </div>

          {/* Internal notes */}
          <div
            className="rounded-xl p-3"
            style={{ background: "var(--background)" }}
          >
            <p
              className="text-xs font-semibold uppercase mb-1"
              style={{ color: "var(--muted-foreground)" }}
            >
              Internal Notes
            </p>
            <p
              className="text-sm"
              style={{ color: "var(--muted-foreground)" }}
            >
              {recommendation.notes}
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={() => {
                toast.success("Action applied!");
                onClose?.();
              }}
              className="flex-1 font-semibold text-white"
              style={{ background: config?.color }}
            >
              <CheckCircle size={16} className="mr-2" />
              Apply
            </Button>
            <Button
              onClick={() => setRecommendation(null)}
              className="px-4"
              style={{
                background: "var(--input)",
                border: "1px solid var(--border)",
                color: "var(--muted-foreground)",
              }}
            >
              Retry
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}