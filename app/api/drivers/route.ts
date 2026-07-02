import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET() {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const drivers = await prisma.driver.findMany({
      include: { user: true, vehicle: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, drivers });
  } catch (error) {
    console.error("[GET /api/drivers]", error);
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
      fullName,
      phone,
      email,
      password,
      licenseNumber,
      licenseExpiresAt,
      licenseClasses,
    } = body;

    if (!fullName || !phone || !email || !password || !licenseNumber || !licenseExpiresAt) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { message: "Email already in use" },
        { status: 409 }
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

    const passwordHash = await bcrypt.hash(password, 10);

    // Create user + driver profile
    const user = await prisma.user.create({
      data: {
        name: fullName,
        email,
        passwordHash,
        role: "DRIVER",
        driverProfile: {
          create: {
            carrierId: carrier.id,
            fullName,
            phone,
            licenseNumber,
            licenseExpiresAt: new Date(licenseExpiresAt),
            licenseClasses: licenseClasses || ["EB"],
            status: "OFF_DUTY",
          },
        },
      },
      include: { driverProfile: true },
    });

    return NextResponse.json(
      { success: true, driver: user.driverProfile },
      { status: 201 }
    );
  } catch (error) {
    console.error("[POST /api/drivers]", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}