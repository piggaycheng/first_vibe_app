import type { GridStackWidget } from 'gridstack';
import SimpleBarChart from './charts/SimpleBarChart';
import SimpleLineChart from './charts/SimpleLineChart';
import SimplePieChart from './charts/SimplePieChart';
import { Typography, Box } from '@mui/material';

interface WidgetRendererProps {
  item: GridStackWidget;
}

export default function WidgetRenderer({ item }: WidgetRendererProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const widgetType = (item as any).type || 'text';

  switch (widgetType) {
    case 'bar':
      return (
        <Box sx={{ width: '100%', height: '100%', p: 1 }}>
           <Typography variant="subtitle2" sx={{ mb: 1 }}>Bar Chart Analysis</Typography>
           <Box sx={{ width: '100%', height: 'calc(100% - 30px)' }}>
             <SimpleBarChart />
           </Box>
        </Box>
      );
    case 'line':
      return (
        <Box sx={{ width: '100%', height: '100%', p: 1 }}>
           <Typography variant="subtitle2" sx={{ mb: 1 }}>Trend Analysis</Typography>
           <Box sx={{ width: '100%', height: 'calc(100% - 30px)' }}>
             <SimpleLineChart />
           </Box>
        </Box>
      );
    case 'pie':
      return (
        <Box sx={{ width: '100%', height: '100%', p: 1 }}>
           <Typography variant="subtitle2" sx={{ mb: 1 }}>Distribution</Typography>
           <Box sx={{ width: '100%', height: 'calc(100% - 30px)' }}>
             <SimplePieChart />
           </Box>
        </Box>
      );
    case 'text':
    default:
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
           {item.content || 'Text Widget'}
        </Box>
      );
  }
}
