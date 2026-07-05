import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateTrackingNumber } from "@/lib/utils/tracking";

export async function GET(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const order = await prisma.order.findUnique({
      where: { id },
      include: { customer: true, shipments: { include: { events: true } } },
    });

    if (!order) {
      return NextResponse.json({ message: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, order });
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
    const { status } = await request.json();

    const order = await prisma.order.update({
      where: { id },
      data: { status },
    });

    // Auto-create shipment when order is confirmed
    if (status === "CONFIRMED") {
      const existing = await prisma.shipment.findFirst({
        where: { orderId: id },
      });

      if (!existing) {
        const shipment = await prisma.shipment.create({
          data: {
            carrierId: order.carrierId,
            orderId: order.id,
            trackingNumber: generateTrackingNumber(),
            status: "CREATED",
            weightKg: order.weightKg,
          },
        });

        await prisma.shipmentEvent.create({
          data: {
            shipmentId: shipment.id,
            type: "CREATED",
            description: "Shipment created and awaiting pickup",
            actor: session.user.name || "System",
          },
        });
      }
    }

    return NextResponse.json({ success: true, order });
  } catch (error) {
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}