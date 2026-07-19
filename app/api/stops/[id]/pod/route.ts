import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { put } from "@vercel/blob";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const formData = await request.formData();
    const file = formData.get("photo") as File;

    if (!file) {
      return NextResponse.json({ message: "No photo provided" }, { status: 400 });
    }

    const blob = await put(`pod/${id}-${Date.now()}.jpg`, file, {
      access: "public",
    });

    await prisma.stop.update({
      where: { id },
      data: { podPhotoUrl: blob.url },
    });

    return NextResponse.json({ success: true, url: blob.url });
  } catch (error) {
    console.error("[POST /api/stops/[id]/pod]", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}