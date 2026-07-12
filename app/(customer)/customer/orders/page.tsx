import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Package, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  PENDING: { bg: "rgba(234,179,8,0.1)", color: "#eab308" },
  CONFIRMED: { bg: "rgba(59,130,246,0.1)", color: "#3b82f6" },
  IN_TRANSIT: { bg: "rgba(200,146,42,0.1)", color: "#c8922a" },
  OUT_FOR_DELIVERY: { bg: "rgba(249,115,22,0.1)", color: "#f97316" },
  DELIVERED: { bg: "rgba(16,185,129,0.1)", color: "#10b981" },
  FAILED: { bg: "rgba(239,68,68,0.1)", color: "#ef4444" },
  CANCELLED: { bg: "rgba(107,114,128,0.1)", color: "#6b7280" },
};

export default async function CustomerOrdersPage() {
  const session = await auth();

  // Find or create customer profile
  let customer = await prisma.customer.findUnique({
    where: { userId: session?.user?.id },
  });

  if (!customer) {
    customer = await prisma.customer.create({
      data: {
        userId: session?.user?.id!,
        fullName: session?.user?.name || "Customer",
      },
    });
  }

  // Fetch orders directly by customerId
  const orders = await prisma.order.findMany({
    where: { customerId: customer.id },
    orderBy: { createdAt: "desc" },
    include: { shipments: true },
  });

  return (
    <div className="space-y-6 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">My Orders</h1>
          <p className="mt-1" style={{ color: "var(--muted-foreground)" }}>
            All your delivery orders
          </p>
        </div>
        <Link href="/customer/orders/new">
          <Button
            className="flex items-center gap-2 font-semibold text-white"
            style={{ background: "var(--gold)" }}
          >
            <Plus size={18} />
            New Order
          </Button>
        </Link>
      </div>

      {orders.length === 0 ? (
        <div
          className="rounded-2xl p-12 text-center"
          style={{ background: "var(--card)", border: "1px solid var(--border)" }}
        >
          <Package
            size={48}
            className="mx-auto mb-4"
            style={{ color: "var(--gold)" }}
          />
          <h2 className="text-xl font-bold text-white mb-2">No orders yet</h2>
          <p className="mb-6" style={{ color: "var(--muted-foreground)" }}>
            Place your first order to get started
          </p>
          <Link href="/customer/orders/new">
            <Button
              className="font-semibold text-white"
              style={{ background: "var(--gold)" }}
            >
              <Plus size={16} className="mr-2" />
              Place Order
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => {
            const colors =
              STATUS_COLORS[order.status] ?? STATUS_COLORS.PENDING;
            const destination = order.destination as any;
            const origin = order.origin as any;
            return (
              <Link
                key={order.id}
                href={`/customer/orders/${order.id}`}
                className="block rounded-2xl p-5 hover:border-orange-500/30 transition"
                style={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className="font-mono text-sm font-semibold"
                        style={{ color: "var(--gold)" }}
                      >
                        {order.trackingNumber}
                      </span>
                      <span
                        className="text-xs font-semibold px-2 py-0.5 rounded-full"
                        style={{
                          background: colors.bg,
                          color: colors.color,
                        }}
                      >
                        {order.status.replace(/_/g, " ")}
                      </span>
                    </div>
                    <p className="text-white font-medium mt-1">
                      To: {order.recipientName}
                    </p>
                    <p
                      className="text-sm mt-0.5"
                      style={{ color: "var(--muted-foreground)" }}
                    >
                      {origin?.city} → {destination?.city}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p
                      className="text-sm"
                      style={{ color: "var(--muted-foreground)" }}
                    >
                      {new Date(order.createdAt).toLocaleDateString("en-ZA")}
                    </p>
                    {order.shipments.length > 0 && (
                      <span
                        className="text-xs mt-1 block"
                        style={{ color: "var(--gold)" }}
                      >
                        Track →
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}