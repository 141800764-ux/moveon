import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const orders = await prisma.order.findMany({
      where: {
        status: "CONFIRMED",
      },
      select: {
        id: true,
        trackingNumber: true,
        status: true,
        recipientName: true,
        recipientPhone: true,
        origin: true,
        destination: true,
        originLat: true,
        originLng: true,
        destinationLat: true,
        destinationLng: true,
        distanceKm: true,
        deliveryFee: true,
        driverPayout: true,
        platformFee: true,
        serviceLevel: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, orders });
  } catch (error) {
    console.error("[GET /api/orders/available]", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}