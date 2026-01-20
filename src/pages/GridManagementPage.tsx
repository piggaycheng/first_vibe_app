import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Layout } from '../db';
import { 
  Box, 
  Typography, 
  IconButton, 
  Paper
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import RestoreIcon from '@mui/icons-material/Restore';
import { useLayoutPersistence } from '../hooks/useLayoutPersistence';
import { useNavigate } from 'react-router-dom';
import { DataGrid, type GridColDef, type GridRenderCellParams } from '@mui/x-data-grid';

export default function GridManagementPage() {
  const layouts = useLiveQuery(() => db.layouts.orderBy('updatedAt').reverse().toArray());
  const { loadLayout, deleteLayout } = useLayoutPersistence();
  const navigate = useNavigate();

  const handleLoad = async (layout: Layout) => {
    await loadLayout(layout);
    navigate('/');
  };

  const columns: GridColDef[] = [
    { field: 'name', headerName: 'Layout Name', flex: 1, minWidth: 200 },
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
    </Box>
  );
}