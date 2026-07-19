"use client";

import { useEffect, useState } from "react";
import { Package, MapPin, DollarSign, Loader2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function AvailableOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 30000);
    return () => clearInterval(interval);
  }, []);

  async function fetchOrders() {
    try {
      const res = await fetch("/api/orders/available");
      const data = await res.json();
      if (data.success) setOrders(data.orders);
    } catch {
      console.error("Failed to fetch orders");
    } finally {
      setLoading(false);
    }
  }

  async function acceptOrder(orderId: string) {
    setAccepting(orderId);
    try {
      const res = await fetch(`/api/orders/${orderId}/bid`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message || "Failed to accept order");
        return;
      }
      toast.success("Order accepted! Check your route.");
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
    } catch {
      toast.error("Something went wrong");
    } finally {
      setAccepting(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={32} className="animate-spin" style={{ color: "var(--gold)" }} />
      </div>
    );
  }

  return (
    <div className="space-y-6 py-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Available Orders</h1>
        <p className="mt-1 text-sm" style={{ color: "var(--muted-foreground)" }}>
          Accept orders to start earning · Refreshes every 30 seconds
        </p>
      </div>

      {orders.length === 0 ? (
        <div className="rounded-2xl p-12 text-center" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <Package size={48} className="mx-auto mb-4" style={{ color: "var(--gold)" }} />
          <p className="text-white font-semibold">No orders available right now</p>
          <p className="text-sm mt-1" style={{ color: "var(--muted-foreground)" }}>Check back soon</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const origin = order.origin as any;
            const destination = order.destination as any;
            return (
              <div key={order.id} className="rounded-2xl p-5 space-y-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-mono text-sm font-semibold" style={{ color: "var(--gold)" }}>{order.trackingNumber}</p>
                    <p className="text-white font-medium mt-1">To: {order.recipientName}</p>
                  </div>
                  {order.driverPayout && (
                    <div className="text-right">
                      <p className="text-2xl font-bold" style={{ color: "var(--gold)" }}>
                        R{Number(order.driverPayout).toFixed(2)}
                      </p>
                      <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>your earnings</p>
                    </div>
                  )}
                </div>

                <div className="flex gap-3">
                  <div className="flex flex-col items-center pt-1">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: "var(--gold)" }} />
                    <div className="w-0.5 flex-1 my-1" style={{ background: "var(--border)" }} />
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#ef4444" }} />
                  </div>
                  <div className="flex-1 space-y-3">
                    <div>
                      <p className="text-xs uppercase font-semibold" style={{ color: "var(--muted-foreground)" }}>Pickup</p>
                      <p className="text-white text-sm">{origin?.address}</p>
                      <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>{origin?.city}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase font-semibold" style={{ color: "var(--muted-foreground)" }}>Delivery</p>
                      <p className="text-white text-sm">{destination?.address}</p>
                      <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>{destination?.city}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm pt-2" style={{ borderTop: "1px solid var(--border)" }}>
                  <div className="flex items-center gap-4">
                    {order.distanceKm && (
                      <span style={{ color: "var(--muted-foreground)" }}>{order.distanceKm} km</span>
                    )}
                    <span style={{ color: "var(--muted-foreground)" }}>{order.serviceLevel}</span>
                  </div>
                  <Button
                    onClick={() => acceptOrder(order.id)}
                    disabled={accepting === order.id}
                    className="font-semibold text-white"
                    style={{ background: "#10b981" }}
                  >
                    {accepting === order.id ? (
                      <Loader2 size={16} className="animate-spin mr-2" />
                    ) : (
                      <CheckCircle size={16} className="mr-2" />
                    )}
                    Accept Order
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}