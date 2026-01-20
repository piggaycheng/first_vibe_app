import { useState, useEffect, useRef } from 'react';
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
  const [open, setOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);
  const gridRef = useRef<GridStack | null>(null);

  const handleDrawerToggle = () => {
    setOpen(!open);
  };

  const handleRightDrawerToggle = () => {
    setRightOpen(!rightOpen);
  };

  useEffect(() => {
    // 初始化 GridStack
    // Gridstack 會自動尋找並初始化所有 nested grids，只要它們有正確的 class 結構
    if (!gridRef.current) {
      gridRef.current = GridStack.init({
        cellHeight: 100,
        margin: 5,
        minRow: 1, // 確保至少有一行
        acceptWidgets: true, // 允許接受拖入的 widget
        dragIn: '.new-widget', // 如果有外部拖入的需求
        float: true, // 允許浮動
        subGridOpts: {
          cellHeight: 80, // sub-grid 的高度可以不同
          margin: 5,
          acceptWidgets: true, // sub-grid 也接受 widgets
          float: true // 允許浮動
        }
      } as GridStackOptions, '.grid-stack-root'); // 指定一個 root class

      // 載入預設的巢狀結構
      const widgets = [
        { x: 0, y: 0, w: 4, h: 4, content: 'Regular Widget' },
        {
          x: 4, y: 0, w: 8, h: 6,
          // content: 'Container Widget (Drop items here)',
          subGridOpts: {
            children: [
              { x: 0, y: 0, w: 3, h: 2, content: 'Nested 1' },
              { x: 3, y: 0, w: 3, h: 2, content: 'Nested 2' },
              { x: 0, y: 2, w: 6, h: 2, content: 'Nested 3' }
            ]
          }
        },
      ];

      gridRef.current.load(widgets);
    }
  }, []);

  const addWidget = () => {
    if (gridRef.current) {
      gridRef.current.addWidget({ w: 3, h: 2, content: 'New Widget' });
    }
  };

  const addNestedWidget = () => {
    if (gridRef.current) {
      // 新增一個帶有 subGrid 的 widget
      gridRef.current.addWidget({
        w: 6, h: 6,
        subGridOpts: {
          children: [
            { x: 0, y: 0, w: 2, h: 2, content: 'Sub Item 1' }
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
