import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function getWeekBounds() {
  const now = new Date();
  const day = now.getDay();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - day);
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
        route: {
          select: {
            driverId: true,
            stops: {
              select: {
                id: true,
                sequence: true,
                type: true,
                status: true,
                address: true,
                latitude: true,
                longitude: true,
                contactName: true,
                contactPhone: true,
              },
              orderBy: { sequence: "asc" },
            },
          },
        },
        shipment: {
          include: {
            order: {
              select: {
                id: true,
                trackingNumber: true,
                driverPayout: true,
                deliveryFee: true,
                platformFee: true,
                origin: true,
                destination: true,
                originLat: true,
                originLng: true,
                destinationLat: true,
                destinationLng: true,
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
      return NextResponse.json({ message: "Stop not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, stop });
  } catch (error) {
    console.error("[GET /api/stops/[id]]", error);
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
    const { status, notes, failureReason, actualArrivalAt, podPhotoUrl } = body;

    const stop = await prisma.stop.update({
      where: { id },
      data: {
        status,
        notes: notes || undefined,
        failureReason: failureReason || undefined,
        podPhotoUrl: podPhotoUrl || undefined,
        actualArrivalAt: actualArrivalAt
          ? new Date(actualArrivalAt)
          : undefined,
      },
      include: {
        route: { select: { driverId: true } },
        shipment: {
          include: { order: true },
        },
      },
    });

    // Only cascade on DELIVERY stops — not PICKUP stops
    if (
      stop.shipmentId &&
      stop.type === "DELIVERY" &&
      (status === "COMPLETED" || status === "FAILED")
    ) {
      const shipmentStatus = status === "COMPLETED" ? "DELIVERED" : "FAILED";
      const orderStatus = status === "COMPLETED" ? "DELIVERED" : "FAILED";

      const shipment = await prisma.shipment.update({
        where: { id: stop.shipmentId },
        data: {
          status: shipmentStatus,
          deliveredAt: status === "COMPLETED" ? new Date() : undefined,
          failureReason: status === "FAILED" ? failureReason : undefined,
          podNotes: notes || undefined,
          attemptCount: { increment: 1 },
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

      if (status === "COMPLETED" && stop.route?.driverId) {
        await prisma.driver.update({
          where: { id: stop.route.driverId },
          data: { totalDeliveries: { increment: 1 } },
        });

        if (order.driverPayout) {
          const { weekStart, weekEnd } = getWeekBounds();
          await prisma.driverEarning.create({
            data: {
              driverId: stop.route.driverId,
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

    // If PICKUP stop completed — update shipment to IN_TRANSIT
    if (
      stop.shipmentId &&
      stop.type === "PICKUP" &&
      status === "COMPLETED"
    ) {
      await prisma.shipment.update({
        where: { id: stop.shipmentId },
        data: { status: "IN_TRANSIT" },
      });

      await prisma.shipmentEvent.create({
        data: {
          shipmentId: stop.shipmentId,
          type: "PICKED_UP",
          description: "Package picked up by driver",
          actor: "DRIVER",
        },
      });

      await prisma.order.update({
        where: { id: stop.shipment!.orderId },
        data: { status: "PICKED_UP" },
      });
    }

    return NextResponse.json({ success: true, stop });
  } catch (error) {
    console.error("[PATCH /api/stops/[id]]", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}