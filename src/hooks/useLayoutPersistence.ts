import { useCallback } from 'react';
import { useGridStore } from '../store/useGridStore';
import { db, type Layout } from '../db';
import { findWidgetById } from '../utils/gridUtils';

export function useLayoutPersistence() {
  const gridItems = useGridStore((state) => state.gridItems);
  const selectedWidgetId = useGridStore((state) => state.selectedWidgetId);
  const addCommand = useGridStore((state) => state.addCommand);
  const setLastLoadedLayoutId = useGridStore((state) => state.setLastLoadedLayoutId);

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

  const saveSelectedLayout = useCallback(async () => {
    if (!selectedWidgetId) {
      console.warn('No widget selected to save');
      return;
    }

    const selectedWidget = findWidgetById(gridItems, selectedWidgetId);
    if (!selectedWidget) {
      console.error('Selected widget not found in current items');
      return;
    }

    try {
      const timestamp = new Date();
      await db.layouts.add({
        id: crypto.randomUUID(),
        name: `Selection: ${selectedWidget.id} ${timestamp.toLocaleString()}`,
        items: [selectedWidget],
        updatedAt: timestamp
      });
      console.log('Selected layout saved successfully');
    } catch (error) {
      console.error('Failed to save selected layout:', error);
    }
  }, [gridItems, selectedWidgetId]);

  const loadLayout = useCallback(async (specificLayout?: Layout) => {
    try {
      let items = specificLayout?.items;
      let layoutId = specificLayout?.id;
      
      if (!items) {
        // Fallback to loading the most recent one if no specific layout provided
        const latest = await db.layouts.orderBy('updatedAt').reverse().first();
        items = latest?.items;
        layoutId = latest?.id;
      }

      if (items) {
        addCommand({
          type: 'LOAD_LAYOUT',
          payload: {
            widgetOptions: items
          }
        });
        if (layoutId) {
          setLastLoadedLayoutId(layoutId);
        }
      }
    } catch (error) {
      console.error('Failed to load layout:', error);
    }
  }, [addCommand, setLastLoadedLayoutId]);

  const deleteLayout = useCallback(async (id: string) => {
    try {
      await db.layouts.delete(id);
    } catch (error) {
      console.error('Failed to delete layout:', error);
    }
  }, []);

  return { saveLayout, saveSelectedLayout, loadLayout, deleteLayout };
}
