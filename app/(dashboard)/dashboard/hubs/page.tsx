import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { MapPin, Plus, Truck, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

const HUB_TYPE_COLORS: Record<string, { bg: string; color: string }> = {
  DEPOT: { bg: "rgba(200,146,42,0.1)", color: "#c8922a" },
  WAREHOUSE: { bg: "rgba(59,130,246,0.1)", color: "#3b82f6" },
  SORTING_CENTER: { bg: "rgba(168,85,247,0.1)", color: "#a855f7" },
  PICKUP_POINT: { bg: "rgba(16,185,129,0.1)", color: "#10b981" },
};

export default async function HubsPage() {
  const hubs = await prisma.hub.findMany({
    include: {
      vehicles: true,
      routes: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Hubs</h1>
          <p className="mt-1" style={{ color: "var(--muted-foreground)" }}>
            Manage your depots and warehouses
          </p>
        </div>
        <Link href="/dashboard/hubs/new">
          <Button
            className="flex items-center gap-2 font-semibold text-white"
            style={{ background: "var(--gold)" }}
          >
            <Plus size={18} />
            Add Hub
          </Button>
        </Link>
      </div>

      {hubs.length === 0 ? (
        <div
          className="rounded-2xl p-16 text-center"
          style={{ background: "var(--card)", border: "1px solid var(--border)" }}
        >
          <MapPin size={48} className="mx-auto mb-4" style={{ color: "var(--gold)" }} />
          <h2 className="text-xl font-bold text-white mb-2">No hubs yet</h2>
          <p className="mb-6" style={{ color: "var(--muted-foreground)" }}>
            Add your first hub to get started
          </p>
          <Link href="/dashboard/hubs/new">
            <Button
              className="font-semibold text-white"
              style={{ background: "var(--gold)" }}
            >
              <Plus size={16} className="mr-2" />
              Add Hub
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {hubs.map((hub) => {
            const colors = HUB_TYPE_COLORS[hub.type] ?? HUB_TYPE_COLORS.DEPOT;
            const address = hub.address as any;
            return (
              <Link
                key={hub.id}
                href={`/dashboard/hubs/${hub.id}`}
                className="rounded-2xl p-6 hover:border-orange-500/30 transition block"
                style={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center"
                      style={{ background: "rgba(200,146,42,0.1)" }}
                    >
                      <MapPin size={24} style={{ color: "var(--gold)" }} />
                    </div>
                    <div>
                      <p className="font-semibold text-white">{hub.name}</p>
                      <p
                        className="text-xs font-mono"
                        style={{ color: "var(--muted-foreground)" }}
                      >
                        {hub.code}
                      </p>
                    </div>
                  </div>
                  <span
                    className="text-xs font-semibold px-2 py-1 rounded-full"
                    style={{ background: colors.bg, color: colors.color }}
                  >
                    {hub.type.replace(/_/g, " ")}
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin size={14} style={{ color: "var(--muted-foreground)" }} />
                    <span style={{ color: "var(--muted-foreground)" }}>
                      {address?.city || address?.address || "—"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Truck size={14} style={{ color: "var(--muted-foreground)" }} />
                    <span style={{ color: "var(--muted-foreground)" }}>
                      {hub.vehicles.length} vehicles
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Users size={14} style={{ color: "var(--muted-foreground)" }} />
                    <span style={{ color: "var(--muted-foreground)" }}>
                      {hub.routes.length} routes
                    </span>
                  </div>
                </div>

                <div
                  className="mt-4 pt-4 flex justify-between items-center"
                  style={{ borderTop: "1px solid var(--border)" }}
                >
                  <span
                    className="text-xs"
                    style={{
                      color: hub.isActive ? "#10b981" : "#ef4444",
                    }}
                  >
                    {hub.isActive ? "Active" : "Inactive"}
                  </span>
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