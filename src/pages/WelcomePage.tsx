import { Box, Typography, Container, Paper, List, ListItem, ListItemIcon, ListItemText } from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import WebIcon from '@mui/icons-material/Web';
import SettingsIcon from '@mui/icons-material/Settings';

export default function WelcomePage() {
  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 8, mb: 4 }}>
        <Typography variant="h2" component="h1" gutterBottom align="center">
          Welcome to First Vibe App
        </Typography>
        <Typography variant="h5" component="h2" gutterBottom align="center" color="text.secondary">
          A flexible Gridstack.js based dashboard system.
        </Typography>
      </Box>

      <Paper elevation={3} sx={{ p: 4, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          System Features:
        </Typography>
        <List>
          <ListItem>
            <ListItemIcon>
              <DashboardIcon color="primary" />
            </ListItemIcon>
            <ListItemText 
              primary="Dynamic Dashboards" 
              secondary="Create and customize layouts using drag-and-drop widgets. Supports nested grids." 
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <WebIcon color="secondary" />
            </ListItemIcon>
            <ListItemText 
              primary="Page Management" 
              secondary="Organize your dashboards into a tree structure. Reorder pages and folders easily." 
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <SettingsIcon color="action" />
            </ListItemIcon>
            <ListItemText 
              primary="Layout Persistence" 
              secondary="All layouts are saved locally in your browser (IndexedDB). Export/Import capabilities." 
            />
          </ListItem>
        </List>
      </Paper>

      <Box sx={{ textAlign: 'center' }}>
        <Typography variant="body1">
          Select a page from the left sidebar to get started, or create a new one in Page Management.
        </Typography>
      </Box>
    </Container>
  );
}
