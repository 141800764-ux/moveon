import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { token } = await params;
    const { reason } = await request.json();

    await prisma.driverApplication.update({
      where: { token },
      data: {
        status: "REJECTED",
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[REJECT DRIVER]", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}