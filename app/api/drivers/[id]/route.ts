import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const driver = await prisma.driver.findUnique({
      where: { id },
      include: { user: true, vehicle: true, shifts: true },
    });

    if (!driver) {
      return NextResponse.json({ message: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, driver });
  } catch (error) {
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    const driver = await prisma.driver.update({
      where: { id },
      data: body,
    });

    return NextResponse.json({ success: true, driver });
  } catch (error) {
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}