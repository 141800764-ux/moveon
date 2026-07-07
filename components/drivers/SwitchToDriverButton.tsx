"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function SwitchToDriverButton() {
  const router = useRouter();
  const { update } = useSession();
  const [loading, setLoading] = useState(false);

  async function handleSwitch() {
    setLoading(true);
    try {
      const res = await fetch("/api/user/switch-role", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: "DRIVER" }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message || "Couldn't switch role");
        return;
      }

      await update({ role: "DRIVER" });
      router.push("/dashboard/driver");
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      onClick={handleSwitch}
      disabled={loading}
      className="font-semibold text-white"
      style={{ background: "var(--gold)" }}
    >
      {loading && <Loader2 size={16} className="animate-spin mr-2" />}
      Switch to Driver Mode
    </Button>
  );
}