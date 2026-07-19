import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Truck,
  Users,
  MapPin,
  Calendar,
  CheckCircle,
  Circle,
  XCircle,
} from "lucide-react";
import RouteStatusUpdater from "@/components/routes/RouteStatusUpdater";
import RouteOptimizer from "@/components/routes/RouteOptimizer";

const STOP_STATUS_ICONS: Record<string, any> = {
  PENDING: Circle,
  COMPLETED: CheckCircle,
  FAILED: XCircle,
  SKIPPED: XCircle,
};

const STOP_STATUS_COLORS: Record<string, string> = {
  PENDING: "var(--muted-foreground)",
  COMPLETED: "#10b981",
  FAILED: "#ef4444",
  SKIPPED: "#6b7280",
};

export default async function RouteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const route = await prisma.route.findUnique({
    where: { id },
    include: {
      driver: true,
      vehicle: true,
      hub: true,
      stops: { orderBy: { sequence: "asc" } },
    },
  });

  if (!route) notFound();

  const completedStops = route.stops.filter(
    (s) => s.status === "COMPLETED"
  ).length;

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
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
            <h1 className="text-3xl font-bold text-white">Route Details</h1>
            <p className="mt-1" style={{ color: "var(--muted-foreground)" }}>
              {new Date(route.date).toLocaleDateString("en-ZA", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
        </div>
        <RouteStatusUpdater routeId={route.id} currentStatus={route.status} />
        <RouteOptimizer routeId={route.id} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left */}
        <div className="space-y-6">
          {/* Info */}
          <div
            className="rounded-2xl p-6 space-y-4"
            style={{ background: "var(--card)", border: "1px solid var(--border)" }}
          >
            <h3 className="font-semibold text-white">Route Info</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <MapPin size={16} style={{ color: "var(--gold)" }} />
                <span className="text-white">{route.hub.name}</span>
              </div>
              {route.driver && (
                <div className="flex items-center gap-3">
                  <Users size={16} style={{ color: "var(--gold)" }} />
                  <span style={{ color: "var(--muted-foreground)" }}>
                    {route.driver.fullName}
                  </span>
                </div>
              )}
              {route.vehicle && (
                <div className="flex items-center gap-3">
                  <Truck size={16} style={{ color: "var(--gold)" }} />
                  <span style={{ color: "var(--muted-foreground)" }}>
                    {route.vehicle.make} {route.vehicle.model} ·{" "}
                    {route.vehicle.registration}
                  </span>
                </div>
              )}
              {route.plannedStartAt && (
                <div className="flex items-center gap-3">
                  <Calendar size={16} style={{ color: "var(--gold)" }} />
                  <span style={{ color: "var(--muted-foreground)" }}>
                    {new Date(route.plannedStartAt).toLocaleTimeString(
                      "en-ZA",
                      { hour: "2-digit", minute: "2-digit" }
                    )}
                    {route.plannedEndAt &&
                      ` — ${new Date(route.plannedEndAt).toLocaleTimeString(
                        "en-ZA",
                        { hour: "2-digit", minute: "2-digit" }
                      )}`}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Progress */}
          <div
            className="rounded-2xl p-6"
            style={{ background: "var(--card)", border: "1px solid var(--border)" }}
          >
            <h3 className="font-semibold text-white mb-4">Progress</h3>
            <div className="text-center mb-4">
              <p className="text-4xl font-bold" style={{ color: "var(--gold)" }}>
                {completedStops}/{route.stops.length}
              </p>
              <p
                className="text-sm mt-1"
                style={{ color: "var(--muted-foreground)" }}
              >
                stops completed
              </p>
            </div>
            {route.stops.length > 0 && (
              <div
                className="h-2 rounded-full overflow-hidden"
                style={{ background: "var(--border)" }}
              >
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${(completedStops / route.stops.length) * 100}%`,
                    background: "var(--gold)",
                  }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Right — Stops */}
        <div className="lg:col-span-2">
          <div
            className="rounded-2xl p-6"
            style={{ background: "var(--card)", border: "1px solid var(--border)" }}
          >
            <h3 className="font-semibold text-white mb-4">
              Stops ({route.stops.length})
            </h3>
            {route.stops.length === 0 ? (
              <p style={{ color: "var(--muted-foreground)" }}>
                No stops added yet.
              </p>
            ) : (
              <div className="space-y-3">
                {route.stops.map((stop, index) => {
                  const Icon = STOP_STATUS_ICONS[stop.status] ?? Circle;
                  const color = STOP_STATUS_COLORS[stop.status] ?? "var(--muted-foreground)";
                  const address = stop.address as any;

                  return (
                    <div
                      key={stop.id}
                      className="flex gap-4 p-4 rounded-xl"
                      style={{ background: "var(--background)" }}
                    >
                      <div className="flex flex-col items-center">
                        <Icon size={20} style={{ color }} />
                        {index < route.stops.length - 1 && (
                          <div
                            className="w-0.5 flex-1 mt-2"
                            style={{ background: "var(--border)" }}
                          />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span
                            className="text-xs font-semibold uppercase tracking-wider"
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
                        <p className="text-white font-medium mt-1">
                          {address?.address}
                        </p>
                        <p
                          className="text-sm"
                          style={{ color: "var(--muted-foreground)" }}
                        >
                          {address?.city}
                        </p>
                        {stop.contactName && (
                          <p
                            className="text-sm mt-1"
                            style={{ color: "var(--muted-foreground)" }}
                          >
                            {stop.contactName}{" "}
                            {stop.contactPhone && `· ${stop.contactPhone}`}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}