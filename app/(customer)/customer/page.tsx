import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Package, Plus, Truck, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function CustomerHomePage() {
  const session = await auth();

  const customer = await prisma.customer.findUnique({
    where: { userId: session?.user?.id },
    include: {
      orders: {
        orderBy: { createdAt: "desc" },
        take: 3,
        include: { shipments: true },
      },
    },
  });

  const totalOrders = customer?.orders.length ?? 0;
  const activeOrders = customer?.orders.filter(
    (o) => o.status !== "DELIVERED" && o.status !== "CANCELLED"
  ).length ?? 0;

  return (
    <div className="space-y-8 py-8">
      {/* Welcome */}
      <div>
        <h1 className="text-3xl font-bold text-white">
          Hello, {session?.user?.name?.split(" ")[0]} 👋
        </h1>
        <p className="mt-1" style={{ color: "var(--muted-foreground)" }}>
          Track your deliveries and place new orders
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div
          className="rounded-2xl p-6"
          style={{ background: "var(--card)", border: "1px solid var(--border)" }}
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
            style={{ background: "rgba(200,146,42,0.1)" }}
          >
            <Package size={20} style={{ color: "var(--gold)" }} />
          </div>
          <p className="text-2xl font-bold text-white">{totalOrders}</p>
          <p className="text-sm mt-0.5" style={{ color: "var(--muted-foreground)" }}>
            Total Orders
          </p>
        </div>
        <div
          className="rounded-2xl p-6"
          style={{ background: "var(--card)", border: "1px solid var(--border)" }}
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
            style={{ background: "rgba(59,130,246,0.1)" }}
          >
            <Truck size={20} style={{ color: "#3b82f6" }} />
          </div>
          <p className="text-2xl font-bold text-white">{activeOrders}</p>
          <p className="text-sm mt-0.5" style={{ color: "var(--muted-foreground)" }}>
            Active Orders
          </p>
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link href="/customer/orders/new">
          <div
            className="rounded-2xl p-6 hover:border-orange-500/30 transition cursor-pointer"
            style={{ background: "var(--card)", border: "1px solid var(--border)" }}
          >
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
              style={{ background: "rgba(200,146,42,0.1)" }}
            >
              <Plus size={24} style={{ color: "var(--gold)" }} />
            </div>
            <h3 className="font-semibold text-white">Place New Order</h3>
            <p className="text-sm mt-1" style={{ color: "var(--muted-foreground)" }}>
              Send a package anywhere
            </p>
          </div>
        </Link>
        <Link href="/customer/orders">
          <div
            className="rounded-2xl p-6 hover:border-orange-500/30 transition cursor-pointer"
            style={{ background: "var(--card)", border: "1px solid var(--border)" }}
          >
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
              style={{ background: "rgba(59,130,246,0.1)" }}
            >
              <Clock size={24} style={{ color: "#3b82f6" }} />
            </div>
            <h3 className="font-semibold text-white">Track Orders</h3>
            <p className="text-sm mt-1" style={{ color: "var(--muted-foreground)" }}>
              View all your deliveries
            </p>
          </div>
        </Link>
      </div>

      {/* Recent orders */}
      {customer?.orders && customer.orders.length > 0 && (
        <div
          className="rounded-2xl p-6"
          style={{ background: "var(--card)", border: "1px solid var(--border)" }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-white">Recent Orders</h2>
            <Link
              href="/customer/orders"
              className="text-sm"
              style={{ color: "var(--gold)" }}
            >
              View all →
            </Link>
          </div>
          <div className="space-y-3">
            {customer.orders.map((order) => {
              const destination = order.destination as any;
              return (
                <Link
                  key={order.id}
                  href={`/customer/orders/${order.id}`}
                  className="flex items-center justify-between py-3 hover:opacity-80 transition"
                  style={{ borderBottom: "1px solid var(--border)" }}
                >
                  <div>
                    <p className="text-white font-medium">{order.recipientName}</p>
                    <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
                      {destination?.city}
                    </p>
                  </div>
                  <div className="text-right">
                    <p
                      className="font-mono text-sm"
                      style={{ color: "var(--gold)" }}
                    >
                      {order.trackingNumber}
                    </p>
                    <p
                      className="text-xs mt-0.5"
                      style={{ color: "var(--muted-foreground)" }}
                    >
                      {order.status.replace(/_/g, " ")}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}