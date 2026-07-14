import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const routes = await prisma.route.findMany({
      where: {
        status: "IN_PROGRESS",
        date: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
          lte: new Date(new Date().setHours(23, 59, 59, 999)),
        },
      },
      include: {
        driver: true,
        vehicle: true,
        hub: true,
        stops: {
          orderBy: { sequence: "asc" },
          include: { shipment: true },
        },
      },
    });

    const mapData = routes.map((route) => {
      const pendingStops = route.stops.filter((s) => s.status === "PENDING");
      const completedStops = route.stops.filter((s) => s.status === "COMPLETED");
      const nextStop = pendingStops[0] ?? null;
      const nextStopAddress = nextStop?.address as any;

      return {
        routeId: route.id,
        driver: {
          id: route.driver?.id,
          name: route.driver?.fullName,
          phone: route.driver?.phone,
        },
        vehicle: {
          registration: route.vehicle?.registration,
          make: route.vehicle?.make,
          model: route.vehicle?.model,
        },
        hub: {
          name: route.hub.name,
          latitude: route.hub.latitude,
          longitude: route.hub.longitude,
        },
        progress: {
          total: route.stops.length,
          completed: completedStops.length,
          remaining: pendingStops.length,
        },
        nextStop: nextStop
          ? {
              id: nextStop.id,
              sequence: nextStop.sequence,
              address: nextStopAddress?.address,
              city: nextStopAddress?.city,
              latitude: nextStop.latitude,
              longitude: nextStop.longitude,
              contactName: nextStop.contactName,
              contactPhone: nextStop.contactPhone,
            }
          : null,
        allStops: route.stops.map((s) => {
          const addr = s.address as any;
          return {
            id: s.id,
            sequence: s.sequence,
            type: s.type,
            status: s.status,
            address: addr?.address,
            city: addr?.city,
            latitude: s.latitude,
            longitude: s.longitude,
          };
        }),
      };
    });

    return NextResponse.json({ success: true, drivers: mapData });
  } catch (error) {
    console.error("[GET /api/map/drivers]", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}