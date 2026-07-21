import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Package, Truck, Users, DollarSign, TrendingUp, Clock } from "lucide-react";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await auth();

  const [
    totalOrders,
    pendingOrders,
    activeOrders,
    deliveredOrders,
    totalDrivers,
    activeDrivers,
    totalVehicles,
    recentOrders,
    revenue,
    pendingPayouts,
  ] = await Promise.all([
    prisma.order.count(),
    prisma.order.count({ where: { status: "PENDING" } }),
    prisma.order.count({ where: { status: { in: ["CONFIRMED", "IN_TRANSIT", "OUT_FOR_DELIVERY"] } } }),
    prisma.order.count({ where: { status: "DELIVERED" } }),
    prisma.driver.count(),
    prisma.driver.count({ where: { status: { in: ["ON_DUTY", "ON_ROUTE"] } } }),
    prisma.vehicle.count({ where: { isActive: true } }),
    prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { customer: true },
    }),
    prisma.payment.aggregate({
      where: { status: "PAID" },
      _sum: { amount: true },
    }),
    prisma.driverEarning.aggregate({
      where: { isPaid: false },
      _sum: { amount: true },
    }),
  ]);

  const totalRevenue = Number(revenue._sum.amount ?? 0);
  const totalPendingPayouts = Number(pendingPayouts._sum.amount ?? 0);
  const platformRevenue = totalRevenue * 0.2;

  const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
    PENDING: { bg: "rgba(234,179,8,0.1)", color: "#eab308" },
    CONFIRMED: { bg: "rgba(59,130,246,0.1)", color: "#3b82f6" },
    IN_TRANSIT: { bg: "rgba(200,146,42,0.1)", color: "#c8922a" },
    OUT_FOR_DELIVERY: { bg: "rgba(249,115,22,0.1)", color: "#f97316" },
    DELIVERED: { bg: "rgba(16,185,129,0.1)", color: "#10b981" },
    FAILED: { bg: "rgba(239,68,68,0.1)", color: "#ef4444" },
    CANCELLED: { bg: "rgba(107,114,128,0.1)", color: "#6b7280" },
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Dashboard</h1>
        <p className="mt-1" style={{ color: "var(--muted-foreground)" }}>
          Welcome back, {session?.user?.name?.split(" ")[0]}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Orders", value: totalOrders, icon: Package, color: "var(--gold)", bg: "rgba(200,146,42,0.1)" },
          { label: "Active Orders", value: activeOrders, icon: Clock, color: "#3b82f6", bg: "rgba(59,130,246,0.1)" },
          { label: "Drivers", value: `${activeDrivers}/${totalDrivers}`, icon: Users, color: "#10b981", bg: "rgba(16,185,129,0.1)" },
          { label: "Vehicles", value: totalVehicles, icon: Truck, color: "#a855f7", bg: "rgba(168,85,247,0.1)" },
        ].map((stat) => (
          <div key={stat.label} className="rounded-2xl p-5" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: stat.bg }}>
              <stat.icon size={20} style={{ color: stat.color }} />
            </div>
            <p className="text-2xl font-bold text-white">{stat.value}</p>
            <p className="text-sm mt-0.5" style={{ color: "var(--muted-foreground)" }}>{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Revenue */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl p-5" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: "rgba(200,146,42,0.1)" }}>
            <DollarSign size={20} style={{ color: "var(--gold)" }} />
          </div>
          <p className="text-2xl font-bold" style={{ color: "var(--gold)" }}>
            R{totalRevenue.toFixed(2)}
          </p>
          <p className="text-sm mt-0.5" style={{ color: "var(--muted-foreground)" }}>Total Revenue (Paid)</p>
          {totalRevenue === 0 && (
            <p className="text-xs mt-1" style={{ color: "var(--muted-foreground)" }}>
              Populates when orders are paid
            </p>
          )}
        </div>
        <div className="rounded-2xl p-5" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: "rgba(16,185,129,0.1)" }}>
            <TrendingUp size={20} style={{ color: "#10b981" }} />
          </div>
          <p className="text-2xl font-bold text-white">R{platformRevenue.toFixed(2)}</p>
          <p className="text-sm mt-0.5" style={{ color: "var(--muted-foreground)" }}>Platform Earnings (20%)</p>
        </div>
        <div className="rounded-2xl p-5" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: "rgba(239,68,68,0.1)" }}>
            <DollarSign size={20} style={{ color: "#ef4444" }} />
          </div>
          <p className="text-2xl font-bold text-white">R{totalPendingPayouts.toFixed(2)}</p>
          <p className="text-sm mt-0.5" style={{ color: "var(--muted-foreground)" }}>Pending Driver Payouts</p>
        </div>
      </div>

      {/* Recent orders */}
      <div className="rounded-2xl p-6" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-white">Recent Orders</h2>
          <Link href="/dashboard/orders" className="text-sm" style={{ color: "var(--gold)" }}>
            View all →
          </Link>
        </div>
        {recentOrders.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>No orders yet.</p>
        ) : (
          <div className="space-y-3">
            {recentOrders.map((order) => {
              const colors = STATUS_COLORS[order.status] ?? STATUS_COLORS.PENDING;
              const destination = order.destination as any;
              return (
                <Link
                  key={order.id}
                  href={`/dashboard/orders/${order.id}`}
                  className="flex items-center justify-between py-3 hover:opacity-80 transition"
                  style={{ borderBottom: "1px solid var(--border)" }}
                >
                  <div>
                    <p className="text-white font-medium">{order.recipientName}</p>
                    <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
                      {destination?.city} · {order.customer?.fullName}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {order.deliveryFee && (
                      <span className="font-semibold" style={{ color: "var(--gold)" }}>
                        R{Number(order.deliveryFee).toFixed(0)}
                      </span>
                    )}
                    <span
                      className="text-xs font-semibold px-2 py-0.5 rounded-full"
                      style={{ background: colors.bg, color: colors.color }}
                    >
                      {order.status.replace(/_/g, " ")}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}