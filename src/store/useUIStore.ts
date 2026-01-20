import { create } from 'zustand';

interface UIState {
  leftSidebarOpen: boolean;
  rightSidebarOpen: boolean;
  isEditMode: boolean;
  themeMode: 'light' | 'dark';
  toggleLeftSidebar: () => void;
  toggleRightSidebar: () => void;
  setRightSidebar: (open: boolean) => void;
  toggleEditMode: () => void;
  toggleTheme: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  leftSidebarOpen: false,
  rightSidebarOpen: false,
  isEditMode: false,
  themeMode: 'light',
  toggleLeftSidebar: () => set((state) => ({ leftSidebarOpen: !state.leftSidebarOpen })),
  toggleRightSidebar: () => set((state) => ({ rightSidebarOpen: !state.rightSidebarOpen })),
  setRightSidebar: (open) => set({ rightSidebarOpen: open }),
  toggleEditMode: () => set((state) => ({ isEditMode: !state.isEditMode })),
  toggleTheme: () => set((state) => ({ themeMode: state.themeMode === 'light' ? 'dark' : 'light' })),
}));