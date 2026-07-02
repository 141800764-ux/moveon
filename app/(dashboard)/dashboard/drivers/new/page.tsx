"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function NewDriverPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    email: "",
    password: "",
    licenseNumber: "",
    licenseExpiresAt: "",
    licenseClasses: "EB",
  });

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/drivers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          licenseClasses: form.licenseClasses.split(",").map((c) => c.trim()),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || "Failed to add driver");
        return;
      }

      toast.success("Driver added successfully!");
      router.push("/dashboard/drivers");
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
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/drivers">
          <button
            className="p-2 rounded-xl transition hover:bg-white/5"
            style={{ color: "var(--muted-foreground)" }}
          >
            <ArrowLeft size={20} />
          </button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-white">Add Driver</h1>
          <p className="mt-1" style={{ color: "var(--muted-foreground)" }}>
            Register a new driver to your fleet
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal Info */}
        <div
          className="rounded-2xl p-6 space-y-4"
          style={{ background: "var(--card)", border: "1px solid var(--border)" }}
        >
          <h2 className="text-lg font-semibold text-white">Personal Information</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-white">Full Name *</Label>
              <Input
                placeholder="John Doe"
                value={form.fullName}
                onChange={(e) => update("fullName", e.target.value)}
                required
                style={inputStyle}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-white">Phone *</Label>
              <Input
                placeholder="+27 82 000 0000"
                value={form.phone}
                onChange={(e) => update("phone", e.target.value)}
                required
                style={inputStyle}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-white">Email *</Label>
              <Input
                type="email"
                placeholder="driver@example.com"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                required
                style={inputStyle}
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-white">Password *</Label>
              <Input
                type="password"
                placeholder="Min 6 characters"
                value={form.password}
                onChange={(e) => update("password", e.target.value)}
                required
                minLength={6}
                style={inputStyle}
              />
            </div>
          </div>
        </div>

        {/* License Info */}
        <div
          className="rounded-2xl p-6 space-y-4"
          style={{ background: "var(--card)", border: "1px solid var(--border)" }}
        >
          <h2 className="text-lg font-semibold text-white">License Information</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-white">License Number *</Label>
              <Input
                placeholder="SA123456789"
                value={form.licenseNumber}
                onChange={(e) => update("licenseNumber", e.target.value)}
                required
                style={inputStyle}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-white">License Expiry *</Label>
              <Input
                type="date"
                value={form.licenseExpiresAt}
                onChange={(e) => update("licenseExpiresAt", e.target.value)}
                required
                style={inputStyle}
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-white">License Classes *</Label>
              <Input
                placeholder="EB, EC1, EC (comma separated)"
                value={form.licenseClasses}
                onChange={(e) => update("licenseClasses", e.target.value)}
                required
                style={inputStyle}
              />
              <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                Common classes: EB (light vehicles), EC1 (heavy vehicles), EC (articulated trucks)
              </p>
            </div>
          </div>
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full h-12 font-semibold text-white text-base"
          style={{ background: "var(--gold)" }}
        >
          {loading && <Loader2 size={18} className="animate-spin mr-2" />}
          Add Driver
        </Button>
      </form>
    </div>
  );
}