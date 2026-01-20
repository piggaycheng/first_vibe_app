import { useEffect, useRef } from 'react';
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
import { useUIStore } from './store/useUIStore';
import { useGridStore } from './store/useGridStore';

// 引入 Gridstack 及其樣式
import { GridStack, type GridStackOptions } from 'gridstack';
import 'gridstack/dist/gridstack.min.css';

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

  const { gridItems, setGridItems, pendingCommand, clearCommand } = useGridStore();

  const gridRef = useRef<GridStack | null>(null);

  useEffect(() => {
    // 初始化 GridStack
    if (!gridRef.current) {
      gridRef.current = GridStack.init({
        cellHeight: 100,
        margin: 5,
        minRow: 1,
        acceptWidgets: true,
        dragIn: '.new-widget',
        float: true,
        subGridOpts: {
          cellHeight: 80,
          margin: 5,
          acceptWidgets: true,
          float: true
        }
      } as GridStackOptions, '.grid-stack-root');

      gridRef.current.load(gridItems);

      const syncToStore = () => {
        if (gridRef.current) {
          const layout = gridRef.current.save(false);
          setGridItems(layout as any);
        }
      };

      gridRef.current.on('change', syncToStore);
      gridRef.current.on('added', syncToStore);
      gridRef.current.on('removed', syncToStore);
    }
  }, []);

  // Command Processor
  useEffect(() => {
    if (pendingCommand && pendingCommand.type === 'MOVE_WIDGET') {
      const { nodeId, targetParentId } = pendingCommand.payload;

      // 1. Find the widget element to move
      // GridStack adds 'gs-id' attribute with the node ID
      const widgetEl = document.querySelector(`.grid-stack-item[gs-id="${nodeId}"]`);

      if (widgetEl && gridRef.current) {
        // 2. Find the target grid
        let targetGrid: GridStack | undefined;

        if (!targetParentId) {
          // Move to Root Grid
          targetGrid = gridRef.current;
        } else {
          // Move to a Nested Grid
          // Find the parent widget first
          const parentEl = document.querySelector(`.grid-stack-item[gs-id="${targetParentId}"]`);
          if (parentEl) {
            // Check if it has a sub-grid
            const subGridEl = parentEl.querySelector('.grid-stack');
            if (subGridEl && (subGridEl as any).gridstack) {
              targetGrid = (subGridEl as any).gridstack;
            } else {
              // TODO: If it's not a sub-grid yet, we might want to convert it?
              // For now, ignore if target is not a container.
              console.warn('Target widget is not a container (sub-grid).');
            }
          }
        }

        // 3. Execute Move
        if (targetGrid) {
          const gridNode = (widgetEl as any).gridstackNode;
          const sourceGrid = gridNode?.grid;

          // 3.1 Remove from old grid (crucial to clean up placeholder)
          if (sourceGrid) {
            sourceGrid.removeWidget(widgetEl, false); // false = keep DOM
          }

          // 3.2 Prepare for new grid
          // Remove position attributes to force auto-positioning
          widgetEl.removeAttribute('gs-x');
          widgetEl.removeAttribute('gs-y');

          // 3.3 Move DOM element manually
          targetGrid.el.appendChild(widgetEl);

          // 3.4 Register as widget in new grid
          targetGrid.makeWidget(widgetEl as HTMLElement);

          // 3.5 Force Store Sync
          // Since programmatic moves might not trigger 'change' consistently in all cases,
          // or we want to ensure the specific sequence is captured.
          setTimeout(() => {
            if (gridRef.current) {
              const layout = gridRef.current.save(false);
              setGridItems(layout as any);
            }
          }, 0);
        }
      }

      // Clear command to avoid repetition
      clearCommand();
    }
  }, [pendingCommand, clearCommand]);

  const addWidget = () => {
    if (gridRef.current) {
      gridRef.current.addWidget({ w: 3, h: 2, content: 'New Widget', id: `new-${Date.now()}` });
    }
  };

  const addNestedWidget = () => {
    if (gridRef.current) {
      gridRef.current.addWidget({
        w: 6, h: 6,
        id: `nested-container-${Date.now()}`,
        subGridOpts: {
          children: [
            { x: 0, y: 0, w: 2, h: 2, content: 'Sub Item 1', id: `sub-${Date.now()}` }
          ]
        }
      });
    }
  };

  const handleExportLayout = () => {
    if (gridRef.current) {
      const layout = gridRef.current.save(false);
      const json = JSON.stringify(layout, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const href = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = href;
      link.download = 'grid-layout.json';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(href);
    }
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
          {/* 給予一個特定的 class name 作為 root */}
          <div className="grid-stack grid-stack-root"></div>
        </Box>
      </Main>

      <RightSidebar open={rightOpen} width={rightDrawerWidth} />
    </Box>
  );
}
export default App;
