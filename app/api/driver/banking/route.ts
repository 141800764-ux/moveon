import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const driver = await prisma.driver.findUnique({
      where: { userId: session.user.id },
      include: { bankingDetails: true },
    });

    return NextResponse.json({ success: true, bankingDetails: driver?.bankingDetails });
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
    const { bankName, accountHolder, accountNumber, branchCode, accountType } = body;

    const driver = await prisma.driver.findUnique({
      where: { userId: session.user.id },
    });

    if (!driver) {
      return NextResponse.json({ message: "Driver not found" }, { status: 404 });
    }

    const banking = await prisma.driverBankingDetails.upsert({
      where: { driverId: driver.id },
      update: { bankName, accountHolder, accountNumber, branchCode, accountType },
      create: { driverId: driver.id, bankName, accountHolder, accountNumber, branchCode, accountType },
    });

    return NextResponse.json({ success: true, banking });
  } catch (error) {
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}