import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

function generateSignature(data: Record<string, string>, passphrase?: string): string {
  let str = Object.entries(data)
    .filter(([, v]) => v !== "")
    .map(([k, v]) => `${k}=${encodeURIComponent(v).replace(/%20/g, "+")}`)
    .join("&");

  if (passphrase) {
    str += `&passphrase=${encodeURIComponent(passphrase).replace(/%20/g, "+")}`;
  }

  return crypto.createHash("md5").update(str).digest("hex");
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { orderId, method } = await request.json();

    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return NextResponse.json({ message: "Order not found" }, { status: 404 });
    }

    const payment = await prisma.payment.upsert({
      where: { orderId },
      update: { method, status: "PENDING" },
      create: {
        orderId,
        amount: order.deliveryFee ?? 0,
        method,
        status: "PENDING",
      },
    });

    if (method === "CARD") {
      const merchantId = process.env.PAYFAST_MERCHANT_ID || "10000100";
      const merchantKey = process.env.PAYFAST_MERCHANT_KEY || "46f0cd694581a";
      const baseUrl = process.env.NEXTAUTH_URL || "https://moveon-xi.vercel.app";
      const isSandbox = !process.env.PAYFAST_MERCHANT_ID || process.env.PAYFAST_MERCHANT_ID === "10000100";
      const payfastBase = isSandbox
        ? "https://sandbox.payfast.co.za/eng/process"
        : "https://www.payfast.co.za/eng/process";

      const nameParts = (session.user.name || "Customer").split(" ");

      const data: Record<string, string> = {
        merchant_id: merchantId,
        merchant_key: merchantKey,
        return_url: `${baseUrl}/customer/orders/${orderId}?payment=success`,
        cancel_url: `${baseUrl}/customer/orders/${orderId}?payment=cancelled`,
        notify_url: `${baseUrl}/api/payments/notify`,
        name_first: nameParts[0] || "Customer",
        name_last: nameParts.slice(1).join(" ") || "User",
        email_address: session.user.email || "",
        m_payment_id: payment.id,
        amount: Number(order.deliveryFee ?? 0).toFixed(2),
        item_name: `MoveOn Delivery ${order.trackingNumber}`,
        item_description: `Delivery from ${(order.origin as any)?.city || ""} to ${(order.destination as any)?.city || ""}`,
      };

      const signature = generateSignature(data);
      data.signature = signature;

      const payfastUrl = `${payfastBase}?${new URLSearchParams(data).toString()}`;

      return NextResponse.json({ success: true, payment, payfastUrl });
    }

    // Cash payment — confirm order immediately
    await prisma.order.update({
      where: { id: orderId },
      data: { status: "CONFIRMED" },
    });

    return NextResponse.json({ success: true, payment });
  } catch (error) {
    console.error("[POST /api/payments]", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}