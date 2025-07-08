import {
  useState,
  useEffect,
  useRef,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from "react";
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  TextField,
  Select,
  MenuItem,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import Map, { Source, Layer } from "react-map-gl";
import mapboxgl from "mapbox-gl";
import MapboxDraw from "@mapbox/mapbox-gl-draw";
import "mapbox-gl/dist/mapbox-gl.css";
import "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css";
import * as turf from "@turf/turf";
import type { Feature, Polygon as GeoPolygon } from "geojson";
import type { ForwardedRef } from "react";

const MAPBOX_TOKEN =
  "pk.eyJ1Ijoib21hcmhvdXJhbmkiLCJhIjoiY21jdDRtMmt6MDFvbjJvcXRjZjU3d3owdCJ9.fGx_F25Q7WL8F0N9Bd8XhQ";

const ZONE_COLORS = [
  "#FFD600",
  "#00C853",
  "#0091EA",
  "#D50000",
  "#FF6D00",
  "#00B8D4",
  "#C51162",
  "#AEEA00",
];

const ZONE_TYPES = ["Site Layout", "Site Details"];

// Polygon: stores coordinates and the MapboxDraw feature ID
type Polygon = { id: string; coordinates: [number, number][] };

// Zone: all metadata for a zone, including polygon and UI fields
type Zone = {
  id: string;
  name: string;
  type: string;
  color: string;
  area: string;
  parameters: string;
  polygon: [number, number][];
};

// lon and lat of Amman
const DEFAULT_CENTER: [number, number] = [35.9106, 31.9544]; // [lng, lat]
const DEFAULT_ZOOM = 15;

// Expose imperative handle for deleting polygons from parent
type ZonesMapHandle = {
  deletePolygonById: (id: string) => void;
};

// Helper to safely get MapboxDraw instance from ref
function getDraw(ref: unknown): InstanceType<typeof MapboxDraw> | null {
  return ref && typeof ref === "object" && "getAll" in ref
    ? (ref as InstanceType<typeof MapboxDraw>)
    : null;
}

// ZonesMap: renders the map, handles drawing/editing polygons
const ZonesMap = forwardRef(function ZonesMap(
  {
    polygons,
    setPolygons,
    zoneColors,
  }: {
    polygons: Polygon[];
    setPolygons: React.Dispatch<React.SetStateAction<Polygon[]>>;
    zoneColors: string[];
  },
  ref: ForwardedRef<ZonesMapHandle>
) {
  // Mapbox map and draw control refs
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const drawRef = useRef<unknown>(null);

  // Initialize MapboxDraw and load polygons on map load
  const onMapLoad = useCallback(
    (e: { target: mapboxgl.Map }) => {
      const map = e.target;
      mapRef.current = map;
      if (drawRef.current) return;
      const draw = new MapboxDraw({
        displayControlsDefault: false,
        controls: {
          polygon: true,
          trash: true,
          point: true,
          rectangle: true,
          polyline: true,
          edit: true,          
        },
        defaultMode: "draw_polygon",
      });
      map.addControl(draw);
      drawRef.current = draw as unknown;
      // Load existing polygons
      if (polygons.length > 0) {
        polygons.forEach((poly) => {
          if (poly.coordinates.length >= 3) {
            draw.add({
              id: poly.id,
              type: "Feature",
              properties: {},
              geometry: {
                type: "Polygon",
                coordinates: [[...poly.coordinates, poly.coordinates[0]]],
              },
            });
          }
        });
      }
      // Extract polygons from MapboxDraw features (for state sync)
      function extractPolys(features: Feature[]): Polygon[] {
        return features
          .filter((f) => f.geometry.type === "Polygon")
          .map((f) => {
            const coords = (f.geometry as GeoPolygon).coordinates[0].slice(
              0,
              -1
            );
            // Type guard: only keep [number, number] pairs
            const coordinates = coords.filter(
              (pt): pt is [number, number] =>
                Array.isArray(pt) &&
                pt.length === 2 &&
                typeof pt[0] === "number" &&
                typeof pt[1] === "number"
            );
            return { id: String(f.id), coordinates };
          });
      }
      // When a polygon is created, use MapboxDraw's ID as our main ID
      map.on("draw.create", (e: unknown) => {
        const event = e as { features: Feature[] };
        const draw = getDraw(drawRef.current);
        const features = draw ? (draw.getAll().features as Feature[]) : [];
        if (event && event.features && event.features.length > 0) {
          const newFeature = event.features[0];
          // newFeature.id is the MapboxDraw internal ID
          const coords = (
            newFeature.geometry as GeoPolygon
          ).coordinates[0].slice(0, -1);
          const coordinates = coords.filter(
            (pt): pt is [number, number] =>
              Array.isArray(pt) &&
              pt.length === 2 &&
              typeof pt[0] === "number" &&
              typeof pt[1] === "number"
          );
          // Store the polygon using the MapboxDraw ID as its id
          setPolygons((prev) => [
            ...prev,
            { id: String(newFeature.id), coordinates },
          ]);
        } else {
          const newPolys = extractPolys(features);
          setPolygons(newPolys);
        }
      });
      // When a polygon is deleted on the map, update state
      map.on("draw.delete", () => {
        const draw = getDraw(drawRef.current);
        const features = draw ? (draw.getAll().features as Feature[]) : [];
        const newPolys = extractPolys(features);
        setPolygons(newPolys);
      });
      // When a polygon is updated on the map, update state
      map.on("draw.update", () => {
        const draw = getDraw(drawRef.current);
        const features = draw ? (draw.getAll().features as Feature[]) : [];
        const newPolys = extractPolys(features);
        setPolygons(newPolys);
      });
    },
    [setPolygons, polygons]
  );

  // Expose deletePolygonById to parent (Zones)
  useImperativeHandle(ref, () => ({
    deletePolygonById: (id: string) => {
      const draw = getDraw(drawRef.current);
      if (draw) {
        draw.delete(id);
      }
    },
  }));

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
      >
        {/* Render polygons as GeoJSON source/layer for color */}
        {polygons.length > 0 && (
          <Source
            id="zones-polygons"
            type="geojson"
            data={{
              type: "FeatureCollection",
              features: polygons.map((poly, idx) => ({
                type: "Feature",
                properties: {
                  color: zoneColors[idx] || "#FFD600",
                  id: poly.id,
                },
                geometry: {
                  type: "Polygon",
                  coordinates: [[...poly.coordinates, poly.coordinates[0]]],
                },
              })),
            }}
          >
            <Layer
              id="zones-fill"
              type="fill"
              paint={{
                "fill-color": ["get", "color"],
                "fill-opacity": 0.3,
              }}
            />
            <Layer
              id="zones-outline"
              type="line"
              paint={{
                "line-color": ["get", "color"],
                "line-width": 2,
              }}
            />
          </Source>
        )}
      </Map>
    </Box>
  );
});

