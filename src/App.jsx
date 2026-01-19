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
  Paper
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import HomeIcon from '@mui/icons-material/Home';
import InfoIcon from '@mui/icons-material/Info';
import ContactMailIcon from '@mui/icons-material/ContactMail';
import AddIcon from '@mui/icons-material/Add';

// 引入 Gridstack 及其樣式
import { GridStack } from 'gridstack';
import 'gridstack/dist/gridstack.min.css';

const drawerWidth = 240;

const Main = styled('main', { shouldForwardProp: (prop) => prop !== 'open' })(
  ({ theme, open }) => ({
    flexGrow: 1,
    padding: theme.spacing(3),
    transition: theme.transitions.create('margin', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
    marginLeft: `-${drawerWidth}px`,
    ...(open && {
      transition: theme.transitions.create('margin', {
        easing: theme.transitions.easing.easeOut,
        duration: theme.transitions.duration.enteringScreen,
      }),
      marginLeft: 0,
    }),
  }),
);

function App() {
  const [open, setOpen] = useState(true);
  const gridRef = useRef(null); // 用於保存 GridStack 實例

  const handleDrawerToggle = () => {
    setOpen(!open);
  };

  // 初始化 GridStack
  useEffect(() => {
    if (!gridRef.current) {
      gridRef.current = GridStack.init({
        cellHeight: 100,
        margin: 5,
        float: true, // 允許懸浮（不自動向上緊縮），根據需求可改為 false
      }, '.grid-stack');
      
      // 添加一些預設的小工具 (Widgets)
      const widgets = [
        { x: 0, y: 0, w: 4, h: 2, content: 'Widget 1' },
        { x: 4, y: 0, w: 4, h: 4, content: 'Widget 2' },
        { x: 8, y: 0, w: 2, h: 2, content: 'Widget 3' },
      ];
      
      gridRef.current.load(widgets);
    }
  }, []); // 空依賴陣列確保只初始化一次

  const addWidget = () => {
    if (gridRef.current) {
      gridRef.current.addWidget({ w: 3, h: 2, content: 'New Widget' });
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
            Dashboard with Gridstack.js
          </Typography>
          <Button color="inherit" startIcon={<AddIcon />} onClick={addWidget}>
            Add Widget
          </Button>
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

      <Main open={open}>
        <Toolbar /> {/* Spacer for Navbar */}
        
        {/* Gridstack Container */}
        <Box sx={{ width: '100%', height: '100%', minHeight: '80vh' }}>
           <div className="grid-stack"></div>
        </Box>
      </Main>
    </Box>
  );
}

export default App;