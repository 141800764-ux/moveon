import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Route, Plus, Truck, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  PLANNED: { bg: "rgba(59,130,246,0.1)", color: "#3b82f6" },
  IN_PROGRESS: { bg: "rgba(200,146,42,0.1)", color: "#c8922a" },
  COMPLETED: { bg: "rgba(16,185,129,0.1)", color: "#10b981" },
  CANCELLED: { bg: "rgba(239,68,68,0.1)", color: "#ef4444" },
};

export default async function RoutesPage() {
  const routes = await prisma.route.findMany({
    include: {
      driver: true,
      vehicle: true,
      hub: true,
      stops: true,
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Routes</h1>
          <p className="mt-1" style={{ color: "var(--muted-foreground)" }}>
            Plan and manage delivery routes
          </p>
        </div>
        <Link href="/dashboard/routes/new">
          <Button
            className="flex items-center gap-2 font-semibold text-white"
            style={{ background: "var(--gold)" }}
          >
            <Plus size={18} />
            New Route
          </Button>
        </Link>
      </div>

      {routes.length === 0 ? (
        <div
          className="rounded-2xl p-16 text-center"
          style={{ background: "var(--card)", border: "1px solid var(--border)" }}
        >
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: "rgba(200,146,42,0.1)" }}
          >
            <Truck size={32} style={{ color: "var(--gold)" }} />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">No routes yet</h2>
          <p className="mb-6" style={{ color: "var(--muted-foreground)" }}>
            Create your first route to assign drivers and stops
          </p>
          <Link href="/dashboard/routes/new">
            <Button
              className="font-semibold text-white"
              style={{ background: "var(--gold)" }}
            >
              <Plus size={16} className="mr-2" />
              New Route
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {routes.map((route) => {
            const colors = STATUS_COLORS[route.status] ?? STATUS_COLORS.PLANNED;
            const completedStops = route.stops.filter(
              (s) => s.status === "COMPLETED"
            ).length;

            return (
              <Link
                key={route.id}
                href={`/dashboard/routes/${route.id}`}
                className="block rounded-2xl p-6 hover:border-orange-500/30 transition"
                style={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center"
                      style={{ background: "rgba(200,146,42,0.1)" }}
                    >
                      <Truck size={22} style={{ color: "var(--gold)" }} />
                    </div>
                    <div>
                      <div className="flex items-center gap-3">
                        <p className="font-semibold text-white">
                          {route.hub.name}
                        </p>
                        <span
                          className="text-xs font-semibold px-2 py-0.5 rounded-full"
                          style={{ background: colors.bg, color: colors.color }}
                        >
                          {route.status.replace(/_/g, " ")}
                        </span>
                      </div>
                      <p
                        className="text-sm mt-0.5"
                        style={{ color: "var(--muted-foreground)" }}
                      >
                        {new Date(route.date).toLocaleDateString("en-ZA")} ·{" "}
                        {route.stops.length} stops · {completedStops} completed
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 text-sm">
                    {route.driver && (
                      <div className="flex items-center gap-2">
                        <Users
                          size={14}
                          style={{ color: "var(--muted-foreground)" }}
                        />
                        <span style={{ color: "var(--muted-foreground)" }}>
                          {route.driver.fullName}
                        </span>
                      </div>
                    )}
                    {route.vehicle && (
                      <div className="flex items-center gap-2">
                        <Truck
                          size={14}
                          style={{ color: "var(--muted-foreground)" }}
                        />
                        <span style={{ color: "var(--muted-foreground)" }}>
                          {route.vehicle.registration}
                        </span>
                      </div>
                    )}
                    {route.totalDistanceKm && (
                      <span style={{ color: "var(--muted-foreground)" }}>
                        {route.totalDistanceKm} km
                      </span>
                    )}
                    <span style={{ color: "var(--gold)" }}>View →</span>
                  </div>
                </div>

                {route.stops.length > 0 && (
                  <div className="mt-4 pt-4" style={{ borderTop: "1px solid var(--border)" }}>
                    <div className="flex items-center gap-2">
                      <div
                        className="h-1.5 rounded-full flex-1 overflow-hidden"
                        style={{ background: "var(--border)" }}
                      >
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${(completedStops / route.stops.length) * 100}%`,
                            background: "var(--gold)",
                          }}
                        />
                      </div>
                      <span
                        className="text-xs"
                        style={{ color: "var(--muted-foreground)" }}
                      >
                        {Math.round((completedStops / route.stops.length) * 100)}%
                      </span>
                    </div>
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}