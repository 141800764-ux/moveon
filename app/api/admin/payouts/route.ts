import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Get all drivers with unpaid earnings
    const drivers = await prisma.driver.findMany({
      include: {
        bankingDetails: true,
        earnings: {
          where: { isPaid: false },
        },
      },
    });

    const payouts = drivers
      .map((driver) => ({
        driverId: driver.id,
        fullName: driver.fullName,
        phone: driver.phone,
        bankingDetails: driver.bankingDetails,
        unpaidEarnings: driver.earnings.length,
        totalOwed: driver.earnings.reduce(
          (sum, e) => sum + Number(e.amount),
          0
        ),
      }))
      .filter((d) => d.totalOwed > 0);

    return NextResponse.json({ success: true, payouts });
  } catch (error) {
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { driverId } = await request.json();

    // Mark all unpaid earnings as paid
    await prisma.driverEarning.updateMany({
      where: { driverId, isPaid: false },
      data: { isPaid: true, paidAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}