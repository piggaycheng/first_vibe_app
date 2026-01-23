import { useState, useEffect, useMemo } from 'react';
import { type Layout } from '../db';
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
  Card,
  CardActionArea,
  CardContent,
  CardMedia,
  useTheme,
  alpha,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tooltip,
  tooltipClasses,
  type TooltipProps,
  styled
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

export interface PageFormData {
  name: string;
  path: string;
  type: 'page' | 'folder';
  gridId?: string;
}

interface PageFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: PageFormData) => void;
  layouts: Layout[];
  initialValues?: PageFormData;
  title?: string;
  submitLabel?: string;
}

const defaultValues: PageFormData = {
  name: '',
  path: '',
  type: 'page',
  gridId: ''
};

// Custom styled tooltip for the image preview
const ImageTooltip = styled(({ className, ...props }: TooltipProps) => (
  <Tooltip {...props} classes={{ popper: className }} />
))(({ theme }) => ({
  [`& .${tooltipClasses.tooltip}`]: {
    backgroundColor: theme.palette.background.paper,
    color: theme.palette.text.primary,
    maxWidth: 400,
    fontSize: theme.typography.pxToRem(12),
    border: `1px solid ${theme.palette.divider}`,
    boxShadow: theme.shadows[4],
    padding: 0, // Remove default padding for image
  },
}));

export default function PageFormDialog({ 
  open, 
  onClose, 
  onSubmit, 
  layouts, 
  initialValues, 
  title = "Add New Item",
  submitLabel = "Create"
}: PageFormDialogProps) {
  const [data, setData] = useState<PageFormData>(initialValues || defaultValues);

  const handleSubmit = () => {
    onSubmit(data);
  };
  
  const selectedLayoutName = useMemo(() => {
    if (!data.gridId) return 'Empty / Default';
    const layout = layouts.find(l => l.id === data.gridId);
    return layout ? layout.name : 'Unknown';
  }, [data.gridId, layouts]);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
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
            <>
              <TextField
                label="Path"
                variant="outlined"
                fullWidth
                value={data.path}
                onChange={(e) => setData({ ...data, path: e.target.value })}
                helperText="e.g. /my-page"
              />

              <Accordion defaultExpanded variant="outlined" sx={{ mt: 1 }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', mr: 2, alignItems: 'center' }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Select Layout (Optional)
                    </Typography>
                    <Typography variant="body2" color="primary" fontWeight="medium">
                      Current: {selectedLayoutName}
                    </Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Box 
                    sx={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', 
                      gap: 2,
                      maxHeight: '400px',
                      overflowY: 'auto',
                      p: 1
                    }}
                  >
                    {/* Default/Empty Option */}
                    <LayoutCard 
                      selected={!data.gridId} 
                      onClick={() => setData({ ...data, gridId: '' })}
                      name="Empty / Default"
                    />

                    {layouts.map((layout) => (
                      <LayoutCard
                        key={layout.id}
                        selected={data.gridId === layout.id}
                        onClick={() => setData({ ...data, gridId: layout.id })}
                        name={layout.name}
                        thumbnailBlob={layout.thumbnail}
                      />
                    ))}
                  </Box>
                </AccordionDetails>
              </Accordion>
            </>
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

interface LayoutCardProps {
  name: string;
  selected: boolean;
  onClick: () => void;
  thumbnailBlob?: Blob;
}

function LayoutCard({ name, selected, onClick, thumbnailBlob }: LayoutCardProps) {
  const theme = useTheme();
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    if (thumbnailBlob) {
      const url = URL.createObjectURL(thumbnailBlob);
      // We need to set state here to render the image. 
      // This is a necessary side effect of converting Blob to URL.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setImageUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setImageUrl(null);
    }
  }, [thumbnailBlob]);

  const cardContent = (
    <Card 
      variant="outlined"
      sx={{ 
        borderWidth: 2,
        borderColor: selected ? 'primary.main' : 'divider',
        backgroundColor: selected ? alpha(theme.palette.primary.main, 0.04) : 'background.paper',
        transition: 'all 0.2s',
        '&:hover': {
          borderColor: selected ? 'primary.main' : 'text.disabled',
          transform: 'translateY(-2px)',
          boxShadow: 2
        }
      }}
    >
      <CardActionArea onClick={onClick} sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}>
        <Box 
          sx={{ 
            height: 90, 
            bgcolor: 'action.hover', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            overflow: 'hidden',
            borderBottom: '1px solid',
            borderColor: 'divider'
          }}
        >
          {imageUrl ? (
            <CardMedia
              component="img"
              height="90" 
              image={imageUrl}
              alt={name}
              sx={{ objectFit: 'contain', width: '100%', height: '100%' }}
            />
          ) : (
            <DashboardIcon sx={{ fontSize: 32, color: 'text.disabled', opacity: 0.5 }} />
          )}
        </Box>
        <CardContent sx={{ py: 1, px: 1, flexGrow: 0 }}>
          <Typography variant="caption" fontWeight="bold" noWrap align="center" display="block">
            {name}
          </Typography>
        </CardContent>
      </CardActionArea>
    </Card>
  );

  if (!imageUrl) {
    return cardContent;
  }

  return (
    <ImageTooltip
      disableInteractive
      title={
        <Box sx={{ p: 0.5, bgcolor: 'background.paper' }}>
          <img 
            src={imageUrl} 
            alt={name} 
            style={{ 
              maxWidth: '300px', 
              maxHeight: '250px', 
              display: 'block',
              objectFit: 'contain' 
            }} 
          />
        </Box>
      }
      placement="right"
    >
      <Box>{cardContent}</Box>
    </ImageTooltip>
  );
}