import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Car, Plus, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  AVAILABLE: { bg: "rgba(16,185,129,0.1)", color: "#10b981" },
  ON_ROUTE: { bg: "rgba(200,146,42,0.1)", color: "#c8922a" },
  SERVICING: { bg: "rgba(59,130,246,0.1)", color: "#3b82f6" },
  OUT_OF_SERVICE: { bg: "rgba(239,68,68,0.1)", color: "#ef4444" },
};

const TYPE_ICONS: Record<string, any> = {
  BIKE: "🚲",
  CAR: "🚗",
  VAN: "🚐",
  TRUCK: "🚛",
  REFRIGERATED: "❄️",
};

export default async function VehiclesPage() {
  const vehicles = await prisma.vehicle.findMany({
    include: { drivers: true, hub: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Vehicles</h1>
          <p className="mt-1" style={{ color: "var(--muted-foreground)" }}>
            Manage your vehicle fleet
          </p>
        </div>
        <Link href="/dashboard/vehicles/new">
          <Button
            className="flex items-center gap-2 font-semibold text-white"
            style={{ background: "var(--gold)" }}
          >
            <Plus size={18} />
            Add Vehicle
          </Button>
        </Link>
      </div>

      {vehicles.length === 0 ? (
        <div
          className="rounded-2xl p-16 text-center"
          style={{ background: "var(--card)", border: "1px solid var(--border)" }}
        >
          <Truck size={48} className="mx-auto mb-4" style={{ color: "var(--gold)" }} />
          <h2 className="text-xl font-bold text-white mb-2">No vehicles yet</h2>
          <p className="mb-6" style={{ color: "var(--muted-foreground)" }}>
            Add your first vehicle to get started
          </p>
          <Link href="/dashboard/vehicles/new">
            <Button
              className="font-semibold text-white"
              style={{ background: "var(--gold)" }}
            >
              <Plus size={16} className="mr-2" />
              Add Vehicle
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {vehicles.map((vehicle) => {
            const colors = STATUS_COLORS[vehicle.status] ?? STATUS_COLORS.AVAILABLE;
            return (
              <Link
                key={vehicle.id}
                href={`/dashboard/vehicles/${vehicle.id}`}
                className="rounded-2xl p-6 hover:border-orange-500/30 transition block"
                style={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                      style={{ background: "rgba(200,146,42,0.1)" }}
                    >
                      {TYPE_ICONS[vehicle.type] || "🚗"}
                    </div>
                    <div>
                      <p className="font-semibold text-white">
                        {vehicle.make} {vehicle.model}
                      </p>
                      <p
                        className="text-xs font-mono"
                        style={{ color: "var(--gold)" }}
                      >
                        {vehicle.registration}
                      </p>
                    </div>
                  </div>
                  <span
                    className="text-xs font-semibold px-2 py-1 rounded-full"
                    style={{ background: colors.bg, color: colors.color }}
                  >
                    {vehicle.status.replace(/_/g, " ")}
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span style={{ color: "var(--muted-foreground)" }}>Type</span>
                    <span className="text-white">{vehicle.type}</span>
                  </div>
                  {vehicle.capacityKg && (
                    <div className="flex justify-between text-sm">
                      <span style={{ color: "var(--muted-foreground)" }}>Capacity</span>
                      <span className="text-white">{vehicle.capacityKg} kg</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span style={{ color: "var(--muted-foreground)" }}>Drivers</span>
                    <span className="text-white">{vehicle.drivers.length}</span>
                  </div>
                  {vehicle.hub && (
                    <div className="flex justify-between text-sm">
                      <span style={{ color: "var(--muted-foreground)" }}>Hub</span>
                      <span className="text-white">{vehicle.hub.name}</span>
                    </div>
                  )}
                </div>

                <div
                  className="mt-4 pt-4 flex justify-end"
                  style={{ borderTop: "1px solid var(--border)" }}
                >
                  <span className="text-xs" style={{ color: "var(--gold)" }}>
                    View Details →
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}