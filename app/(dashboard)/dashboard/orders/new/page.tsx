"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

export default function NewOrderPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    recipientName: "",
    recipientPhone: "",
    recipientEmail: "",
    originAddress: "",
    originCity: "",
    destinationAddress: "",
    destinationCity: "",
    weightKg: "",
    serviceLevel: "STANDARD",
    notes: "",
    declaredValue: "",
  });

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || "Failed to create order");
        return;
      }

      toast.success("Order created successfully!");
      router.push("/dashboard/orders");
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
    <div className="max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/orders">
          <button
            className="p-2 rounded-xl transition hover:bg-white/5"
            style={{ color: "var(--muted-foreground)" }}
          >
            <ArrowLeft size={20} />
          </button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-white">New Order</h1>
          <p className="mt-1" style={{ color: "var(--muted-foreground)" }}>
            Fill in the details to create a new delivery order
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Recipient */}
        <div
          className="rounded-2xl p-6 space-y-4"
          style={{ background: "var(--card)", border: "1px solid var(--border)" }}
        >
          <h2 className="text-lg font-semibold text-white">Recipient Details</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-white">Full Name *</Label>
              <Input
                placeholder="John Doe"
                value={form.recipientName}
                onChange={(e) => update("recipientName", e.target.value)}
                required
                style={inputStyle}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-white">Phone *</Label>
              <Input
                placeholder="+27 82 000 0000"
                value={form.recipientPhone}
                onChange={(e) => update("recipientPhone", e.target.value)}
                required
                style={inputStyle}
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-white">Email</Label>
              <Input
                type="email"
                placeholder="john@example.com"
                value={form.recipientEmail}
                onChange={(e) => update("recipientEmail", e.target.value)}
                style={inputStyle}
              />
            </div>
          </div>
        </div>

        {/* Origin */}
        <div
          className="rounded-2xl p-6 space-y-4"
          style={{ background: "var(--card)", border: "1px solid var(--border)" }}
        >
          <h2 className="text-lg font-semibold text-white">Pickup Address</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-white">Street Address *</Label>
              <Input
                placeholder="123 Main Street"
                value={form.originAddress}
                onChange={(e) => update("originAddress", e.target.value)}
                required
                style={inputStyle}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-white">City *</Label>
              <Input
                placeholder="Cape Town"
                value={form.originCity}
                onChange={(e) => update("originCity", e.target.value)}
                required
                style={inputStyle}
              />
            </div>
          </div>
        </div>

        {/* Destination */}
        <div
          className="rounded-2xl p-6 space-y-4"
          style={{ background: "var(--card)", border: "1px solid var(--border)" }}
        >
          <h2 className="text-lg font-semibold text-white">Delivery Address</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-white">Street Address *</Label>
              <Input
                placeholder="456 Oak Avenue"
                value={form.destinationAddress}
                onChange={(e) => update("destinationAddress", e.target.value)}
                required
                style={inputStyle}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-white">City *</Label>
              <Input
                placeholder="Johannesburg"
                value={form.destinationCity}
                onChange={(e) => update("destinationCity", e.target.value)}
                required
                style={inputStyle}
              />
            </div>
          </div>
        </div>

        {/* Package Details */}
        <div
          className="rounded-2xl p-6 space-y-4"
          style={{ background: "var(--card)", border: "1px solid var(--border)" }}
        >
          <h2 className="text-lg font-semibold text-white">Package Details</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label className="text-white">Weight (kg)</Label>
              <Input
                type="number"
                placeholder="1.5"
                value={form.weightKg}
                onChange={(e) => update("weightKg", e.target.value)}
                style={inputStyle}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-white">Declared Value (R)</Label>
              <Input
                type="number"
                placeholder="500"
                value={form.declaredValue}
                onChange={(e) => update("declaredValue", e.target.value)}
                style={inputStyle}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-white">Service Level</Label>
              <Select
                value={form.serviceLevel}
                onValueChange={(v) => update("serviceLevel", v)}
              >
                <SelectTrigger style={inputStyle}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ECONOMY">Economy</SelectItem>
                  <SelectItem value="STANDARD">Standard</SelectItem>
                  <SelectItem value="EXPRESS">Express</SelectItem>
                  <SelectItem value="SAME_DAY">Same Day</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 sm:col-span-3">
              <Label className="text-white">Notes</Label>
              <Textarea
                placeholder="Any special instructions..."
                value={form.notes}
                onChange={(e) => update("notes", e.target.value)}
                style={inputStyle}
                rows={3}
              />
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
          Create Order
        </Button>
      </form>
    </div>
  );
}