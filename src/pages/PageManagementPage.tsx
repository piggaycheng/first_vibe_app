import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton, Button, Breadcrumbs, Link } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import HomeIcon from '@mui/icons-material/Home';
import { useNavigate } from 'react-router-dom';

export default function PageManagementPage() {
  const navigate = useNavigate();

  // Mock data for current pages in sidebar
  const pages = [
    { id: 1, name: 'Dashboard', path: '/', icon: 'HomeIcon', visible: true },
    { id: 2, name: 'Analytics', path: '/analytics', icon: 'ContactMailIcon', visible: true },
  ];

  return (
    <Box>
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
        <Typography variant="h4" sx={{ mt: 2, fontWeight: 'bold' }}>
          Page Management
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage the pages displayed in the left sidebar menu.
        </Typography>
      </Box>

      <Paper sx={{ width: '100%', mb: 2, p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
          <Button variant="contained" startIcon={<AddIcon />}>
            Add New Page
          </Button>
        </Box>
        
        <TableContainer>
          <Table sx={{ minWidth: 650 }} aria-label="page management table">
            <TableHead>
              <TableRow>
                <TableCell>Page Name</TableCell>
                <TableCell>Path</TableCell>
                <TableCell>Icon</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {pages.map((page) => (
                <TableRow key={page.id} hover>
                  <TableCell component="th" scope="row">
                    {page.name}
                  </TableCell>
                  <TableCell>{page.path}</TableCell>
                  <TableCell>{page.icon}</TableCell>
                  <TableCell>{page.visible ? 'Visible' : 'Hidden'}</TableCell>
                  <TableCell align="right">
                    <IconButton size="small" color="primary">
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" color="error">
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
}
