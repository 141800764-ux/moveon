import { NextRequest, NextResponse } from "next/server";
import { geocodeAddress } from "@/lib/utils/geocode";
import { calculateDistanceKm, calculateDeliveryFee } from "@/lib/utils/distance";

export async function POST(request: NextRequest) {
  try {
    const { originAddress, originCity, destinationAddress, destinationCity } =
      await request.json();

    if (!originAddress || !originCity || !destinationAddress || !destinationCity) {
      return NextResponse.json(
        { message: "All address fields are required" },
        { status: 400 }
      );
    }

    const [origin, destination] = await Promise.all([
      geocodeAddress(originAddress, originCity),
      geocodeAddress(destinationAddress, destinationCity),
    ]);

    if (!origin || !destination) {
      return NextResponse.json(
        { message: "Could not find one or both addresses. Please check and try again." },
        { status: 400 }
      );
    }

    const distanceKm = calculateDistanceKm(
      origin.lat,
      origin.lng,
      destination.lat,
      destination.lng
    );

    const deliveryFee = calculateDeliveryFee(distanceKm);

    return NextResponse.json({
      success: true,
      origin,
      destination,
      distanceKm: Math.round(distanceKm * 10) / 10,
      deliveryFee,
    });
  } catch (error) {
    console.error("[POST /api/orders/quote]", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}