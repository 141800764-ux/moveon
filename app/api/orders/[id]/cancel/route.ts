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

    if (!["PENDING", "CONFIRMED"].includes(order.status)) {
      return NextResponse.json(
        { message: "Order cannot be cancelled at this stage" },
        { status: 400 }
      );
    }

    await prisma.order.update({
      where: { id },
      data: { status: "CANCELLED" },
    });

    if (order.status === "CONFIRMED") {
      await prisma.shipment.updateMany({
        where: { orderId: id },
        data: { status: "CANCELLED" },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}