import { create } from 'zustand';

interface AppState {
  isCommandPaletteOpen: boolean;
  openCommandPalette: () => void;
  closeCommandPalette: () => void;
  toggleCommandPalette: () => void;

  isResetFlowActive: boolean;
  startResetFlow: () => void;
  endResetFlow: () => void;
  resetCompletionCount: number;
  incrementResetCompletionCount: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  isCommandPaletteOpen: false,
  openCommandPalette: () => set({ isCommandPaletteOpen: true }),
  closeCommandPalette: () => set({ isCommandPaletteOpen: false }),
  toggleCommandPalette: () =>
    set((state) => ({ isCommandPaletteOpen: !state.isCommandPaletteOpen })),

  isResetFlowActive: false,
  startResetFlow: () => set({ isResetFlowActive: true }),
  endResetFlow: () => set({ isResetFlowActive: false }),

  resetCompletionCount: 0,
  incrementResetCompletionCount: () =>
    set((state) => ({ resetCompletionCount: state.resetCompletionCount + 1 })),
}));
