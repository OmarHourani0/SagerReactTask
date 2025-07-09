import {
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
  Typography,
  Box,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import type { Zone } from "../types/Zone";
import type { Polygon } from "../types/Polygon";

export type ZoneTableProps = {
  zones: Zone[];
  polygons: Polygon[];
  onZoneChange: (id: string, field: keyof Zone, value: string) => void;
  onDelete: (id: string) => void;
  onColorChange?: (id: string, color: string) => void;
};

const ZONE_TYPES = ["Site Layout", "Site Details", "Site Boundary", "Other"];

const ZoneTable = ({
  zones,
  polygons,
  onZoneChange,
  onDelete,
  onColorChange,
}: ZoneTableProps) => {
  // Only show zones with a matching polygon
  const polygonIds = new Set(polygons.map((p) => p.id));
  const safeZones = Array.isArray(zones)
    ? zones.filter((z) => z && typeof z.id === "string" && polygonIds.has(z.id))
    : [];

  return (
    <>
      {safeZones.length === 0 ? (
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          height="100%"
        >
          <Typography variant="h5" sx={{ color: "#222", mb: 2 }}>
            No Zones Available Yet!
          </Typography>
          <Typography sx={{ color: "#888", mb: 2 }}>
            You can add zones by drawing on the map.
          </Typography>
        </Box>
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
                {safeZones.map((zone) => (
                  <TableRow
                    key={zone.id}
                    sx={{ borderBottom: "1px solid #F0F0F0" }}
                  >
                    <TableCell>
                      <input
                        type="color"
                        value={zone.color}
                        onChange={(e) => {
                          const newColor = e.target.value;
                          onZoneChange(zone.id, "color", newColor);
                          if (onColorChange) onColorChange(zone.id, newColor);
                        }}
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
                          onZoneChange(zone.id, "name", e.target.value)
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
                          onZoneChange(
                            zone.id,
                            "type",
                            e.target.value as string
                          )
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
                    <TableCell>
                      {Number(zone.area || 0).toFixed(2)} m²
                    </TableCell>
                    <TableCell>
                      <TextField
                        variant="outlined"
                        value={zone.parameters}
                        onChange={(e) =>
                          onZoneChange(zone.id, "parameters", e.target.value)
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
                      <IconButton onClick={() => onDelete(zone.id)}>
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
    </>
  );
};

export default ZoneTable;
