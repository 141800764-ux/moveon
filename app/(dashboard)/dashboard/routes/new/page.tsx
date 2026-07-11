"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, Plus, Trash2, Package, CheckCircle } from "lucide-react";
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

type Shipment = {
  id: string;
  trackingNumber: string;
  order: {
    recipientName: string;
    recipientPhone: string;
    destination: { address: string; city: string };
    origin: { address: string; city: string };
  };
};

type Stop = {
  type: string;
  address: string;
  city: string;
  contactName: string;
  contactPhone: string;
  sequence: number;
  shipmentId?: string;
  trackingNumber?: string;
};

export default function NewRoutePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [hubs, setHubs] = useState<any[]>([]);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [selectedShipments, setSelectedShipments] = useState<string[]>([]);
  const [form, setForm] = useState({
    hubId: "",
    driverId: "",
    vehicleId: "",
    date: new Date().toISOString().split("T")[0],
    plannedStartAt: "",
    plannedEndAt: "",
  });
  const [stops, setStops] = useState<Stop[]>([]);

  useEffect(() => {
    Promise.all([
      fetch("/api/drivers").then((r) => r.json()),
      fetch("/api/vehicles").then((r) => r.json()),
      fetch("/api/hubs").then((r) => r.json()),
      fetch("/api/shipments/unassigned").then((r) => r.json()),
    ]).then(([d, v, h, s]) => {
      setDrivers(d.drivers || []);
      setVehicles(v.vehicles || []);
      setHubs(h.hubs || []);
      setShipments(s.shipments || []);
    });
  }, []);

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function toggleShipment(shipment: Shipment) {
    const isSelected = selectedShipments.includes(shipment.id);

    if (isSelected) {
      setSelectedShipments((prev) => prev.filter((id) => id !== shipment.id));
      setStops((prev) =>
        prev
          .filter((s) => s.shipmentId !== shipment.id)
          .map((s, i) => ({ ...s, sequence: i + 1 }))
      );
    } else {
      setSelectedShipments((prev) => [...prev, shipment.id]);
      const destination = shipment.order.destination;
      setStops((prev) => [
        ...prev,
        {
          type: "DELIVERY",
          address: destination.address,
          city: destination.city,
          contactName: shipment.order.recipientName,
          contactPhone: shipment.order.recipientPhone,
          sequence: prev.length + 1,
          shipmentId: shipment.id,
          trackingNumber: shipment.trackingNumber,
        },
      ]);
    }
  }

  function addManualStop() {
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

  function updateStop(index: number, field: string, value: string) {
    setStops((prev) =>
      prev.map((s, i) => (i === index ? { ...s, [field]: value } : s))
    );
  }

  function removeStop(index: number) {
    const stop = stops[index];
    if (stop.shipmentId) {
      setSelectedShipments((prev) =>
        prev.filter((id) => id !== stop.shipmentId)
      );
    }
    setStops((prev) =>
      prev
        .filter((_, i) => i !== index)
        .map((s, i) => ({ ...s, sequence: i + 1 }))
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!form.hubId) {
      toast.error("Please select a hub");
      return;
    }

    if (stops.length === 0) {
      toast.error("Please add at least one stop");
      return;
    }

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
            Assign shipments to a driver route
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
              <Select value={form.hubId} onValueChange={(v) => update("hubId", v)}>
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
              <Select value={form.driverId} onValueChange={(v) => update("driverId", v)}>
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
              <Select value={form.vehicleId} onValueChange={(v) => update("vehicleId", v)}>
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

        {/* Assign Shipments */}
        <div
          className="rounded-2xl p-6 space-y-4"
          style={{ background: "var(--card)", border: "1px solid var(--border)" }}
        >
          <div>
            <h2 className="text-lg font-semibold text-white">
              Assign Shipments
            </h2>
            <p className="text-sm mt-1" style={{ color: "var(--muted-foreground)" }}>
              Select confirmed shipments to add to this route
            </p>
          </div>

          {shipments.length === 0 ? (
            <div
              className="rounded-xl p-6 text-center"
              style={{ background: "var(--background)" }}
            >
              <Package
                size={32}
                className="mx-auto mb-2"
                style={{ color: "var(--muted-foreground)" }}
              />
              <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
                No unassigned shipments available. Confirm some orders first.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {shipments.map((shipment) => {
                const isSelected = selectedShipments.includes(shipment.id);
                const destination = shipment.order.destination;
                return (
                  <button
                    key={shipment.id}
                    type="button"
                    onClick={() => toggleShipment(shipment)}
                    className="w-full text-left rounded-xl p-4 transition"
                    style={{
                      background: isSelected
                        ? "rgba(200,146,42,0.1)"
                        : "var(--background)",
                      border: isSelected
                        ? "1px solid rgba(200,146,42,0.4)"
                        : "1px solid var(--border)",
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center"
                          style={{
                            background: isSelected
                              ? "rgba(200,146,42,0.2)"
                              : "var(--muted)",
                          }}
                        >
                          {isSelected ? (
                            <CheckCircle
                              size={16}
                              style={{ color: "var(--gold)" }}
                            />
                          ) : (
                            <Package
                              size={16}
                              style={{ color: "var(--muted-foreground)" }}
                            />
                          )}
                        </div>
                        <div>
                          <p
                            className="font-mono text-sm font-semibold"
                            style={{ color: "var(--gold)" }}
                          >
                            {shipment.trackingNumber}
                          </p>
                          <p className="text-white text-sm">
                            {shipment.order.recipientName}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p
                          className="text-sm"
                          style={{ color: "var(--muted-foreground)" }}
                        >
                          {destination.address}
                        </p>
                        <p
                          className="text-xs"
                          style={{ color: "var(--muted-foreground)" }}
                        >
                          {destination.city}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Stops */}
        <div
          className="rounded-2xl p-6 space-y-4"
          style={{ background: "var(--card)", border: "1px solid var(--border)" }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">
                Stops ({stops.length})
              </h2>
              <p className="text-sm mt-0.5" style={{ color: "var(--muted-foreground)" }}>
                Shipment stops are added automatically above
              </p>
            </div>
            <Button
              type="button"
              onClick={addManualStop}
              className="text-sm font-semibold text-white"
              style={{ background: "var(--gold)" }}
            >
              <Plus size={16} className="mr-1" />
              Manual Stop
            </Button>
          </div>

          {stops.length === 0 ? (
            <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
              Select shipments above or add a manual stop.
            </p>
          ) : (
            <div className="space-y-3">
              {stops.map((stop, index) => (
                <div
                  key={index}
                  className="rounded-xl p-4 space-y-3"
                  style={{
                    background: "var(--background)",
                    border: stop.shipmentId
                      ? "1px solid rgba(200,146,42,0.3)"
                      : "1px solid var(--border)",
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className="text-sm font-semibold"
                        style={{ color: "var(--gold)" }}
                      >
                        Stop {stop.sequence}
                      </span>
                      {stop.trackingNumber && (
                        <span
                          className="text-xs font-mono px-2 py-0.5 rounded-full"
                          style={{
                            background: "rgba(200,146,42,0.1)",
                            color: "var(--gold)",
                          }}
                        >
                          {stop.trackingNumber}
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeStop(index)}
                      className="p-1 rounded-lg hover:bg-red-500/10 transition"
                      style={{ color: "#ef4444" }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  {stop.shipmentId ? (
                    // Shipment stop — show read-only info
                    <div className="space-y-1">
                      <p className="text-white text-sm font-medium">
                        {stop.contactName}
                      </p>
                      <p
                        className="text-sm"
                        style={{ color: "var(--muted-foreground)" }}
                      >
                        {stop.address}, {stop.city}
                      </p>
                      <p
                        className="text-sm"
                        style={{ color: "var(--muted-foreground)" }}
                      >
                        {stop.contactPhone}
                      </p>
                    </div>
                  ) : (
                    // Manual stop — editable
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
                          onChange={(e) => updateStop(index, "contactName", e.target.value)}
                          style={inputStyle}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-white text-sm">Address *</Label>
                        <Input
                          placeholder="123 Main Street"
                          value={stop.address}
                          onChange={(e) => updateStop(index, "address", e.target.value)}
                          style={inputStyle}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-white text-sm">City *</Label>
                        <Input
                          placeholder="Cape Town"
                          value={stop.city}
                          onChange={(e) => updateStop(index, "city", e.target.value)}
                          style={inputStyle}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-white text-sm">Contact Phone</Label>
                        <Input
                          placeholder="+27 82 000 0000"
                          value={stop.contactPhone}
                          onChange={(e) => updateStop(index, "contactPhone", e.target.value)}
                          style={inputStyle}
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
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