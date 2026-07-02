import { prisma } from "@/lib/prisma";
import Link from "next/link";
import Image from "next/image";
import { Users, Plus, Phone, Truck, Star } from "lucide-react";
import { Button } from "@/components/ui/button";

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  OFF_DUTY: { bg: "rgba(107,114,128,0.1)", color: "#6b7280" },
  ON_DUTY: { bg: "rgba(16,185,129,0.1)", color: "#10b981" },
  ON_ROUTE: { bg: "rgba(200,146,42,0.1)", color: "#c8922a" },
  ON_BREAK: { bg: "rgba(59,130,246,0.1)", color: "#3b82f6" },
  UNAVAILABLE: { bg: "rgba(239,68,68,0.1)", color: "#ef4444" },
};

export default async function DriversPage() {
  const drivers = await prisma.driver.findMany({
    include: {
      user: true,
      vehicle: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Drivers</h1>
          <p className="mt-1" style={{ color: "var(--muted-foreground)" }}>
            Manage your driver fleet
          </p>
        </div>
        <Link href="/dashboard/drivers/new">
          <Button
            className="flex items-center gap-2 font-semibold text-white"
            style={{ background: "var(--gold)" }}
          >
            <Plus size={18} />
            Add Driver
          </Button>
        </Link>
      </div>

      {/* Drivers grid */}
      {drivers.length === 0 ? (
        <div
          className="rounded-2xl p-16 text-center"
          style={{ background: "var(--card)", border: "1px solid var(--border)" }}
        >
          <Users size={48} className="mx-auto mb-4" style={{ color: "var(--gold)" }} />
          <h2 className="text-xl font-bold text-white mb-2">No drivers yet</h2>
          <p className="mb-6" style={{ color: "var(--muted-foreground)" }}>
            Add your first driver to get started
          </p>
          <Link href="/dashboard/drivers/new">
            <Button
              className="font-semibold text-white"
              style={{ background: "var(--gold)" }}
            >
              <Plus size={16} className="mr-2" />
              Add Driver
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {drivers.map((driver) => {
            const colors = STATUS_COLORS[driver.status] ?? STATUS_COLORS.OFF_DUTY;
            return (
              <Link
                key={driver.id}
                href={`/dashboard/drivers/${driver.id}`}
                className="rounded-2xl p-6 hover:border-orange-500/30 transition block"
                style={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                }}
              >
                {/* Avatar + status */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {driver.avatar ? (
                      <Image
                        src={driver.avatar}
                        alt={driver.fullName}
                        width={48}
                        height={48}
                        className="rounded-full"
                      />
                    ) : (
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold"
                        style={{ background: "rgba(200,146,42,0.15)", color: "var(--gold)" }}
                      >
                        {driver.fullName[0]}
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-white">{driver.fullName}</p>
                      <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                        {driver.licenseClasses.join(", ")}
                      </p>
                    </div>
                  </div>
                  <span
                    className="text-xs font-semibold px-2 py-1 rounded-full"
                    style={{ background: colors.bg, color: colors.color }}
                  >
                    {driver.status.replace(/_/g, " ")}
                  </span>
                </div>

                {/* Details */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Phone size={14} style={{ color: "var(--muted-foreground)" }} />
                    <span className="text-sm" style={{ color: "var(--muted-foreground)" }}>
                      {driver.phone}
                    </span>
                  </div>
                  {driver.vehicle && (
                    <div className="flex items-center gap-2">
                      <Truck size={14} style={{ color: "var(--muted-foreground)" }} />
                      <span className="text-sm" style={{ color: "var(--muted-foreground)" }}>
                        {driver.vehicle.make} {driver.vehicle.model} · {driver.vehicle.registration}
                      </span>
                    </div>
                  )}
                  {driver.rating && (
                    <div className="flex items-center gap-2">
                      <Star size={14} style={{ color: "var(--gold)" }} />
                      <span className="text-sm text-white">{driver.rating.toFixed(1)}</span>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div
                  className="mt-4 pt-4 flex justify-between"
                  style={{ borderTop: "1px solid var(--border)" }}
                >
                  <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                    {driver.totalDeliveries} deliveries
                  </span>
                  <span className="text-xs" style={{ color: "var(--gold)" }}>
                    View Profile →
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