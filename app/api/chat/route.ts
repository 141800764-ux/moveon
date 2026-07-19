import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const withUserId = searchParams.get("with");

    const messages = await prisma.chatMessage.findMany({
      where: {
        OR: [
          { fromUserId: session.user.id, toUserId: withUserId || undefined },
          { fromUserId: withUserId || undefined, toUserId: session.user.id },
        ],
      },
      include: {
        fromUser: { select: { name: true, image: true, role: true } },
      },
      orderBy: { createdAt: "asc" },
      take: 100,
    });

    await prisma.chatMessage.updateMany({
      where: { toUserId: session.user.id, isRead: false },
      data: { isRead: true },
    });

    return NextResponse.json({ success: true, messages });
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

    const { toUserId, message } = await request.json();

    if (!toUserId || !message) {
      return NextResponse.json({ message: "Missing fields" }, { status: 400 });
    }

    const chatMessage = await prisma.chatMessage.create({
      data: {
        fromUserId: session.user.id,
        toUserId,
        message,
      },
      include: {
        fromUser: { select: { name: true, image: true, role: true } },
      },
    });

    return NextResponse.json({ success: true, message: chatMessage });
  } catch (error) {
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}