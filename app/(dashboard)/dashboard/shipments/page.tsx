import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Package, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  CREATED: { bg: "rgba(107,114,128,0.1)", color: "#6b7280" },
  IN_TRANSIT: { bg: "rgba(200,146,42,0.1)", color: "#c8922a" },
  OUT_FOR_DELIVERY: { bg: "rgba(249,115,22,0.1)", color: "#f97316" },
  DELIVERED: { bg: "rgba(16,185,129,0.1)", color: "#10b981" },
  FAILED: { bg: "rgba(239,68,68,0.1)", color: "#ef4444" },
  RETURNED: { bg: "rgba(239,68,68,0.1)", color: "#ef4444" },
  CANCELLED: { bg: "rgba(107,114,128,0.1)", color: "#6b7280" },
};

export default async function ShipmentsPage() {
  const shipments = await prisma.shipment.findMany({
    include: {
      order: {
        include: { customer: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Shipments</h1>
          <p className="mt-1" style={{ color: "var(--muted-foreground)" }}>
            Track all active shipments
          </p>
        </div>
      </div>

      {shipments.length === 0 ? (
        <div
          className="rounded-2xl p-16 text-center"
          style={{ background: "var(--card)", border: "1px solid var(--border)" }}
        >
          <Package size={48} className="mx-auto mb-4" style={{ color: "var(--gold)" }} />
          <h2 className="text-xl font-bold text-white mb-2">No shipments yet</h2>
          <p style={{ color: "var(--muted-foreground)" }}>
            Shipments are created automatically when orders are confirmed.
          </p>
        </div>
      ) : (
        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: "var(--card)", border: "1px solid var(--border)" }}
        >
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                {["Tracking #", "Customer", "Status", "Weight", "Attempts", "Created", ""].map((h) => (
                  <th
                    key={h}
                    className="text-left px-6 py-4 text-sm font-semibold"
                    style={{ color: "var(--muted-foreground)" }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {shipments.map((shipment) => {
                const colors = STATUS_COLORS[shipment.status] ?? STATUS_COLORS.CREATED;
                return (
                  <tr
                    key={shipment.id}
                    style={{ borderBottom: "1px solid var(--border)" }}
                    className="hover:bg-white/[0.02] transition"
                  >
                    <td className="px-6 py-4">
                      <span
                        className="font-mono text-sm font-semibold"
                        style={{ color: "var(--gold)" }}
                      >
                        {shipment.trackingNumber}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-white">
                        {shipment.order.customer.fullName}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className="text-xs font-semibold px-2.5 py-1 rounded-full"
                        style={{ background: colors.bg, color: colors.color }}
                      >
                        {shipment.status.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm" style={{ color: "var(--muted-foreground)" }}>
                      {shipment.weightKg ? `${shipment.weightKg} kg` : "—"}
                    </td>
                    <td className="px-6 py-4 text-sm" style={{ color: "var(--muted-foreground)" }}>
                      {shipment.attemptCount}
                    </td>
                    <td className="px-6 py-4 text-sm" style={{ color: "var(--muted-foreground)" }}>
                      {new Date(shipment.createdAt).toLocaleDateString("en-ZA")}
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        href={`/track/${shipment.trackingNumber}`}
                        className="text-sm font-medium hover:underline"
                        style={{ color: "var(--gold)" }}
                        target="_blank"
                      >
                        Track
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}