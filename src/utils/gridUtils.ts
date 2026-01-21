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

    // 2. 處理顯示名稱：
    // 去除 HTML tag (以防萬一 content 仍含有 HTML)
    let name = widget.content || `Widget ${id}`;
    name = name.replace(/<[^>]*>?/gm, '');
    name = name.trim() || 'Untitled Widget';

    const node: TreeNode = {
      id,
      name: name.trim() || 'Untitled Widget',
    };

    // 4. 遞迴處理子節點 (Nested Grids)
    // 只要有 subGridOpts，就視為資料夾，即使子節點為空也給予空陣列
    // 這樣 Tree View 才會將其視為 Folder 並允許拖入
    if (widget.subGridOpts) {
      node.children = transformGridToTree(widget.subGridOpts.children || []);
    }

    return node;
  });
};

/**
 * 遞迴尋找指定的 Widget
 */
export const findWidgetById = (widgets: GridStackWidget[], id: string): GridStackWidget | null => {
  for (const widget of widgets) {
    if (widget.id === id) return widget;
    if (widget.subGridOpts?.children) {
      const found = findWidgetById(widget.subGridOpts.children, id);
      if (found) return found;
    }
  }
  return null;
};
