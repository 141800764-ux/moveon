import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const vehicles = await prisma.vehicle.findMany({
      include: { drivers: true, hub: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ success: true, vehicles });
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
    const { registration, make, model, year, type, capacityKg, capacityParcels } = body;

    if (!registration || !make || !model || !type) {
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

    const vehicle = await prisma.vehicle.create({
      data: {
        carrierId: carrier.id,
        registration,
        make,
        model,
        year: year ? parseInt(year) : null,
        type,
        capacityKg: capacityKg ? parseFloat(capacityKg) : null,
        capacityParcels: capacityParcels ? parseInt(capacityParcels) : null,
        status: "AVAILABLE",
      },
    });

    return NextResponse.json({ success: true, vehicle }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/vehicles]", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}