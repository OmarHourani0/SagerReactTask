import {
  Table,
  TableBody,
  TableContainer,
  TableHead,
  Paper,
} from "@mui/material";
import type { Zone } from "../../types/Zone";
import type { Polygon } from "../../types/Polygon";
import ZoneTableRow from "./ZoneTableRow";
import ZoneTableHeader from "./ZoneTableHeader";
import ZoneTableEmptyState from "./ZoneTableEmptyState";

export type ZoneTableProps = {
  zones: Zone[];
  polygons: Polygon[];
  onZoneChange: (id: string, field: keyof Zone, value: string) => void;
  onDelete: (id: string) => void;
};

const ZONE_TYPES = ["Site Layout", "Site Details", "Site Boundary", "Other"];

const ZoneTable = ({
  zones,
  polygons,
  onZoneChange,
  onDelete,
}: ZoneTableProps) => {
  // Only show zones with a matching polygon
  const polygonIds = new Set(polygons.map((p) => p.id));
  const safeZones = Array.isArray(zones)
    ? zones.filter((z) => z && typeof z.id === "string" && polygonIds.has(z.id))
    : [];

  return (
    <>
      {safeZones.length === 0 ? (
        <ZoneTableEmptyState />
      ) : (
        <>
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
                <ZoneTableHeader />
              </TableHead>
              <TableBody>
                {safeZones.map((zone) => (
                  <ZoneTableRow
                    key={zone.id}
                    zone={zone}
                    onZoneChange={onZoneChange}
                    onDelete={onDelete}
                    ZONE_TYPES={ZONE_TYPES}
                  />
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}
    </>
  );
};

export default ZoneTable;
