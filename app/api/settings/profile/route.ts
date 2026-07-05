import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { name, email } = await request.json();

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: { name, email },
    });

    return NextResponse.json({ success: true, user });
  } catch (error) {
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}