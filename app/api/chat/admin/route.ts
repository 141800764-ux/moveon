import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const admins = await prisma.user.findMany({
      where: {
        role: { in: ["SUPER_ADMIN", "CARRIER_ADMIN", "DISPATCHER"] },
      },
      select: { id: true, name: true, image: true, role: true },
    });

    return NextResponse.json({ success: true, admins });
  } catch (error) {
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}