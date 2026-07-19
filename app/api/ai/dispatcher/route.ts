import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { stopId, failureReason } = await request.json();

    const stop = await prisma.stop.findUnique({
      where: { id: stopId },
      include: {
        route: {
          include: { driver: true, hub: true },
        },
        shipment: {
          include: {
            order: {
              include: { customer: true },
            },
            events: { orderBy: { createdAt: "desc" }, take: 5 },
          },
        },
      },
    });

    if (!stop) {
      return NextResponse.json({ message: "Stop not found" }, { status: 404 });
    }

    const attemptCount = stop.shipment?.attemptCount ?? 0;
    const address = stop.address as any;

    const prompt = `You are an AI dispatcher for MoveOn, a South African logistics company.

A delivery has failed. Here are the details:

- Stop: ${stop.sequence} of route
- Address: ${address?.address}, ${address?.city}
- Contact: ${stop.contactName || "Unknown"} (${stop.contactPhone || "No phone"})
- Failure reason: ${failureReason || "Not specified"}
- Delivery attempts so far: ${attemptCount}
- Driver: ${stop.route?.driver?.fullName || "Unknown"}
- Hub: ${stop.route?.hub?.name || "Unknown"}
- Recent events: ${stop.shipment?.events?.map((e) => e.description).join(", ") || "None"}

Based on this information, provide a recommendation in JSON format with these fields:
{
  "action": "RETRY_TOMORROW" | "RETURN_TO_SENDER" | "CONTACT_CUSTOMER" | "HOLD_AT_HUB",
  "reason": "Brief explanation",
  "customerMessage": "SMS message to send to customer (max 160 chars)",
  "priority": "LOW" | "MEDIUM" | "HIGH",
  "notes": "Internal notes for the dispatcher"
}

Rules:
- If attempt >= 3, always recommend RETURN_TO_SENDER
- If reason is "refused delivery", recommend RETURN_TO_SENDER
- If reason suggests wrong address, recommend CONTACT_CUSTOMER
- Otherwise recommend RETRY_TOMORROW for first 2 attempts
- Keep customer message friendly and professional`;

    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 500,
      messages: [{ role: "user", content: prompt }],
    });

    const content = response.content[0];
    if (content.type !== "text") {
      throw new Error("Unexpected response type");
    }

    // Parse JSON from response
    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No JSON found in response");
    }

    const recommendation = JSON.parse(jsonMatch[0]);

    // Save the recommendation as a shipment event
    if (stop.shipmentId) {
      await prisma.shipmentEvent.create({
        data: {
          shipmentId: stop.shipmentId,
          type: "AI_DISPATCH_RECOMMENDATION",
          description: `AI Dispatcher: ${recommendation.action} — ${recommendation.reason}`,
          actor: "AI_DISPATCHER",
        },
      });
    }

    return NextResponse.json({
      success: true,
      recommendation,
    });
  } catch (error) {
    console.error("[POST /api/ai/dispatcher]", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}