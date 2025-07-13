import { useRef, forwardRef, useImperativeHandle, useEffect } from "react";
import Map from "react-map-gl";
import mapboxgl from "mapbox-gl";
import MapboxDraw from "@mapbox/mapbox-gl-draw";
import "mapbox-gl/dist/mapbox-gl.css";
import "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css";
import type { Feature, Polygon as GeoPolygon } from "geojson";
import { Box } from "@mui/material";
import type { Polygon } from "../../types/Polygon";
import type { Zone } from "../../types/Zone";
import { calculateArea } from "../../helpers/area";
import { extractPolys, getDraw } from "./drawHandlers";
import { addMapControls } from "./mapControls";
import { getDrawOptions } from "./mapDrawConfig";

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

const ZonesMap = forwardRef<
  ZonesMapHandle,
  {
    polygons: Polygon[];
    zones: Zone[];
    onPolygonsChange: (newPolygons: Polygon[]) => void;
    onAreasUpdate: (areas: Record<string, number>) => void;
  }
>(({ polygons, zones, onPolygonsChange, onAreasUpdate }, ref) => {
  // Mapbox map and draw control refs
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const drawRef = useRef<unknown>(null);

  // Only show polygons with a matching zone
  const zoneIds = new Set(zones.map((z) => z.id));
  const safePolygons = Array.isArray(polygons)
    ? polygons.filter((p) => p && typeof p.id === "string" && zoneIds.has(p.id))
    : [];

  // MapboxDraw and map event logic

  function onMapLoad(e: { target: mapboxgl.Map }) {
    const map = e.target;
    mapRef.current = map;
    if (drawRef.current) return;
    // Use externalized MapboxDraw config
    const draw = new MapboxDraw(getDrawOptions());
    map.addControl(draw);
    addMapControls(map);
    drawRef.current = draw as unknown;
    // Load existing polygons from state, with color styling as feature property
    if (safePolygons.length > 0) {
      safePolygons.forEach((poly) => {
        if (poly.coordinates.length >= 3) {
          const feature = {
            id: poly.id,
            type: "Feature",
            properties: {
              user_portColor: poly.color || "#3bb2d0",
            },
            geometry: {
              type: "Polygon",
              coordinates: [[...poly.coordinates, poly.coordinates[0]]],
            },
          };
          const [id] = draw.add(feature);
          draw.setFeatureProperty(id, "portColor", poly.color || "#3bb2d0");
        }
      });
    }
    // When a polygon is created, update state
    map.on("draw.create", (e: unknown) => {
      const event = e as { features?: { id: string }[] };
      if (event.features && event.features.length > 0) {
        const draw = getDraw(drawRef.current);
        const features = draw ? (draw.getAll().features as Feature[]) : [];
        const newPolys = extractPolys(features, safePolygons);
        onPolygonsChange(newPolys);
      }
    });
    // When a polygon is deleted, update state
    map.on("draw.delete", () => {
      const draw = getDraw(drawRef.current);
      const features = draw ? (draw.getAll().features as Feature[]) : [];
      const newPolys = extractPolys(features, safePolygons);
      onPolygonsChange(newPolys);
    });
    // When selection changes, update selectedPolygonId
    map.on("draw.selectionchange", (e: unknown) => {
      const event = e as { features?: { id: string }[] };
      if (event.features && event.features.length > 0) {
        // selectedPolygonId is no longer needed
      }
    });
    // When a polygon is updated, update selectedPolygonId
    map.on("draw.update", (e: unknown) => {
      const event = e as { features?: { id: string }[] };
      if (event.features && event.features.length > 0) {
        // selectedPolygonId is no longer needed
      }
    });
    // On map click, update selectedPolygonId if a polygon is clicked
    map.on("click", (e: unknown) => {
      const event = e as { point: { x: number; y: number } };
      const draw = getDraw(drawRef.current);
      if (!draw) return;
      const featuresAtPoint = draw.getFeatureIdsAt(event.point);
      if (featuresAtPoint.length > 0) {
        // selectedPolygonId is no longer needed
      }
    });
  }

  // useImperativeHandle used because the Parent components needs to
  // call methods on the child component
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
          draw.setFeatureProperty(id, "portColor", color);
        } catch {
          // fallback: remove and re-add if setFeatureProperty is not supported
          const feature = draw.get(id);
          if (feature) {
            draw.delete(id);
            feature.properties = { ...feature.properties, portColor: color };
            draw.add(feature);
          }
        }
      }
    },
  }));

  // Sync polygon color on the map with the color in the zone when the user picks a color in the table
  useEffect(() => {
    if (!zones || !Array.isArray(zones)) return;
    const draw = getDraw(drawRef.current);
    if (!draw) return;
    zones.forEach((zone) => {
      if (zone.id && zone.color) {
        const feature = draw.get(zone.id);
        if (feature) {
          draw.delete(zone.id);
          feature.properties = {
            ...feature.properties,
            user_portColor: zone.color,
            portColor: zone.color,
          };
          draw.add(feature);
        }
      }
    });
    // No cleanup needed
  }, [zones]);

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
        position: "relative",
      }}
    >
      {/* Color change buttons */}
      <Box
        sx={{
          position: "absolute",
          right: 5,
          top: 10,
          zIndex: 1005,
          display: "flex",
          flexDirection: "column",
          gap: 1,
        }}
      ></Box>
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
