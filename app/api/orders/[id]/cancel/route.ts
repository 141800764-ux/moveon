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

    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) {
      return NextResponse.json({ message: "Order not found" }, { status: 404 });
    }

    const isAdmin = !["CUSTOMER", "DRIVER"].includes(session.user.role as string);

    // Customers can only cancel pending or confirmed orders
    if (!isAdmin && !["PENDING", "CONFIRMED"].includes(order.status)) {
      return NextResponse.json(
        { message: "Order cannot be cancelled at this stage" },
        { status: 400 }
      );
    }

    // Admins can cancel any order that isn't already delivered/cancelled
    if (isAdmin && ["DELIVERED", "CANCELLED", "RETURNED"].includes(order.status)) {
      return NextResponse.json(
        { message: "Cannot cancel a delivered or already cancelled order" },
        { status: 400 }
      );
    }

    await prisma.order.update({
      where: { id },
      data: { status: "CANCELLED" },
    });

    // Cancel all related shipments
    await prisma.shipment.updateMany({
      where: { orderId: id },
      data: { status: "CANCELLED" },
    });

    // Add tracking event
    const shipment = await prisma.shipment.findFirst({ where: { orderId: id } });
    if (shipment) {
      await prisma.shipmentEvent.create({
        data: {
          shipmentId: shipment.id,
          type: "CANCELLED",
          description: `Order cancelled by ${isAdmin ? "admin" : "customer"}`,
          actor: isAdmin ? "ADMIN" : "CUSTOMER",
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[POST /api/orders/[id]/cancel]", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}