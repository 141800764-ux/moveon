import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import {
  MapPin,
  CheckCircle,
  Circle,
  XCircle,
  Phone,
  Truck,
} from "lucide-react";

const STOP_STATUS_COLORS: Record<string, string> = {
  PENDING: "var(--muted-foreground)",
  COMPLETED: "#10b981",
  FAILED: "#ef4444",
  SKIPPED: "#6b7280",
};

export default async function DriverHomePage() {
  const session = await auth();

  const driver = await prisma.driver.findUnique({
    where: { userId: session?.user?.id },
    include: {
      vehicle: true,
      routes: {
        where: {
          status: { in: ["PLANNED", "IN_PROGRESS"] },
          date: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
            lte: new Date(new Date().setHours(23, 59, 59, 999)),
          },
        },
        include: {
          stops: { orderBy: { sequence: "asc" } },
          hub: true,
        },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  const todayRoute = driver?.routes[0] ?? null;
  const pendingStops = todayRoute?.stops.filter(
    (s) => s.status === "PENDING"
  ) ?? [];
  const completedStops = todayRoute?.stops.filter(
    (s) => s.status === "COMPLETED"
  ) ?? [];

  return (
    <div className="space-y-6 py-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">
          Good {new Date().getHours() < 12 ? "morning" : "afternoon"},{" "}
          {session?.user?.name?.split(" ")[0]} 👋
        </h1>
        <p className="mt-1" style={{ color: "var(--muted-foreground)" }}>
          {new Date().toLocaleDateString("en-ZA", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      {/* Vehicle */}
      {driver?.vehicle && (
        <div
          className="rounded-2xl p-4 flex items-center gap-4"
          style={{ background: "var(--card)", border: "1px solid var(--border)" }}
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: "rgba(200,146,42,0.1)" }}
          >
            <Truck size={20} style={{ color: "var(--gold)" }} />
          </div>
          <div>
            <p className="text-white font-medium">
              {driver.vehicle.make} {driver.vehicle.model}
            </p>
            <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
              {driver.vehicle.registration} · {driver.vehicle.type}
            </p>
          </div>
        </div>
      )}

      {/* Today's route */}
      {!todayRoute ? (
        <div
          className="rounded-2xl p-12 text-center"
          style={{ background: "var(--card)", border: "1px solid var(--border)" }}
        >
          <MapPin
            size={40}
            className="mx-auto mb-3"
            style={{ color: "var(--gold)" }}
          />
          <h2 className="text-lg font-bold text-white mb-1">
            No route assigned today
          </h2>
          <p style={{ color: "var(--muted-foreground)" }}>
            Check back later or contact your dispatcher
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Progress */}
          <div
            className="rounded-2xl p-5"
            style={{ background: "var(--card)", border: "1px solid var(--border)" }}
          >
            <div className="flex justify-between mb-3">
              <p className="font-semibold text-white">Today's Route</p>
              <span
                className="text-sm"
                style={{ color: "var(--muted-foreground)" }}
              >
                {completedStops.length}/{todayRoute.stops.length} stops
              </span>
            </div>
            <div
              className="h-2 rounded-full overflow-hidden"
              style={{ background: "var(--border)" }}
            >
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${todayRoute.stops.length > 0
                    ? (completedStops.length / todayRoute.stops.length) * 100
                    : 0}%`,
                  background: "var(--gold)",
                }}
              />
            </div>
          </div>

          {/* Stops */}
          <div
            className="rounded-2xl p-5"
            style={{ background: "var(--card)", border: "1px solid var(--border)" }}
          >
            <p className="font-semibold text-white mb-4">Stops</p>
            <div className="space-y-3">
              {todayRoute.stops.map((stop, index) => {
                const address = stop.address as any;
                const color = STOP_STATUS_COLORS[stop.status];
                const Icon =
                  stop.status === "COMPLETED"
                    ? CheckCircle
                    : stop.status === "FAILED"
                    ? XCircle
                    : Circle;

                return (
                  <Link
                    key={stop.id}
                    href={`/driver/stop/${stop.id}`}
                    className="flex gap-4 p-4 rounded-xl hover:opacity-80 transition"
                    style={{ background: "var(--background)" }}
                  >
                    <Icon size={20} style={{ color }} className="shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <span
                          className="text-xs font-semibold uppercase"
                          style={{ color: "var(--gold)" }}
                        >
                          Stop {stop.sequence} · {stop.type}
                        </span>
                        <span
                          className="text-xs font-semibold"
                          style={{ color }}
                        >
                          {stop.status}
                        </span>
                      </div>
                      <p className="text-white font-medium mt-0.5">
                        {address?.address}
                      </p>
                      <p
                        className="text-sm"
                        style={{ color: "var(--muted-foreground)" }}
                      >
                        {address?.city}
                      </p>
                      {stop.contactName && (
                        <div className="flex items-center gap-2 mt-1">
                          <Phone
                            size={12}
                            style={{ color: "var(--muted-foreground)" }}
                          />
                          <span
                            className="text-xs"
                            style={{ color: "var(--muted-foreground)" }}
                          >
                            {stop.contactName}{" "}
                            {stop.contactPhone && `· ${stop.contactPhone}`}
                          </span>
                        </div>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}