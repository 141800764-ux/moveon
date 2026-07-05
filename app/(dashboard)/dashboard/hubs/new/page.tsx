"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

export default function NewHubPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    code: "",
    type: "DEPOT",
    address: "",
    city: "",
    latitude: "",
    longitude: "",
  });

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/hubs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || "Failed to add hub");
        return;
      }

      toast.success("Hub added successfully!");
      router.push("/dashboard/hubs");
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
        <Link href="/dashboard/hubs">
          <button
            className="p-2 rounded-xl transition hover:bg-white/5"
            style={{ color: "var(--muted-foreground)" }}
          >
            <ArrowLeft size={20} />
          </button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-white">Add Hub</h1>
          <p className="mt-1" style={{ color: "var(--muted-foreground)" }}>
            Register a new depot or warehouse
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Hub Info */}
        <div
          className="rounded-2xl p-6 space-y-4"
          style={{ background: "var(--card)", border: "1px solid var(--border)" }}
        >
          <h2 className="text-lg font-semibold text-white">Hub Information</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-white">Hub Name *</Label>
              <Input
                placeholder="Cape Town Depot"
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                required
                style={inputStyle}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-white">Hub Code *</Label>
              <Input
                placeholder="CPT-001"
                value={form.code}
                onChange={(e) => update("code", e.target.value.toUpperCase())}
                required
                style={inputStyle}
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-white">Type *</Label>
              <Select
                value={form.type}
                onValueChange={(v) => update("type", v)}
              >
                <SelectTrigger style={inputStyle}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DEPOT">Depot</SelectItem>
                  <SelectItem value="WAREHOUSE">Warehouse</SelectItem>
                  <SelectItem value="SORTING_CENTER">Sorting Center</SelectItem>
                  <SelectItem value="PICKUP_POINT">Pickup Point</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Location */}
        <div
          className="rounded-2xl p-6 space-y-4"
          style={{ background: "var(--card)", border: "1px solid var(--border)" }}
        >
          <h2 className="text-lg font-semibold text-white">Location</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-white">Street Address *</Label>
              <Input
                placeholder="123 Industrial Road"
                value={form.address}
                onChange={(e) => update("address", e.target.value)}
                required
                style={inputStyle}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-white">City *</Label>
              <Input
                placeholder="Cape Town"
                value={form.city}
                onChange={(e) => update("city", e.target.value)}
                required
                style={inputStyle}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-white">Latitude</Label>
              <Input
                type="number"
                step="any"
                placeholder="-33.9249"
                value={form.latitude}
                onChange={(e) => update("latitude", e.target.value)}
                style={inputStyle}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-white">Longitude</Label>
              <Input
                type="number"
                step="any"
                placeholder="18.4241"
                value={form.longitude}
                onChange={(e) => update("longitude", e.target.value)}
                style={inputStyle}
              />
            </div>
            <p
  className="text-xs sm:col-span-2"
  style={{ color: "var(--muted-foreground)" }}
>
  Tip: Find coordinates at latlong.net
</p>
          </div>
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full h-12 font-semibold text-white text-base"
          style={{ background: "var(--gold)" }}
        >
          {loading && <Loader2 size={18} className="animate-spin mr-2" />}
          Add Hub
        </Button>
      </form>
    </div>
  );
}