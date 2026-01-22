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
  FormControlLabel,
  Checkbox
} from '@mui/material';

interface AddPageDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: NewPageData) => void;
}

export interface NewPageData {
  name: string;
  path: string;
  visible: boolean;
  type: 'page' | 'folder';
}

const initialData: NewPageData = {
  name: '',
  path: '',
  visible: true,
  type: 'page'
};

export default function AddPageDialog({ open, onClose, onSubmit }: AddPageDialogProps) {
  const [data, setData] = useState<NewPageData>(initialData);

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setData(initialData);
    }
  }, [open]);

  const handleSubmit = () => {
    onSubmit(data);
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Add New Item</DialogTitle>
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

          <FormControlLabel
            control={
              <Checkbox
                checked={data.visible}
                onChange={(e) => setData({ ...data, visible: e.target.checked })}
                color="primary"
              />
            }
            label="Visible"
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={!data.name || (data.type === 'page' && !data.path)}
        >
          Create
        </Button>
      </DialogActions>
    </Dialog>
  );
}
