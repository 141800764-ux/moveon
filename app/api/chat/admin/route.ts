import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Get ALL non-customer users as potential support agents
    const admins = await prisma.user.findMany({
      where: {
        role: {
          notIn: ["CUSTOMER", "DRIVER"],
        },
      },
      select: { id: true, name: true, image: true, role: true },
      take: 10,
    });

    // If still none found, get any user who is not the current user
    if (admins.length === 0) {
      const fallback = await prisma.user.findMany({
        where: {
          id: { not: session.user.id },
          role: { not: "CUSTOMER" },
        },
        select: { id: true, name: true, image: true, role: true },
        take: 5,
      });
      return NextResponse.json({ success: true, admins: fallback });
    }

    return NextResponse.json({ success: true, admins });
  } catch (error) {
    console.error("[GET /api/chat/admins]", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}