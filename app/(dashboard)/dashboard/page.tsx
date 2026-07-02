import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  Package,
  Truck,
  Users,
  TrendingUp,
} from "lucide-react";

export default async function DashboardPage() {
  const session = await auth();

  const [totalOrders, totalDrivers, totalVehicles] = await Promise.all([
    prisma.order.count(),
    prisma.driver.count(),
    prisma.vehicle.count(),
  ]);

  const stats = [
    {
      label: "Total Orders",
      value: totalOrders,
      icon: Package,
      color: "var(--gold)",
      bg: "rgba(200,146,42,0.1)",
    },
    {
      label: "Active Drivers",
      value: totalDrivers,
      icon: Users,
      color: "#3b82f6",
      bg: "rgba(59,130,246,0.1)",
    },
    {
      label: "Vehicles",
      value: totalVehicles,
      icon: Truck,
      color: "#10b981",
      bg: "rgba(16,185,129,0.1)",
    },
    {
      label: "Revenue",
      value: "R 0",
      icon: TrendingUp,
      color: "var(--red)",
      bg: "rgba(230,57,70,0.1)",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">
          Welcome back, {session?.user?.name?.split(" ")[0]} 👋
        </h1>
        <p className="mt-1" style={{ color: "var(--muted-foreground)" }}>
          Here's what's happening with MoveOn today.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl p-6"
            style={{
              background: "var(--card)",
              border: "1px solid var(--border)",
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: stat.bg }}
              >
                <stat.icon size={20} style={{ color: stat.color }} />
              </div>
            </div>
            <p className="text-2xl font-bold text-white">{stat.value}</p>
            <p className="text-sm mt-1" style={{ color: "var(--muted-foreground)" }}>
              {stat.label}
            </p>
          </div>
        ))}
      </div>

      {/* Empty state */}
      <div
        className="rounded-2xl p-12 text-center"
        style={{ background: "var(--card)", border: "1px solid var(--border)" }}
      >
        <Truck size={48} className="mx-auto mb-4" style={{ color: "var(--gold)" }} />
        <h2 className="text-xl font-bold text-white mb-2">Ready to move</h2>
        <p style={{ color: "var(--muted-foreground)" }}>
          Start by creating your first order or adding drivers to your fleet.
        </p>
      </div>
    </div>
  );
}