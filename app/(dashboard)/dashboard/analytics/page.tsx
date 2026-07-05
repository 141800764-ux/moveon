import { prisma } from "@/lib/prisma";
import {
  Package,
  Truck,
  Users,
  TrendingUp,
  CheckCircle,
  XCircle,
  Clock,
  MapPin,
} from "lucide-react";

export default async function AnalyticsPage() {
  const [
    totalOrders,
    totalShipments,
    totalDrivers,
    totalVehicles,
    totalRoutes,
    totalHubs,
    deliveredShipments,
    failedShipments,
    inTransitShipments,
    pendingOrders,
    confirmedOrders,
    deliveredOrders,
    drivers,
    recentOrders,
  ] = await Promise.all([
    prisma.order.count(),
    prisma.shipment.count(),
    prisma.driver.count(),
    prisma.vehicle.count(),
    prisma.route.count(),
    prisma.hub.count(),
    prisma.shipment.count({ where: { status: "DELIVERED" } }),
    prisma.shipment.count({ where: { status: "FAILED" } }),
    prisma.shipment.count({ where: { status: "IN_TRANSIT" } }),
    prisma.order.count({ where: { status: "PENDING" } }),
    prisma.order.count({ where: { status: "CONFIRMED" } }),
    prisma.order.count({ where: { status: "DELIVERED" } }),
    prisma.driver.findMany({
      take: 5,
      orderBy: { totalDeliveries: "desc" },
    }),
    prisma.order.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { customer: true },
    }),
  ]);

  const deliveryRate =
    totalShipments > 0
      ? Math.round((deliveredShipments / totalShipments) * 100)
      : 0;

  const stats = [
    {
      label: "Total Orders",
      value: totalOrders,
      icon: Package,
      color: "var(--gold)",
      bg: "rgba(200,146,42,0.1)",
    },
    {
      label: "Total Shipments",
      value: totalShipments,
      icon: Truck,
      color: "#3b82f6",
      bg: "rgba(59,130,246,0.1)",
    },
    {
      label: "Active Drivers",
      value: totalDrivers,
      icon: Users,
      color: "#a855f7",
      bg: "rgba(168,85,247,0.1)",
    },
    {
      label: "Vehicles",
      value: totalVehicles,
      icon: Truck,
      color: "#10b981",
      bg: "rgba(16,185,129,0.1)",
    },
    {
      label: "Routes",
      value: totalRoutes,
      icon: MapPin,
      color: "#f97316",
      bg: "rgba(249,115,22,0.1)",
    },
    {
      label: "Hubs",
      value: totalHubs,
      icon: MapPin,
      color: "#ec4899",
      bg: "rgba(236,72,153,0.1)",
    },
    {
      label: "Delivered",
      value: deliveredShipments,
      icon: CheckCircle,
      color: "#10b981",
      bg: "rgba(16,185,129,0.1)",
    },
    {
      label: "Failed",
      value: failedShipments,
      icon: XCircle,
      color: "#ef4444",
      bg: "rgba(239,68,68,0.1)",
    },
  ];

  const orderStats = [
    { label: "Pending", value: pendingOrders, color: "#eab308" },
    { label: "Confirmed", value: confirmedOrders, color: "#3b82f6" },
    { label: "Delivered", value: deliveredOrders, color: "#10b981" },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Analytics</h1>
        <p className="mt-1" style={{ color: "var(--muted-foreground)" }}>
          Overview of your logistics operations
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl p-5"
            style={{
              background: "var(--card)",
              border: "1px solid var(--border)",
            }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
              style={{ background: stat.bg }}
            >
              <stat.icon size={20} style={{ color: stat.color }} />
            </div>
            <p className="text-2xl font-bold text-white">{stat.value}</p>
            <p
              className="text-sm mt-0.5"
              style={{ color: "var(--muted-foreground)" }}
            >
              {stat.label}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Delivery rate */}
        <div
          className="rounded-2xl p-6"
          style={{
            background: "var(--card)",
            border: "1px solid var(--border)",
          }}
        >
          <h2 className="text-lg font-semibold text-white mb-6">
            Delivery Performance
          </h2>
          <div className="flex items-center justify-center mb-6">
            <div className="relative w-36 h-36">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <circle
                  cx="18"
                  cy="18"
                  r="15.9"
                  fill="none"
                  stroke="var(--border)"
                  strokeWidth="3"
                />
                <circle
                  cx="18"
                  cy="18"
                  r="15.9"
                  fill="none"
                  stroke="var(--gold)"
                  strokeWidth="3"
                  strokeDasharray={`${deliveryRate} ${100 - deliveryRate}`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-white">
                  {deliveryRate}%
                </span>
                <span
                  className="text-xs"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  success rate
                </span>
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                <span
                  className="text-sm"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  Delivered
                </span>
              </div>
              <span className="text-white font-semibold">
                {deliveredShipments}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-orange-400" />
                <span
                  className="text-sm"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  In Transit
                </span>
              </div>
              <span className="text-white font-semibold">
                {inTransitShipments}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <span
                  className="text-sm"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  Failed
                </span>
              </div>
              <span className="text-white font-semibold">
                {failedShipments}
              </span>
            </div>
          </div>
        </div>

        {/* Order breakdown */}
        <div
          className="rounded-2xl p-6"
          style={{
            background: "var(--card)",
            border: "1px solid var(--border)",
          }}
        >
          <h2 className="text-lg font-semibold text-white mb-6">
            Order Breakdown
          </h2>
          <div className="space-y-4">
            {orderStats.map((stat) => (
              <div key={stat.label}>
                <div className="flex justify-between mb-1.5">
                  <span
                    className="text-sm"
                    style={{ color: "var(--muted-foreground)" }}
                  >
                    {stat.label}
                  </span>
                  <span className="text-white font-semibold">{stat.value}</span>
                </div>
                <div
                  className="h-2 rounded-full overflow-hidden"
                  style={{ background: "var(--border)" }}
                >
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: totalOrders > 0
                        ? `${(stat.value / totalOrders) * 100}%`
                        : "0%",
                      background: stat.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div
            className="mt-6 pt-6"
            style={{ borderTop: "1px solid var(--border)" }}
          >
            <h3
              className="text-sm font-semibold mb-3"
              style={{ color: "var(--muted-foreground)" }}
            >
              Top Drivers by Deliveries
            </h3>
            {drivers.length === 0 ? (
              <p
                className="text-sm"
                style={{ color: "var(--muted-foreground)" }}
              >
                No drivers yet.
              </p>
            ) : (
              <div className="space-y-2">
                {drivers.map((driver, index) => (
                  <div
                    key={driver.id}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="text-sm font-bold w-5"
                        style={{ color: "var(--gold)" }}
                      >
                        {index + 1}
                      </span>
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                        style={{
                          background: "rgba(200,146,42,0.15)",
                          color: "var(--gold)",
                        }}
                      >
                        {driver.fullName[0]}
                      </div>
                      <span className="text-sm text-white">
                        {driver.fullName}
                      </span>
                    </div>
                    <span
                      className="text-sm"
                      style={{ color: "var(--muted-foreground)" }}
                    >
                      {driver.totalDeliveries} deliveries
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div
        className="rounded-2xl p-6"
        style={{
          background: "var(--card)",
          border: "1px solid var(--border)",
        }}
      >
        <h2 className="text-lg font-semibold text-white mb-4">
          Recent Orders
        </h2>
        {recentOrders.length === 0 ? (
          <p style={{ color: "var(--muted-foreground)" }}>No orders yet.</p>
        ) : (
          <div className="space-y-3">
            {recentOrders.map((order) => {
              const destination = order.destination as any;
              return (
                <div
                  key={order.id}
                  className="flex items-center justify-between py-3"
                  style={{ borderBottom: "1px solid var(--border)" }}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center"
                      style={{ background: "rgba(200,146,42,0.1)" }}
                    >
                      <Package size={16} style={{ color: "var(--gold)" }} />
                    </div>
                    <div>
                      <p className="text-white font-medium text-sm">
                        {order.recipientName}
                      </p>
                      <p
                        className="text-xs"
                        style={{ color: "var(--muted-foreground)" }}
                      >
                        {destination?.city} ·{" "}
                        {new Date(order.createdAt).toLocaleDateString("en-ZA")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span
                      className="font-mono text-xs"
                      style={{ color: "var(--gold)" }}
                    >
                      {order.trackingNumber}
                    </span>
                    <span
                      className="text-xs font-semibold px-2 py-0.5 rounded-full"
                      style={{
                        background: "rgba(200,146,42,0.1)",
                        color: "var(--gold)",
                      }}
                    >
                      {order.status.replace(/_/g, " ")}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}