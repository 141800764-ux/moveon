const GEOAPIFY_KEY = process.env.NEXT_PUBLIC_GEOAPIFY_KEY;

export async function geocodeAddress(
  address: string,
  city: string
): Promise<{ lat: number; lng: number } | null> {
  if (!GEOAPIFY_KEY) {
    console.error("Missing NEXT_PUBLIC_GEOAPIFY_KEY");
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
        `https://api.geoapify.com/v1/geocode/search?text=${encoded}&filter=countrycode:za&format=json&limit=1&apiKey=${GEOAPIFY_KEY}`
      );

      if (!res.ok) continue;

      const data = await res.json();

      if (data?.results && data.results.length > 0) {
        return {
          lat: data.results[0].lat,
          lng: data.results[0].lon,
        };
      }
    }

    return null;
  } catch (error) {
    console.error("[geocodeAddress]", error);
    return null;
  }
}