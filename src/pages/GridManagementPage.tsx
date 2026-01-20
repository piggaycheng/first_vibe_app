import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Layout } from '../db';
import { 
  Box, 
  Typography, 
  List, 
  ListItem, 
  ListItemText, 
  ListItemSecondaryAction, 
  IconButton, 
  Paper,
  Button
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import RestoreIcon from '@mui/icons-material/Restore';
import { useLayoutPersistence } from '../hooks/useLayoutPersistence';
import { useNavigate } from 'react-router-dom';

export default function GridManagementPage() {
  const layouts = useLiveQuery(() => db.layouts.orderBy('updatedAt').reverse().toArray());
  const { loadLayout, deleteLayout } = useLayoutPersistence();
  const navigate = useNavigate();

  const handleLoad = async (layout: Layout) => {
    await loadLayout(layout);
    navigate('/');
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        Grid Management
      </Typography>
      <Paper elevation={2}>
        <List>
          {layouts?.map((layout) => (
            <ListItem key={layout.id} divider>
              <ListItemText 
                primary={layout.name} 
                secondary={layout.updatedAt.toLocaleString()} 
              />
              <ListItemSecondaryAction>
                <Button 
                  startIcon={<RestoreIcon />} 
                  onClick={() => handleLoad(layout)}
                  sx={{ mr: 2 }}
                >
                  Load
                </Button>
                <IconButton 
                  edge="end" 
                  aria-label="delete" 
                  onClick={() => deleteLayout(layout.id)}
                  color="error"
                >
                  <DeleteIcon />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
          {layouts?.length === 0 && (
            <ListItem>
              <ListItemText primary="No saved layouts found." />
            </ListItem>
          )}
        </List>
      </Paper>
    </Box>
  );
}
