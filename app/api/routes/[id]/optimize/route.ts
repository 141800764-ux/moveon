import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function calculateDistance(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function nearestNeighborTSP(
  stops: any[],
  hubLat: number,
  hubLng: number
): any[] {
  if (stops.length === 0) return [];

  const remaining = [...stops];
  const ordered: any[] = [];
  let currentLat = hubLat;
  let currentLng = hubLng;

  while (remaining.length > 0) {
    let nearestIdx = 0;
    let nearestDist = Infinity;

    remaining.forEach((stop, idx) => {
      if (!stop.latitude || !stop.longitude) return;
      const dist = calculateDistance(
        currentLat, currentLng,
        stop.latitude, stop.longitude
      );
      if (dist < nearestDist) {
        nearestDist = dist;
        nearestIdx = idx;
      }
    });

    const nearest = remaining.splice(nearestIdx, 1)[0];
    ordered.push(nearest);
    currentLat = nearest.latitude || currentLat;
    currentLng = nearest.longitude || currentLng;
  }

  return ordered;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const route = await prisma.route.findUnique({
      where: { id },
      include: {
        hub: true,
        stops: {
          where: { status: "PENDING" },
          orderBy: { sequence: "asc" },
        },
      },
    });

    if (!route) {
      return NextResponse.json({ message: "Route not found" }, { status: 404 });
    }

    if (route.stops.length === 0) {
      return NextResponse.json(
        { message: "No pending stops to optimize" },
        { status: 400 }
      );
    }

    // Run nearest neighbor algorithm from hub location
    const optimizedStops = nearestNeighborTSP(
      route.stops,
      route.hub.latitude,
      route.hub.longitude
    );

    // Calculate total distance
    let totalDistance = 0;
    let prevLat = route.hub.latitude;
    let prevLng = route.hub.longitude;

    // Update sequences in database
    await Promise.all(
      optimizedStops.map(async (stop, index) => {
        if (stop.latitude && stop.longitude) {
          totalDistance += calculateDistance(
            prevLat, prevLng,
            stop.latitude, stop.longitude
          );
          prevLat = stop.latitude;
          prevLng = stop.longitude;
        }

        return prisma.stop.update({
          where: { id: stop.id },
          data: { sequence: index + 1 },
        });
      })
    );

    // Update route total distance
    await prisma.route.update({
      where: { id },
      data: {
        totalDistanceKm: Math.round(totalDistance * 10) / 10,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Route optimized — ${optimizedStops.length} stops reordered`,
      totalDistanceKm: Math.round(totalDistance * 10) / 10,
      stopsReordered: optimizedStops.length,
    });
  } catch (error) {
    console.error("[POST /api/routes/[id]/optimize]", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}