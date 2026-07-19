import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { targetRole } = await request.json();
    const allowedRoles = ["SUPER_ADMIN", "CARRIER_ADMIN", "DISPATCHER", "DRIVER"];

    if (!allowedRoles.includes(targetRole)) {
      return NextResponse.json({ message: "Invalid role" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    const userRoles = (user as any)?.roles ?? [];
    if (!userRoles.includes(targetRole) && !userRoles.includes("SUPER_ADMIN")) {
      return NextResponse.json({ message: "Unauthorized role switch" }, { status: 403 });
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: { role: targetRole },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}