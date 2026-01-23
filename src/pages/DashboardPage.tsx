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
        // If we are at root or /dashboard, and didn't find a specific page entry 
        // (or it had no grid), we fall back to the "latest" behavior for backward compatibility.
        // OR if the user navigated to a path that doesn't exist in DB, we might want to load nothing or default.
        // For now, let's keep the "load latest" behavior for root paths to ensure the app isn't empty on start.
        if (pathname === '/' || pathname === '/dashboard') {
          await loadLayout();
        } else {
           // For other unknown paths, we might want to clear the grid or load an empty one?
           // But if 'loadLayout()' without args loads the latest, we should be careful.
           // Let's assume if it's a new page (not in DB yet?) or just a "Dashboard view" of something else.
           // If we want a truly empty grid for new pages, we would need a clearGrid method.
           // For now, doing nothing (or loading latest if that's the default behavior of loadLayout) is the safest strictly-minimal change.
           // However, if the user defines a new page in the menu, it SHOULD be in the DB.
        }
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
