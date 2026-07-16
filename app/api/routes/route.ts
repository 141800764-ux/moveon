import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateTrackingNumber } from "@/lib/utils/tracking";
import { calculateDistanceKm } from "@/lib/utils/distance";
import { sequenceStopsNearestNeighbor } from "@/lib/utils/routeOptimizer";

export async function GET() {
  try {
    const routes = await prisma.route.findMany({
      include: {
        driver: true,
        vehicle: true,
        hub: true,
        stops: true,
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ success: true, routes });
  } catch (error) {
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { hubId, driverId, vehicleId, date, plannedStartAt, plannedEndAt, orderIds } = body;

    if (!hubId || !date) {
      return NextResponse.json({ message: "Hub and date are required" }, { status: 400 });
    }

    if (!orderIds || orderIds.length === 0) {
      return NextResponse.json({ message: "Select at least one order" }, { status: 400 });
    }

    const hub = await prisma.hub.findUnique({ where: { id: hubId } });
    if (!hub) {
      return NextResponse.json({ message: "Hub not found" }, { status: 404 });
    }

    const orders = await prisma.order.findMany({
      where: { id: { in: orderIds } },
    });

    if (orders.length === 0) {
      return NextResponse.json({ message: "No valid orders found" }, { status: 404 });
    }

    // Create a Shipment for each selected order
    const shipmentByOrderId: Record<string, string> = {};
    for (const order of orders) {
      const shipment = await prisma.shipment.create({
        data: {
          carrierId: order.carrierId,
          orderId: order.id,
          trackingNumber: generateTrackingNumber(),
          status: "CREATED",
          weightKg: order.weightKg,
        },
      });
      shipmentByOrderId[order.id] = shipment.id;
    }

    // Build raw stop points from each order's already-geocoded destination
    const rawStops = orders
      .filter((o) => o.destinationLat != null && o.destinationLng != null)
      .map((order) => ({
        id: order.id,
        lat: order.destinationLat as number,
        lng: order.destinationLng as number,
        shipmentId: shipmentByOrderId[order.id],
        address: order.destination,
        contactName: order.recipientName,
        contactPhone: order.recipientPhone,
      }));

    // Sequence stops nearest-neighbor starting from the hub
    const sequenced = sequenceStopsNearestNeighbor(hub.latitude, hub.longitude, rawStops);

    // Calculate total route distance
    let totalDistanceKm = 0;
    let prevLat = hub.latitude;
    let prevLng = hub.longitude;
    for (const stop of sequenced) {
      totalDistanceKm += calculateDistanceKm(prevLat, prevLng, stop.lat, stop.lng);
      prevLat = stop.lat;
      prevLng = stop.lng;
    }

    const route = await prisma.route.create({
      data: {
        carrierId: hub.carrierId,
        hubId,
        driverId: driverId || null,
        vehicleId: vehicleId || null,
        date: new Date(date),
        status: "PLANNED",
        plannedStartAt: plannedStartAt ? new Date(`${date}T${plannedStartAt}`) : null,
        plannedEndAt: plannedEndAt ? new Date(`${date}T${plannedEndAt}`) : null,
        totalDistanceKm: Math.round(totalDistanceKm * 10) / 10,
        stops: {
          create: sequenced.map((stop, index) => ({
            sequence: index + 1,
            type: "DELIVERY",
            shipmentId: stop.shipmentId,
            address: stop.address as any,
            latitude: stop.lat,
            longitude: stop.lng,
            contactName: stop.contactName,
            contactPhone: stop.contactPhone,
            status: "PENDING",
          })),
        },
      },
      include: { stops: true },
    });

    // Mark selected orders as CONFIRMED
    await prisma.order.updateMany({
      where: { id: { in: orderIds } },
      data: { status: "CONFIRMED" },
    });

    return NextResponse.json({ success: true, route }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/routes]", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}