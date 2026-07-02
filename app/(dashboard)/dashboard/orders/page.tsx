import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Package, Plus, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  PENDING: { bg: "rgba(234,179,8,0.1)", color: "#eab308" },
  CONFIRMED: { bg: "rgba(59,130,246,0.1)", color: "#3b82f6" },
  PICKED_UP: { bg: "rgba(168,85,247,0.1)", color: "#a855f7" },
  IN_TRANSIT: { bg: "rgba(200,146,42,0.1)", color: "#c8922a" },
  OUT_FOR_DELIVERY: { bg: "rgba(249,115,22,0.1)", color: "#f97316" },
  DELIVERED: { bg: "rgba(16,185,129,0.1)", color: "#10b981" },
  FAILED: { bg: "rgba(239,68,68,0.1)", color: "#ef4444" },
  CANCELLED: { bg: "rgba(107,114,128,0.1)", color: "#6b7280" },
  RETURNED: { bg: "rgba(239,68,68,0.1)", color: "#ef4444" },
};

export default async function OrdersPage() {
  const session = await auth();

  const orders = await prisma.order.findMany({
    include: {
      customer: true,
      shipments: true,
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Orders</h1>
          <p className="mt-1" style={{ color: "var(--muted-foreground)" }}>
            Manage and track all delivery orders
          </p>
        </div>
        <Link href="/dashboard/orders/new">
          <Button
            className="flex items-center gap-2 font-semibold text-white"
            style={{ background: "var(--gold)" }}
          >
            <Plus size={18} />
            New Order
          </Button>
        </Link>
      </div>

      {/* Orders table */}
      {orders.length === 0 ? (
        <div
          className="rounded-2xl p-16 text-center"
          style={{ background: "var(--card)", border: "1px solid var(--border)" }}
        >
          <Package size={48} className="mx-auto mb-4" style={{ color: "var(--gold)" }} />
          <h2 className="text-xl font-bold text-white mb-2">No orders yet</h2>
          <p className="mb-6" style={{ color: "var(--muted-foreground)" }}>
            Create your first order to get started
          </p>
          <Link href="/dashboard/orders/new">
            <Button
              className="font-semibold text-white"
              style={{ background: "var(--gold)" }}
            >
              <Plus size={16} className="mr-2" />
              Create Order
            </Button>
          </Link>
        </div>
      ) : (
        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: "var(--card)", border: "1px solid var(--border)" }}
        >
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                {["Tracking #", "Recipient", "Origin", "Destination", "Status", "Date", ""].map((h) => (
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
              {orders.map((order) => {
                const colors = STATUS_COLORS[order.status] ?? STATUS_COLORS.PENDING;
                const origin = order.origin as any;
                const destination = order.destination as any;
                return (
                  <tr
                    key={order.id}
                    style={{ borderBottom: "1px solid var(--border)" }}
                    className="hover:bg-white/[0.02] transition"
                  >
                    <td className="px-6 py-4">
                      <span
                        className="font-mono text-sm font-semibold"
                        style={{ color: "var(--gold)" }}
                      >
                        {order.trackingNumber}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-white">{order.recipientName}</p>
                      <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                        {order.recipientPhone}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-sm" style={{ color: "var(--muted-foreground)" }}>
                      {origin?.city || origin?.address || "—"}
                    </td>
                    <td className="px-6 py-4 text-sm" style={{ color: "var(--muted-foreground)" }}>
                      {destination?.city || destination?.address || "—"}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className="text-xs font-semibold px-2.5 py-1 rounded-full"
                        style={{ background: colors.bg, color: colors.color }}
                      >
                        {order.status.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm" style={{ color: "var(--muted-foreground)" }}>
                      {new Date(order.createdAt).toLocaleDateString("en-ZA")}
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        href={`/dashboard/orders/${order.id}`}
                        className="text-sm font-medium hover:underline"
                        style={{ color: "var(--gold)" }}
                      >
                        View
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