import { calculateDistanceKm } from "./distance";

type StopPoint = {
  id: string;
  lat: number;
  lng: number;
};

/**
 * Greedy nearest-neighbor sequencing: starting from (startLat, startLng),
 * repeatedly visits whichever remaining stop is closest to the current position.
 * Not a perfect optimizer, but a solid, fast approximation without needing
 * a full VRP solver.
 */
export function sequenceStopsNearestNeighbor<T extends StopPoint>(
  startLat: number,
  startLng: number,
  stops: T[]
): T[] {
  const remaining = [...stops];
  const ordered: T[] = [];
  let currentLat = startLat;
  let currentLng = startLng;

  while (remaining.length > 0) {
    let nearestIndex = 0;
    let nearestDist = Infinity;

    remaining.forEach((stop, index) => {
      const dist = calculateDistanceKm(currentLat, currentLng, stop.lat, stop.lng);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearestIndex = index;
      }
    });

    const [next] = remaining.splice(nearestIndex, 1);
    ordered.push(next);
    currentLat = next.lat;
    currentLng = next.lng;
  }

  return ordered;
}