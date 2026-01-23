import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import GridDashboard from '../components/GridDashboard';
import { useUIStore } from '../store/useUIStore';
import { useGridStore } from '../store/useGridStore';
import { useLayoutPersistence } from '../hooks/useLayoutPersistence';
import { db } from '../db';

export default function DashboardPage() {
  const { pathname } = useLocation();
  const setRightSidebar = useUIStore((state) => state.setRightSidebar);
  const setEditMode = useUIStore((state) => state.setEditMode);
  const selectWidget = useGridStore((state) => state.selectWidget);
  const clearCommand = useGridStore((state) => state.clearCommand);
  const setLastLoadedLayoutId = useGridStore((state) => state.setLastLoadedLayoutId);
  const { loadLayout } = useLayoutPersistence();

  // Handle layout loading based on URL
  useEffect(() => {
    async function fetchAndLoadLayout() {
      try {
        // 1. Try to find the page definition for the current path
        const page = await db.pages.where('path').equals(pathname).first();

        if (page && page.gridId) {
          // 2. If page exists and has a linked grid, load that specific layout
          const layout = await db.layouts.get(page.gridId);
          if (layout) {
            await loadLayout(layout);
            return;
          }
        }

        // 3. Fallback:
        // If no specific page/grid is found, we should load an empty grid to avoid showing random data.
        // We do this by loading an empty array of items.
        
        // However, if we are on /dashboard (and it wasn't in DB), we might want to show empty.
        // The user explicitly requested: "dashboard page的grid如果沒設定就空白就好不要用第一筆顯示"
        
        console.log("No layout found for this path, loading empty grid.");
        // We can use loadLayout with an empty layout object to clear it, 
        // OR simpler: just pass an empty list to the store if we had a direct setter, 
        // but loadLayout takes a Layout object.
        // Let's create a temporary empty layout object.
        const emptyLayout = {
            id: 'empty',
            name: 'Empty',
            items: [],
            updatedAt: new Date()
        };
        await loadLayout(emptyLayout);

      } catch (error) {
        console.error("Error loading layout for page:", error);
      }
    }

    fetchAndLoadLayout();
  }, [pathname, loadLayout]);

  useEffect(() => {
    return () => {
      // 離開頁面時重置狀態
      setRightSidebar(false);
      setEditMode(false);
      selectWidget(null);
      clearCommand();
      setLastLoadedLayoutId(null);
    };
  }, [setRightSidebar, setEditMode, selectWidget, clearCommand, setLastLoadedLayoutId]);

  return <GridDashboard />;
}
