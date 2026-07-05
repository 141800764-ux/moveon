import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const route = await prisma.route.findUnique({
      where: { id },
      include: {
        driver: true,
        vehicle: true,
        hub: true,
        stops: { orderBy: { sequence: "asc" } },
      },
    });

    if (!route) {
      return NextResponse.json({ message: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, route });
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

    const route = await prisma.route.update({
      where: { id },
      data: body,
    });

    return NextResponse.json({ success: true, route });
  } catch (error) {
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}