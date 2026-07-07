import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const DEFAULT_CARRIER_SLUG = "moveon"; // the single carrier record representing your own business

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  // Prevent duplicate applications
  const existing = await prisma.driver.findUnique({
    where: { userId: session.user.id },
  });
  if (existing) {
    return NextResponse.json(
      { message: "You already have a driver application on file", status: existing.verificationStatus },
      { status: 409 }
    );
  }

  const body = await request.json();
  const {
    phone,
    licenseNumber,
    licenseExpiresAt,
    licenseClasses,
    documents, // [{ type: "ID_DOCUMENT", fileUrl: "https://..." }, ...]
  } = body;

  if (!phone || !licenseNumber || !licenseExpiresAt) {
    return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
  }

  const carrier = await prisma.carrier.findUnique({
    where: { slug: DEFAULT_CARRIER_SLUG },
  });
  if (!carrier) {
    return NextResponse.json({ message: "Carrier not configured" }, { status: 500 });
  }

  const driver = await prisma.driver.create({
    data: {
      userId: session.user.id,
      carrierId: carrier.id,
      fullName: session.user.name ?? "Unnamed Driver",
      phone,
      licenseNumber,
      licenseExpiresAt: new Date(licenseExpiresAt),
      licenseClasses: licenseClasses ?? [],
      verificationStatus: "PENDING",
      documents: {
        create: (documents ?? []).map((d: { type: string; fileUrl: string }) => ({
          type: d.type as any,
          fileUrl: d.fileUrl,
        })),
      },
    },
    include: { documents: true },
  });

  return NextResponse.json({ driver });
}