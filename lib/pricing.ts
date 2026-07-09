const RATE_PER_KM = 15;
const MINIMUM_FEE = 50;
const DRIVER_SHARE = 0.8;
const PLATFORM_SHARE = 0.2;

export function calculatePricing(distanceKm: number) {
  const rawFee = distanceKm * RATE_PER_KM;
  const deliveryFee = Math.max(rawFee, MINIMUM_FEE);
  const driverPayout = Math.round(deliveryFee * DRIVER_SHARE * 100) / 100;
  const platformFee = Math.round(deliveryFee * PLATFORM_SHARE * 100) / 100;

  return {
    distanceKm: Math.round(distanceKm * 10) / 10,
    deliveryFee: Math.round(deliveryFee * 100) / 100,
    driverPayout,
    platformFee,
  };
}