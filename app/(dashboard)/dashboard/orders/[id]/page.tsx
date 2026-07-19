import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Package, MapPin, User, Phone, Mail } from "lucide-react";
import OrderStatusUpdater from "@/components/orders/OrderStatusUpdater";
import AIDispatcher from "@/components/admin/AIDispatcher";

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

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      customer: true,
      shipments: {
        include: {
          events: { orderBy: { createdAt: "desc" } },
          stops: { orderBy: { sequence: "asc" } },
        },
      },
    },
  });

  if (!order) notFound();

  const colors = STATUS_COLORS[order.status] ?? STATUS_COLORS.PENDING;
  const origin = order.origin as any;
  const destination = order.destination as any;
  const failedStop = order.shipments[0]?.stops?.find(
    (s) => s.status === "FAILED"
  );

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
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
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-3xl font-bold text-white">Order Details</h1>
              <span
                className="text-xs font-semibold px-2.5 py-1 rounded-full"
                style={{ background: colors.bg, color: colors.color }}
              >
                {order.status.replace(/_/g, " ")}
              </span>
            </div>
            <p className="mt-1 font-mono" style={{ color: "var(--gold)" }}>
              {order.trackingNumber}
            </p>
          </div>
        </div>
        <OrderStatusUpdater orderId={order.id} currentStatus={order.status} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left */}
        <div className="lg:col-span-2 space-y-6">
          {/* Route */}
          <div
            className="rounded-2xl p-6"
            style={{ background: "var(--card)", border: "1px solid var(--border)" }}
          >
            <h2 className="text-lg font-semibold text-white mb-4">Route</h2>
            <div className="flex items-start gap-4">
              <div className="flex flex-col items-center">
                <div className="w-3 h-3 rounded-full" style={{ background: "var(--gold)" }} />
                <div className="w-0.5 h-12" style={{ background: "var(--border)" }} />
                <div className="w-3 h-3 rounded-full" style={{ background: "var(--red)" }} />
              </div>
              <div className="flex-1 space-y-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider mb-1"
                    style={{ color: "var(--muted-foreground)" }}>Pickup</p>
                  <p className="text-white font-medium">{origin?.address}</p>
                  <p style={{ color: "var(--muted-foreground)" }}>{origin?.city}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider mb-1"
                    style={{ color: "var(--muted-foreground)" }}>Delivery</p>
                  <p className="text-white font-medium">{destination?.address}</p>
                  <p style={{ color: "var(--muted-foreground)" }}>{destination?.city}</p>
                </div>
              </div>
            </div>
          </div>

          {/* AI Dispatcher — only for failed orders */}
          {order.status === "FAILED" && failedStop && (
            <AIDispatcher
              stopId={failedStop.id}
              failureReason={failedStop.failureReason ?? ""}
            />
          )}

          {/* Shipment Events */}
          {order.shipments.length > 0 && (
            <div
              className="rounded-2xl p-6"
              style={{ background: "var(--card)", border: "1px solid var(--border)" }}
            >
              <h2 className="text-lg font-semibold text-white mb-4">
                Tracking Timeline
              </h2>
              {order.shipments[0].events.length === 0 ? (
                <p style={{ color: "var(--muted-foreground)" }}>No tracking events yet.</p>
              ) : (
                <div className="space-y-4">
                  {order.shipments[0].events.map((event) => (
                    <div key={event.id} className="flex gap-4">
                      <div
                        className="w-2 h-2 rounded-full mt-2 shrink-0"
                        style={{ background: "var(--gold)" }}
                      />
                      <div>
                        <p className="text-white font-medium">{event.description}</p>
                        <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>
                          {new Date(event.createdAt).toLocaleString("en-ZA")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* POD Photos */}
          {order.shipments[0]?.stops?.some((s) => s.podPhotoUrl) && (
            <div
              className="rounded-2xl p-6"
              style={{ background: "var(--card)", border: "1px solid var(--border)" }}
            >
              <h2 className="text-lg font-semibold text-white mb-4">
                Proof of Delivery
              </h2>
              <div className="grid grid-cols-2 gap-3">
                {order.shipments[0].stops
                  .filter((s) => s.podPhotoUrl)
                  .map((stop) => (
                    <div key={stop.id}>
                      <img
                        src={stop.podPhotoUrl!}
                        alt={`Stop ${stop.sequence} POD`}
                        className="w-full h-40 object-cover rounded-xl"
                      />
                      <p className="text-xs mt-1 text-center"
                        style={{ color: "var(--muted-foreground)" }}>
                        Stop {stop.sequence}
                      </p>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>

        {/* Right */}
        <div className="space-y-6">
          {/* Recipient */}
          <div
            className="rounded-2xl p-6"
            style={{ background: "var(--card)", border: "1px solid var(--border)" }}
          >
            <h2 className="text-lg font-semibold text-white mb-4">Recipient</h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <User size={16} style={{ color: "var(--gold)" }} />
                <span className="text-white">{order.recipientName}</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone size={16} style={{ color: "var(--gold)" }} />
                <span style={{ color: "var(--muted-foreground)" }}>{order.recipientPhone}</span>
              </div>
              {order.recipientEmail && (
                <div className="flex items-center gap-3">
                  <Mail size={16} style={{ color: "var(--gold)" }} />
                  <span style={{ color: "var(--muted-foreground)" }}>{order.recipientEmail}</span>
                </div>
              )}
            </div>
          </div>

          {/* Package */}
          <div
            className="rounded-2xl p-6"
            style={{ background: "var(--card)", border: "1px solid var(--border)" }}
          >
            <h2 className="text-lg font-semibold text-white mb-4">Package</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span style={{ color: "var(--muted-foreground)" }}>Service</span>
                <span className="text-white font-medium">{order.serviceLevel}</span>
              </div>
              {order.weightKg && (
                <div className="flex justify-between">
                  <span style={{ color: "var(--muted-foreground)" }}>Weight</span>
                  <span className="text-white font-medium">{order.weightKg} kg</span>
                </div>
              )}
              {order.distanceKm && (
                <div className="flex justify-between">
                  <span style={{ color: "var(--muted-foreground)" }}>Distance</span>
                  <span className="text-white font-medium">{order.distanceKm} km</span>
                </div>
              )}
              {order.deliveryFee && (
                <div className="flex justify-between">
                  <span style={{ color: "var(--muted-foreground)" }}>Delivery Fee</span>
                  <span className="font-bold" style={{ color: "var(--gold)" }}>
                    R{Number(order.deliveryFee).toFixed(2)}
                  </span>
                </div>
              )}
              {order.declaredValue && (
                <div className="flex justify-between">
                  <span style={{ color: "var(--muted-foreground)" }}>Value</span>
                  <span className="text-white font-medium">
                    R{Number(order.declaredValue).toFixed(2)}
                  </span>
                </div>
              )}
              {order.notes && (
                <div className="pt-2" style={{ borderTop: "1px solid var(--border)" }}>
                  <p className="text-xs mb-1" style={{ color: "var(--muted-foreground)" }}>Notes</p>
                  <p className="text-white text-sm">{order.notes}</p>
                </div>
              )}
            </div>
          </div>

          {/* Dates */}
          <div
            className="rounded-2xl p-6"
            style={{ background: "var(--card)", border: "1px solid var(--border)" }}
          >
            <h2 className="text-lg font-semibold text-white mb-4">Dates</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span style={{ color: "var(--muted-foreground)" }}>Created</span>
                <span className="text-white text-sm">
                  {new Date(order.createdAt).toLocaleDateString("en-ZA")}
                </span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: "var(--muted-foreground)" }}>Updated</span>
                <span className="text-white text-sm">
                  {new Date(order.updatedAt).toLocaleDateString("en-ZA")}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}