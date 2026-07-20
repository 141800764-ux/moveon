import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const driver = await prisma.driver.findUnique({
      where: { userId: session.user.id },
    });

    if (!driver) {
      return NextResponse.json({ message: "Driver profile not found" }, { status: 404 });
    }

    const order = await prisma.order.findUnique({ where: { id } });

    if (!order) {
      return NextResponse.json({ message: "Order not found" }, { status: 404 });
    }

    if (order.status !== "CONFIRMED") {
      return NextResponse.json(
        { message: "This order is no longer available" },
        { status: 409 }
      );
    }

    // Create a shipment for this order linked to this driver
    let carrier = await prisma.carrier.findFirst();
    if (!carrier) {
      carrier = await prisma.carrier.create({
        data: { name: "MoveOn Logistics", slug: "moveon", email: "ops@moveon.co.za" },
      });
    }

    // Check if shipment already exists
    const existingShipment = await prisma.shipment.findFirst({
      where: { orderId: id },
    });

    if (!existingShipment) {
      await prisma.shipment.create({
        data: {
          carrierId: carrier.id,
          orderId: id,
          trackingNumber: `SHP-${Date.now()}`,
          status: "IN_TRANSIT",
        },
      });
    }

    // Update order status to IN_TRANSIT
    await prisma.order.update({
      where: { id },
      data: { status: "IN_TRANSIT" },
    });

    // Create a route for this driver with this order
    const hub = await prisma.hub.findFirst({
      where: { carrierId: carrier.id },
    });

    if (hub) {
      const destinationCoords = {
        lat: order.destinationLat ?? 0,
        lng: order.destinationLng ?? 0,
      };

      const destination = order.destination as any;

      await prisma.route.create({
        data: {
          carrierId: carrier.id,
          hubId: hub.id,
          driverId: driver.id,
          date: new Date(),
          status: "IN_PROGRESS",
          stops: {
            create: [
              {
                sequence: 1,
                type: "DELIVERY",
                address: {
                  address: destination?.address || "",
                  city: destination?.city || "",
                },
                latitude: destinationCoords.lat,
                longitude: destinationCoords.lng,
                contactName: order.recipientName,
                contactPhone: order.recipientPhone,
                shipmentId: existingShipment?.id,
                status: "PENDING",
              },
            ],
          },
        },
      });
    }

    // Record driver earnings
    if (order.driverPayout) {
      const now = new Date();
      const day = now.getDay();
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - day);
      weekStart.setHours(0, 0, 0, 0);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);

      await prisma.driverEarning.create({
        data: {
          driverId: driver.id,
          orderId: id,
          amount: order.driverPayout,
          weekStart,
          weekEnd,
          isPaid: false,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[POST /api/orders/[id]/bid]", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}