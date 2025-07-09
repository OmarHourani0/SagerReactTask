import { useRef, forwardRef, useImperativeHandle } from "react";
import Map from "react-map-gl";
import mapboxgl from "mapbox-gl";
import MapboxDraw from "@mapbox/mapbox-gl-draw";
import "mapbox-gl/dist/mapbox-gl.css";
import "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css";
import type { Feature, Polygon as GeoPolygon } from "geojson";
import { Box } from "@mui/material";
import type { Polygon } from "../types/Polygon";
import type { Zone } from "../types/Zone";
import { calculateArea } from "../helpers/area";

// Mapbox public access token (required for map)
const MAPBOX_TOKEN =
  "pk.eyJ1Ijoib21hcmhvdXJhbmkiLCJhIjoiY21jdDRtMmt6MDFvbjJvcXRjZjU3d3owdCJ9.fGx_F25Q7WL8F0N9Bd8XhQ";

// lon and lat of Amman
const DEFAULT_CENTER: [number, number] = [35.9106, 31.9544]; // [lng, lat]
const DEFAULT_ZOOM = 12;

export type ZonesMapHandle = {
  deletePolygonById: (id: string) => void;
  getAreasById: () => Record<string, number>;
  setPolygonColorById: (id: string, color: string) => void;
};

function getDraw(ref: unknown): InstanceType<typeof MapboxDraw> | null {
  return ref && typeof ref === "object" && "getAll" in ref
    ? (ref as InstanceType<typeof MapboxDraw>)
    : null;
}

const DEFAULT_COLORS = [
  "#FFD600",
  "#00C853",
  "#0091EA",
  "#D50000",
  "#FF6D00",
  "#00B8D4",
  "#C51162",
  "#AEEA00",
];

const ZonesMap = forwardRef<
  ZonesMapHandle,
  {
    polygons: Polygon[];
    zones: Zone[];
    onPolygonsChange: (newPolygons: Polygon[]) => void;
    onAreasUpdate: (areas: Record<string, number>) => void;
  }
>(function ZonesMap({ polygons, zones, onPolygonsChange, onAreasUpdate }, ref) {
  // Mapbox map and draw control refs
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const drawRef = useRef<unknown>(null);

  // Only show polygons with a matching zone
  const zoneIds = new Set(zones.map((z) => z.id));
  const safePolygons = Array.isArray(polygons)
    ? polygons.filter((p) => p && typeof p.id === "string" && zoneIds.has(p.id))
    : [];

  // Helper to get color for a polygon
  function getColor(idx: number) {
    return (
      safePolygons[idx]?.color || DEFAULT_COLORS[idx % DEFAULT_COLORS.length]
    );
  }

  // MapboxDraw and map event logic
  function onMapLoad(e: { target: mapboxgl.Map }) {
    const map = e.target;
    mapRef.current = map;
    if (drawRef.current) return;
    // Add draw controls (polygon, trash, etc.)
    const draw = new MapboxDraw({
      displayControlsDefault: false,
      controls: {
        polygon: true,
        trash: true,
        point: false,
        rectangle: false,
        polyline: false,
        edit: true,
      },
      defaultMode: "draw_polygon",
      styles: [
        {
          id: "gl-draw-polygon-fill-custom",
          type: "fill",
          filter: ["all", ["==", "$type", "Polygon"]],
          paint: {
            "fill-color": ["get", "color"],
            "fill-opacity": 0.4,
          },
        },
        {
          id: "gl-draw-polygon-stroke-custom",
          type: "line",
          filter: ["all", ["==", "$type", "Polygon"]],
          paint: {
            "line-color": ["get", "color"],
            "line-width": 2,
          },
        },
      ],
    });
    map.addControl(draw);
    drawRef.current = draw as unknown;
    // Load existing polygons from state, with color styling as feature property
    if (safePolygons.length > 0) {
      safePolygons.forEach((poly, idx) => {
        if (poly.coordinates.length >= 3) {
          const feature = {
            id: poly.id,
            type: "Feature",
            properties: {
              color: poly.color || getColor(idx),
            },
            geometry: {
              type: "Polygon",
              coordinates: [[...poly.coordinates, poly.coordinates[0]]],
            },
          };
          const [id] = draw.add(feature);
          draw.setFeatureProperty(id, "color", poly.color || getColor(idx));
        }
      });
    }
    // Extract polygons from MapboxDraw features (for state sync)
    function extractPolys(features: Feature[]): Polygon[] {
      return features
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
                : getColor(idx),
          };
        });
    }
    // When a polygon is created, use MapboxDraw's ID as our main ID
    map.on("draw.create", () => {
      const draw = getDraw(drawRef.current);
      const features = draw ? (draw.getAll().features as Feature[]) : [];
      const newPolys = extractPolys(features);
      onPolygonsChange(newPolys);
    });
    // When a polygon is deleted on the map, update state
    map.on("draw.delete", () => {
      const draw = getDraw(drawRef.current);
      const features = draw ? (draw.getAll().features as Feature[]) : [];
      const newPolys = extractPolys(features);
      onPolygonsChange(newPolys);
    });    
  }

  // useImperativeHandle is a React hook that allows this child component to expose imperative methods
  // (like deletePolygonById, getAreasById, setPolygonColorById) to its parent via a ref.
  // This is necessary when the parent needs to call functions on the child directly 
  // (e.g., to delete a polygon from outside the map component).
  // It should be used sparingly and only when parent-to-child imperative control is required.
  useImperativeHandle(ref, () => ({
    deletePolygonById: (id: string) => {
      const draw = getDraw(drawRef.current);
      if (draw) {
        draw.delete(id);
      }
    },
    getAreasById: () => {
      const draw = getDraw(drawRef.current);
      if (!draw) return {};
      const features = draw.getAll().features as Feature[];
      const areas: Record<string, number> = {};
      features.forEach((f) => {
        if (f.geometry.type === "Polygon" && f.id) {
          let coords = (f.geometry as GeoPolygon).coordinates[0];
          // Ensure the ring is closed
          if (
            coords.length &&
            (coords[0][0] !== coords[coords.length - 1][0] ||
              coords[0][1] !== coords[coords.length - 1][1])
          ) {
            coords = [...coords, coords[0]];
          }
          // Use helper for area calculation
          areas[String(f.id)] = calculateArea(coords as [number, number][]);
        }
      });
      onAreasUpdate(areas);
      return areas;
    },
    setPolygonColorById: (id: string, color: string) => {
      const draw = getDraw(drawRef.current);
      if (draw) {
        try {
          draw.setFeatureProperty(id, "color", color);
        } catch {
          // fallback: remove and re-add if setFeatureProperty is not supported
          const feature = draw.get(id);
          if (feature) {
            draw.delete(id);
            feature.properties = { ...feature.properties, color };
            draw.add(feature);
          }
        }
      }
    },
  }));

  // Map UI
  return (
    <Box
      sx={{
        width: "100%",
        maxWidth: "100%",
        height: "100%",
        borderRadius: 3,
        boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
        border: "1px solid #E0E0E0",
        overflow: "hidden",
        bgcolor: "#fff",
        boxSizing: "border-box",
      }}
    >
      <Map
        initialViewState={{
          longitude: DEFAULT_CENTER[0],
          latitude: DEFAULT_CENTER[1],
          zoom: DEFAULT_ZOOM,
        }}
        style={{ width: "100%", height: "100%", borderRadius: 12 }}
        mapStyle="mapbox://styles/mapbox/streets-v11"
        mapboxAccessToken={MAPBOX_TOKEN}
        onLoad={onMapLoad}
      ></Map>
    </Box>
  );
});

export default ZonesMap;
