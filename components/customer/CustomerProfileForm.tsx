"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function CustomerProfileForm({ user }: { user: any }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: user?.name || "",
    phone: user?.customerProfile?.phone || "",
    city: user?.customerProfile?.city || "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/customer/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        toast.error("Failed to update profile");
        return;
      }

      toast.success("Profile updated!");
      router.refresh();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  const inputStyle = {
    background: "var(--input)",
    border: "1px solid var(--border)",
    color: "var(--foreground)",
  };

  return (
    <div
      className="rounded-2xl p-6 space-y-4"
      style={{ background: "var(--card)", border: "1px solid var(--border)" }}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label className="text-white">Full Name</Label>
          <Input
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            style={inputStyle}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-white">Email</Label>
          <Input
            value={user?.email || ""}
            disabled
            style={{ ...inputStyle, opacity: 0.5 }}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-white">Phone</Label>
          <Input
            value={form.phone}
            onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
            placeholder="+27 82 000 0000"
            style={inputStyle}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-white">City</Label>
          <Input
            value={form.city}
            onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))}
            placeholder="Cape Town"
            style={inputStyle}
          />
        </div>
        <Button
          type="submit"
          disabled={loading}
          className="font-semibold text-white"
          style={{ background: "var(--gold)" }}
        >
          {loading && <Loader2 size={16} className="animate-spin mr-2" />}
          Save Changes
        </Button>
      </form>
    </div>
  );
}