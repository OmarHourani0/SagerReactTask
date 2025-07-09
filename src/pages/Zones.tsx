import { useState, useRef, useCallback } from "react";
import { Box } from "@mui/material";
import ZonesMap from "../components/ZonesMap";
import type { ZonesMapHandle } from "../components/ZonesMap";
import ZoneTable from "../components/ZoneTable";
import type { Zone } from "../types/Zone";
import type { Polygon } from "../types/Polygon";

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
    return stored ? JSON.parse(stored) : [];
  });

  const zonesMapRef = useRef<ZonesMapHandle>(null);

  // Handler for zone metadata changes (name, type, color, etc.)
  const handleZoneChange = useCallback(
    (id: string, field: keyof Zone, value: string) => {
      setZones((prevZones) => {
        const newZones = prevZones.map((z) =>
          z.id === id ? { ...z, [field]: value } : z
        );
        localStorage.setItem("zones", JSON.stringify(newZones));
        return newZones;
      });
      if (field === "color") {
        setPolygons((prevPolys) => {
          const newPolys = prevPolys.map((p) =>
            p.id === id ? { ...p, color: value } : p
          );
          localStorage.setItem("polygons", JSON.stringify(newPolys));
          return newPolys;
        });
        if (
          zonesMapRef.current &&
          typeof zonesMapRef.current.setPolygonColorById === "function"
        ) {
          zonesMapRef.current.setPolygonColorById(id, value);
        }
      }
    },
    []
  );

  // Handler for deleting a zone and its polygon
  const handleDelete = useCallback((id: string) => {
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
  }, []);

  // Handler for polygon changes from ZonesMap
  const handlePolygonsChange = useCallback((newPolygons: Polygon[]) => {
    setPolygons(newPolygons);
    localStorage.setItem("polygons", JSON.stringify(newPolygons));
    setZones((prevZones) => {
      const polygonIds = new Set(newPolygons.map((p) => p.id));
      // Remove zones whose polygon no longer exists
      const updatedZones = prevZones.filter((z) => polygonIds.has(z.id));
      const zoneIds = new Set(updatedZones.map((z) => z.id));
      const newZonesToAdd = newPolygons
        .filter((poly) => !zoneIds.has(poly.id))
        .map((poly) => ({
          id: poly.id,
          name: "",
          type: "",
          color: poly.color || "#FFD600",
          area: "0.00",
          parameters: "",
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
  }, []);

  // Handler for area updates from ZonesMap
  const handleAreasUpdate = useCallback((areas: Record<string, number>) => {
    setZones((prevZones) => {
      const updatedZones = prevZones.map((z) => ({
        ...z,
        area: typeof areas[z.id] === "number" ? areas[z.id].toFixed(2) : "0.00",
      }));
      localStorage.setItem("zones", JSON.stringify(updatedZones));
      return updatedZones;
    });
  }, []);

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
          onColorChange={(id, color) => {
            // update internal state
            handleZoneChange(id, "color", color);
            // apply to map
            zonesMapRef.current?.setPolygonColorById(id, color);
          }}
        />
      </Box>
      <Box sx={{ flex: 1, height: "100%", minWidth: 0 }}>
        <ZonesMap
          ref={zonesMapRef}
          polygons={polygons}
          zones={zones}
          onPolygonsChange={handlePolygonsChange}
          onAreasUpdate={handleAreasUpdate}
        />
      </Box>
    </Box>
  );
}

export default Zones;
