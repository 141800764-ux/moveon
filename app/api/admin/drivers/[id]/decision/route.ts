import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const ADMIN_ROLES = ["SUPER_ADMIN", "CARRIER_ADMIN", "DISPATCHER"];

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user || !ADMIN_ROLES.some((r) => session.user.roles.includes(r as any))) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  const { decision, rejectionReason } = await request.json();
  if (!["APPROVE", "REJECT"].includes(decision)) {
    return NextResponse.json({ message: "Invalid decision" }, { status: 400 });
  }

  const driver = await prisma.driver.findUnique({
    where: { id: params.id },
    include: { user: true },
  });
  if (!driver) {
    return NextResponse.json({ message: "Driver application not found" }, { status: 404 });
  }

  if (decision === "APPROVE") {
    const updatedRoles = driver.user.roles.includes("DRIVER")
      ? driver.user.roles
      : [...driver.user.roles, "DRIVER" as const];

    await prisma.$transaction([
      prisma.driver.update({
        where: { id: driver.id },
        data: {
          verificationStatus: "APPROVED",
          reviewedAt: new Date(),
          reviewedById: session.user.id,
          rejectionReason: null,
        },
      }),
      prisma.user.update({
        where: { id: driver.userId },
        data: { roles: { set: updatedRoles } },
      }),
    ]);

    return NextResponse.json({ status: "APPROVED" });
  }

  // REJECT
  await prisma.driver.update({
    where: { id: driver.id },
    data: {
      verificationStatus: "REJECTED",
      reviewedAt: new Date(),
      reviewedById: session.user.id,
      rejectionReason: rejectionReason || "Application did not meet requirements",
    },
  });

  return NextResponse.json({ status: "REJECTED" });
}