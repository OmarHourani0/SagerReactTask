import type { Feature, Polygon as GeoPolygon } from "geojson";
import type { Polygon } from "../../types/Polygon";
import MapboxDraw from "@mapbox/mapbox-gl-draw";

export const getDraw = (ref: unknown): InstanceType<typeof MapboxDraw> | null =>
  ref && typeof ref === "object" && "getAll" in ref
    ? (ref as InstanceType<typeof MapboxDraw>)
    : null;

export const extractPolys = (features: Feature[], safePolygons: Polygon[]) =>
  features
    .filter((f) => f.geometry.type === "Polygon")
    .map((f, idx) => {
      const coords = (f.geometry as GeoPolygon).coordinates[0].slice(0, -1);
      const coordinates = coords.filter(
        (pt): pt is [number, number] =>
          Array.isArray(pt) &&
          pt.length === 2 &&
          typeof pt[0] === "number" &&
          typeof pt[1] === "number"
      );
      return {
        id: String(f.id),
        coordinates,
        color:
          f.properties && typeof f.properties.color === "string"
            ? f.properties.color
            : safePolygons[idx]?.color,
      };
    }); 