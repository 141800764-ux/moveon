import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const customer = await prisma.customer.findUnique({
      where: { userId: session.user.id },
    });

    if (!customer) {
      return NextResponse.json({ orders: [] });
    }

    const orders = await prisma.order.findMany({
      where: {
        customerId: customer.id,
        status: { notIn: ["DELIVERED", "CANCELLED", "RETURNED"] },
      },
      select: {
        id: true,
        trackingNumber: true,
        status: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: "desc" },
      take: 10,
    });

    return NextResponse.json({ orders });
  } catch (error) {
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}