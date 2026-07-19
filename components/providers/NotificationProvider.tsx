"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { useSession } from "next-auth/react";

export default function NotificationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session } = useSession();

  useEffect(() => {
    if (!session?.user) return;

    // Request browser notification permission
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }

    // Poll for new order status changes every 30 seconds for customers
    if (session.user.role !== "CUSTOMER") return;

    let lastStatuses: Record<string, string> = {};

    async function checkOrderUpdates() {
      try {
        const res = await fetch("/api/customer/orders/status");
        if (!res.ok) return;
        const data = await res.json();

        data.orders?.forEach((order: any) => {
          const prev = lastStatuses[order.id];
          if (prev && prev !== order.status) {
            const messages: Record<string, string> = {
              CONFIRMED: "Your order has been confirmed!",
              PICKED_UP: "Your package has been picked up!",
              IN_TRANSIT: "Your package is on its way!",
              OUT_FOR_DELIVERY: "Your driver is on the way!",
              DELIVERED: "Your package has been delivered!",
              FAILED: "Delivery attempt failed. We'll try again.",
            };

            const message = messages[order.status];
            if (message) {
              // In-app toast
              toast(message, {
                description: `Order ${order.trackingNumber}`,
              });

              // Browser notification
              if (
                "Notification" in window &&
                Notification.permission === "granted"
              ) {
                new Notification("MoveOn Update", {
                  body: `${message} — ${order.trackingNumber}`,
                  icon: "/images/MoveOnLogo.png",
                });
              }
            }
          }
          lastStatuses[order.id] = order.status;
        });
      } catch {
        // Silent fail
      }
    }

    // Initial load
    checkOrderUpdates();
    const interval = setInterval(checkOrderUpdates, 30000);
    return () => clearInterval(interval);
  }, [session]);

  return <>{children}</>;
}