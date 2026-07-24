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
      return NextResponse.json(
        { message: "Driver profile not found" },
        { status: 404 }
      );
    }

    const order = await prisma.order.findUnique({
      where: { id },
      include: { payment: true },
    });

    if (!order) {
      return NextResponse.json(
        { message: "Order not found" },
        { status: 404 }
      );
    }

    if (order.status !== "CONFIRMED") {
      return NextResponse.json(
        { message: "This order is no longer available" },
        { status: 409 }
      );
    }

    let carrier = await prisma.carrier.findFirst();
    if (!carrier) {
      carrier = await prisma.carrier.create({
        data: {
          name: "MoveOn Logistics",
          slug: "moveon",
          email: "ops@moveon.co.za",
        },
      });
    }

    // Check if shipment already exists
    let shipment = await prisma.shipment.findFirst({
      where: { orderId: id },
    });

    if (!shipment) {
      shipment = await prisma.shipment.create({
        data: {
          carrierId: carrier.id,
          orderId: id,
          trackingNumber: `SHP-${Date.now()}`,
          status: "IN_TRANSIT",
        },
      });
    } else {
      shipment = await prisma.shipment.update({
        where: { id: shipment.id },
        data: { status: "IN_TRANSIT" },
      });
    }

    // Update order status
    await prisma.order.update({
      where: { id },
      data: { status: "IN_TRANSIT" },
    });

    // Get or create hub
    let hub = await prisma.hub.findFirst({
      where: { carrierId: carrier.id },
    });

    if (!hub) {
      hub = await prisma.hub.create({
        data: {
          carrierId: carrier.id,
          name: "MoveOn Main Hub",
          code: "MOH001",
          type: "DEPOT",
          address: { address: "Main Hub", city: "Cape Town" },
          latitude: -33.9249,
          longitude: 18.4241,
        },
      });
    }

    const originData = order.origin as any;
    const destinationData = order.destination as any;

    // Create route with 2 stops — PICKUP then DELIVERY
    // Both stops linked to same shipment so order data is accessible
    const route = await prisma.route.create({
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
              type: "PICKUP",
              address: {
                address: originData?.address || "Pickup address",
                city: originData?.city || "",
              },
              latitude: order.originLat ?? 0,
              longitude: order.originLng ?? 0,
              contactName: null,
              contactPhone: null,
              shipmentId: shipment.id,
              status: "PENDING",
              notes: `Pickup for order ${order.trackingNumber}`,
            },
            {
              sequence: 2,
              type: "DELIVERY",
              address: {
                address: destinationData?.address || "Delivery address",
                city: destinationData?.city || "",
              },
              latitude: order.destinationLat ?? 0,
              longitude: order.destinationLng ?? 0,
              contactName: order.recipientName,
              contactPhone: order.recipientPhone,
              shipmentId: shipment.id,
              status: "PENDING",
              notes: null,
            },
          ],
        },
      },
      include: { stops: true },
    });

    return NextResponse.json({
      success: true,
      routeId: route.id,
      stops: route.stops.length,
      message: "Order accepted successfully",
    });
  } catch (error: any) {
    console.error("[POST /api/orders/[id]/bid]", error);
    return NextResponse.json(
      { message: error?.message || "Server error" },
      { status: 500 }
    );
  }
}