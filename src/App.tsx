import { ThemeProvider, createTheme } from '@mui/material/styles';
import {
  AppBar as MuiAppBar,
  Box,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Divider,
  Tooltip,
  Avatar,
  Menu,
  MenuItem,
  ListItemIcon,
  CssBaseline,
  styled,
  Breadcrumbs,
  Link as MuiLink,
} from '@mui/material';
import type { AppBarProps as MuiAppBarProps } from '@mui/material/AppBar';
import MenuIcon from '@mui/icons-material/Menu';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import DashboardIcon from '@mui/icons-material/Dashboard';
import InfoIcon from '@mui/icons-material/Info';
import LayersIcon from '@mui/icons-material/Layers';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import DownloadIcon from '@mui/icons-material/Download';
import DesignServicesIcon from '@mui/icons-material/DesignServices';
import VisibilityIcon from '@mui/icons-material/Visibility';
import WebIcon from '@mui/icons-material/Web';
import SaveIcon from '@mui/icons-material/Save';
import ViewInArIcon from '@mui/icons-material/ViewInAr';

import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';

import RightSidebar from './components/RightSidebar';
import LeftSidebar from './components/LeftSidebar';
import DashboardPage from './pages/DashboardPage';
import WelcomePage from './pages/WelcomePage';
import AnalyticsPage from './pages/AnalyticsPage';
import SettingsPage from './pages/SettingsPage';
import GridManagementPage from './pages/GridManagementPage';
import PageManagementPage from './pages/PageManagementPage';
import ThreeDEditorPage from './pages/ThreeDEditorPage';
import SaveLayoutDialog from './components/SaveLayoutDialog';
import { useUIStore } from './store/useUIStore';
import { useGridStore } from './store/useGridStore';
import { useLayoutPersistence } from './hooks/useLayoutPersistence';
import { db } from './db';
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
  const {
    leftSidebarOpen: open,
    rightSidebarOpen: rightOpen,
    isEditMode,
    themeMode,
    toggleLeftSidebar: handleDrawerToggle,
    toggleRightSidebar: handleRightDrawerToggle,
    toggleEditMode,
  } = useUIStore();

  const addCommand = useGridStore((state) => state.addCommand);
  const navigate = useNavigate();
  const location = useLocation();
  const { saveLayout, saveSelectedLayout } = useLayoutPersistence();
  const selectedWidgetId = useGridStore((state) => state.selectedWidgetId);

  const activePageName = useLiveQuery(
    async () => {
      if (location.pathname === '/' || ['/settings', '/analytics', '/grid-management', '/page-management', '/3d-editor'].includes(location.pathname)) return null;
      const page = await db.pages.where('path').equals(location.pathname).first();
      return page?.name;
    },
    [location.pathname]
  );

  const [anchorElUser, setAnchorElUser] = useState<null | HTMLElement>(null);

  // Save Dialog State
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [saveType, setSaveType] = useState<'all' | 'selected'>('all');

  const handleOpenSaveDialog = (type: 'all' | 'selected') => {
    setSaveType(type);
    setSaveDialogOpen(true);
  };

  const handleConfirmSave = (name: string, thumbnail?: Blob) => {
    if (saveType === 'all') {
      saveLayout(name, thumbnail);
    } else {
      saveSelectedLayout(name, thumbnail);
    }
  };

  const getCaptureSelector = () => {
    if (saveType === 'all') return ".grid-stack-root";
    const nestedGrid = document.querySelector(`.grid-stack-item[gs-id="${selectedWidgetId}"] .grid-stack`);
    if (nestedGrid) {
      return `.grid-stack-item[gs-id="${selectedWidgetId}"] .grid-stack`;
    }
    return `.grid-stack-item[gs-id="${selectedWidgetId}"] > .grid-stack-item-content`;
  };

  const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  const isDashboard = !['/', '/settings', '/analytics', '/grid-management', '/page-management', '/3d-editor'].some(path =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path)
  );

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
            <Breadcrumbs
              separator={<NavigateNextIcon fontSize="small" />}
              aria-label="breadcrumb"
              sx={{ flexGrow: 1 }}
            >
              <MuiLink
                underline="hover"
                color="inherit"
                onClick={() => navigate('/')}
                sx={{ cursor: 'pointer' }}
              >
                Dashboard
              </MuiLink>
              {(() => {
                // Determine current page name
                let name = '';
                if (location.pathname === '/settings') name = 'Settings';
                else if (location.pathname === '/analytics') name = 'Analytics';
                else if (location.pathname === '/grid-management') name = 'Grid Management';
                else if (location.pathname === '/page-management') name = 'Page Management';
                else if (location.pathname === '/3d-editor') name = '3D Editor';
                else if (location.pathname !== '/') {
                  // Try to find dynamic page name. 
                  // Note: activePage might be undefined initially due to async useLiveQuery.
                  // We need to define activePage hook in the component body first.
                  // Since we can't easily inject hooks inside render, we'll use the one we add below.
                  return activePageName ? (
                    <Typography color="text.primary">{activePageName}</Typography>
                  ) : null;
                }

                return name ? <Typography color="text.primary">{name}</Typography> : null;
              })()}
            </Breadcrumbs>

            <Box sx={{ flexGrow: 1 }} />

            {isDashboard && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {isEditMode && (
                  <>
                    <Button color="inherit" startIcon={<LayersIcon />} onClick={addNestedWidget}>
                      Add Nested
                    </Button>
                    <Button color="inherit" startIcon={<SaveIcon />} onClick={() => handleOpenSaveDialog('all')}>
                      Save
                    </Button>
                    {selectedWidgetId && (
                      <Button color="inherit" startIcon={<SaveIcon />} onClick={() => handleOpenSaveDialog('selected')} sx={{ color: 'primary.main' }}>
                        Save Selection
                      </Button>
                    )}
                    <Button color="inherit" startIcon={<DownloadIcon />} onClick={handleExportLayout}>
                      Export JSON
                    </Button>
                  </>
                )}

                <Tooltip title={isEditMode ? "Switch to View Mode" : "Switch to Edit Mode"}>
                  <Button
                    color="inherit"
                    onClick={toggleEditMode}
                    startIcon={isEditMode ? <VisibilityIcon /> : <DesignServicesIcon />}
                    sx={{ border: '1px solid rgba(128,128,128,0.3)', whiteSpace: 'nowrap' }}
                  >
                    {isEditMode ? "Editing" : "Viewing"}
                  </Button>
                </Tooltip>

                <IconButton
                  color="inherit"
                  aria-label="open right drawer"
                  onClick={handleRightDrawerToggle}
                >
                  <AccountTreeIcon />
                </IconButton>
              </Box>
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
              <MenuItem onClick={() => { handleCloseUserMenu(); navigate('/page-management'); }}>
                <ListItemIcon>
                  <WebIcon fontSize="small" />
                </ListItemIcon>
                <Typography textAlign="center">Page Management</Typography>
              </MenuItem>
              <MenuItem onClick={() => { handleCloseUserMenu(); navigate('/3d-editor'); }}>
                <ListItemIcon>
                  <ViewInArIcon fontSize="small" />
                </ListItemIcon>
                <Typography textAlign="center">3D Editor</Typography>
              </MenuItem>
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

        <LeftSidebar width={drawerWidth} />

        <Main open={open} rightOpen={rightOpen}>
          <DrawerHeader />
          <Box>
            <Routes>
              <Route path="/" element={<WelcomePage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
              <Route path="/grid-management" element={<GridManagementPage />} />
              <Route path="/page-management" element={<PageManagementPage />} />
              <Route path="/3d-editor" element={<ThreeDEditorPage />} />
              <Route path="*" element={<DashboardPage />} />
            </Routes>
          </Box>
        </Main>

        <RightSidebar open={rightOpen} width={rightDrawerWidth} />
      </Box>

      <SaveLayoutDialog
        open={saveDialogOpen}
        onClose={() => setSaveDialogOpen(false)}
        onSave={handleConfirmSave}
        title={saveType === 'all' ? 'Save Layout' : 'Save Selected Widget'}
        defaultName={saveType === 'all' ? `Layout ${new Date().toLocaleString()}` : `Selection ${new Date().toLocaleString()}`}
        captureSelector={getCaptureSelector()}
      />
    </ThemeProvider>
  );
}
export default App;