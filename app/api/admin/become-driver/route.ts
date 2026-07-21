import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST() {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

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

    // Check if already a driver
    const existing = await prisma.driver.findUnique({
      where: { userId: session.user.id },
    });

    if (existing) {
      // Just switch role and add DRIVER to roles array
      await prisma.user.update({
        where: { id: session.user.id },
        data: {
          role: "DRIVER",
          roles: {
            set: ["DRIVER", session.user.role as any],
          },
        },
      });
      return NextResponse.json({ success: true });
    }

    // Create driver profile
    await prisma.driver.create({
      data: {
        userId: session.user.id,
        carrierId: carrier.id,
        fullName: session.user.name || "Admin Driver",
        phone: "",
        licenseNumber: "ADMIN",
        licenseExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        licenseClasses: ["EB"],
        verificationStatus: "APPROVED",
        status: "ON_DUTY",
      },
    });

    // Add DRIVER role to user
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    const currentRoles = (user as any)?.roles ?? [user?.role];
    const newRoles = [...new Set([...currentRoles, "DRIVER"])];

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        role: "DRIVER",
        roles: { set: newRoles as any },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[POST /api/admin/become-driver]", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}