import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
              select: { driverPayout: true },
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

    // Cascade the status change to the linked Shipment and Order
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

      await prisma.order.update({
        where: { id: shipment.orderId },
        data: { status: orderStatus },
      });

      await prisma.shipmentEvent.create({
        data: {
          shipmentId: shipment.id,
          type: status === "COMPLETED" ? "DELIVERED" : "DELIVERY_FAILED",
          description:
            status === "COMPLETED"
              ? "Package delivered successfully"
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
          await prisma.driver.update({
            where: { id: route.driverId },
            data: { totalDeliveries: { increment: 1 } },
          });
        }
      }
    }

    return NextResponse.json({ success: true, stop });
  } catch (error) {
    console.error("[PATCH /api/stops/[id]]", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}