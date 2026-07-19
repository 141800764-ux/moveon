import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const applications = await prisma.driverApplication.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, applications });
  } catch (error) {
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { email } = await request.json();
    if (!email) {
      return NextResponse.json({ message: "Email required" }, { status: 400 });
    }

    const application = await prisma.driverApplication.create({
      data: { email },
    });

    return NextResponse.json({ success: true, application, token: application.token });
  } catch (error) {
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}