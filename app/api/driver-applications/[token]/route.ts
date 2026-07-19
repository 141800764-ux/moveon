import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const application = await prisma.driverApplication.findUnique({
      where: { token },
    });

    if (!application) {
      return NextResponse.json({ message: "Invalid link" }, { status: 404 });
    }

    return NextResponse.json({ success: true, application });
  } catch (error) {
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const body = await request.json();

    const application = await prisma.driverApplication.update({
      where: { token },
      data: { ...body, status: "SUBMITTED" },
    });

    return NextResponse.json({ success: true, application });
  } catch (error) {
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}