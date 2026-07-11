import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Truck, Users, MapPin } from "lucide-react";
import VehicleStatusUpdater from "@/components/vehicles/VehicleStatusUpdater";

const TYPE_ICONS: Record<string, string> = {
  BIKE: "🚲",
  CAR: "🚗",
  VAN: "🚐",
  TRUCK: "🚛",
  REFRIGERATED: "❄️",
};

export default async function VehicleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const vehicle = await prisma.vehicle.findUnique({
    where: { id },
    include: { drivers: true, hub: true },
  });

  if (!vehicle) notFound();

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/vehicles">
            <button
              className="p-2 rounded-xl transition hover:bg-white/5"
              style={{ color: "var(--muted-foreground)" }}
            >
              <ArrowLeft size={20} />
            </button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white">
              {vehicle.make} {vehicle.model}
            </h1>
            <p
              className="font-mono mt-1"
              style={{ color: "var(--gold)" }}
            >
              {vehicle.registration}
            </p>
          </div>
        </div>
        <VehicleStatusUpdater
          vehicleId={vehicle.id}
          currentStatus={vehicle.status}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Details */}
        <div
          className="rounded-2xl p-6"
          style={{ background: "var(--card)", border: "1px solid var(--border)" }}
        >
          <h2 className="font-semibold text-white mb-4">Vehicle Details</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span style={{ color: "var(--muted-foreground)" }}>Type</span>
              <span className="text-white">
                {TYPE_ICONS[vehicle.type]} {vehicle.type}
              </span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: "var(--muted-foreground)" }}>Make</span>
              <span className="text-white">{vehicle.make}</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: "var(--muted-foreground)" }}>Model</span>
              <span className="text-white">{vehicle.model}</span>
            </div>
            {vehicle.year && (
              <div className="flex justify-between">
                <span style={{ color: "var(--muted-foreground)" }}>Year</span>
                <span className="text-white">{vehicle.year}</span>
              </div>
            )}
            {vehicle.capacityKg && (
              <div className="flex justify-between">
                <span style={{ color: "var(--muted-foreground)" }}>
                  Capacity
                </span>
                <span className="text-white">{vehicle.capacityKg} kg</span>
              </div>
            )}
            {vehicle.capacityParcels && (
              <div className="flex justify-between">
                <span style={{ color: "var(--muted-foreground)" }}>
                  Max Parcels
                </span>
                <span className="text-white">{vehicle.capacityParcels}</span>
              </div>
            )}
          </div>
        </div>

        {/* Hub */}
        <div
          className="rounded-2xl p-6"
          style={{ background: "var(--card)", border: "1px solid var(--border)" }}
        >
          <h2 className="font-semibold text-white mb-4">Hub</h2>
          {vehicle.hub ? (
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: "rgba(200,146,42,0.1)" }}
              >
                <MapPin size={20} style={{ color: "var(--gold)" }} />
              </div>
              <div>
                <p className="text-white font-medium">{vehicle.hub.name}</p>
                <p
                  className="text-sm"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  {vehicle.hub.code} · {vehicle.hub.type}
                </p>
              </div>
            </div>
          ) : (
            <p style={{ color: "var(--muted-foreground)" }}>
              Not assigned to a hub.
            </p>
          )}
        </div>

        {/* Drivers */}
        <div
          className="rounded-2xl p-6 lg:col-span-2"
          style={{ background: "var(--card)", border: "1px solid var(--border)" }}
        >
          <h2 className="font-semibold text-white mb-4">
            Assigned Drivers ({vehicle.drivers.length})
          </h2>
          {vehicle.drivers.length === 0 ? (
            <p style={{ color: "var(--muted-foreground)" }}>
              No drivers assigned yet.
            </p>
          ) : (
            <div className="space-y-3">
              {vehicle.drivers.map((driver) => (
                <Link
                  key={driver.id}
                  href={`/dashboard/drivers/${driver.id}`}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition"
                >
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center font-bold"
                    style={{
                      background: "rgba(200,146,42,0.15)",
                      color: "var(--gold)",
                    }}
                  >
                    {driver.fullName[0]}
                  </div>
                  <div>
                    <p className="text-white font-medium">{driver.fullName}</p>
                    <p
                      className="text-xs"
                      style={{ color: "var(--muted-foreground)" }}
                    >
                      {driver.phone}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}