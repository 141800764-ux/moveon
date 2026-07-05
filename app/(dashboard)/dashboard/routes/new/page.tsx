"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, Plus, Trash2 } from "lucide-react";
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

export default function NewRoutePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [hubs, setHubs] = useState<any[]>([]);
  const [form, setForm] = useState({
    hubId: "",
    driverId: "",
    vehicleId: "",
    date: new Date().toISOString().split("T")[0],
    plannedStartAt: "",
    plannedEndAt: "",
  });
  const [stops, setStops] = useState([
    {
      type: "PICKUP",
      address: "",
      city: "",
      contactName: "",
      contactPhone: "",
      sequence: 1,
    },
  ]);

  useEffect(() => {
    Promise.all([
      fetch("/api/drivers").then((r) => r.json()),
      fetch("/api/vehicles").then((r) => r.json()),
      fetch("/api/hubs").then((r) => r.json()),
    ]).then(([d, v, h]) => {
      setDrivers(d.drivers || []);
      setVehicles(v.vehicles || []);
      setHubs(h.hubs || []);
    });
  }, []);

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function updateStop(index: number, field: string, value: string) {
    setStops((prev) =>
      prev.map((s, i) => (i === index ? { ...s, [field]: value } : s))
    );
  }

  function addStop() {
    setStops((prev) => [
      ...prev,
      {
        type: "DELIVERY",
        address: "",
        city: "",
        contactName: "",
        contactPhone: "",
        sequence: prev.length + 1,
      },
    ]);
  }

  function removeStop(index: number) {
    setStops((prev) =>
      prev
        .filter((_, i) => i !== index)
        .map((s, i) => ({ ...s, sequence: i + 1 }))
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/routes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, stops }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || "Failed to create route");
        return;
      }

      toast.success("Route created successfully!");
      router.push("/dashboard/routes");
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
      <div className="flex items-center gap-4">
        <Link href="/dashboard/routes">
          <button
            className="p-2 rounded-xl transition hover:bg-white/5"
            style={{ color: "var(--muted-foreground)" }}
          >
            <ArrowLeft size={20} />
          </button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-white">New Route</h1>
          <p className="mt-1" style={{ color: "var(--muted-foreground)" }}>
            Plan a delivery route for a driver
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Route Details */}
        <div
          className="rounded-2xl p-6 space-y-4"
          style={{ background: "var(--card)", border: "1px solid var(--border)" }}
        >
          <h2 className="text-lg font-semibold text-white">Route Details</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-white">Hub *</Label>
              <Select
                value={form.hubId}
                onValueChange={(v) => update("hubId", v)}
              >
                <SelectTrigger style={inputStyle}>
                  <SelectValue placeholder="Select hub" />
                </SelectTrigger>
                <SelectContent>
                  {hubs.map((h) => (
                    <SelectItem key={h.id} value={h.id}>
                      {h.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-white">Date *</Label>
              <Input
                type="date"
                value={form.date}
                onChange={(e) => update("date", e.target.value)}
                required
                style={inputStyle}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-white">Driver</Label>
              <Select
                value={form.driverId}
                onValueChange={(v) => update("driverId", v)}
              >
                <SelectTrigger style={inputStyle}>
                  <SelectValue placeholder="Select driver" />
                </SelectTrigger>
                <SelectContent>
                  {drivers.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-white">Vehicle</Label>
              <Select
                value={form.vehicleId}
                onValueChange={(v) => update("vehicleId", v)}
              >
                <SelectTrigger style={inputStyle}>
                  <SelectValue placeholder="Select vehicle" />
                </SelectTrigger>
                <SelectContent>
                  {vehicles.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.make} {v.model} · {v.registration}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-white">Planned Start</Label>
              <Input
                type="time"
                value={form.plannedStartAt}
                onChange={(e) => update("plannedStartAt", e.target.value)}
                style={inputStyle}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-white">Planned End</Label>
              <Input
                type="time"
                value={form.plannedEndAt}
                onChange={(e) => update("plannedEndAt", e.target.value)}
                style={inputStyle}
              />
            </div>
          </div>
        </div>

        {/* Stops */}
        <div
          className="rounded-2xl p-6 space-y-4"
          style={{ background: "var(--card)", border: "1px solid var(--border)" }}
        >
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">
              Stops ({stops.length})
            </h2>
            <Button
              type="button"
              onClick={addStop}
              className="text-sm font-semibold text-white"
              style={{ background: "var(--gold)" }}
            >
              <Plus size={16} className="mr-1" />
              Add Stop
            </Button>
          </div>

          <div className="space-y-4">
            {stops.map((stop, index) => (
              <div
                key={index}
                className="rounded-xl p-4 space-y-3"
                style={{
                  background: "var(--background)",
                  border: "1px solid var(--border)",
                }}
              >
                <div className="flex items-center justify-between">
                  <span
                    className="text-sm font-semibold"
                    style={{ color: "var(--gold)" }}
                  >
                    Stop {stop.sequence}
                  </span>
                  {stops.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeStop(index)}
                      className="p-1 rounded-lg hover:bg-red-500/10 transition"
                      style={{ color: "#ef4444" }}
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-white text-sm">Type</Label>
                    <Select
                      value={stop.type}
                      onValueChange={(v) => updateStop(index, "type", v)}
                    >
                      <SelectTrigger style={inputStyle}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PICKUP">Pickup</SelectItem>
                        <SelectItem value="DELIVERY">Delivery</SelectItem>
                        <SelectItem value="HUB">Hub</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-white text-sm">Contact Name</Label>
                    <Input
                      placeholder="John Doe"
                      value={stop.contactName}
                      onChange={(e) =>
                        updateStop(index, "contactName", e.target.value)
                      }
                      style={inputStyle}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-white text-sm">Address *</Label>
                    <Input
                      placeholder="123 Main Street"
                      value={stop.address}
                      onChange={(e) =>
                        updateStop(index, "address", e.target.value)
                      }
                      required
                      style={inputStyle}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-white text-sm">City *</Label>
                    <Input
                      placeholder="Cape Town"
                      value={stop.city}
                      onChange={(e) =>
                        updateStop(index, "city", e.target.value)
                      }
                      required
                      style={inputStyle}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-white text-sm">Contact Phone</Label>
                    <Input
                      placeholder="+27 82 000 0000"
                      value={stop.contactPhone}
                      onChange={(e) =>
                        updateStop(index, "contactPhone", e.target.value)
                      }
                      style={inputStyle}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full h-12 font-semibold text-white text-base"
          style={{ background: "var(--gold)" }}
        >
          {loading && <Loader2 size={18} className="animate-spin mr-2" />}
          Create Route
        </Button>
      </form>
    </div>
  );
}