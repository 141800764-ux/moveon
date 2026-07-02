import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateTrackingNumber } from "@/lib/utils/tracking";

export async function GET() {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const orders = await prisma.order.findMany({
      include: { customer: true, shipments: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, orders });
  } catch (error) {
    console.error("[GET /api/orders]", error);
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
      recipientName,
      recipientPhone,
      recipientEmail,
      originAddress,
      originCity,
      destinationAddress,
      destinationCity,
      weightKg,
      serviceLevel,
      notes,
      declaredValue,
    } = body;

    if (!recipientName || !recipientPhone || !originAddress || !destinationAddress) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get or create customer profile
    let customer = await prisma.customer.findUnique({
      where: { userId: session.user.id },
    });

    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          userId: session.user.id,
          fullName: session.user.name || "Unknown",
        },
      });
    }

    // Get or create a default carrier
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

    const order = await prisma.order.create({
      data: {
        carrierId: carrier.id,
        customerId: customer.id,
        trackingNumber: generateTrackingNumber(),
        status: "PENDING",
        serviceLevel: serviceLevel || "STANDARD",
        origin: { address: originAddress, city: originCity },
        destination: { address: destinationAddress, city: destinationCity },
        recipientName,
        recipientPhone,
        recipientEmail: recipientEmail || null,
        weightKg: weightKg ? parseFloat(weightKg) : null,
        notes: notes || null,
        declaredValue: declaredValue ? parseFloat(declaredValue) : null,
      },
    });

    return NextResponse.json(
      { success: true, order },
      { status: 201 }
    );
  } catch (error) {
    console.error("[POST /api/orders]", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}