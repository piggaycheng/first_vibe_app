import { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  IconButton,
  Button,
  Breadcrumbs,
  Link,
  Switch,
  Tooltip,
  Table,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import HomeIcon from '@mui/icons-material/Home';
import FolderIcon from '@mui/icons-material/Folder';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import { useNavigate } from 'react-router-dom';
import { Tree, NodeApi } from 'react-arborist';

// Data Structure
interface PageNode {
  id: string;
  name: string;
  path: string;
  visible: boolean;
  children?: PageNode[];
}

const initialData: PageNode[] = [
  {
    id: '1',
    name: 'Main Menu',
    path: '-',
    visible: true,
    children: [
      { id: '1-1', name: 'Dashboard', path: '/', visible: true },
      { id: '1-2', name: 'Analytics', path: '/analytics', visible: true },
    ]
  },
  {
    id: '2',
    name: 'System Settings',
    path: '/settings',
    visible: true,
  }
];

export default function PageManagementPage() {
  const navigate = useNavigate();
  const [data, setData] = useState(initialData);

  // Define column widths to ensure alignment between Header and Body
  const widthConfig = {
    name: '40%',
    path: '30%',
    status: '15%',
    actions: '15%'
  };

  return (
    <Box sx={{ p: 1 }}>
      <Box sx={{ mb: 3 }}>
        <Breadcrumbs aria-label="breadcrumb">
          <Link
            underline="hover"
            sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
            color="inherit"
            onClick={() => navigate('/')}
          >
            <HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" />
            Dashboard
          </Link>
          <Typography color="text.primary">Page Management</Typography>
        </Breadcrumbs>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
              Page Management
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Manage your site structure with drag-and-drop support.
            </Typography>
          </Box>
          <Button variant="contained" startIcon={<AddIcon />} size="large">
            Add New Page
          </Button>
        </Box>
      </Box>

      <Paper sx={{ width: '100%', overflow: 'hidden' }} elevation={2}>
        {/* MUI Table Header */}
        <TableContainer>
          <Table size="medium">
            <TableHead>
              <TableRow>
                <TableCell sx={{ width: widthConfig.name, pl: 4, fontWeight: 'bold' }}>PAGE NAME</TableCell>
                <TableCell sx={{ width: widthConfig.path, fontWeight: 'bold' }}>PATH</TableCell>
                <TableCell sx={{ width: widthConfig.status, fontWeight: 'bold' }}>VISIBILITY</TableCell>
                <TableCell align="right" sx={{ width: widthConfig.actions, fontWeight: 'bold', pr: 4 }}>ACTIONS</TableCell>
              </TableRow>
            </TableHead>
          </Table>
        </TableContainer>

        {/* Tree Body - mimicking TableRow */}
        <Box sx={{ height: 600 }}>
          <Tree
            data={data}
            onMove={({ dragIds, parentId, index }) => {
              setData(prevData => {
                const newData = JSON.parse(JSON.stringify(prevData)) as PageNode[];
                let movedNode: PageNode | null = null;

                // Helper to remove node
                const removeNode = (nodes: PageNode[], id: string): boolean => {
                  const i = nodes.findIndex(n => n.id === id);
                  if (i !== -1) {
                    movedNode = nodes[i];
                    nodes.splice(i, 1);
                    return true;
                  }
                  for (const node of nodes) {
                    if (node.children && removeNode(node.children, id)) return true;
                  }
                  return false;
                };

                // 1. Remove the node (handling single selection for now)
                const id = dragIds[0];
                removeNode(newData, id);

                if (!movedNode) return prevData;

                // 2. Insert the node
                if (parentId === null) {
                  newData.splice(index, 0, movedNode);
                } else {
                  const findNode = (nodes: PageNode[], targetId: string): PageNode | undefined => {
                    for (const node of nodes) {
                      if (node.id === targetId) return node;
                      if (node.children) {
                        const found = findNode(node.children, targetId);
                        if (found) return found;
                      }
                    }
                    return undefined;
                  };

                  const parent = findNode(newData, parentId);
                  if (parent) {
                    if (!parent.children) parent.children = [];
                    parent.children.splice(index, 0, movedNode);
                  }
                }
                return newData;
              });
            }}
            width="100%"
            height={600}
            rowHeight={60} // Matches standard TableRow height
            indent={24}
            padding={0}
            rowClassName="tree-row"
          >
            {({ node, style, dragHandle }: { node: NodeApi<PageNode>, style: React.CSSProperties, dragHandle?: any }) => (
              <div style={{ ...style, paddingLeft: 0, height: '100%' }}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    height: '100%', // Ensure consistent height
                    width: '100%',
                    borderBottom: '1px solid rgba(224, 224, 224, 1)',
                    boxSizing: 'border-box',
                    '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' },
                    transition: 'background-color 0.2s',
                  }}
                >
                  {/* Name Column */}
                  <Box sx={{ width: widthConfig.name, display: 'flex', alignItems: 'center', pl: 2, boxSizing: 'border-box', overflow: 'hidden' }}>
                    {/* Drag Handle - Fixed position, no indent */}
                    <Box
                      ref={dragHandle}
                      sx={{
                        cursor: 'grab',
                        display: 'flex',
                        alignItems: 'center',
                        color: 'action.active',
                        mr: 1,
                        minWidth: 24, // Fixed width for alignment
                        opacity: 0.5,
                        '&:hover': { opacity: 1 }
                      }}
                    >
                      <DragIndicatorIcon />
                    </Box>

                    {/* Indentation Area - Only pushes the content after Drag Handle */}
                    <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
                      {/* Indentation Spacer */}
                      <Box sx={{ width: node.level * 24, flexShrink: 0 }} />

                      {/* Toggle Icon */}
                      <Box
                        onClick={(e) => { e.stopPropagation(); node.toggle(); }}
                        sx={{ cursor: 'pointer', display: 'flex', alignItems: 'center', mr: 1, width: 24, justifyContent: 'center', flexShrink: 0 }}
                      >
                        {!node.isLeaf && (
                          node.isOpen ? <KeyboardArrowDownIcon fontSize="small" /> : <KeyboardArrowRightIcon fontSize="small" />
                        )}
                      </Box>

                      {/* Type Icon */}
                      <Box sx={{ display: 'flex', alignItems: 'center', mr: 1, flexShrink: 0 }}>
                        {node.isLeaf ? (
                          <InsertDriveFileIcon color="action" fontSize="small" />
                        ) : (
                          <FolderIcon color="action" fontSize="small" />
                        )}
                      </Box>

                      <Typography variant="body2" noWrap sx={{ fontWeight: node.isLeaf ? 400 : 500 }}>
                        {node.data.name}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Path Column */}
                  <Box sx={{ width: widthConfig.path, px: 2, boxSizing: 'border-box' }}>
                    <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                      {node.data.path}
                    </Typography>
                  </Box>

                  {/* Status Column */}
                  <Box sx={{ width: widthConfig.status, px: 2, boxSizing: 'border-box' }}>
                    <Switch
                      checked={node.data.visible}
                      size="small"
                      color="success"
                    />
                  </Box>

                  {/* Actions Column */}
                  <Box sx={{ width: widthConfig.actions, pr: 4, textAlign: 'right', boxSizing: 'border-box' }}>
                    <Tooltip title="Edit">
                      <IconButton size="small">
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton size="small" color="error">
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>
              </div>
            )}
          </Tree>
        </Box>
      </Paper>
    </Box>
  );
}