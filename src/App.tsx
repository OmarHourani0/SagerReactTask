import {
  Box,
  CssBaseline,
  Drawer,
  AppBar,
  Toolbar,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Divider,
  Button,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import DashboardIcon from "@mui/icons-material/Dashboard";
import InventoryIcon from "@mui/icons-material/Inventory";
import CloudIcon from "@mui/icons-material/Cloud";
import AddIcon from "@mui/icons-material/Add";
import ListItemButton from "@mui/material/ListItemButton";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useNavigate,
} from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Inventory from "./pages/Inventory";
import Clients from "./pages/Clients";
import Pilots from "./pages/Pilots";
import StreamingHub from "./pages/StreamingHub";
import Projects from "./pages/Projects";
import Sites from "./pages/Sites";
import Missions from "./pages/Missions";
import Flights from "./pages/Flights";
import Cloud from "./pages/Cloud";
import PeopleIcon from "@mui/icons-material/People";
import PersonIcon from "@mui/icons-material/Person";
import HubIcon from "@mui/icons-material/Hub";
import WorkspacesIcon from "@mui/icons-material/Workspaces";
import LocationCityIcon from "@mui/icons-material/LocationCity";
import FlightTakeoffIcon from "@mui/icons-material/FlightTakeoff";
import AssignmentIcon from "@mui/icons-material/Assignment";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import SagerLogo from "./assets/sager.png";

const drawerWidth = 240;

const theme = createTheme({
  palette: {
    mode: "light",
    primary: { main: "#1976d2" },
    background: { default: "#fff", paper: "#fff" },
    text: { primary: "#000", secondary: "#000" },
  },
  typography: {
    fontFamily: "Roboto, Inter, Arial, sans-serif",
    allVariants: { color: "#000" },
  },
});

function AppContent() {
  const navigate = useNavigate();
  const menuItems = [
    { text: "Dashboard", icon: <DashboardIcon />, path: "/" },
    { text: "Inventory", icon: <InventoryIcon />, path: "/inventory" },
    { text: "Clients", icon: <PeopleIcon />, path: "/clients" },
    { text: "Pilots", icon: <PersonIcon />, path: "/pilots" },
    { text: "Streaming Hub", icon: <HubIcon />, path: "/streaming-hub" },
    { text: "Projects", icon: <WorkspacesIcon />, path: "/projects" },
    { text: "Sites", icon: <LocationCityIcon />, path: "/sites" },
    { text: "Missions", icon: <AssignmentIcon />, path: "/missions" },
    { text: "Flights", icon: <FlightTakeoffIcon />, path: "/flights" },
    { text: "Cloud", icon: <CloudIcon />, path: "/cloud" },
  ];
  return (
    <Box sx={{ display: "flex", height: "100vh", bgcolor: "#fff" }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
          bgcolor: "#fff",
          color: "#000",
          boxShadow: "none",
          borderBottom: "1px solid #E0E0E0",
        }}
      >
        <Toolbar>
          <IconButton color="inherit" edge="start" sx={{ mr: 2 }}>
            <MenuIcon sx={{ color: "#000" }} />
          </IconButton>
          <Box sx={{ flexGrow: 1, display: "flex", alignItems: "center" }}>
            <img
              src={SagerLogo}
              alt="Sager Logo"
              style={{ maxHeight: 40, display: "block" }}
              onClick={() => navigate("/")}
            />
          </Box>
          <Button
            color="inherit"
            variant="outlined"
            sx={{ mr: 2, borderColor: "#000", color: "#000" }}
          >
            + New Project
          </Button>
        </Toolbar>
      </AppBar>
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: {
            width: drawerWidth,
            boxSizing: "border-box",
            bgcolor: "#fff",
            color: "#000",
            borderRight: "1px solid #E0E0E0",
          },
        }}
      >
        <Toolbar />
        <Box sx={{ overflow: "auto" }}>
          <List>
            {menuItems.map((item) => (
              <ListItem key={item.text} disablePadding>
                <ListItemButton
                  selected={window.location.pathname === item.path}
                  onClick={() => navigate(item.path)}
                  sx={{ color: "#000" }}
                >
                  <ListItemIcon sx={{ color: "#000" }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.text}
                    primaryTypographyProps={{ style: { color: "#000" } }}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
          <Divider sx={{ bgcolor: "#E0E0E0" }} />
          <Box sx={{ p: 2 }}>
            <Button
              variant="contained"
              color="secondary"
              fullWidth
              startIcon={<AddIcon sx={{ color: "#000" }} />}
              sx={{ bgcolor: "#fff", color: "#000", border: "1px solid #000" }}
            >
              Request a Mission
            </Button>
            <Button
              variant="outlined"
              color="secondary"
              fullWidth
              sx={{ mt: 1, color: "#000", borderColor: "#000" }}
            >
              Create a Project
            </Button>
          </Box>
        </Box>
      </Drawer>
      <Box
        component="main"
        sx={{
          width: "100%",
          height: "calc(100vh - 64px)",
          bgcolor: "#fff",
          p: 0,
          m: 0,
          flexGrow: 1,
          display: "flex",
          flexDirection: "column",
          boxSizing: "border-box",
          overflowX: "hidden",
        }}
      >
        <Toolbar />
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/clients" element={<Clients />} />
          <Route path="/pilots" element={<Pilots />} />
          <Route path="/streaming-hub" element={<StreamingHub />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/sites" element={<Sites />} />
          <Route path="/missions" element={<Missions />} />
          <Route path="/flights" element={<Flights />} />
          <Route path="/cloud" element={<Cloud />} />
        </Routes>
      </Box>
    </Box>
  );
}

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <Router>
        <AppContent />
      </Router>
    </ThemeProvider>
  );
}
