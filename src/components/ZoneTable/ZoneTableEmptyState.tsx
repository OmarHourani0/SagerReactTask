import { Box, Typography } from "@mui/material";

const ZoneTableEmptyState = () => (
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
);

export default ZoneTableEmptyState;
