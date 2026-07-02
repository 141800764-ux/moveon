import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  Phone,
  Mail,
  Truck,
  Star,
  Calendar,
  CreditCard,
  Package,
} from "lucide-react";
import DriverStatusUpdater from "@/components/drivers/DriverStatusUpdater";

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  OFF_DUTY: { bg: "rgba(107,114,128,0.1)", color: "#6b7280" },
  ON_DUTY: { bg: "rgba(16,185,129,0.1)", color: "#10b981" },
  ON_ROUTE: { bg: "rgba(200,146,42,0.1)", color: "#c8922a" },
  ON_BREAK: { bg: "rgba(59,130,246,0.1)", color: "#3b82f6" },
  UNAVAILABLE: { bg: "rgba(239,68,68,0.1)", color: "#ef4444" },
};

export default async function DriverProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const driver = await prisma.driver.findUnique({
    where: { id },
    include: {
      user: true,
      vehicle: true,
      shifts: {
        orderBy: { startedAt: "desc" },
        take: 5,
      },
    },
  });

  if (!driver) notFound();

  const colors = STATUS_COLORS[driver.status] ?? STATUS_COLORS.OFF_DUTY;

  const licenseExpired = new Date(driver.licenseExpiresAt) < new Date();
  const licenseExpiringSoon =
    !licenseExpired &&
    new Date(driver.licenseExpiresAt) 
      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/drivers">
            <button
              className="p-2 rounded-xl transition hover:bg-white/5"
              style={{ color: "var(--muted-foreground)" }}
            >
              <ArrowLeft size={20} />
            </button>
          </Link>
          <h1 className="text-3xl font-bold text-white">Driver Profile</h1>
        </div>
        <DriverStatusUpdater driverId={driver.id} currentStatus={driver.status} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left */}
        <div className="space-y-6">
          {/* Profile card */}
          <div
            className="rounded-2xl p-6 text-center"
            style={{ background: "var(--card)", border: "1px solid var(--border)" }}
          >
            {driver.avatar ? (
              <Image
                src={driver.avatar}
                alt={driver.fullName}
                width={80}
                height={80}
                className="rounded-full mx-auto mb-4"
              />
            ) : (
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4"
                style={{ background: "rgba(200,146,42,0.15)", color: "var(--gold)" }}
              >
                {driver.fullName[0]}
              </div>
            )}

            <h2 className="text-xl font-bold text-white">{driver.fullName}</h2>
            <p className="text-sm mt-1" style={{ color: "var(--muted-foreground)" }}>
              {driver.licenseClasses.join(", ")}
            </p>

            <span
              className="inline-block mt-3 text-xs font-semibold px-3 py-1 rounded-full"
              style={{ background: colors.bg, color: colors.color }}
            >
              {driver.status.replace(/_/g, " ")}
            </span>

            {driver.rating && (
              <div className="flex items-center justify-center gap-1 mt-3">
                <Star size={16} style={{ color: "var(--gold)" }} />
                <span className="text-white font-semibold">
                  {driver.rating.toFixed(1)}
                </span>
              </div>
            )}

            {driver.bio && (
              <p
                className="text-sm mt-4"
                style={{ color: "var(--muted-foreground)" }}
              >
                {driver.bio}
              </p>
            )}
          </div>

          {/* Stats */}
          <div
            className="rounded-2xl p-6"
            style={{ background: "var(--card)", border: "1px solid var(--border)" }}
          >
            <h3 className="font-semibold text-white mb-4">Stats</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span style={{ color: "var(--muted-foreground)" }}>
                  Total Deliveries
                </span>
                <span className="text-white font-semibold">
                  {driver.totalDeliveries}
                </span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: "var(--muted-foreground)" }}>Status</span>
                <span style={{ color: colors.color }} className="font-semibold">
                  {driver.status.replace(/_/g, " ")}
                </span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: "var(--muted-foreground)" }}>Joined</span>
                <span className="text-white">
                  {new Date(driver.createdAt).toLocaleDateString("en-ZA")}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right */}
        <div className="lg:col-span-2 space-y-6">
          {/* Contact */}
          <div
            className="rounded-2xl p-6"
            style={{ background: "var(--card)", border: "1px solid var(--border)" }}
          >
            <h3 className="font-semibold text-white mb-4">Contact</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Phone size={16} style={{ color: "var(--gold)" }} />
                <span className="text-white">{driver.phone}</span>
              </div>
              {driver.user?.email && (
                <div className="flex items-center gap-3">
                  <Mail size={16} style={{ color: "var(--gold)" }} />
                  <span style={{ color: "var(--muted-foreground)" }}>
                    {driver.user.email}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* License */}
          <div
            className="rounded-2xl p-6"
            style={{ background: "var(--card)", border: "1px solid var(--border)" }}
          >
            <h3 className="font-semibold text-white mb-4">License</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <CreditCard size={16} style={{ color: "var(--gold)" }} />
                <span className="text-white">{driver.licenseNumber}</span>
              </div>
              <div className="flex items-center gap-3">
                <Calendar size={16} style={{ color: "var(--gold)" }} />
                <span
                  className="font-medium"
                  style={{
                    color: licenseExpired
                      ? "#ef4444"
                      : licenseExpiringSoon
                      ? "#eab308"
                      : "var(--muted-foreground)",
                  }}
                >
                  Expires:{" "}
                  {new Date(driver.licenseExpiresAt).toLocaleDateString("en-ZA")}
                  {licenseExpired && " — EXPIRED"}
                  {licenseExpiringSoon && " — Expiring soon"}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Package size={16} style={{ color: "var(--gold)" }} />
                <span style={{ color: "var(--muted-foreground)" }}>
                  Classes: {driver.licenseClasses.join(", ")}
                </span>
              </div>
            </div>
          </div>

          {/* Vehicle */}
          <div
            className="rounded-2xl p-6"
            style={{ background: "var(--card)", border: "1px solid var(--border)" }}
          >
            <h3 className="font-semibold text-white mb-4">Assigned Vehicle</h3>
            {driver.vehicle ? (
              <div className="flex items-center gap-4">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ background: "rgba(200,146,42,0.1)" }}
                >
                  <Truck size={24} style={{ color: "var(--gold)" }} />
                </div>
                <div>
                  <p className="text-white font-semibold">
                    {driver.vehicle.make} {driver.vehicle.model}
                  </p>
                  <p style={{ color: "var(--muted-foreground)" }}>
                    {driver.vehicle.registration} · {driver.vehicle.type}
                  </p>
                </div>
              </div>
            ) : (
              <p style={{ color: "var(--muted-foreground)" }}>
                No vehicle assigned yet.
              </p>
            )}
          </div>

          {/* Recent Shifts */}
          <div
            className="rounded-2xl p-6"
            style={{ background: "var(--card)", border: "1px solid var(--border)" }}
          >
            <h3 className="font-semibold text-white mb-4">Recent Shifts</h3>
            {driver.shifts.length === 0 ? (
              <p style={{ color: "var(--muted-foreground)" }}>No shifts yet.</p>
            ) : (
              <div className="space-y-3">
                {driver.shifts.map((shift) => (
                  <div
                    key={shift.id}
                    className="flex justify-between items-center py-2"
                    style={{ borderBottom: "1px solid var(--border)" }}
                  >
                    <div>
                      <p className="text-white text-sm">
                        {new Date(shift.startedAt).toLocaleDateString("en-ZA")}
                      </p>
                      <p
                        className="text-xs"
                        style={{ color: "var(--muted-foreground)" }}
                      >
                        {new Date(shift.startedAt).toLocaleTimeString("en-ZA", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                        {shift.endedAt &&
                          ` — ${new Date(shift.endedAt).toLocaleTimeString(
                            "en-ZA",
                            { hour: "2-digit", minute: "2-digit" }
                          )}`}
                      </p>
                    </div>
                    {shift.startKm && shift.endKm && (
                      <span
                        className="text-sm"
                        style={{ color: "var(--muted-foreground)" }}
                      >
                        {shift.endKm - shift.startKm} km
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}