import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const hubs = await prisma.hub.findMany({
      include: { vehicles: true, routes: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ success: true, hubs });
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
    const { name, code, type, address, city, latitude, longitude } = body;

    if (!name || !code || !type || !address || !city) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get or create carrier
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

    const hub = await prisma.hub.create({
      data: {
        carrierId: carrier.id,
        name,
        code,
        type,
        address: { address, city },
        latitude: latitude ? parseFloat(latitude) : 0,
        longitude: longitude ? parseFloat(longitude) : 0,
        isActive: true,
      },
    });

    return NextResponse.json({ success: true, hub }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/hubs]", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}