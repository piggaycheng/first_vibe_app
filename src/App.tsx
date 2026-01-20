import {
  AppBar,
  Box,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  CssBaseline,
  styled,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import HomeIcon from '@mui/icons-material/Home';
import InfoIcon from '@mui/icons-material/Info';
import ContactMailIcon from '@mui/icons-material/ContactMail';
import AddIcon from '@mui/icons-material/Add';
import LayersIcon from '@mui/icons-material/Layers';
import SettingsIcon from '@mui/icons-material/Settings';
import DownloadIcon from '@mui/icons-material/Download';
import RightSidebar from './components/RightSidebar';
import GridDashboard from './components/GridDashboard';
import { useUIStore } from './store/useUIStore';
import { useGridStore } from './store/useGridStore';
import './App.css';

const drawerWidth = 240;
const rightDrawerWidth = 240;

const Main = styled('main', { shouldForwardProp: (prop) => prop !== 'open' && prop !== 'rightOpen' })<{
  open?: boolean;
  rightOpen?: boolean;
}>(({ theme, open, rightOpen }) => ({
  flexGrow: 1,
  padding: theme.spacing(3),
  transition: theme.transitions.create(['margin', 'width'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  marginLeft: `-${drawerWidth}px`,
  marginRight: `-${rightDrawerWidth}px`,
  ...(open && {
    transition: theme.transitions.create('margin', {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
    marginLeft: 0,
  }),
  ...(rightOpen && {
    transition: theme.transitions.create('margin', {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
    marginRight: 0,
  }),
}));

function App() {
  const {
    leftSidebarOpen: open,
    rightSidebarOpen: rightOpen,
    toggleLeftSidebar: handleDrawerToggle,
    toggleRightSidebar: handleRightDrawerToggle
  } = useUIStore();

  const addCommand = useGridStore((state) => state.addCommand);
  
  const addWidget = () => {
    addCommand({
      type: 'ADD_WIDGET',
      payload: {
        widgetOptions: {
          w: 3, h: 2,
          content: 'New Widget',
          id: `new-${Date.now()}`
        }
      }
    });
  };

  const addNestedWidget = () => {
    addCommand({
      type: 'ADD_WIDGET',
      payload: {
        widgetOptions: {
          w: 6, h: 6,
          id: `nested-container-${Date.now()}`,
          subGridOpts: {
            children: [
              { x: 0, y: 0, w: 2, h: 2, content: 'Sub Item 1', id: `sub-${Date.now()}` }
            ]
          }
        }
      }
    });
  };

  const handleExportLayout = () => {
    addCommand({ type: 'EXPORT_LAYOUT', payload: {} });
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />

      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            onClick={handleDrawerToggle}
            edge="start"
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            Nested Gridstack Dashboard
          </Typography>
          <Button color="inherit" startIcon={<AddIcon />} onClick={addWidget} sx={{ mr: 1 }}>
            Add Item
          </Button>
          <Button color="inherit" startIcon={<LayersIcon />} onClick={addNestedWidget}>
            Add Nested
          </Button>
          <Button color="inherit" startIcon={<DownloadIcon />} onClick={handleExportLayout}>
            Export JSON
          </Button>
          <IconButton
            color="inherit"
            aria-label="open right drawer"
            onClick={handleRightDrawerToggle}
            edge="end"
            sx={{ ml: 1 }}
          >
            <SettingsIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Drawer
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            top: '64px',
            height: 'calc(100% - 64px)',
          },
        }}
        variant="persistent"
        anchor="left"
        open={open}
        hideBackdrop={true}
      >
        <List>
          {['Dashboard', 'Settings', 'Analytics'].map((text, index) => (
            <ListItem key={text} disablePadding>
              <ListItemButton>
                <ListItemIcon>
                  {index === 0 ? <HomeIcon /> : index === 1 ? <InfoIcon /> : <ContactMailIcon />}
                </ListItemIcon>
                <ListItemText primary={text} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Drawer>

      <Main open={open} rightOpen={rightOpen}>
        <Toolbar />

        <Box sx={{ width: '100%', height: '100%', minHeight: '80vh' }}>
          <GridDashboard />
        </Box>
      </Main>

      <RightSidebar open={rightOpen} width={rightDrawerWidth} />
    </Box>
  );
}
export default App;
