import { create } from "zustand";

interface UiState {
  /** Whether only favorite bookmarks are shown in the list. */
  showFavoritesOnly: boolean;
  toggleShowFavoritesOnly: () => void;
}

export const useUiStore = create<UiState>(set => ({
  showFavoritesOnly: false,
  toggleShowFavoritesOnly: () => set(state => ({
    showFavoritesOnly: !state.showFavoritesOnly,
  })),
}));
