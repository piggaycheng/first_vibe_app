import { useMemo } from 'react';
import { Drawer, Box, Typography } from '@mui/material';
import { Tree, NodeApi } from 'react-arborist';
import '../assets/css/RightSidebar.css';
import { useGridStore } from '../store/useGridStore';
import { transformGridToTree } from '../utils/gridUtils';

interface RightSidebarProps {
  open: boolean;
  width: number;
}

export default function RightSidebar({ open, width }: RightSidebarProps) {
  const gridItems = useGridStore((state) => state.gridItems);

  // 將 Gridstack 資料轉換為 Tree 資料
  const treeData = useMemo(() => {
    return transformGridToTree(gridItems);
  }, [gridItems]);

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
          Layout Tree
        </Typography>
        <Tree
          data={treeData}
          openByDefault={true}
          width={width - 16}
          height={600}
          indent={24}
          rowHeight={32}
          paddingTop={10}
          paddingBottom={10}
        >
          {/* Node Renderer */}
          {({ node, style, dragHandle }: { node: NodeApi<any>, style: React.CSSProperties, dragHandle?: any }) => (
            <div 
              style={style} 
              ref={dragHandle} 
              className={`node-container ${node.isSelected ? 'selected' : ''}`} 
              onClick={() => node.toggle()}
            >
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
