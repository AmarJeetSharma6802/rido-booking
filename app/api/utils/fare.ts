export function calculateFare(
  baseFare: number,
  perKmRate: number,
  distance: number
) {
  return baseFare + perKmRate * distance;
}