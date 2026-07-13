const LOCATIONIQ_KEY = process.env.LOCATIONIQ_API_KEY || process.env.NEXT_PUBLIC_LOCATIONIQ_API_KEY;

export async function geocodeAddress(
  address: string,
  city: string
): Promise<{ lat: number; lng: number } | null> {
  if (!LOCATIONIQ_KEY) {
    console.error("Missing LOCATIONIQ_API_KEY");
    return null;
  }

  try {
    const queries = [
      `${address}, ${city}, South Africa`,
      `${address}, ${city}`,
      `${city}, South Africa`,
    ];

    for (const query of queries) {
      const encoded = encodeURIComponent(query);
      const res = await fetch(
        `https://us1.locationiq.com/v1/search?key=${LOCATIONIQ_KEY}&q=${encoded}&countrycodes=za&format=json&limit=1`
      );

      if (!res.ok) continue;

      const data = await res.json();

      if (Array.isArray(data) && data.length > 0) {
        return {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon),
        };
      }
    }

    return null;
  } catch (error) {
    console.error("[geocodeAddress]", error);
    return null;
  }
}