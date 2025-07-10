import { TableRow, TableCell } from "@mui/material";

const ZoneTableHeader = () => (
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
);

export default ZoneTableHeader;
