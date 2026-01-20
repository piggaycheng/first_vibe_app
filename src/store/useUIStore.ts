import { create } from 'zustand';

interface UIState {
  leftSidebarOpen: boolean;
  rightSidebarOpen: boolean;
  isEditMode: boolean;
  toggleLeftSidebar: () => void;
  toggleRightSidebar: () => void;
  toggleEditMode: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  leftSidebarOpen: true,
  rightSidebarOpen: true,
  isEditMode: false, // Default to View mode
  toggleLeftSidebar: () => set((state) => ({ leftSidebarOpen: !state.leftSidebarOpen })),
  toggleRightSidebar: () => set((state) => ({ rightSidebarOpen: !state.rightSidebarOpen })),
  toggleEditMode: () => set((state) => ({ isEditMode: !state.isEditMode })),
}));
