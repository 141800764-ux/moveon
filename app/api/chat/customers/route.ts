import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const customers = await prisma.user.findMany({
      where: { role: "CUSTOMER" },
      select: {
        id: true,
        name: true,
        image: true,
        role: true,
        receivedMessages: {
          where: { isRead: false },
          select: { id: true },
        },
      },
    });

    return NextResponse.json({ success: true, customers });
  } catch (error) {
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}