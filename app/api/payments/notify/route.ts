import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const params = new URLSearchParams(body);
    const paymentId = params.get("m_payment_id");
    const paymentStatus = params.get("payment_status");

    if (!paymentId) {
      return new NextResponse("OK");
    }

    if (paymentStatus === "COMPLETE") {
      await prisma.payment.update({
        where: { id: paymentId },
        data: {
          status: "PAID",
          payfastId: params.get("pf_payment_id") || undefined,
        },
      });

      const payment = await prisma.payment.findUnique({
        where: { id: paymentId },
      });

      if (payment) {
        await prisma.order.update({
          where: { id: payment.orderId },
          data: { status: "CONFIRMED" },
        });
      }
    }

    return new NextResponse("OK");
  } catch (error) {
    return new NextResponse("OK");
  }
}