import { useTheme } from '@mui/material/styles';
import {
  AppBar as MuiAppBar,
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
  Divider,
  Tooltip,
} from '@mui/material';
import type { AppBarProps as MuiAppBarProps } from '@mui/material/AppBar';
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import HomeIcon from '@mui/icons-material/Home';
import InfoIcon from '@mui/icons-material/Info';
import ContactMailIcon from '@mui/icons-material/ContactMail';
import AddIcon from '@mui/icons-material/Add';
import LayersIcon from '@mui/icons-material/Layers';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import DownloadIcon from '@mui/icons-material/Download';
import DesignServicesIcon from '@mui/icons-material/DesignServices';
import VisibilityIcon from '@mui/icons-material/Visibility';
import RightSidebar from './components/RightSidebar';
import GridDashboard from './components/GridDashboard';
import { useUIStore } from './store/useUIStore';
import { useGridStore } from './store/useGridStore';
import './App.css';

const drawerWidth = 240;
const rightDrawerWidth = 240;

// Custom AppBar Interface
interface AppBarProps extends MuiAppBarProps {
  open?: boolean;
}

// Styled AppBar that shifts when drawer opens
const AppBar = styled(MuiAppBar, {
  shouldForwardProp: (prop) => prop !== 'open',
})<AppBarProps>(({ theme, open }) => ({
  transition: theme.transitions.create(['margin', 'width'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  ...(open && {
    width: `calc(100% - ${drawerWidth}px)`,
    marginLeft: `${drawerWidth}px`,
    transition: theme.transitions.create(['margin', 'width'], {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
  }),
}));

const DrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(0, 1),
  // necessary for content to be below app bar
  ...theme.mixins.toolbar,
  justifyContent: 'flex-end',
}));

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
  const theme = useTheme();
  const { 
    leftSidebarOpen: open, 
    rightSidebarOpen: rightOpen, 
    isEditMode,
    toggleLeftSidebar: handleDrawerToggle, 
    toggleRightSidebar: handleRightDrawerToggle,
    toggleEditMode
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

      <AppBar position="fixed" open={open}>
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            onClick={handleDrawerToggle}
            edge="start"
            sx={{ mr: 2, ...(open && { display: 'none' }) }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            Nested Gridstack Dashboard
          </Typography>
          
          <Box sx={{ flexGrow: 1 }} />

          <Tooltip title={isEditMode ? "Switch to View Mode" : "Switch to Edit Mode"}>
            <Button 
              color="inherit" 
              onClick={toggleEditMode}
              startIcon={isEditMode ? <VisibilityIcon /> : <DesignServicesIcon />}
              sx={{ mr: 2, border: '1px solid rgba(255,255,255,0.3)' }}
            >
              {isEditMode ? "Editing" : "Viewing"}
            </Button>
          </Tooltip>

          {isEditMode && (
            <>
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
                <AccountTreeIcon />
              </IconButton>
            </>
          )}
        </Toolbar>
      </AppBar>

      <Drawer
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
          },
        }}
        variant="persistent"
        anchor="left"
        open={open}
      >
        <DrawerHeader>
          <IconButton onClick={handleDrawerToggle}>
            {theme.direction === 'ltr' ? <ChevronLeftIcon /> : <ChevronRightIcon />}
          </IconButton>
        </DrawerHeader>
        <Divider />
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
        <DrawerHeader />
        <Box sx={{ width: '100%', height: '100%', minHeight: '80vh' }}>
          <GridDashboard />
        </Box>
      </Main>

      <RightSidebar open={rightOpen} width={rightDrawerWidth} />
    </Box>
  );
}
export default App;

