import { useState, useRef } from "react";
import { Box } from "@mui/material";
import ZonesMap from "../components/ZonesMap/ZonesMap";
import type { ZonesMapHandle } from "../components/ZonesMap/ZonesMap";
import ZoneTable from "../components/ZoneTable/ZoneTable";
import type { Zone } from "../types/Zone";
import type { Polygon } from "../types/Polygon";
import { getRandomColor } from "../helpers/randomColor";

// Helper to calculate perimeter of a polygon
const calculatePerimeter = (coordinates: [number, number][]): number => {
  if (!coordinates || coordinates.length < 2) return 0;
  let perimeter = 0;
  for (let i = 0; i < coordinates.length - 1; i++) {
    const [x1, y1] = coordinates[i];
    const [x2, y2] = coordinates[i + 1];
    const dx = x2 - x1;
    const dy = y2 - y1;
    perimeter += Math.sqrt(dx * dx + dy * dy) * 111319.9; // rough meters per degree
  }
  // Close the polygon
  const [x1, y1] = coordinates[coordinates.length - 1];
  const [x2, y2] = coordinates[0];
  const dx = x2 - x1;
  const dy = y2 - y1;
  perimeter += Math.sqrt(dx * dx + dy * dy) * 111319.9;
  return perimeter;
};

// Zones: main component for managing zones and polygons
const Zones = () => {
  // Zones state: all metadata for each zone
  const [zones, setZones] = useState<Zone[]>(() => {
    const stored = localStorage.getItem("zones");
    return stored ? JSON.parse(stored) : [];
  });
  // Polygons state: all drawn polygons, keyed by MapboxDraw ID
  const [polygons, setPolygons] = useState<Polygon[]>(() => {
    const stored = localStorage.getItem("polygons");
    return stored ? JSON.parse(stored) : [];
  });

  const [mapKey] = useState(0); // for forcing rerender
  const zonesMapRef = useRef<ZonesMapHandle>(null);

  // Handler for zone metadata changes (name, type, perimeter, etc.)
  const handleZoneChange = (id: string, field: keyof Zone, value: string) => {
    setZones((prevZones) => {
      const newZones = prevZones.map((z) =>
        z.id === id ? { ...z, [field]: value } : z
      );
      localStorage.setItem("zones", JSON.stringify(newZones));
      return newZones;
    });
  };

  // Handler for deleting a zone and its polygon
  const handleDelete = (id: string) => {
    zonesMapRef.current?.deletePolygonById(id);
    setPolygons((prevPolys) => {
      const newPolys = prevPolys.filter((p) => p.id !== id);
      localStorage.setItem("polygons", JSON.stringify(newPolys));
      return newPolys;
    });
    setZones((prevZones) => {
      const newZones = prevZones.filter((z) => z.id !== id);
      localStorage.setItem("zones", JSON.stringify(newZones));
      return newZones;
    });
  };

  // Handler for polygon changes from ZonesMap
  const handlePolygonsChange = (newPolygons: Polygon[]) => {
    setPolygons(newPolygons);
    localStorage.setItem("polygons", JSON.stringify(newPolygons));
    setZones((prevZones) => {
      const polygonIds = new Set(newPolygons.map((p) => p.id));
      const updatedZones = prevZones.filter((z) => polygonIds.has(z.id));
      const zoneIds = new Set(updatedZones.map((z) => z.id));
      const newZonesToAdd = newPolygons
        .filter((poly) => !zoneIds.has(poly.id))
        .map((poly) => ({
          id: poly.id,
          name: "",
          type: "",
          color: getRandomColor(),
          area: "0.00",
          perimeter: "0.00",
          polygon: poly.coordinates,
        }));
      const allZones = [...updatedZones, ...newZonesToAdd];
      if (allZones.length !== prevZones.length) {
        localStorage.setItem("zones", JSON.stringify(allZones));
      }
      return allZones;
    });
    if (
      zonesMapRef.current &&
      typeof zonesMapRef.current.getAreasById === "function"
    ) {
      zonesMapRef.current.getAreasById();
    }
  };

  // Handler for area updates from ZonesMap
  const handleAreasUpdate = (areas: Record<string, number>) => {
    setZones((prevZones) => {
      const updatedZones = prevZones.map((z) => {
        const perimeter = calculatePerimeter(z.polygon).toFixed(2);
        return {
          ...z,
          area:
            typeof areas[z.id] === "number" ? areas[z.id].toFixed(2) : "0.00",
          perimeter,
        };
      });
      localStorage.setItem("zones", JSON.stringify(updatedZones));
      return updatedZones;
    });
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
      <Box
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
        <ZoneTable
          zones={zones}
          polygons={polygons}
          onZoneChange={handleZoneChange}
          onDelete={handleDelete}
        />
      </Box>
      <Box
        sx={{
          flex: 1,
          height: "100%",
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <ZonesMap
          key={mapKey}
          ref={zonesMapRef}
          polygons={polygons}
          zones={zones}
          onPolygonsChange={handlePolygonsChange}
          onAreasUpdate={handleAreasUpdate}
        />
      </Box>
    </Box>
  );
};

export default Zones;
