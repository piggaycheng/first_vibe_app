import type { GridStackWidget } from 'gridstack';

export interface TreeNode {
  id: string;
  name: string;
  children?: TreeNode[];
}

/**
 * 將 GridStackWidget[] 轉換為 React-Arborist 預期的 TreeNode[]
 * @param widgets Gridstack 的 widget 列表
 * @returns 樹狀結構資料
 */
export const transformGridToTree = (widgets: GridStackWidget[]): TreeNode[] => {
  return widgets.map((widget, index) => {
    // 1. 確保有 ID，如果沒有則生成一個臨時 ID (基於 content 或 index + random)
    // 注意：每次 render 若重新生成 ID 會導致 Tree 狀態重置，建議原始資料本身就要有 ID
    const id = widget.id ? String(widget.id) : `node-${index}-${Math.random().toString(36).substr(2, 9)}`;

    // 2. 處理顯示名稱：去除 HTML 標籤或是使用預設名稱
    const name = widget.content 
      ? widget.content.replace(/<[^>]*>?/gm, '') // 簡單去除 HTML tag
      : `Widget ${id}`;

    // 3. 建立基本節點
    const node: TreeNode = {
      id,
      name: name.trim() || 'Untitled Widget',
    };

    // 4. 遞迴處理子節點 (Nested Grids)
    if (widget.subGridOpts && widget.subGridOpts.children && widget.subGridOpts.children.length > 0) {
      node.children = transformGridToTree(widget.subGridOpts.children);
    }

    return node;
  });
};
