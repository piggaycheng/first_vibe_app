import { useEffect } from 'react';
import GridDashboard from '../components/GridDashboard';
import { useUIStore } from '../store/useUIStore';
import { useGridStore } from '../store/useGridStore';

export default function DashboardPage() {
  const setRightSidebar = useUIStore((state) => state.setRightSidebar);
  const setEditMode = useUIStore((state) => state.setEditMode);
  const selectWidget = useGridStore((state) => state.selectWidget);
  const clearCommand = useGridStore((state) => state.clearCommand);
  const setLastLoadedLayoutId = useGridStore((state) => state.setLastLoadedLayoutId);

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
