import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, image, phone, address, city, country, bio } = body;

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        ...(name !== undefined && { name }),
        ...(image !== undefined && { image }),
      },
    });

    // Update customer profile fields if they exist
    const customer = await prisma.customer.findUnique({
      where: { userId: session.user.id },
    });

    if (customer) {
      await prisma.customer.update({
        where: { userId: session.user.id },
        data: {
          ...(phone !== undefined && { phone }),
          ...(address !== undefined && { address }),
          ...(city !== undefined && { city }),
          ...(country !== undefined && { country }),
          ...(bio !== undefined && { bio }),
          ...(name !== undefined && { fullName: name }),
        },
      });
    }

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error("[PATCH /api/settings/profile]", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}