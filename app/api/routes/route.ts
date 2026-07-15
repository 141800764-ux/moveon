import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { geocodeAddress } from "@/lib/utils/geocode";

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
    const {
      hubId,
      driverId,
      vehicleId,
      date,
      plannedStartAt,
      plannedEndAt,
      stops,
    } = body;

    if (!hubId || !date) {
      return NextResponse.json(
        { message: "Hub and date are required" },
        { status: 400 }
      );
    }

    const hub = await prisma.hub.findUnique({ where: { id: hubId } });
    if (!hub) {
      return NextResponse.json({ message: "Hub not found" }, { status: 404 });
    }

    // Geocode all stop addresses
    const geocodedStops = await Promise.all(
      stops.map(async (stop: any) => {
        let lat = 0;
        let lng = 0;

        // If stop came from a shipment it may already have coords
        if (stop.lat && stop.lng) {
          lat = stop.lat;
          lng = stop.lng;
        } else if (stop.address && stop.city) {
          const coords = await geocodeAddress(stop.address, stop.city);
          if (coords) {
            lat = coords.lat;
            lng = coords.lng;
          }
        }

        return {
          sequence: stop.sequence,
          type: stop.type,
          address: { address: stop.address, city: stop.city },
          latitude: lat,
          longitude: lng,
          contactName: stop.contactName || null,
          contactPhone: stop.contactPhone || null,
          shipmentId: stop.shipmentId || null,
          status: "PENDING",
        };
      })
    );

    const route = await prisma.route.create({
      data: {
        carrierId: hub.carrierId,
        hubId,
        driverId: driverId || null,
        vehicleId: vehicleId || null,
        date: new Date(date),
        status: "PLANNED",
        plannedStartAt: plannedStartAt
          ? new Date(`${date}T${plannedStartAt}`)
          : null,
        plannedEndAt: plannedEndAt
          ? new Date(`${date}T${plannedEndAt}`)
          : null,
        stops: {
          create: geocodedStops,
        },
      },
      include: { stops: true },
    });

    return NextResponse.json({ success: true, route }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/routes]", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}