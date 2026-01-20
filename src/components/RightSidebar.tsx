import { useMemo } from 'react';
import { Drawer, Box, Typography } from '@mui/material';
import { Tree, NodeApi } from 'react-arborist';
import FolderIcon from '@mui/icons-material/Folder';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import DashboardIcon from '@mui/icons-material/Dashboard';
import '../assets/css/RightSidebar.css';
import { useGridStore } from '../store/useGridStore';
import { transformGridToTree } from '../utils/gridUtils';

interface RightSidebarProps {
  open: boolean;
  width: number;
}

export default function RightSidebar({ open, width }: RightSidebarProps) {
  const gridItems = useGridStore((state) => state.gridItems);
  const addCommand = useGridStore((state) => state.addCommand);
  const selectWidget = useGridStore((state) => state.selectWidget);

  // 將 Gridstack 資料轉換為 Tree 資料
  const treeData = useMemo(() => {
    return transformGridToTree(gridItems);
  }, [gridItems]);

  const handleMove = ({ dragIds, parentId }: { dragIds: string[], parentId: string | null }) => {
    // 我們假設一次只拖曳一個
    const nodeId = dragIds[0];
    // 發送指令給 App (GridController)
    addCommand({
      type: 'MOVE_WIDGET',
      payload: {
        nodeId,
        targetParentId: parentId, // parentId 為 null 代表移到根目錄
      },
    });
  };

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
          onMove={handleMove}
        >
          {/* Node Renderer */}
          {({ node, style, dragHandle }: { node: NodeApi<any>, style: React.CSSProperties, dragHandle?: any }) => {
             // Determine Icon
             const Icon = node.isLeaf 
               ? DashboardIcon 
               : (node.isOpen ? FolderOpenIcon : FolderIcon);

             return (
              <div 
                style={style} 
                ref={dragHandle} 
                className={`node-container ${node.isSelected ? 'selected' : ''}`} 
                onClick={() => {
                  node.toggle();
                  node.select();
                  selectWidget(node.id);
                }}
              >
                <div className="node-content" style={{ display: 'flex', alignItems: 'center' }}>
                  <Icon fontSize="small" sx={{ color: 'text.secondary', mr: 1 }} />
                  <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {node.data.name}
                  </span>
                </div>
              </div>
            );
          }}
        </Tree>
      </Box>
    </Drawer>
  );
}
