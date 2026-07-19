import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
      update: { method, status: method === "CASH" ? "PENDING" : "PENDING" },
      create: {
        orderId,
        amount: order.deliveryFee ?? 0,
        method,
        status: "PENDING",
      },
    });

    if (method === "CARD") {
      const merchantId = process.env.PAYFAST_MERCHANT_ID;
      const merchantKey = process.env.PAYFAST_MERCHANT_KEY;
      const returnUrl = `${process.env.NEXTAUTH_URL}/customer/orders/${orderId}?payment=success`;
      const cancelUrl = `${process.env.NEXTAUTH_URL}/customer/orders/${orderId}?payment=cancelled`;
      const notifyUrl = `${process.env.NEXTAUTH_URL}/api/payments/notify`;

      const payfastUrl = process.env.NODE_ENV === "production"
        ? "https://www.payfast.co.za/eng/process"
        : "https://sandbox.payfast.co.za/eng/process";

      const params = new URLSearchParams({
        merchant_id: merchantId || "",
        merchant_key: merchantKey || "",
        return_url: returnUrl,
        cancel_url: cancelUrl,
        notify_url: notifyUrl,
        name_first: session.user.name?.split(" ")[0] || "",
        name_last: session.user.name?.split(" ")[1] || "",
        email_address: session.user.email || "",
        m_payment_id: payment.id,
        amount: Number(order.deliveryFee ?? 0).toFixed(2),
        item_name: `MoveOn Order ${order.trackingNumber}`,
      });

      return NextResponse.json({
        success: true,
        payment,
        payfastUrl: `${payfastUrl}?${params.toString()}`,
      });
    }

    return NextResponse.json({ success: true, payment });
  } catch (error) {
    console.error("[POST /api/payments]", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}