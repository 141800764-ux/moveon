import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { role } = await request.json();

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) {
    return NextResponse.json({ message: "User not found" }, { status: 404 });
  }

  if (!user.roles.includes(role)) {
    return NextResponse.json(
      { message: "You're not approved for this role yet" },
      { status: 403 }
    );
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { role },
  });

  return NextResponse.json({ role });
}