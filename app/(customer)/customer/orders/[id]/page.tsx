import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Package,
  MapPin,
  Phone,
  Mail,
  CheckCircle,
  Circle,
  Truck,
  Home,
} from "lucide-react";

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  PENDING: { bg: "rgba(234,179,8,0.1)", color: "#eab308" },
  CONFIRMED: { bg: "rgba(59,130,246,0.1)", color: "#3b82f6" },
  PICKED_UP: { bg: "rgba(168,85,247,0.1)", color: "#a855f7" },
  IN_TRANSIT: { bg: "rgba(200,146,42,0.1)", color: "#c8922a" },
  OUT_FOR_DELIVERY: { bg: "rgba(249,115,22,0.1)", color: "#f97316" },
  DELIVERED: { bg: "rgba(16,185,129,0.1)", color: "#10b981" },
  FAILED: { bg: "rgba(239,68,68,0.1)", color: "#ef4444" },
  CANCELLED: { bg: "rgba(107,114,128,0.1)", color: "#6b7280" },
  RETURNED: { bg: "rgba(239,68,68,0.1)", color: "#ef4444" },
};

const STATUS_STEPS = [
  { key: "PENDING", label: "Order Placed", icon: Package },
  { key: "IN_TRANSIT", label: "In Transit", icon: Truck },
  { key: "OUT_FOR_DELIVERY", label: "Out for Delivery", icon: MapPin },
  { key: "DELIVERED", label: "Delivered", icon: Home },
];

const STATUS_ORDER = [
  "PENDING",
  "CONFIRMED",
  "PICKED_UP",
  "IN_TRANSIT",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
];

