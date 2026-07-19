import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(
  _: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { token } = await params;
    const application = await prisma.driverApplication.findUnique({
      where: { token },
    });

    if (!application || !application.email) {
      return NextResponse.json({ message: "Application not found" }, { status: 404 });
    }

    let carrier = await prisma.carrier.findFirst();
    if (!carrier) {
      carrier = await prisma.carrier.create({
        data: { name: "MoveOn Logistics", slug: "moveon", email: "ops@moveon.co.za" },
      });
    }

    const tempPassword = await bcrypt.hash("MoveOn2024!", 10);

    const user = await prisma.user.create({
      data: {
        name: application.fullName || "Driver",
        email: application.email,
        passwordHash: tempPassword,
        role: "DRIVER",
        image: application.profilePhotoUrl,
        driverProfile: {
          create: {
            carrierId: carrier.id,
            fullName: application.fullName || "Driver",
            phone: application.phone || "",
            licenseNumber: application.licenseNumber || "",
            licenseExpiresAt: application.licenseExpiresAt || new Date(),
            licenseClasses: application.licenseClasses || ["EB"],
            avatar: application.profilePhotoUrl,
            verificationStatus: "APPROVED",
            bankingDetails: application.bankName ? {
              create: {
                bankName: application.bankName,
                accountHolder: application.accountHolder || "",
                accountNumber: application.accountNumber || "",
                branchCode: application.branchCode || "",
                accountType: application.accountType || "CHEQUE",
              },
            } : undefined,
          },
        },
      },
    });

    await prisma.driverApplication.update({
      where: { token },
      data: { status: "APPROVED" },
    });

    return NextResponse.json({ success: true, userId: user.id });
  } catch (error) {
    console.error("[APPROVE DRIVER]", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}