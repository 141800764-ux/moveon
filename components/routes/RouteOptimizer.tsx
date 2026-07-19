"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function RouteOptimizer({ routeId }: { routeId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleOptimize() {
    setLoading(true);
    try {
      const res = await fetch(`/api/routes/${routeId}/optimize`, {
        method: "POST",
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || "Failed to optimize route");
        return;
      }

      toast.success(
        `Route optimized! ${data.stopsReordered} stops reordered — ${data.totalDistanceKm}km total`
      );
      router.refresh();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      onClick={handleOptimize}
      disabled={loading}
      className="font-semibold text-white flex items-center gap-2"
      style={{ background: "rgba(200,146,42,0.2)", border: "1px solid rgba(200,146,42,0.4)", color: "var(--gold)" }}
    >
      {loading ? (
        <Loader2 size={16} className="animate-spin" />
      ) : (
        <Wand2 size={16} />
      )}
      {loading ? "Optimizing..." : "Optimize Route"}
    </Button>
  );
}