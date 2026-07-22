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

    if (!application) {
      return NextResponse.json(
        { message: "Application not found" },
        { status: 404 }
      );
    }

    if (application.status === "APPROVED") {
      return NextResponse.json(
        { message: "Already approved" },
        { status: 400 }
      );
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

    const tempPassword = await bcrypt.hash("MoveOn2024!", 10);

    // Check if user already exists with this email
    let user = await prisma.user.findUnique({
      where: { email: application.email },
    });

    if (!user) {
      // Create new user
      user = await prisma.user.create({
        data: {
          name: application.fullName || "Driver",
          email: application.email,
          passwordHash: tempPassword,
          role: "DRIVER",
          roles: ["DRIVER"],
          image: application.profilePhotoUrl || null,
        },
      });
    } else {
      // Update existing user to add driver role
      const existingRoles = (user as any).roles ?? [user.role];
      const newRoles = [...new Set([...existingRoles, "DRIVER"])];
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          role: "DRIVER",
          roles: { set: newRoles as any },
          image: user.image || application.profilePhotoUrl || null,
        },
      });
    }

    // Check if driver profile already exists
    const existingDriver = await prisma.driver.findUnique({
      where: { userId: user.id },
    });

    let driver;
    if (!existingDriver) {
      // Create driver profile
      driver = await prisma.driver.create({
        data: {
          userId: user.id,
          carrierId: carrier.id,
          fullName: application.fullName || "Driver",
          phone: application.phone || "",
          licenseNumber: application.licenseNumber || "PENDING",
          licenseExpiresAt: application.licenseExpiresAt
            ? new Date(application.licenseExpiresAt)
            : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          licenseClasses: application.licenseClasses?.length
            ? application.licenseClasses
            : ["EB"],
          avatar: application.profilePhotoUrl || null,
          verificationStatus: "APPROVED",
          status: "OFF_DUTY",
          isActive: true,
        },
      });
    } else {
      driver = existingDriver;
      await prisma.driver.update({
        where: { id: driver.id },
        data: {
          verificationStatus: "APPROVED",
          fullName: application.fullName || driver.fullName,
          phone: application.phone || driver.phone,
        },
      });
    }

    // Create banking details separately if provided
    if (application.bankName && application.accountNumber) {
      await prisma.driverBankingDetails.upsert({
        where: { driverId: driver.id },
        update: {
          bankName: application.bankName,
          accountHolder: application.accountHolder || application.fullName || "",
          accountNumber: application.accountNumber,
          branchCode: application.branchCode || "",
          accountType: application.accountType || "CHEQUE",
        },
        create: {
          driverId: driver.id,
          bankName: application.bankName,
          accountHolder: application.accountHolder || application.fullName || "",
          accountNumber: application.accountNumber,
          branchCode: application.branchCode || "",
          accountType: application.accountType || "CHEQUE",
        },
      });
    }

    // Create vehicle if provided
    if (application.vehicleMake && application.vehicleModel && application.vehicleReg) {
      const existingVehicle = await prisma.vehicle.findUnique({
        where: { carrierId_registration: { carrierId: carrier.id, registration: application.vehicleReg } },
      });

      if (!existingVehicle) {
        const vehicle = await prisma.vehicle.create({
          data: {
            carrierId: carrier.id,
            registration: application.vehicleReg,
            make: application.vehicleMake,
            model: application.vehicleModel,
            year: application.vehicleYear || 2020,
            type: (application.vehicleType as any) || "CAR",
            status: "AVAILABLE",
            isActive: true,
          },
        });

        // Link vehicle to driver
        await prisma.driver.update({
          where: { id: driver.id },
          data: { vehicleId: vehicle.id },
        });
      }
    }

    // Update application status
    await prisma.driverApplication.update({
      where: { token },
      data: { status: "APPROVED" },
    });

    return NextResponse.json({
      success: true,
      userId: user.id,
      driverId: driver.id,
      tempPassword: "MoveOn2024!",
      message: `Driver approved. They can log in with ${application.email} and password MoveOn2024!`,
    });
  } catch (error: any) {
    console.error("[APPROVE DRIVER]", error);
    return NextResponse.json(
      { message: error?.message || "Server error" },
      { status: 500 }
    );
  }
}