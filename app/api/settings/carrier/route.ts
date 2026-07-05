import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const staff = await prisma.staff.findUnique({
      where: { userId: session.user.id },
    });

    if (!staff || staff.role !== "CARRIER_ADMIN") {
      return NextResponse.json(
        { message: "Only carrier admins can update company settings" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, email, phone, address } = body;

    const carrier = await prisma.carrier.update({
      where: { id: staff.carrierId },
      data: {
        ...(name !== undefined && { name }),
        ...(email !== undefined && { email }),
        ...(phone !== undefined && { phone }),
        ...(address !== undefined && { address }),
      },
    });

    return NextResponse.json({ success: true, carrier });
  } catch (error) {
    console.error("[PATCH /api/settings/carrier]", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}