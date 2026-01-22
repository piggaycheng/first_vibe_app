import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIState {
  leftSidebarOpen: boolean;
  rightSidebarOpen: boolean;
  isEditMode: boolean;
  themeMode: 'light' | 'dark';
  toggleLeftSidebar: () => void;
  toggleRightSidebar: () => void;
  setLeftSidebar: (open: boolean) => void;
  setRightSidebar: (open: boolean) => void;
  setEditMode: (isEdit: boolean) => void;
  toggleEditMode: () => void;
  toggleTheme: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      leftSidebarOpen: false,
      rightSidebarOpen: false,
      isEditMode: false,
      themeMode: 'light',
      toggleLeftSidebar: () => set((state) => ({ leftSidebarOpen: !state.leftSidebarOpen })),
      toggleRightSidebar: () => set((state) => ({ rightSidebarOpen: !state.rightSidebarOpen })),
      setLeftSidebar: (open) => set({ leftSidebarOpen: open }),
      setRightSidebar: (open) => set({ rightSidebarOpen: open }),
      setEditMode: (isEdit) => set({ isEditMode: isEdit }),
      toggleEditMode: () => set((state) => ({ isEditMode: !state.isEditMode })),
      toggleTheme: () => set((state) => ({ themeMode: state.themeMode === 'light' ? 'dark' : 'light' })),
    }),
    {
      name: 'ui-storage',
      partialize: (state) => ({ themeMode: state.themeMode, leftSidebarOpen: state.leftSidebarOpen }),
    }
  )
);
