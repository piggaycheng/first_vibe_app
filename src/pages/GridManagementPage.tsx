import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Layout } from '../db';
import { 
  Box, 
  Typography, 
  IconButton, 
  Paper,
  Dialog,
  DialogContent,
  DialogTitle,
  Button
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import RestoreIcon from '@mui/icons-material/Restore';
import CloseIcon from '@mui/icons-material/Close';
import { useLayoutPersistence } from '../hooks/useLayoutPersistence';
import { useNavigate } from 'react-router-dom';
import { DataGrid, type GridColDef, type GridRenderCellParams } from '@mui/x-data-grid';
import { useState, useCallback } from 'react';

export default function GridManagementPage() {
  const layouts = useLiveQuery(() => db.layouts.orderBy('updatedAt').reverse().toArray());
  const { loadLayout, deleteLayout } = useLayoutPersistence();
  const navigate = useNavigate();

  // Preview Dialog State
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const handleOpenPreview = (blob: Blob) => {
    const url = URL.createObjectURL(blob);
    setPreviewImage(url);
  };

  const handleClosePreview = useCallback(() => {
    if (previewImage) {
      URL.revokeObjectURL(previewImage);
      setPreviewImage(null);
    }
  }, [previewImage]);

  const handleLoad = async (layout: Layout) => {
    await loadLayout(layout);
    navigate('/');
  };

  const columns: GridColDef[] = [
    { 
      field: 'thumbnail', 
      headerName: 'Preview', 
      width: 120,
      sortable: false,
      renderCell: (params: GridRenderCellParams<Layout>) => {
        if (!params.row.thumbnail) return <Box sx={{ bgcolor: '#eee', width: 100, height: 60, borderRadius: 1 }} />;
        
        // Use a persistent URL for the list cell to avoid flickering
        // Note: For simplicity in renderCell, we create it here. 
        // In a high-performance app, we'd manage these URLs in a hook.
        const url = URL.createObjectURL(params.row.thumbnail);
        return (
          <Box 
            component="img"
            src={url}
            onLoad={() => URL.revokeObjectURL(url)}
            onClick={() => params.row.thumbnail && handleOpenPreview(params.row.thumbnail)}
            sx={{ 
              width: 100, 
              height: 60, 
              objectFit: 'cover', 
              borderRadius: 1,
              border: '1px solid #ddd',
              mt: 1,
              cursor: 'pointer',
              '&:hover': { opacity: 0.8, borderColor: 'primary.main' }
            }}
          />
        );
      }
    },
    { 
      field: 'updatedAt', 
      headerName: 'Last Updated', 
      width: 200,
      valueFormatter: (value) => {
        if (!value) return '';
        return new Date(value).toLocaleString();
      }
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 150,
      sortable: false,
      renderCell: (params: GridRenderCellParams<Layout>) => (
        <Box>
          <IconButton 
            color="primary" 
            onClick={() => handleLoad(params.row)}
            title="Load Layout"
          >
            <RestoreIcon />
          </IconButton>
          <IconButton 
            color="error" 
            onClick={() => deleteLayout(params.row.id)}
            title="Delete Layout"
          >
            <DeleteIcon />
          </IconButton>
        </Box>
      ),
    },
  ];

  return (
    <Box sx={{ maxWidth: 1000, mx: 'auto', mt: 4, height: 600, width: '100%' }}>
      <Typography variant="h4" gutterBottom>
        Grid Management
      </Typography>
      <Paper elevation={2} sx={{ height: '100%', width: '100%' }}>
        <DataGrid
          rows={layouts || []}
          columns={columns}
          rowHeight={80}
          initialState={{
            pagination: {
              paginationModel: { page: 0, pageSize: 10 },
            },
          }}
          pageSizeOptions={[5, 10, 25]}
          checkboxSelection
          disableRowSelectionOnClick
        />
      </Paper>

      {/* Large Image Preview Dialog */}
      <Dialog 
        open={Boolean(previewImage)} 
        onClose={handleClosePreview}
        maxWidth="lg"
      >
        <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Layout Preview
          <IconButton onClick={handleClosePreview}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 0, overflow: 'hidden', display: 'flex', justifyContent: 'center', bgcolor: '#f0f0f0' }}>
          {previewImage && (
            <Box 
              component="img"
              src={previewImage}
              sx={{ 
                maxWidth: '100%', 
                maxHeight: '80vh', 
                objectFit: 'contain',
                display: 'block'
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}