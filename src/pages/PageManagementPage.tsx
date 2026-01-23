import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
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
  IconButton
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
import { db, type Page, type Layout } from '../db';
import ConfirmDialog from '../components/ConfirmDialog';
import AppSnackbar from '../components/AppSnackbar';
import PageFormDialog, { type PageFormData } from '../components/PageFormDialog';

// Data Structure used by Tree (extends DB Page with children)
interface PageNode extends Omit<Page, 'parentId'> {
  parentId?: string | null;
  children?: PageNode[];
}

export default function PageManagementPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<PageNode[]>([]);
  const [layouts, setLayouts] = useState<Layout[]>([]);
  
  // Dialog State (Unified for Add & Edit)
  const [dialogState, setDialogState] = useState<{
    open: boolean;
    mode: 'add' | 'edit';
    nodeId?: string;
    initialValues?: PageFormData;
    formKey: number;
  }>({
    open: false,
    mode: 'add',
    formKey: Date.now()
  });

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

  // Find node helper
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

  // Load Data from DB
  const loadData = async () => {
    const [pages, layoutsData] = await Promise.all([
      db.pages.toArray(),
      db.layouts.toArray()
    ]);
    const tree = buildTree(pages);
    setData(tree);
    setLayouts(layoutsData);
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleOpenAddDialog = () => {
    setDialogState({
      open: true,
      mode: 'add',
      initialValues: undefined,
      formKey: Date.now()
    });
  };

  const handleOpenEditDialog = (nodeId: string) => {
    const node = findNode(data, nodeId);
    if (node) {
      setDialogState({
        open: true,
        mode: 'edit',
        nodeId: nodeId,
        initialValues: {
          name: node.name,
          path: node.path,
          type: node.type,
          gridId: node.gridId
        },
        formKey: Date.now()
      });
    }
  };

  const handleDialogSubmit = async (formData: PageFormData) => {
    if (dialogState.mode === 'add') {
      await handleAddPage(formData);
    } else {
      await handleUpdatePage(dialogState.nodeId!, formData);
    }
  };

  const handleAddPage = async (data: PageFormData) => {
    const id = crypto.randomUUID();
    const newPage: Page = {
      id,
      name: data.name,
      path: data.type === 'folder' ? '-' : data.path,
      visible: true, // Default to true
      type: data.type,
      parentId: null,
      gridId: data.gridId || ''
    };

    try {
      await db.pages.add(newPage);
      await loadData();
      setDialogState({ ...dialogState, open: false });
      setSnackbar({ open: true, message: 'Item created successfully', severity: 'success' });
    } catch (error) {
      console.error("Failed to add page:", error);
      setSnackbar({ open: true, message: 'Failed to create item', severity: 'error' });
    }
  };

  const handleUpdatePage = async (id: string, data: PageFormData) => {
    try {
      await db.pages.update(id, {
        name: data.name,
        path: data.type === 'folder' ? '-' : data.path,
        type: data.type,
        gridId: data.gridId || ''
      });
      await loadData();
      setDialogState({ ...dialogState, open: false });
      setSnackbar({ open: true, message: 'Item updated successfully', severity: 'success' });
    } catch (error) {
      console.error("Failed to update page:", error);
      setSnackbar({ open: true, message: 'Failed to update item', severity: 'error' });
    }
  };

  const handleVisibilityChange = async (id: string, visible: boolean) => {
    try {
      await db.pages.update(id, { visible });
      await loadData();
      setSnackbar({ open: true, message: `Visibility set to ${visible ? 'Visible' : 'Hidden'}`, severity: 'success' });
    } catch (error) {
      console.error("Failed to update visibility:", error);
      setSnackbar({ open: true, message: 'Failed to update visibility', severity: 'error' });
    }
  };

  const handleMove = async ({ dragIds, parentId, index }: { dragIds: string[], parentId: string | null, index: number }) => {
    // Optimistic UI Update not strictly needed if we reload fast, but good for UX.
    // However, since we reload from DB immediately after update in other actions, 
    // we can rely on DB reload here too or keep optimistic logic.
    // Keeping optimistic logic for smoothness.
    setData(prevData => {
      const newData = JSON.parse(JSON.stringify(prevData)) as PageNode[];
      let movedNode: PageNode | null = null;
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

    const nodeId = dragIds[0];
    try {
      await db.pages.update(nodeId, { parentId: parentId });
    } catch (error) {
      console.error("Failed to update parentId:", error);
      loadData();
    }
  };

  const deleteRecursive = async (id: string) => {
    const children = await db.pages.where('parentId').equals(id).toArray();
    for (const child of children) {
        await deleteRecursive(child.id);
    }
    await db.pages.delete(id);
  };

  const handleDeleteClick = (id: string) => {
    const node = findNode(data, id);
    const hasChildren = node ? (node.children && node.children.length > 0) : false;
    setDeleteDialog({ open: true, nodeId: id, hasChildren: !!hasChildren });
  };

  const confirmDelete = async () => {
    if (deleteDialog.nodeId) {
        try {
            await deleteRecursive(deleteDialog.nodeId);
            await loadData();
            setSnackbar({ open: true, message: 'Item deleted successfully', severity: 'success' });
        } catch (error) {
            console.error("Failed to delete:", error);
            setSnackbar({ open: true, message: 'Failed to delete item', severity: 'error' });
        }
    }
    setDeleteDialog({ open: false, nodeId: null, hasChildren: false });
  };

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
            onClick={handleOpenAddDialog}
          >
            Add New Page
          </Button>
        </Box>
      </Box>

      <Paper sx={{ width: '100%', overflow: 'hidden' }} elevation={2}>
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
            {({ node, style, dragHandle }: { node: NodeApi<PageNode>, style: React.CSSProperties, dragHandle?: (el: HTMLDivElement | null) => void }) => (
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

                  <Box sx={{ width: widthConfig.path, px: 2, boxSizing: 'border-box' }}>
                    <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                      {node.data.path}
                    </Typography>
                  </Box>

                  <Box sx={{ width: widthConfig.status, px: 2, boxSizing: 'border-box' }}>
                    <Switch
                      checked={node.data.visible}
                      onChange={(e) => handleVisibilityChange(node.data.id, e.target.checked)}
                      size="small"
                      color="primary"
                    />
                  </Box>

                  <Box sx={{ width: widthConfig.actions, pr: 4, textAlign: 'right', boxSizing: 'border-box' }}>
                    <Tooltip title="Edit">
                      <IconButton size="small" onClick={() => handleOpenEditDialog(node.data.id)}>
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

      {/* Add/Edit Page Dialog */}
      <PageFormDialog 
        key={dialogState.formKey}
        open={dialogState.open} 
        onClose={() => setDialogState({ ...dialogState, open: false })} 
        onSubmit={handleDialogSubmit}
        layouts={layouts}
        initialValues={dialogState.initialValues}
        title={dialogState.mode === 'add' ? 'Add New Item' : 'Edit Item'}
        submitLabel={dialogState.mode === 'add' ? 'Create' : 'Save'}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialog.open}
        title="Confirm Delete"
        content={deleteDialog.hasChildren
          ? "This folder has children. Deleting it will remove all contents within it. Are you sure?"
          : "Are you sure you want to delete this item? This action cannot be undone."}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteDialog({ ...deleteDialog, open: false })}
        confirmLabel="Delete"
        confirmColor="error"
      />

      {/* Snackbar */}
      <AppSnackbar
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      />
    </Box>
  );
}