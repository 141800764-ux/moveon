import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Get all users who are NOT customers and NOT the current user
    const admins = await prisma.user.findMany({
      where: {
        id: { not: session.user.id },
        role: { not: "CUSTOMER" },
      },
      select: {
        id: true,
        name: true,
        image: true,
        role: true,
      },
      take: 10,
    });

    // If still empty, get any other user at all
    if (admins.length === 0) {
      const anyone = await prisma.user.findMany({
        where: {
          id: { not: session.user.id },
        },
        select: {
          id: true,
          name: true,
          image: true,
          role: true,
        },
        take: 5,
      });
      return NextResponse.json({ success: true, admins: anyone });
    }

    return NextResponse.json({ success: true, admins });
  } catch (error) {
    console.error("[GET /api/chat/admins]", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}