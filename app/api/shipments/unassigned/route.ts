import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Get shipments that are CREATED status and not assigned to any stop
    const shipments = await prisma.shipment.findMany({
      where: {
        status: "CREATED",
        stops: { none: {} },
      },
      include: {
        order: {
          select: {
            recipientName: true,
            recipientPhone: true,
            origin: true,
            destination: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ success: true, shipments });
  } catch (error) {
    console.error("[GET /api/shipments/unassigned]", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}