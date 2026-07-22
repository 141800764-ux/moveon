import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function getWeekBounds() {
  const now = new Date();
  const day = now.getDay(); // 0 = Sunday
  const diff = now.getDate() - day;
  const weekStart = new Date(now.setDate(diff));
  weekStart.setHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);
  return { weekStart, weekEnd };
}

export async function GET(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const stop = await prisma.stop.findUnique({
  where: { id },
  include: {
    shipment: {
      include: {
        order: {
          select: {
            driverPayout: true,
            deliveryFee: true,
            platformFee: true,
            origin: true,
            destination: true,
            recipientName: true,
            recipientPhone: true,
            payment: true,
          },
        },
      },
    },
  },
});
    if (!stop) {
      return NextResponse.json({ message: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, stop });
  } catch (error) {
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { status, notes, failureReason, actualArrivalAt } = body;

    const stop = await prisma.stop.update({
      where: { id },
      data: {
        status,
        notes,
        failureReason,
        actualArrivalAt: actualArrivalAt ? new Date(actualArrivalAt) : undefined,
      },
      include: { shipment: true },
    });

    if (stop.shipmentId && (status === "COMPLETED" || status === "FAILED")) {
      const shipmentStatus = status === "COMPLETED" ? "DELIVERED" : "FAILED";
      const orderStatus = status === "COMPLETED" ? "DELIVERED" : "FAILED";

      const shipment = await prisma.shipment.update({
        where: { id: stop.shipmentId },
        data: {
          status: shipmentStatus,
          deliveredAt: status === "COMPLETED" ? new Date() : undefined,
          failureReason: status === "FAILED" ? failureReason : undefined,
          podNotes: notes || undefined,
        },
      });

      const order = await prisma.order.update({
        where: { id: shipment.orderId },
        data: { status: orderStatus },
      });

      await prisma.shipmentEvent.create({
        data: {
          shipmentId: shipment.id,
          type: status === "COMPLETED" ? "DELIVERED" : "DELIVERY_FAILED",
          description:
            status === "COMPLETED"
              ? "Package delivered successfully by driver"
              : `Delivery failed: ${failureReason || "No reason provided"}`,
          actor: "DRIVER",
        },
      });

      if (status === "COMPLETED") {
        const route = await prisma.route.findUnique({
          where: { id: stop.routeId },
          select: { driverId: true },
        });

        if (route?.driverId) {
          // Update driver delivery count
          await prisma.driver.update({
            where: { id: route.driverId },
            data: { totalDeliveries: { increment: 1 } },
          });

          // Record earnings for this week
          if (order.driverPayout) {
            const { weekStart, weekEnd } = getWeekBounds();
            await prisma.driverEarning.create({
              data: {
                driverId: route.driverId,
                orderId: order.id,
                amount: order.driverPayout,
                weekStart,
                weekEnd,
                isPaid: false,
              },
            });
          }
        }
      }
    }

    return NextResponse.json({ success: true, stop });
  } catch (error) {
    console.error("[PATCH /api/stops/[id]]", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}