import {
  TableRow,
  TableCell,
  TextField,
  Select,
  MenuItem,
  IconButton,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import type { Zone } from "../../types/Zone";
// import { useState } from "react";

interface ZoneTableRowProps {
  zone: Zone;
  onZoneChange: (id: string, field: keyof Zone, value: string) => void;
  onDelete: (id: string) => void;
  ZONE_TYPES: string[];
}

const ZoneTableRow = ({
  zone,
  onZoneChange,
  onDelete,
  ZONE_TYPES,
}: ZoneTableRowProps) => (
  <TableRow sx={{ borderBottom: "1px solid #F0F0F0" }}>
    <TableCell>
      <input
        type="color"
        value={zone.color || "#3bb2d0"}
        onChange={(e) => onZoneChange(zone.id, "color", e.target.value)}
        style={{
          width: 32,
          height: 32,
          border: "none",
          background: "none",
          cursor: "pointer",
        }}
        title="Pick zone color"
      />
    </TableCell>
    <TableCell>
      <TextField
        variant="outlined"
        value={zone.name}
        onChange={(e) => onZoneChange(zone.id, "name", e.target.value)}
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
          onZoneChange(zone.id, "type", e.target.value as string)
        }
        displayEmpty
        sx={{ width: 120, bgcolor: "#F9FAFB", borderRadius: 1 }}
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
    <TableCell>{Number(zone.area || 0).toFixed(2)} m²</TableCell>
    <TableCell>
      <TextField
        variant="outlined"
        value={zone.parameters}
        onChange={(e) => onZoneChange(zone.id, "parameters", e.target.value)}
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
);

export default ZoneTableRow;
