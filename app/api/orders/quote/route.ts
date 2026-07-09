import { NextRequest, NextResponse } from "next/server";
import { geocodeAddress } from "@/lib/utils/geocode";
import { calculateDistanceKm, calculateDeliveryFee } from "@/lib/utils/distance";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    let originLat: number;
    let originLng: number;
    let destinationLat: number;
    let destinationLng: number;

    // If coordinates are passed directly (from autocomplete)
    if (body.originLat && body.destinationLat) {
      originLat = body.originLat;
      originLng = body.originLng;
      destinationLat = body.destinationLat;
      destinationLng = body.destinationLng;
    } else {
      // Fall back to geocoding
      const { originAddress, originCity, destinationAddress, destinationCity } = body;

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
          { message: "Could not find one or both addresses." },
          { status: 400 }
        );
      }

      originLat = origin.lat;
      originLng = origin.lng;
      destinationLat = destination.lat;
      destinationLng = destination.lng;
    }

    const distanceKm = calculateDistanceKm(
      originLat, originLng,
      destinationLat, destinationLng
    );

    const deliveryFee = calculateDeliveryFee(distanceKm);
    const driverPayout = Math.round(deliveryFee * 0.8 * 100) / 100;
    const platformFee = Math.round(deliveryFee * 0.2 * 100) / 100;

    return NextResponse.json({
      success: true,
      origin: { lat: originLat, lng: originLng },
      destination: { lat: destinationLat, lng: destinationLng },
      distanceKm: Math.round(distanceKm * 10) / 10,
      deliveryFee,
      driverPayout,
      platformFee,
    });
  } catch (error) {
    console.error("[POST /api/orders/quote]", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}