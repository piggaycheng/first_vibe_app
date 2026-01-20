import { create } from 'zustand';
import type { GridStackWidget } from 'gridstack';

export type GridCommandType = 'MOVE_WIDGET';

export interface GridCommand {
  type: GridCommandType;
  payload: {
    nodeId: string;
    targetParentId: string | null; // null means root
  };
}

interface GridState {
  gridItems: GridStackWidget[];
  pendingCommand: GridCommand | null;
  setGridItems: (items: GridStackWidget[]) => void;
  addCommand: (command: GridCommand) => void;
  clearCommand: () => void;
}

const initialGridItems: GridStackWidget[] = [
  { x: 0, y: 0, w: 4, h: 4, content: 'Regular Widget', id: 'widget-1' },
  {
    x: 4, y: 0, w: 8, h: 6,
    id: 'widget-container-1',
    // content: 'Container Widget (Drop items here)',
    subGridOpts: {
      children: [
        { x: 0, y: 0, w: 3, h: 2, content: 'Nested 1', id: 'nested-1' },
        { x: 3, y: 0, w: 3, h: 2, content: 'Nested 2', id: 'nested-2' },
        { x: 0, y: 2, w: 6, h: 2, content: 'Nested 3', id: 'nested-3' }
      ]
    }
  },
];

export const useGridStore = create<GridState>((set) => ({
  gridItems: initialGridItems,
  pendingCommand: null,
  setGridItems: (items) => set({ gridItems: items }),
  addCommand: (command) => set({ pendingCommand: command }),
  clearCommand: () => set({ pendingCommand: null }),
}));
