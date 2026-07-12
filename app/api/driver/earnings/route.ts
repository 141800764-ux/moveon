import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function getWeekBounds() {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day;
  const weekStart = new Date(now);
  weekStart.setDate(diff);
  weekStart.setHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);
  return { weekStart, weekEnd };
}

export async function GET() {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const driver = await prisma.driver.findUnique({
      where: { userId: session.user.id },
    });

    if (!driver) {
      return NextResponse.json({ message: "Driver not found" }, { status: 404 });
    }

    const { weekStart, weekEnd } = getWeekBounds();

    // This week's earnings
    const weekEarnings = await prisma.driverEarning.findMany({
      where: {
        driverId: driver.id,
        weekStart: { gte: weekStart },
        isPaid: false,
      },
      include: {
        order: {
          select: {
            trackingNumber: true,
            recipientName: true,
            destination: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // All time earnings
    const allTimeTotal = await prisma.driverEarning.aggregate({
      where: { driverId: driver.id, isPaid: true },
      _sum: { amount: true },
    });

    // This week total
    const weekTotal = weekEarnings.reduce(
      (sum, e) => sum + Number(e.amount),
      0
    );

    // Previous unpaid weeks
    const unpaidTotal = await prisma.driverEarning.aggregate({
      where: { driverId: driver.id, isPaid: false },
      _sum: { amount: true },
    });

    return NextResponse.json({
      success: true,
      weekEarnings,
      weekTotal: Math.round(weekTotal * 100) / 100,
      weekStart,
      weekEnd,
      allTimePaid: Number(allTimeTotal._sum.amount ?? 0),
      totalUnpaid: Number(unpaidTotal._sum.amount ?? 0),
    });
  } catch (error) {
    console.error("[GET /api/driver/earnings]", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}