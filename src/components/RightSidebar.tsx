import { useMemo } from 'react';
import { Drawer, Box, Typography } from '@mui/material';
import { Tree, NodeApi } from 'react-arborist';
import FolderIcon from '@mui/icons-material/Folder';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import WidgetsIcon from '@mui/icons-material/Widgets';
import DeleteIcon from '@mui/icons-material/Delete';
import { IconButton } from '@mui/material';
import '../assets/css/RightSidebar.css';
import { useGridStore } from '../store/useGridStore';
import { useUIStore } from '../store/useUIStore';
import { transformGridToTree } from '../utils/gridUtils';

interface RightSidebarProps {
  open: boolean;
  width: number;
}

interface TreeNode {
  id: string;
  name: string;
  children?: TreeNode[];
}

export default function RightSidebar({ open, width }: RightSidebarProps) {
  const gridItems = useGridStore((state) => state.gridItems);
  const selectedWidgetId = useGridStore((state) => state.selectedWidgetId);
  const addCommand = useGridStore((state) => state.addCommand);
  const selectWidget = useGridStore((state) => state.selectWidget);
  const isEditMode = useUIStore((state) => state.isEditMode);

  // 將 Gridstack 資料轉換為 Tree 資料
  const treeData = useMemo(() => {
    return transformGridToTree(gridItems);
  }, [gridItems]);

  const handleMove = ({ dragIds, parentId }: { dragIds: string[], parentId: string | null }) => {
    const nodeId = dragIds[0];
    addCommand({
      type: 'MOVE_WIDGET',
      payload: {
        nodeId,
        targetParentId: parentId,
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
          selection={selectedWidgetId || undefined}
          onSelect={(nodes) => {
            if (nodes.length > 0) {
              selectWidget(nodes[0].id);
            } else {
              selectWidget(null);
            }
          }}
          openByDefault={true}
          width={width - 16}
          height={600}
          indent={24}
          rowHeight={32}
          paddingTop={10}
          paddingBottom={10}
          onMove={handleMove}
          disableDrag={!isEditMode}
          disableDrop={!isEditMode}
        >
          {/* Node Renderer */}
          {({ node, style, dragHandle }: { node: NodeApi<TreeNode>, style: React.CSSProperties, dragHandle?: (el: HTMLDivElement | null) => void }) => {
             // Determine Icon
             const Icon = node.isLeaf 
               ? WidgetsIcon 
               : (node.isOpen ? FolderOpenIcon : FolderIcon);

             return (
              <div 
                style={style} 
                ref={dragHandle} 
                className={`node-container ${node.isSelected ? 'selected' : ''}`} 
                onClick={() => {
                  node.toggle();
                  // selection is now handled by the Tree's selection/onSelect props
                }}
              >
                <div className="node-content" style={{ display: 'flex', alignItems: 'center', flexGrow: 1, overflow: 'hidden' }}>
                  <Icon fontSize="small" sx={{ color: 'text.secondary', mr: 1 }} />
                  <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flexGrow: 1 }}>
                    {node.data.name}
                  </span>
                  {isEditMode && (
                    <IconButton 
                      size="small" 
                      onClick={(e) => {
                        e.stopPropagation();
                        addCommand({
                          type: 'REMOVE_WIDGET',
                          payload: { nodeId: node.id }
                        });
                      }}
                      sx={{ p: 0.5, ml: 1, '&:hover': { color: 'error.main' } }}
                    >
                      <DeleteIcon fontSize="inherit" />
                    </IconButton>
                  )}
                </div>
              </div>
            );
          }}
        </Tree>
      </Box>
    </Drawer>
  );
}
