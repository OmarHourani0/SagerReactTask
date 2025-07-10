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
    const draw = new MapboxDraw({
      // userProperties: true,
      // controls: {
      //   polygon: true,
      //   trash: true,
      //   point: false,
      //   rectangle: false,
      //   polyline: false,
      //   combine_features: false,
      //   uncombine_features: false,
      // },

      userProperties: true,
      controls: {
        combine_features: false,
        uncombine_features: false,
      },
      styles: [
        // default themes provided by MB Draw
        // default themes provided by MB Draw
        // default themes provided by MB Draw
        // default themes provided by MB Draw

        {
          id: "gl-draw-polygon-fill-inactive",
          type: "fill",
          filter: [
            "all",
            ["==", "active", "false"],
            ["==", "$type", "Polygon"],
            ["!=", "mode", "static"],
          ],
          paint: {
            "fill-color": "#3bb2d0",
            "fill-outline-color": "#3bb2d0",
            "fill-opacity": 0.1,
          },
        },
        {
          id: "gl-draw-polygon-fill-active",
          type: "fill",
          filter: ["all", ["==", "active", "true"], ["==", "$type", "Polygon"]],
          paint: {
            "fill-color": "#fbb03b",
            "fill-outline-color": "#fbb03b",
            "fill-opacity": 0.1,
          },
        },
        {
          id: "gl-draw-polygon-midpoint",
          type: "circle",
          filter: ["all", ["==", "$type", "Point"], ["==", "meta", "midpoint"]],
          paint: {
            "circle-radius": 3,
            "circle-color": "#fbb03b",
          },
        },
        {
          id: "gl-draw-polygon-stroke-inactive",
          type: "line",
          filter: [
            "all",
            ["==", "active", "false"],
            ["==", "$type", "Polygon"],
            ["!=", "mode", "static"],
          ],
          layout: {
            "line-cap": "round",
            "line-join": "round",
          },
          paint: {
            "line-color": "#3bb2d0",
            "line-width": 2,
          },
        },
        {
          id: "gl-draw-polygon-stroke-active",
          type: "line",
          filter: ["all", ["==", "active", "true"], ["==", "$type", "Polygon"]],
          layout: {
            "line-cap": "round",
            "line-join": "round",
          },
          paint: {
            "line-color": "#fbb03b",
            "line-dasharray": [0.2, 2],
            "line-width": 2,
          },
        },
        {
          id: "gl-draw-line-inactive",
          type: "line",
          filter: [
            "all",
            ["==", "active", "false"],
            ["==", "$type", "LineString"],
            ["!=", "mode", "static"],
          ],
          layout: {
            "line-cap": "round",
            "line-join": "round",
          },
          paint: {
            "line-color": "#3bb2d0",
            "line-width": 2,
          },
        },
        {
          id: "gl-draw-line-active",
          type: "line",
          filter: [
            "all",
            ["==", "$type", "LineString"],
            ["==", "active", "true"],
          ],
          layout: {
            "line-cap": "round",
            "line-join": "round",
          },
          paint: {
            "line-color": "#fbb03b",
            "line-dasharray": [0.2, 2],
            "line-width": 2,
          },
        },
        {
          id: "gl-draw-polygon-and-line-vertex-stroke-inactive",
          type: "circle",
          filter: [
            "all",
            ["==", "meta", "vertex"],
            ["==", "$type", "Point"],
            ["!=", "mode", "static"],
          ],
          paint: {
            "circle-radius": 5,
            "circle-color": "#fff",
          },
        },
        {
          id: "gl-draw-polygon-and-line-vertex-inactive",
          type: "circle",
          filter: [
            "all",
            ["==", "meta", "vertex"],
            ["==", "$type", "Point"],
            ["!=", "mode", "static"],
          ],
          paint: {
            "circle-radius": 3,
            "circle-color": "#fbb03b",
          },
        },
        {
          id: "gl-draw-point-point-stroke-inactive",
          type: "circle",
          filter: [
            "all",
            ["==", "active", "false"],
            ["==", "$type", "Point"],
            ["==", "meta", "feature"],
            ["!=", "mode", "static"],
          ],
          paint: {
            "circle-radius": 5,
            "circle-opacity": 1,
            "circle-color": "#fff",
          },
        },
        {
          id: "gl-draw-point-inactive",
          type: "circle",
          filter: [
            "all",
            ["==", "active", "false"],
            ["==", "$type", "Point"],
            ["==", "meta", "feature"],
            ["!=", "mode", "static"],
          ],
          paint: {
            "circle-radius": 3,
            "circle-color": "#3bb2d0",
          },
        },
        {
          id: "gl-draw-point-stroke-active",
          type: "circle",
          filter: [
            "all",
            ["==", "$type", "Point"],
            ["==", "active", "true"],
            ["!=", "meta", "midpoint"],
          ],
          paint: {
            "circle-radius": 7,
            "circle-color": "#fff",
          },
        },
        {
          id: "gl-draw-point-active",
          type: "circle",
          filter: [
            "all",
            ["==", "$type", "Point"],
            ["!=", "meta", "midpoint"],
            ["==", "active", "true"],
          ],
          paint: {
            "circle-radius": 5,
            "circle-color": "#fbb03b",
          },
        },
        {
          id: "gl-draw-polygon-fill-static",
          type: "fill",
          filter: ["all", ["==", "mode", "static"], ["==", "$type", "Polygon"]],
          paint: {
            "fill-color": "#404040",
            "fill-outline-color": "#404040",
            "fill-opacity": 0.1,
          },
        },
        {
          id: "gl-draw-polygon-stroke-static",
          type: "line",
          filter: ["all", ["==", "mode", "static"], ["==", "$type", "Polygon"]],
          layout: {
            "line-cap": "round",
            "line-join": "round",
          },
          paint: {
            "line-color": "#404040",
            "line-width": 2,
          },
        },
        {
          id: "gl-draw-line-static",
          type: "line",
          filter: [
            "all",
            ["==", "mode", "static"],
            ["==", "$type", "LineString"],
          ],
          layout: {
            "line-cap": "round",
            "line-join": "round",
          },
          paint: {
            "line-color": "#404040",
            "line-width": 2,
          },
        },
        {
          id: "gl-draw-point-static",
          type: "circle",
          filter: ["all", ["==", "mode", "static"], ["==", "$type", "Point"]],
          paint: {
            "circle-radius": 5,
            "circle-color": "#404040",
          },
        },

        // end default themes provided by MB Draw
        // end default themes provided by MB Draw
        // end default themes provided by MB Draw
        // end default themes provided by MB Draw

        // new styles for toggling colors
        // new styles for toggling colors
        // new styles for toggling colors
        // new styles for toggling colors

        {
          id: "gl-draw-polygon-color-picker",
          type: "fill",
          filter: [
            "all",
            ["==", "$type", "Polygon"],
            ["has", "user_portColor"],
          ],
          paint: {
            "fill-color": ["get", "user_portColor"],
            "fill-outline-color": ["get", "user_portColor"],
            "fill-opacity": 0.5,
          },
        },
        {
          id: "gl-draw-line-color-picker",
          type: "line",
          filter: [
            "all",
            ["==", "$type", "LineString"],
            ["has", "user_portColor"],
          ],
          paint: {
            "line-color": ["get", "user_portColor"],
            "line-width": 2,
          },
        },
        {
          id: "gl-draw-point-color-picker",
          type: "circle",
          filter: ["all", ["==", "$type", "Point"], ["has", "user_portColor"]],
          paint: {
            "circle-radius": 3,
            "circle-color": ["get", "user_portColor"],
          },
        },
      ],
    });
    map.addControl(draw, "top-left");
    addMapControls(map);

    // Add color change handler
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
          draw.setFeatureProperty(
            id,
            "user_portColor",
            poly.color || "#3bb2d0"
          );
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
          draw.setFeatureProperty(id, "user_portColor", color);
        } catch {
          // fallback: remove and re-add if setFeatureProperty is not supported
          const feature = draw.get(id);
          if (feature) {
            draw.delete(id);
            feature.properties = {
              ...feature.properties,
              user_portColor: color,
            };
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
        try {
          draw.setFeatureProperty(zone.id, "user_portColor", zone.color);
        } catch {
          // fallback: remove and re-add if setFeatureProperty is not supported
          const feature = draw.get(zone.id);
          if (feature) {
            draw.delete(zone.id);
            feature.properties = {
              ...feature.properties,
              user_portColor: zone.color,
            };
            draw.add(feature);
          }
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
