import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Switch,
  Collapse,
  IconButton,
  styled,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';

import { useNavigate, useLocation } from 'react-router-dom';
import { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';

import { useUIStore } from '../store/useUIStore';
import { db, type Page } from '../db';
import { getIconComponent } from '../utils/iconMap';

interface LeftSidebarProps {
  width: number;
}

// Data Structure used by Tree
interface PageNode extends Omit<Page, 'parentId'> {
  parentId?: string | null;
  children?: PageNode[];
}

const DrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(0, 1),
  // necessary for content to be below app bar
  ...theme.mixins.toolbar,
  justifyContent: 'flex-end',
}));

// Helper to reconstruct tree from flat list
const buildTree = (items: Page[]): PageNode[] => {
  const map = new Map<string, PageNode>();
  const roots: PageNode[] = [];

  // 1. Create all nodes
  items.forEach(item => {
    map.set(item.id, { ...item, children: [] });
  });

  // 2. Link them
  items.forEach(item => {
    const node = map.get(item.id)!;
    if (item.parentId && map.has(item.parentId)) {
      map.get(item.parentId)!.children!.push(node);
    } else {
      roots.push(node);
    }
  });

  return roots;
};

const emptyPages: Page[] = [];

// SidebarItem Component
const SidebarItem = ({ node, pl = 0 }: { node: PageNode; pl?: number }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  
  const hasChildren = node.children && node.children.length > 0;
  // Simple matching: current path equals node path
  const isSelected = location.pathname === node.path;

  const handleClick = () => {
    if (node.type === 'folder') {
      setOpen(!open);
    } else {
      navigate(node.path);
    }
  };

  const CustomIcon = getIconComponent(node.icon);
  const IconToRender = CustomIcon;

  return (
    <>
      <ListItem disablePadding>
        <ListItemButton 
          onClick={handleClick} 
          selected={!hasChildren && isSelected}
          sx={{ pl: pl ? pl : undefined }} // Indentation
        >
          {IconToRender && (
            <ListItemIcon>
              <IconToRender />
            </ListItemIcon>
          )}
          <ListItemText primary={node.name} />
          {node.type === 'folder' ? (open ? <ExpandLess /> : <ExpandMore />) : null}
        </ListItemButton>
      </ListItem>
      {node.type === 'folder' && (
        <Collapse in={open} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
             {node.children?.map(child => (
               <SidebarItem key={child.id} node={child} pl={pl + 4} />
             ))}
          </List>
        </Collapse>
      )}
    </>
  );
};

export default function LeftSidebar({ width }: LeftSidebarProps) {
  const theme = useTheme();
  const {
    leftSidebarOpen: open,
    themeMode,
    toggleLeftSidebar: handleDrawerToggle,
    toggleTheme
  } = useUIStore();

  // Load Pages from DB
  const pages = useLiveQuery(async () => {
    const allPages = await db.pages.toArray();
    return allPages
      .filter(p => p.visible)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }, [], emptyPages);

  const tree = useMemo(() => buildTree(pages), [pages]);

  return (
    <Drawer
      sx={{
        width: width,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: width,
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
        {tree.map((node) => (
          <SidebarItem key={node.id} node={node} />
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
  );
}
