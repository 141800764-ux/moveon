import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const ADMIN_ROLES = ["SUPER_ADMIN", "CARRIER_ADMIN", "DISPATCHER"];

export async function GET() {
  const session = await auth();
  if (!session?.user || !ADMIN_ROLES.some((r) => session.user.roles.includes(r as any))) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  const pending = await prisma.driver.findMany({
    where: { verificationStatus: "PENDING" },
    include: {
      documents: true,
      user: { select: { name: true, email: true, image: true } },
    },
    orderBy: { appliedAt: "asc" },
  });

  return NextResponse.json({ drivers: pending });
}