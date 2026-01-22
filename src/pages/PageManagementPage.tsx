import { useState, useEffect } from 'react';
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
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControlLabel,
  Checkbox,
  ToggleButtonGroup,
  ToggleButton,
  Snackbar,
  Alert,
  DialogContentText
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
import { db, type Page } from '../db';

// Data Structure used by Tree (extends DB Page with children)
interface PageNode extends Omit<Page, 'parentId'> {
  parentId?: string | null;
  children?: PageNode[];
}

export default function PageManagementPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<PageNode[]>([]);
  
  // Dialog States
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [newPageData, setNewPageData] = useState<{
    name: string;
    path: string;
    visible: boolean;
    type: 'page' | 'folder';
  }>({ name: '', path: '', visible: true, type: 'page' });

  // Delete Dialog State
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; nodeId: string | null; hasChildren: boolean }>({
    open: false,
    nodeId: null,
    hasChildren: false
  });

  // Snackbar State
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success'
  });

  // Load Data from DB
  const loadPages = async () => {
    const pages = await db.pages.toArray();
    const tree = buildTree(pages);
    setData(tree);
  };

  useEffect(() => {
    loadPages();
  }, []);

  // Helper to reconstruct tree from flat list
  const buildTree = (items: Page[]): PageNode[] => {
    const map = new Map<string, PageNode>();
    const roots: PageNode[] = [];

    // 1. Create all nodes
    items.forEach(item => {
      // Ensure we explicitly include parentId for logic, though Tree uses nesting
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

  const handleAddPage = async () => {
    const id = crypto.randomUUID();
    const newPage: Page = {
      id,
      name: newPageData.name,
      path: newPageData.type === 'folder' ? '-' : newPageData.path, // Folders don't really have paths usually
      visible: newPageData.visible,
      type: newPageData.type,
      parentId: null, // Default to root
      gridId: ''
    };

    try {
      await db.pages.add(newPage);
      
      // Update UI state
      await loadPages();
      
      // Close and Reset
      setOpenAddDialog(false);
      setNewPageData({ name: '', path: '', visible: true, type: 'page' });
      setSnackbar({ open: true, message: 'Item created successfully', severity: 'success' });
    } catch (error) {
      console.error("Failed to add page:", error);
      setSnackbar({ open: true, message: 'Failed to create item', severity: 'error' });
    }
  };

  const handleMove = async ({ dragIds, parentId, index }: { dragIds: string[], parentId: string | null, index: number }) => {
    // 1. Optimistic UI Update
    setData(prevData => {
      const newData = JSON.parse(JSON.stringify(prevData)) as PageNode[];
      let movedNode: PageNode | null = null;

      // Recursive remove
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

      const id = dragIds[0];
      removeNode(newData, id);

      if (!movedNode) return prevData;

      // Insert
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

    // 2. Persist to DB
    const nodeId = dragIds[0];
    try {
      await db.pages.update(nodeId, { parentId: parentId });
    } catch (error) {
      console.error("Failed to update parentId:", error);
      loadPages(); // Revert on error
    }
  };

  const deleteRecursive = async (id: string) => {
    // Find children in DB
    const children = await db.pages.where('parentId').equals(id).toArray();
    for (const child of children) {
        await deleteRecursive(child.id);
    }
    await db.pages.delete(id);
  };

  const handleDeleteClick = (id: string) => {
    // Find node in local data to check for children
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
    
    const node = findNode(data, id);
    const hasChildren = node ? (node.children && node.children.length > 0) : false;

    setDeleteDialog({ open: true, nodeId: id, hasChildren: !!hasChildren });
  };

  const confirmDelete = async () => {
    if (deleteDialog.nodeId) {
        try {
            await deleteRecursive(deleteDialog.nodeId);
            await loadPages();
            setSnackbar({ open: true, message: 'Item deleted successfully', severity: 'success' });
        } catch (error) {
            console.error("Failed to delete:", error);
            setSnackbar({ open: true, message: 'Failed to delete item', severity: 'error' });
        }
    }
    setDeleteDialog({ open: false, nodeId: null, hasChildren: false });
  };

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
          <Button 
            variant="contained" 
            startIcon={<AddIcon />} 
            size="large"
            onClick={() => setOpenAddDialog(true)}
          >
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

        {/* Tree Body */}
        <Box sx={{ height: 600 }}>
          <Tree
            data={data}
            onMove={handleMove}
            disableDrop={({ parentNode }) => parentNode.data.type === 'page'}
            width="100%"
            height={600}
            rowHeight={60}
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
                    height: '100%', 
                    width: '100%',
                    borderBottom: '1px solid rgba(224, 224, 224, 1)',
                    boxSizing: 'border-box',
                    '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' },
                    transition: 'background-color 0.2s',
                  }}
                >
                  {/* Name Column */}
                  <Box sx={{ width: widthConfig.name, display: 'flex', alignItems: 'center', pl: 2, boxSizing: 'border-box', overflow: 'hidden' }}>
                    <Box
                      ref={dragHandle}
                      sx={{
                        cursor: 'grab',
                        display: 'flex',
                        alignItems: 'center',
                        color: 'action.active',
                        mr: 1,
                        minWidth: 24,
                        opacity: 0.5,
                        '&:hover': { opacity: 1 }
                      }}
                    >
                      <DragIndicatorIcon />
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
                      <Box sx={{ width: node.level * 24, flexShrink: 0 }} />

                      <Box
                        onClick={(e) => { e.stopPropagation(); node.toggle(); }}
                        sx={{ cursor: 'pointer', display: 'flex', alignItems: 'center', mr: 1, width: 24, justifyContent: 'center', flexShrink: 0 }}
                      >
                        {node.data.type === 'folder' && !node.isLeaf && (
                          node.isOpen ? <KeyboardArrowDownIcon fontSize="small" /> : <KeyboardArrowRightIcon fontSize="small" />
                        )}
                      </Box>

                      <Box sx={{ display: 'flex', alignItems: 'center', mr: 1, flexShrink: 0 }}>
                        {node.data.type === 'folder' ? (
                          <FolderIcon color="action" fontSize="small" />
                        ) : (
                          <InsertDriveFileIcon color="action" fontSize="small" />
                        )}
                      </Box>

                      <Typography variant="body2" noWrap sx={{ fontWeight: node.data.type === 'folder' ? 500 : 400 }}>
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
                      color="primary"
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
                      <IconButton size="small" color="error" onClick={() => handleDeleteClick(node.data.id)}>
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

      {/* Add New Page Dialog */}
      <Dialog open={openAddDialog} onClose={() => setOpenAddDialog(false)} fullWidth maxWidth="sm">
        <DialogTitle>Add New Item</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
               <Typography variant="body2">Type:</Typography>
               <ToggleButtonGroup
                 value={newPageData.type}
                 exclusive
                 onChange={(_e, val) => val && setNewPageData({ ...newPageData, type: val })}
                 size="small"
                 color="primary"
               >
                 <ToggleButton value="page">Page</ToggleButton>
                 <ToggleButton value="folder">Folder</ToggleButton>
               </ToggleButtonGroup>
            </Box>

            <TextField
              label="Name"
              variant="outlined"
              fullWidth
              value={newPageData.name}
              onChange={(e) => setNewPageData({ ...newPageData, name: e.target.value })}
            />
            
            {newPageData.type === 'page' && (
              <TextField
                label="Path"
                variant="outlined"
                fullWidth
                value={newPageData.path}
                onChange={(e) => setNewPageData({ ...newPageData, path: e.target.value })}
                helperText="e.g. /my-page"
              />
            )}
            
            <FormControlLabel
              control={
                <Checkbox
                  checked={newPageData.visible}
                  onChange={(e) => setNewPageData({ ...newPageData, visible: e.target.checked })}
                  color="primary"
                />
              }
              label="Visible"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAddDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleAddPage} 
            variant="contained" 
            disabled={!newPageData.name || (newPageData.type === 'page' && !newPageData.path)}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ ...deleteDialog, open: false })}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {deleteDialog.hasChildren
              ? "This folder has children. Deleting it will remove all contents within it. Are you sure?"
              : "Are you sure you want to delete this item? This action cannot be undone."}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ ...deleteDialog, open: false })}>Cancel</Button>
          <Button onClick={confirmDelete} color="error" autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}