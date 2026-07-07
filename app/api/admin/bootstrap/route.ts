import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get("key");
  const email = searchParams.get("email");

  if (!process.env.BOOTSTRAP_SECRET || key !== process.env.BOOTSTRAP_SECRET) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  if (!email) {
    return NextResponse.json({ message: "Missing email" }, { status: 400 });
  }

  const user = await prisma.user.update({
    where: { email },
    data: {
      role: "SUPER_ADMIN",
      roles: { set: ["CUSTOMER", "SUPER_ADMIN"] },
    },
  });

  return NextResponse.json({ message: "Updated", user });
}