// Calculate geodesic area of a polygon (in m^2)
function polygonArea(coords: [number, number][]): number {
  if (coords.length < 3) return 0;
  // coords are [lng, lat] for Mapbox
  const geojsonCoords = coords;
  if (
    geojsonCoords.length < 1 ||
    geojsonCoords[0][0] !== geojsonCoords[geojsonCoords.length - 1][0] ||
    geojsonCoords[0][1] !== geojsonCoords[geojsonCoords.length - 1][1]
  ) {
    geojsonCoords.push([...geojsonCoords[0]]);
  }
  const poly = turf.polygon([geojsonCoords]);
  const areaM2 = turf.area(poly);
  return areaM2; // m^2
}

// Zones: main component for managing zones and polygons
function Zones() {
  // Zones state: all metadata for each zone
  const [zones, setZones] = useState<Zone[]>(() => {
    const stored = localStorage.getItem("zones");
    return stored ? JSON.parse(stored) : [];
  });
  // Polygons state: all drawn polygons, keyed by MapboxDraw ID
  const [polygons, setPolygons] = useState<Polygon[]>(() => {
    const stored = localStorage.getItem("polygons");
    if (stored) return JSON.parse(stored);
    // fallback: build from zones if present
    return zones.map((z) => ({ id: z.id, coordinates: z.polygon }));
  });

  // Ref to access ZonesMap's imperative methods
  const zonesMapRef = useRef<ZonesMapHandle>(null);

  // Sync zones with polygons: add, update, or remove zones as polygons change
  useEffect(() => {
    // Add or update zones based on polygons by id
    setZones((prevZones) => {
      // Remove zones for deleted polygons
      const polygonIds = new Set(polygons.map((p) => p.id));
      let newZones = prevZones.filter((z) => polygonIds.has(z.id));
      // Add new zones for new polygons
      const zoneIds = new Set(newZones.map((z) => z.id));
      const newPolys = polygons.filter((p) => !zoneIds.has(p.id));
      if (newPolys.length > 0) {
        const addedZones: Zone[] = newPolys.map((poly, i) => ({
          id: poly.id,
          name: "",
          type: "",
          color: ZONE_COLORS[(newZones.length + i) % ZONE_COLORS.length],
          area: polygonArea(poly.coordinates).toFixed(2),
          parameters: "",
          polygon: poly.coordinates,
        }));
        newZones = [...newZones, ...addedZones];
      }
      // Update area and polygon for all zones
      newZones = newZones.map((z) => {
        const poly = polygons.find((p) => p.id === z.id);
        return poly
          ? {
              ...z,
              area: polygonArea(poly.coordinates).toFixed(2),
              polygon: poly.coordinates,
            }
          : z;
      });
      return newZones;
    });
    localStorage.setItem("polygons", JSON.stringify(polygons));
  }, [polygons]);

  // Persist zones to localStorage
  useEffect(() => {
    localStorage.setItem("zones", JSON.stringify(zones));
  }, [zones]);

  // Handle editing zone fields (name, type, color, etc.)
  const handleZoneChange = (id: string, field: keyof Zone, value: string) => {
    setZones((prev) =>
      prev.map((z) => (z.id === id ? { ...z, [field]: value } : z))
    );
  };

  // Delete a zone and its polygon (from both state and map)
  const handleDelete = (id: string) => {
    zonesMapRef.current?.deletePolygonById(id);
    setPolygons((prev) => prev.filter((p) => p.id !== id));
    setZones((prev) => prev.filter((z) => z.id !== id));
  };

  return (
    <Box
      sx={{
        display: "flex",
        gap: 2,
        width: "100%",
        height: "100%",
        p: 3,
        bgcolor: "#fff",
        overflowX: "hidden",
        fontFamily: "Roboto, Inter, Arial, sans-serif",
        boxSizing: "border-box",
      }}
    >
      <Paper
        elevation={2}
        sx={{
          flex: 2,
          bgcolor: "#fff",
          borderRadius: 3,
          p: 3,
          minHeight: 0,
          height: "100%",
          minWidth: 0,
          maxWidth: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
          boxSizing: "border-box",
          alignItems: zones.length === 0 ? "center" : undefined,
          justifyContent: zones.length === 0 ? "center" : undefined,
        }}
      >
        {zones.length === 0 ? (
          <>
            <Typography variant="h5" sx={{ color: "#222", mb: 2 }}>
              No Zones Available Yet!
            </Typography>
            <Typography sx={{ color: "#888", mb: 2 }}>
              You can add zones by drawing on the map.
            </Typography>
          </>
        ) : (
          <>
            <Box
              sx={{
                mb: 2,
                flexShrink: 0,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Typography
                variant="h6"
                sx={{ color: "#000", fontWeight: 700, fontSize: 20 }}
              >
                Zones
              </Typography>
            </Box>
            <TableContainer
              component={Paper}
              sx={{
                bgcolor: "#fff",
                flex: 1,
                overflowY: "auto",
                minWidth: 0,
                maxWidth: "100%",
                height: "100%",
                boxShadow: "none",
              }}
            >
              <Table sx={{ minWidth: "100%" }}>
                <TableHead>
                  <TableRow sx={{ bgcolor: "#F4F5F7" }}>
                    <TableCell
                      sx={{
                        color: "#888",
                        fontWeight: 600,
                        fontSize: 15,
                        borderBottom: "1px solid #E0E0E0",
                      }}
                    >
                      Color
                    </TableCell>
                    <TableCell
                      sx={{
                        color: "#888",
                        fontWeight: 600,
                        fontSize: 15,
                        borderBottom: "1px solid #E0E0E0",
                      }}
                    >
                      Zone Name
                    </TableCell>
                    <TableCell
                      sx={{
                        color: "#888",
                        fontWeight: 600,
                        fontSize: 15,
                        borderBottom: "1px solid #E0E0E0",
                      }}
                    >
                      Type
                    </TableCell>
                    <TableCell
                      sx={{
                        color: "#888",
                        fontWeight: 600,
                        fontSize: 15,
                        borderBottom: "1px solid #E0E0E0",
                      }}
                    >
                      Area
                    </TableCell>
                    <TableCell
                      sx={{
                        color: "#888",
                        fontWeight: 600,
                        fontSize: 15,
                        borderBottom: "1px solid #E0E0E0",
                      }}
                    >
                      Parameters
                    </TableCell>
                    <TableCell
                      sx={{
                        color: "#888",
                        fontWeight: 600,
                        fontSize: 15,
                        borderBottom: "1px solid #E0E0E0",
                      }}
                    >
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {zones.map((zone) => (
                    <TableRow
                      key={zone.id}
                      sx={{ borderBottom: "1px solid #F0F0F0" }}
                    >
                      <TableCell>
                        <input
                          type="color"
                          value={zone.color}
                          onChange={(e) =>
                            handleZoneChange(zone.id, "color", e.target.value)
                          }
                          style={{
                            width: 28,
                            height: 28,
                            border: "none",
                            background: "none",
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          variant="outlined"
                          value={zone.name}
                          onChange={(e) =>
                            handleZoneChange(zone.id, "name", e.target.value)
                          }
                          InputProps={{
                            sx: {
                              fontWeight: 500,
                              fontSize: 15,
                              bgcolor: "#F9FAFB",
                              borderRadius: 1,
                            },
                          }}
                          sx={{ width: 120 }}
                        />
                      </TableCell>
                      <TableCell>
                        <Select
                          variant="outlined"
                          value={zone.type}
                          onChange={(e) =>
                            handleZoneChange(zone.id, "type", e.target.value)
                          }
                          displayEmpty
                          sx={{
                            width: 120,
                            bgcolor: "#F9FAFB",
                            borderRadius: 1,
                          }}
                        >
                          <MenuItem value="">
                            <em>Type</em>
                          </MenuItem>
                          {ZONE_TYPES.map((type) => (
                            <MenuItem key={type} value={type}>
                              {type}
                            </MenuItem>
                          ))}
                        </Select>
                      </TableCell>
                      <TableCell>{zone.area} m²</TableCell>
                      <TableCell>
                        <TextField
                          variant="outlined"
                          value={zone.parameters}
                          onChange={(e) =>
                            handleZoneChange(
                              zone.id,
                              "parameters",
                              e.target.value
                            )
                          }
                          InputProps={{
                            sx: {
                              fontWeight: 500,
                              fontSize: 15,
                              bgcolor: "#F9FAFB",
                              borderRadius: 1,
                            },
                          }}
                          sx={{ width: 120 }}
                        />
                      </TableCell>
                      <TableCell>
                        <IconButton onClick={() => handleDelete(zone.id)}>
                          <DeleteIcon sx={{ color: "#D50000" }} />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        )}
      </Paper>
      <Box sx={{ flex: 1, height: "100%", minWidth: 0 }}>
        {/* Map component for drawing and editing zones */}
        <ZonesMap
          ref={zonesMapRef}
          polygons={polygons}
          setPolygons={setPolygons}
          zoneColors={zones.map((z) => z.color)}
        />
      </Box>
    </Box>
  );
}

export default Zones;