export default async function CustomerOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();

  const customer = await prisma.customer.findUnique({
    where: { userId: session?.user?.id },
  });

  if (!customer) notFound();

  const order = await prisma.order.findUnique({
    where: { id, customerId: customer.id },
    include: {
      shipments: {
        include: {
          events: { orderBy: { createdAt: "desc" } },
        },
      },
    },
  });

  if (!order) notFound();

  const colors = STATUS_COLORS[order.status] ?? STATUS_COLORS.PENDING;
  const origin = order.origin as any;
  const destination = order.destination as any;
  const currentStep = STATUS_ORDER.indexOf(order.status);
  const shipment = order.shipments[0] ?? null;
  const isFailed =
    order.status === "FAILED" ||
    order.status === "CANCELLED" ||
    order.status === "RETURNED";

  return (
    <div className="space-y-6 py-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/customer/orders">
          <button
            className="p-2 rounded-xl transition hover:bg-white/5"
            style={{ color: "var(--muted-foreground)" }}
          >
            <ArrowLeft size={20} />
          </button>
        </Link>
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-white">Order Details</h1>
            <span
              className="text-xs font-semibold px-2.5 py-1 rounded-full"
              style={{ background: colors.bg, color: colors.color }}
            >
              {order.status.replace(/_/g, " ")}
            </span>
          </div>
          <p
            className="font-mono text-sm mt-0.5"
            style={{ color: "var(--gold)" }}
          >
            {order.trackingNumber}
          </p>
        </div>
      </div>

      {/* Progress tracker */}
      {!isFailed && (
        <div
          className="rounded-2xl p-5"
          style={{ background: "var(--card)", border: "1px solid var(--border)" }}
        >
          <h2 className="font-semibold text-white mb-5">Tracking</h2>
          <div className="flex items-start justify-between">
            {STATUS_STEPS.map((step, index) => {
              const done = STATUS_ORDER.indexOf(step.key) <= currentStep;
              const active = step.key === order.status ||
                (step.key === "PENDING" && currentStep <= 1);
              return (
                <div
                  key={step.key}
                  className="flex-1 flex flex-col items-center"
                >
                  <div className="relative flex items-center w-full">
                    {index > 0 && (
                      <div
                        className="flex-1 h-0.5"
                        style={{
                          background:
                            STATUS_ORDER.indexOf(step.key) <= currentStep
                              ? "var(--gold)"
                              : "var(--border)",
                        }}
                      />
                    )}
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                      style={{
                        background: done
                          ? "rgba(200,146,42,0.2)"
                          : "var(--muted)",
                        border: done
                          ? "2px solid var(--gold)"
                          : "2px solid var(--border)",
                      }}
                    >
                      <step.icon
                        size={16}
                        style={{
                          color: done
                            ? "var(--gold)"
                            : "var(--muted-foreground)",
                        }}
                      />
                    </div>
                    {index < STATUS_STEPS.length - 1 && (
                      <div
                        className="flex-1 h-0.5"
                        style={{
                          background:
                            STATUS_ORDER.indexOf(step.key) < currentStep
                              ? "var(--gold)"
                              : "var(--border)",
                        }}
                      />
                    )}
                  </div>
                  <p
                    className="text-xs mt-2 text-center px-1"
                    style={{
                      color: done ? "var(--gold)" : "var(--muted-foreground)",
                      fontWeight: active ? 600 : 400,
                    }}
                  >
                    {step.label}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Route */}
      <div
        className="rounded-2xl p-5"
        style={{ background: "var(--card)", border: "1px solid var(--border)" }}
      >
        <h2 className="font-semibold text-white mb-4">Route</h2>
        <div className="flex gap-4">
          <div className="flex flex-col items-center pt-1">
            <div
              className="w-3 h-3 rounded-full shrink-0"
              style={{ background: "var(--gold)" }}
            />
            <div
              className="w-0.5 flex-1 my-1"
              style={{ background: "var(--border)" }}
            />
            <div
              className="w-3 h-3 rounded-full shrink-0"
              style={{ background: "var(--red)" }}
            />
          </div>
          <div className="flex-1 space-y-4">
            <div>
              <p
                className="text-xs font-semibold uppercase tracking-wider mb-1"
                style={{ color: "var(--muted-foreground)" }}
              >
                Pickup
              </p>
              <p className="text-white font-medium">{origin?.address}</p>
              <p style={{ color: "var(--muted-foreground)" }}>{origin?.city}</p>
            </div>
            <div>
              <p
                className="text-xs font-semibold uppercase tracking-wider mb-1"
                style={{ color: "var(--muted-foreground)" }}
              >
                Delivery
              </p>
              <p className="text-white font-medium">{destination?.address}</p>
              <p style={{ color: "var(--muted-foreground)" }}>
                {destination?.city}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Recipient */}
      <div
        className="rounded-2xl p-5"
        style={{ background: "var(--card)", border: "1px solid var(--border)" }}
      >
        <h2 className="font-semibold text-white mb-4">Recipient</h2>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Package size={16} style={{ color: "var(--gold)" }} />
            <span className="text-white">{order.recipientName}</span>
          </div>
          <div className="flex items-center gap-3">
            <Phone size={16} style={{ color: "var(--gold)" }} />
            <span style={{ color: "var(--muted-foreground)" }}>
              {order.recipientPhone}
            </span>
          </div>
          {order.recipientEmail && (
            <div className="flex items-center gap-3">
              <Mail size={16} style={{ color: "var(--gold)" }} />
              <span style={{ color: "var(--muted-foreground)" }}>
                {order.recipientEmail}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Pricing */}
      {order.deliveryFee && (
        <div
          className="rounded-2xl p-5"
          style={{ background: "var(--card)", border: "1px solid var(--border)" }}
        >
          <h2 className="font-semibold text-white mb-4">Pricing</h2>
          <div className="space-y-2">
            {order.distanceKm && (
              <div className="flex justify-between text-sm">
                <span style={{ color: "var(--muted-foreground)" }}>
                  Distance
                </span>
                <span className="text-white">{order.distanceKm} km</span>
              </div>
            )}
            <div className="flex justify-between">
              <span style={{ color: "var(--muted-foreground)" }}>
                Delivery Fee
              </span>
              <span
                className="text-lg font-bold"
                style={{ color: "var(--gold)" }}
              >
                R{Number(order.deliveryFee).toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Shipment tracking */}
      {shipment && (
        <div
          className="rounded-2xl p-5"
          style={{ background: "var(--card)", border: "1px solid var(--border)" }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-white">Shipment</h2>
            <Link
              href={`/track/${shipment.trackingNumber}`}
              className="text-sm font-medium hover:underline"
              style={{ color: "var(--gold)" }}
            >
              Track →
            </Link>
          </div>
          <p
            className="font-mono text-sm mb-4"
            style={{ color: "var(--muted-foreground)" }}
          >
            {shipment.trackingNumber}
          </p>

          {shipment.events.length > 0 && (
            <div className="space-y-3">
              {shipment.events.map((event) => (
                <div key={event.id} className="flex gap-3">
                  <div
                    className="w-2 h-2 rounded-full mt-1.5 shrink-0"
                    style={{ background: "var(--gold)" }}
                  />
                  <div>
                    <p className="text-white text-sm">{event.description}</p>
                    <p
                      className="text-xs mt-0.5"
                      style={{ color: "var(--muted-foreground)" }}
                    >
                      {new Date(event.createdAt).toLocaleString("en-ZA")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Dates */}
      <div
        className="rounded-2xl p-5"
        style={{ background: "var(--card)", border: "1px solid var(--border)" }}
      >
        <h2 className="font-semibold text-white mb-4">Order Info</h2>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span style={{ color: "var(--muted-foreground)" }}>Placed</span>
            <span className="text-white">
              {new Date(order.createdAt).toLocaleDateString("en-ZA")}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span style={{ color: "var(--muted-foreground)" }}>
              Service Level
            </span>
            <span className="text-white">{order.serviceLevel}</span>
          </div>
          {order.weightKg && (
            <div className="flex justify-between text-sm">
              <span style={{ color: "var(--muted-foreground)" }}>Weight</span>
              <span className="text-white">{order.weightKg} kg</span>
            </div>
          )}
          {order.notes && (
            <div className="pt-2" style={{ borderTop: "1px solid var(--border)" }}>
              <p
                className="text-xs mb-1"
                style={{ color: "var(--muted-foreground)" }}
              >
                Notes
              </p>
              <p className="text-white text-sm">{order.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}