import { Drawer, Box, Typography } from '@mui/material';
import { Tree, NodeApi } from 'react-arborist';
import '../assets/css/RightSidebar.css'; // For any custom tree styles if needed

interface RightSidebarProps {
  open: boolean;
  width: number;
}

const data = [
  { id: '1', name: 'Dashboard' },
  { id: '2', name: 'Settings' },
  {
    id: '3',
    name: 'Analytics',
    children: [
      { id: 'c1', name: 'Real-time' },
      { id: 'c2', name: 'Historical' },
    ],
  },
  {
    id: '4',
    name: 'Reports',
    children: [
      { id: 'r1', name: 'Monthly' },
      { id: 'r2', name: 'Weekly' },
      { id: 'r3', name: 'Custom' },
    ],
  },
];

export default function RightSidebar({ open, width }: RightSidebarProps) {

  return (
    <Drawer
      sx={{
        width: width,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: width,
          boxSizing: 'border-box',
          top: '64px',
          height: 'calc(100% - 64px)',
        },
      }}
      variant="persistent"
      anchor="right"
      open={open}
    >
      <Box sx={{ height: '100%', overflow: 'hidden', pt: 2, pl: 1 }}>
        <Typography variant="h6" sx={{ px: 2, mb: 2 }}>
          Explorer
        </Typography>
        <Tree
          data={data}
          openByDefault={true}
          width={width - 16} // Adjust for padding
          height={600} // Or use a ResizeObserver to fill height
          indent={24}
          rowHeight={32}
          paddingTop={10}
          paddingBottom={10}
        >
          {/* Node Renderer */}
          {({ node, style, dragHandle }: { node: NodeApi<any>, style: React.CSSProperties, dragHandle?: any }) => (
            <div style={style} ref={dragHandle} className={`node-container ${node.isSelected ? 'selected' : ''}`} onClick={() => node.toggle()}>
              <div className="node-content">
                {node.isLeaf ? '📄' : (node.isOpen ? '📂' : '📁')}
                <span style={{ marginLeft: '8px' }}>{node.data.name}</span>
              </div>
            </div>
          )}
        </Tree>
      </Box>
    </Drawer>
  );
}
