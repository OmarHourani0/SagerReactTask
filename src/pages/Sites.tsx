import { Box, Typography, Tabs, Tab } from "@mui/material";
import { useState as useReactState } from "react";
import Zones from "./Zones";

export default function Sites() {
  const [tab, setTab] = useReactState(4);
  const tabLabels = [
    "Site Main Information",
    "Dashboard",
    "Media",
    "Documentation",
    "Zones",
    "Assets",
    "Integration Hub",
    "Cloud",
  ];
  return (
    <Box
      sx={{
        width: "100%",
        bgcolor: "#F4F5F7",
        minHeight: "calc(100vh - 64px)",
        height: "100%",
        boxSizing: "border-box",
      }}
    >
      <Box sx={{ px: 4, pt: 3, pb: 1 }}>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          textColor="primary"
          indicatorColor="primary"
          sx={{ borderBottom: 1, borderColor: "#E0E0E0" }}
        >
          {tabLabels.map((label, idx) => (
            <Tab
              key={label}
              label={label}
              sx={{
                fontWeight: 600,
                fontSize: 15,
                color: tab === idx ? "#1976d2" : "#888",
                textTransform: "none",
                minWidth: 120,
              }}
            />
          ))}
        </Tabs>
      </Box>
      <Box sx={{ p: 0, height: "100%" }}>
        {tab === 0 && (
          <Typography variant="h4" sx={{ color: "#222", p: 4 }}>
            Site Main Information
          </Typography>
        )}
        {tab === 1 && (
          <Typography variant="h4" sx={{ color: "#222", p: 4 }}>
            Dashboard
          </Typography>
        )}
        {tab === 2 && (
          <Typography variant="h4" sx={{ color: "#222", p: 4 }}>
            Media
          </Typography>
        )}
        {tab === 3 && (
          <Typography variant="h4" sx={{ color: "#222", p: 4 }}>
            Documentation
          </Typography>
        )}
        {tab === 4 && <Zones />}
        {tab === 5 && (
          <Typography variant="h4" sx={{ color: "#222", p: 4 }}>
            Assets
          </Typography>
        )}
        {tab === 6 && (
          <Typography variant="h4" sx={{ color: "#222", p: 4 }}>
            Integration Hub
          </Typography>
        )}
        {tab === 7 && (
          <Typography variant="h4" sx={{ color: "#222", p: 4 }}>
            Cloud
          </Typography>
        )}
      </Box>
    </Box>
  );
}
