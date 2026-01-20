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
import './App.css';

// 引入 Gridstack 及其樣式
import { GridStack, type GridStackOptions, type GridStackNode } from 'gridstack';
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

  const { gridItems, setGridItems, pendingCommand, clearCommand, selectedWidgetId } = useGridStore();

  const gridRef = useRef<GridStack | null>(null);

  // Selection & Scroll Sync
  useEffect(() => {
    // 1. Remove previous highlights
    document.querySelectorAll('.highlighted').forEach(el => {
      el.classList.remove('highlighted');
    });

    if (selectedWidgetId) {
      // 2. Find target widget
      // We look for .grid-stack-item with the gs-id
      const targetEl = document.querySelector(`.grid-stack-item[gs-id="${selectedWidgetId}"]`);

      if (targetEl) {
        // 3. Add highlight class
        targetEl.classList.add('highlighted');

        // 4. Scroll into view
        targetEl.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
          inline: 'center'
        });
      }
    }
  }, [selectedWidgetId]);

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

      // Helper to inject delete buttons into the DOM
      const injectDeleteButtons = (nodes: GridStackNode[]) => {
        nodes.forEach(node => {
          if (node.el && !node.el.querySelector('.delete-widget-btn')) {
            const btn = document.createElement('button');
            btn.className = 'delete-widget-btn';
            btn.innerText = '✕';
            btn.title = 'Remove';
            // Append directly to the widget container (sibling to content)
            node.el.appendChild(btn);
          }
          // Recursively handle nested grids
          if (node.subGrid && node.subGrid.engine.nodes) {
            injectDeleteButtons(node.subGrid.engine.nodes);
          }
        });
      };

      // Inject buttons on initial load
      injectDeleteButtons(gridRef.current.engine.nodes);

      const syncToStore = () => {
        if (gridRef.current) {
          const layout = gridRef.current.save();
          setGridItems(layout as any);
        }
      };

      // Handler for new widgets
      const handleAdded = (event: Event, items: GridStackNode[]) => {
        injectDeleteButtons(items);
        syncToStore();
      };

      gridRef.current.on('change', syncToStore);
      gridRef.current.on('added', handleAdded);
      gridRef.current.on('removed', syncToStore);
    }
  }, []); // Empty dependency array: Only init once on mount.

  // Command Processor
  useEffect(() => {
    if (pendingCommand) {
      if (pendingCommand.type === 'MOVE_WIDGET') {
        const { nodeId, targetParentId } = pendingCommand.payload;

        // 1. Find the widget element to move
        const widgetEl = document.querySelector(`.grid-stack-item[gs-id="${nodeId}"]`);

        if (widgetEl && gridRef.current) {
          // 2. Find the target grid
          let targetGrid: GridStack | undefined;

          if (!targetParentId) {
            targetGrid = gridRef.current;
          } else {
            const parentEl = document.querySelector(`.grid-stack-item[gs-id="${targetParentId}"]`);
            if (parentEl) {
              const subGridEl = parentEl.querySelector('.grid-stack');
              if (subGridEl && (subGridEl as any).gridstack) {
                targetGrid = (subGridEl as any).gridstack;
              }
            }
          }

          // 3. Execute Move
          if (targetGrid) {
            const gridNode = (widgetEl as any).gridstackNode;
            const sourceGrid = gridNode?.grid;

            if (sourceGrid) {
              sourceGrid.removeWidget(widgetEl, false); // false = keep DOM
            }

            widgetEl.removeAttribute('gs-x');
            widgetEl.removeAttribute('gs-y');

            targetGrid.el.appendChild(widgetEl);
            targetGrid.makeWidget(widgetEl as HTMLElement);

            setTimeout(() => {
              if (gridRef.current) {
                const layout = gridRef.current.save();
                setGridItems(layout as any);
              }
            }, 0);
          }
        }
      } else if (pendingCommand.type === 'REMOVE_WIDGET') {
        const { nodeId } = pendingCommand.payload;
        const widgetEl = document.querySelector(`.grid-stack-item[gs-id="${nodeId}"]`);
        if (widgetEl) {
          const gridNode = (widgetEl as any).gridstackNode;
          if (gridNode && gridNode.grid) {
            gridNode.grid.removeWidget(widgetEl);
          }
        }
      }

      clearCommand();
    }
  }, [pendingCommand, clearCommand]);

  // Global Event Listener for Delete Buttons
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.matches('.delete-widget-btn')) {
        const widgetEl = target.closest('.grid-stack-item');
        if (widgetEl) {
          const id = widgetEl.getAttribute('gs-id');
          if (id) {
            useGridStore.getState().addCommand({
              type: 'REMOVE_WIDGET',
              payload: { nodeId: id }
            });
          }
        }
      }
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  const addWidget = () => {
    if (gridRef.current) {
      gridRef.current.addWidget({
        w: 3, h: 2,
        content: 'New Widget',
        id: `new-${Date.now()}`
      });
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
      const layout = gridRef.current.save();
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
