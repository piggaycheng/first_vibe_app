import { ThemeProvider, createTheme } from '@mui/material/styles';
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
  Switch,
  Avatar,
  Menu,
  MenuItem,
} from '@mui/material';
import type { AppBarProps as MuiAppBarProps } from '@mui/material/AppBar';
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import DashboardIcon from '@mui/icons-material/Dashboard';
import HomeIcon from '@mui/icons-material/Home';
import InfoIcon from '@mui/icons-material/Info';
import ContactMailIcon from '@mui/icons-material/ContactMail';
import AddIcon from '@mui/icons-material/Add';
import LayersIcon from '@mui/icons-material/Layers';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import DownloadIcon from '@mui/icons-material/Download';
import DesignServicesIcon from '@mui/icons-material/DesignServices';
import VisibilityIcon from '@mui/icons-material/Visibility';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import RightSidebar from './components/RightSidebar';
import DashboardPage from './pages/DashboardPage';
import AnalyticsPage from './pages/AnalyticsPage';
import SettingsPage from './pages/SettingsPage';
import GridManagementPage from './pages/GridManagementPage';
import { useUIStore } from './store/useUIStore';
import { useGridStore } from './store/useGridStore';
import './App.css';
import { useMemo, useEffect, useState } from 'react';
import SaveIcon from '@mui/icons-material/Save';
import RestoreIcon from '@mui/icons-material/Restore';
import { useLayoutPersistence } from './hooks/useLayoutPersistence';

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
  const {
    leftSidebarOpen: open,
    rightSidebarOpen: rightOpen,
    isEditMode,
    themeMode,
    toggleLeftSidebar: handleDrawerToggle,
    toggleRightSidebar: handleRightDrawerToggle,
    setRightSidebar,
    toggleEditMode,
    toggleTheme
  } = useUIStore();

  const addCommand = useGridStore((state) => state.addCommand);
  const navigate = useNavigate();
  const location = useLocation();
  const { saveLayout, loadLayout } = useLayoutPersistence();

  const [anchorElUser, setAnchorElUser] = useState<null | HTMLElement>(null);

  const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  const isDashboard = location.pathname === '/' || location.pathname === '/dashboard';

  useEffect(() => {
    if (isDashboard) {
      loadLayout();
    } else {
      setRightSidebar(false);
    }
  }, [isDashboard, loadLayout, setRightSidebar]);

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: themeMode,
          primary: {
            main: '#1976d2',
          },
          ...(themeMode === 'dark' && {
            background: {
              default: '#121212',
              paper: '#1e1e1e',
            }
          })
        },
      }),
    [themeMode]
  );

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

  const menuItems = [
    { text: 'Dashboard', icon: <HomeIcon />, path: '/' },
    { text: 'Analytics', icon: <ContactMailIcon />, path: '/analytics' },
  ];

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ display: 'flex' }}>
        <CssBaseline />

        <AppBar
          position="fixed"
          open={open}
          color="default"
          elevation={0}
          sx={{
            borderBottom: '1px solid',
            borderColor: 'divider',
            zIndex: (theme) => theme.zIndex.drawer + 1
          }}
        >
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

            {isDashboard && (
              <>
                {isEditMode ? (
                  <>
                    <Button color="inherit" startIcon={<AddIcon />} onClick={addWidget} sx={{ mr: 1 }}>
                      Add Item
                    </Button>
                    <Button color="inherit" startIcon={<LayersIcon />} onClick={addNestedWidget}>
                      Add Nested
                    </Button>
                    <Button color="inherit" startIcon={<SaveIcon />} onClick={saveLayout}>
                      Save
                    </Button>
                    <Button color="inherit" startIcon={<RestoreIcon />} onClick={() => loadLayout()}>
                      Load
                    </Button>
                    <Button color="inherit" startIcon={<DownloadIcon />} onClick={handleExportLayout} sx={{ mr: 1 }}>
                      Export JSON
                    </Button>
                  </>
                ) : null}

                <Tooltip title={isEditMode ? "Switch to View Mode" : "Switch to Edit Mode"}>
                  <Button
                    color="inherit"
                    onClick={toggleEditMode}
                    startIcon={isEditMode ? <VisibilityIcon /> : <DesignServicesIcon />}
                    sx={{ mr: 2, border: '1px solid rgba(128,128,128,0.3)' }}
                  >
                    {isEditMode ? "Editing" : "Viewing"}
                  </Button>
                </Tooltip>

                <IconButton
                  color="inherit"
                  aria-label="open right drawer"
                  onClick={handleRightDrawerToggle}
                  sx={{ ml: 1 }}
                >
                  <AccountTreeIcon />
                </IconButton>
              </>
            )}

            <Divider orientation="vertical" variant="middle" flexItem sx={{ mx: 1.5, height: '24px', alignSelf: 'center' }} />

            <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
              <Avatar alt="User" src="/static/images/avatar/2.jpg" />
            </IconButton>
            <Menu
              sx={{ mt: '45px' }}
              id="menu-appbar"
              anchorEl={anchorElUser}
              anchorOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              open={Boolean(anchorElUser)}
              onClose={handleCloseUserMenu}
            >
              <MenuItem onClick={() => { handleCloseUserMenu(); navigate('/grid-management'); }}>
                <ListItemIcon>
                  <DashboardIcon fontSize="small" />
                </ListItemIcon>
                <Typography textAlign="center">Grid Management</Typography>
              </MenuItem>
              <MenuItem onClick={() => { handleCloseUserMenu(); navigate('/settings'); }}>
                <ListItemIcon>
                  <InfoIcon fontSize="small" />
                </ListItemIcon>
                <Typography textAlign="center">Settings</Typography>
              </MenuItem>
            </Menu>
          </Toolbar>
        </AppBar>

        <Drawer
          sx={{
            width: drawerWidth,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: drawerWidth,
              boxSizing: 'border-box',
              display: 'flex',
              flexDirection: 'column',
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
          <List sx={{ flexGrow: 1 }}>
            {menuItems.map((item) => (
              <ListItem key={item.text} disablePadding>
                <ListItemButton
                  selected={location.pathname === item.path}
                  onClick={() => navigate(item.path)}
                >
                  <ListItemIcon>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText primary={item.text} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>

          <Divider />
          <List>
            <ListItem disablePadding>
              <ListItemButton onClick={toggleTheme}>
                <ListItemIcon>
                  {themeMode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
                </ListItemIcon>
                <ListItemText primary={themeMode === 'dark' ? "Light Mode" : "Dark Mode"} />
                <Switch
                  checked={themeMode === 'dark'}
                  onChange={toggleTheme}
                  onClick={(e) => e.stopPropagation()}
                  inputProps={{ 'aria-label': 'toggle theme' }}
                  size="small"
                />
              </ListItemButton>
            </ListItem>
          </List>
        </Drawer>

        <Main open={open} rightOpen={rightOpen}>
          <DrawerHeader />
          <Box sx={{ width: '100%', height: '100%', minHeight: '80vh' }}>
            <Routes>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
              <Route path="/grid-management" element={<GridManagementPage />} />
            </Routes>
          </Box>
        </Main>

        <RightSidebar open={rightOpen} width={rightDrawerWidth} />
      </Box>
    </ThemeProvider>
  );
}
export default App;
