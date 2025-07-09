import * as turf from "@turf/turf";

export function calculateArea(coords: [number, number][]): number {
  if (!coords || coords.length < 3) return 0;
  // Ensure the ring is closed
  const closed =
    coords.length &&
    (coords[0][0] !== coords[coords.length - 1][0] ||
      coords[0][1] !== coords[coords.length - 1][1])
      ? [...coords, coords[0]]
      : coords;
  const poly = turf.polygon([closed]);
  return turf.area(poly);
} 