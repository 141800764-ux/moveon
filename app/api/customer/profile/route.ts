import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { name, phone, city } = await request.json();

    await prisma.user.update({
      where: { id: session.user.id },
      data: { name },
    });

    await prisma.customer.upsert({
      where: { userId: session.user.id },
      update: { phone, city, fullName: name },
      create: {
        userId: session.user.id,
        fullName: name,
        phone,
        city,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}