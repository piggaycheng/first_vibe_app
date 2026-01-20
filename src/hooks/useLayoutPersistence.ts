import { useCallback } from 'react';
import { useGridStore } from '../store/useGridStore';
import { db, type Layout } from '../db';

export function useLayoutPersistence() {
  const gridItems = useGridStore((state) => state.gridItems);
  const addCommand = useGridStore((state) => state.addCommand);

  const saveLayout = useCallback(async () => {
    try {
      const timestamp = new Date();
      await db.layouts.add({
        id: crypto.randomUUID(),
        name: `Layout ${timestamp.toLocaleString()}`,
        items: gridItems,
        updatedAt: timestamp
      });
      console.log('Layout saved successfully');
    } catch (error) {
      console.error('Failed to save layout:', error);
    }
  }, [gridItems]);

  const loadLayout = useCallback(async (specificLayout?: Layout) => {
    try {
      let items = specificLayout?.items;
      
      if (!items) {
        // Fallback to loading the most recent one if no specific layout provided
        const latest = await db.layouts.orderBy('updatedAt').reverse().first();
        items = latest?.items;
      }

      if (items) {
        addCommand({
          type: 'LOAD_LAYOUT',
          payload: {
            widgetOptions: items
          }
        });
      }
    } catch (error) {
      console.error('Failed to load layout:', error);
    }
  }, [addCommand]);

  const deleteLayout = useCallback(async (id: string) => {
    try {
      await db.layouts.delete(id);
    } catch (error) {
      console.error('Failed to delete layout:', error);
    }
  }, []);

  return { saveLayout, loadLayout, deleteLayout };
}
