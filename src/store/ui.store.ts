import { create } from "zustand";

type UIState = {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  activeModal: string | null;
  openModal: (id: string) => void;
  closeModal: () => void;
};

export const useUIStore = create<UIState>((set) => ({
  isSidebarOpen: true,
  toggleSidebar: () =>
    set((s) => ({
      isSidebarOpen: !s.isSidebarOpen,
    })),
  setSidebarOpen: (open) => set({ isSidebarOpen: open }),
  activeModal: null,
  openModal: (id) => set({ activeModal: id }),
  closeModal: () => set({ activeModal: null }),
}));
