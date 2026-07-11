"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, MapPin, Package } from "lucide-react";
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

type OrderOption = {
  id: string;
  trackingNumber: string;
  recipientName: string;
  recipientPhone: string;
  destination: { address?: string; city?: string };
  destinationLat: number | null;
  destinationLng: number | null;
  deliveryFee: number | null;
  status: string;
  shipments: { id: string }[];
};

export default function NewRoutePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [hubs, setHubs] = useState<any[]>([]);
  const [orders, setOrders] = useState<OrderOption[]>([]);
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [form, setForm] = useState({
    hubId: "",
    driverId: "",
    vehicleId: "",
    date: new Date().toISOString().split("T")[0],
    plannedStartAt: "",
    plannedEndAt: "",
  });

  useEffect(() => {
    Promise.all([
      fetch("/api/drivers").then((r) => r.json()),
      fetch("/api/vehicles").then((r) => r.json()),
      fetch("/api/hubs").then((r) => r.json()),
      fetch("/api/orders").then((r) => r.json()),
    ]).then(([d, v, h, o]) => {
      setDrivers(d.drivers || []);
      setVehicles(v.vehicles || []);
      setHubs(h.hubs || []);

      // Only show orders that are pending/confirmed and not already on a route (no shipment yet)
      const unassigned = (o.orders || []).filter(
        (order: OrderOption) =>
          (order.status === "PENDING" || order.status === "CONFIRMED") &&
          (!order.shipments || order.shipments.length === 0) &&
          order.destinationLat &&
          order.destinationLng
      );
      setOrders(unassigned);
    });
  }, []);

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function toggleOrder(orderId: string) {
    setSelectedOrderIds((prev) =>
      prev.includes(orderId)
        ? prev.filter((id) => id !== orderId)
        : [...prev, orderId]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (selectedOrderIds.length === 0) {
      toast.error("Select at least one order to build this route");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/routes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, orderIds: selectedOrderIds }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || "Failed to create route");
        return;
      }

      toast.success("Route created — stops sequenced automatically!");
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
            Select orders below — stops will be sequenced automatically for the shortest path
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

        {/* Orders checklist */}
        <div
          className="rounded-2xl p-6 space-y-4"
          style={{ background: "var(--card)", border: "1px solid var(--border)" }}
        >
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">
              Unassigned Orders ({orders.length})
            </h2>
            <span className="text-sm" style={{ color: "var(--gold)" }}>
              {selectedOrderIds.length} selected
            </span>
          </div>

          {orders.length === 0 ? (
            <div className="text-center py-8">
              <Package size={32} className="mx-auto mb-2" style={{ color: "var(--muted-foreground)" }} />
              <p style={{ color: "var(--muted-foreground)" }}>
                No unassigned orders right now.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {orders.map((order) => {
                const selected = selectedOrderIds.includes(order.id);
                return (
                  <button
                    key={order.id}
                    type="button"
                    onClick={() => toggleOrder(order.id)}
                    className="w-full flex items-center gap-3 p-4 rounded-xl text-left transition"
                    style={{
                      background: selected ? "rgba(200,146,42,0.1)" : "var(--background)",
                      border: selected
                        ? "1px solid rgba(200,146,42,0.4)"
                        : "1px solid var(--border)",
                    }}
                  >
                    <div
                      className="w-5 h-5 rounded-md flex items-center justify-center shrink-0"
                      style={{
                        background: selected ? "var(--gold)" : "transparent",
                        border: selected ? "none" : "1px solid var(--border)",
                      }}
                    >
                      {selected && (
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                          <path
                            d="M2 6L5 9L10 3"
                            stroke="white"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                    </div>

                    <MapPin size={16} style={{ color: "var(--muted-foreground)" }} className="shrink-0" />

                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium text-sm truncate">
                        {order.recipientName}
                      </p>
                      <p className="text-xs truncate" style={{ color: "var(--muted-foreground)" }}>
                        {order.destination?.address}, {order.destination?.city}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="font-mono text-xs" style={{ color: "var(--gold)" }}>
                        {order.trackingNumber}
                      </p>
                      {order.deliveryFee && (
                        <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                          R{order.deliveryFee}
                        </p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <Button
          type="submit"
          disabled={loading || selectedOrderIds.length === 0}
          className="w-full h-12 font-semibold text-white text-base"
          style={{ background: "var(--gold)" }}
        >
          {loading && <Loader2 size={18} className="animate-spin mr-2" />}
          {selectedOrderIds.length === 0
            ? "Select orders to build a route"
            : `Create Route with ${selectedOrderIds.length} Stop${selectedOrderIds.length > 1 ? "s" : ""}`}
        </Button>
      </form>
    </div>
  );
}