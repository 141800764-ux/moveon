import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Phone, CreditCard, Truck, Star, Package } from "lucide-react";
import DriverBankingForm from "@/components/driver/DriverBankingForm";

export default async function DriverProfilePage() {
  const session = await auth();

  const driver = await prisma.driver.findUnique({
    where: { userId: session?.user?.id },
    include: { vehicle: true },
  });

  if (!driver) {
    return (
      <div className="py-20 text-center">
        <p style={{ color: "var(--muted-foreground)" }}>
          Driver profile not found.
        </p>
      </div>
    );
  }

  const banking = await prisma.driverBankingDetails.findUnique({
    where: { driverId: driver.id },
  });

  const licenseExpired = new Date(driver.licenseExpiresAt) < new Date();
  const licenseExpiringSoon =
    !licenseExpired &&
    new Date(driver.licenseExpiresAt) 
      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  return (
    <div className="space-y-6 py-8">
      <h1 className="text-2xl font-bold text-white">My Profile</h1>

      {/* Avatar */}
      <div
        className="rounded-2xl p-6 text-center"
        style={{ background: "var(--card)", border: "1px solid var(--border)" }}
      >
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-3"
          style={{ background: "rgba(200,146,42,0.15)", color: "var(--gold)" }}
        >
          {driver.fullName[0]}
        </div>
        <h2 className="text-xl font-bold text-white">{driver.fullName}</h2>
        <p className="text-sm mt-1" style={{ color: "var(--muted-foreground)" }}>
          {driver.licenseClasses.join(", ")}
        </p>
        {driver.rating && (
          <div className="flex items-center justify-center gap-1 mt-2">
            <Star size={16} style={{ color: "var(--gold)" }} />
            <span className="text-white font-semibold">
              {driver.rating.toFixed(1)}
            </span>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div
          className="rounded-2xl p-5 text-center"
          style={{ background: "var(--card)", border: "1px solid var(--border)" }}
        >
          <Package size={24} className="mx-auto mb-2" style={{ color: "var(--gold)" }} />
          <p className="text-2xl font-bold text-white">
            {driver.totalDeliveries}
          </p>
          <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
            Deliveries
          </p>
        </div>
        <div
          className="rounded-2xl p-5 text-center"
          style={{ background: "var(--card)", border: "1px solid var(--border)" }}
        >
          <Star size={24} className="mx-auto mb-2" style={{ color: "var(--gold)" }} />
          <p className="text-2xl font-bold text-white">
            {driver.rating?.toFixed(1) ?? "—"}
          </p>
          <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
            Rating
          </p>
        </div>
      </div>

      {/* Details */}
      <div
        className="rounded-2xl p-6 space-y-4"
        style={{ background: "var(--card)", border: "1px solid var(--border)" }}
      >
        <h3 className="font-semibold text-white">Details</h3>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Phone size={16} style={{ color: "var(--gold)" }} />
            <span className="text-white">{driver.phone}</span>
          </div>
          <div className="flex items-center gap-3">
            <CreditCard size={16} style={{ color: "var(--gold)" }} />
            <span className="text-white">{driver.licenseNumber}</span>
          </div>
          <div className="flex items-center gap-3">
            <CreditCard
              size={16}
              style={{
                color: licenseExpired
                  ? "#ef4444"
                  : licenseExpiringSoon
                  ? "#eab308"
                  : "var(--gold)",
              }}
            />
            <span
              style={{
                color: licenseExpired
                  ? "#ef4444"
                  : licenseExpiringSoon
                  ? "#eab308"
                  : "var(--muted-foreground)",
              }}
            >
              License expires:{" "}
              {new Date(driver.licenseExpiresAt).toLocaleDateString("en-ZA")}
              {licenseExpired && " — EXPIRED"}
              {licenseExpiringSoon && " — Expiring soon"}
            </span>
          </div>
          {driver.vehicle && (
            <div className="flex items-center gap-3">
              <Truck size={16} style={{ color: "var(--gold)" }} />
              <span style={{ color: "var(--muted-foreground)" }}>
                {driver.vehicle.make} {driver.vehicle.model} ·{" "}
                {driver.vehicle.registration}
              </span>
            </div>
          )}
        </div>
      </div>

      <DriverBankingForm banking={banking} />
    </div>
  );
}