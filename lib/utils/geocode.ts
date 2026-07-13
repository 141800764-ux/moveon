export async function geocodeAddress(
  address: string,
  city: string
): Promise<{ lat: number; lng: number } | null> {
  try {
    const queries = [
      `${address}, ${city}, South Africa`,
      `${address}, ${city}`,
      `${city}, South Africa`,
    ];

    for (const query of queries) {
      const encoded = encodeURIComponent(query);
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encoded}&format=json&limit=1&countrycodes=za`,
        { headers: { "User-Agent": "MoveOn-Logistics-App/1.0" } }
      );

      const data = await res.json();

      if (data && data.length > 0) {
        return {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon),
        };
      }
    }

    // Final fallback — search without country restriction
    const encoded = encodeURIComponent(`${address} ${city} South Africa`);
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encoded}&format=json&limit=1`,
      { headers: { "User-Agent": "MoveOn-Logistics-App/1.0" } }
    );
    const data = await res.json();

    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
      };
    }

    return null;
  } catch (error) {
    console.error("[geocodeAddress]", error);
    return null;
  }
}