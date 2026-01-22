import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  ToggleButtonGroup,
  ToggleButton,
  TextField,
} from '@mui/material';

export interface PageFormData {
  name: string;
  path: string;
  type: 'page' | 'folder';
}

interface PageFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: PageFormData) => void;
  initialValues?: PageFormData;
  title?: string;
  submitLabel?: string;
}

const defaultValues: PageFormData = {
  name: '',
  path: '',
  type: 'page'
};

export default function PageFormDialog({ 
  open, 
  onClose, 
  onSubmit, 
  initialValues, 
  title = "Add New Item",
  submitLabel = "Create"
}: PageFormDialogProps) {
  const [data, setData] = useState<PageFormData>(defaultValues);

  useEffect(() => {
    if (open) {
      setData(initialValues || defaultValues);
    }
  }, [open, initialValues]);

  const handleSubmit = () => {
    onSubmit(data);
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="body2">Type:</Typography>
            <ToggleButtonGroup
              value={data.type}
              exclusive
              onChange={(_e, val) => val && setData({ ...data, type: val })}
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
            value={data.name}
            onChange={(e) => setData({ ...data, name: e.target.value })}
          />

          {data.type === 'page' && (
            <TextField
              label="Path"
              variant="outlined"
              fullWidth
              value={data.path}
              onChange={(e) => setData({ ...data, path: e.target.value })}
              helperText="e.g. /my-page"
            />
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={!data.name || (data.type === 'page' && !data.path)}
        >
          {submitLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
