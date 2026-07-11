"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

const STATUSES = ["AVAILABLE", "ON_ROUTE", "SERVICING", "OUT_OF_SERVICE"];

export default function VehicleStatusUpdater({
  vehicleId,
  currentStatus,
}: {
  vehicleId: string;
  currentStatus: string;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [loading, setLoading] = useState(false);

  async function handleUpdate() {
    if (status === currentStatus) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/vehicles/${vehicleId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        toast.error("Failed to update status");
        return;
      }
      toast.success("Status updated!");
      router.refresh();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Select value={status} onValueChange={setStatus}>
        <SelectTrigger
          className="w-44"
          style={{
            background: "var(--input)",
            border: "1px solid var(--border)",
            color: "var(--foreground)",
          }}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {STATUSES.map((s) => (
            <SelectItem key={s} value={s}>
              {s.replace(/_/g, " ")}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        onClick={handleUpdate}
        disabled={loading || status === currentStatus}
        className="font-semibold text-white"
        style={{ background: "var(--gold)" }}
      >
        {loading && <Loader2 size={16} className="animate-spin mr-2" />}
        Update
      </Button>
    </div>
  );
}