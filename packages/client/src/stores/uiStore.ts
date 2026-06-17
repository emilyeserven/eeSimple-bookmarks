import { create } from "zustand";
import { persist } from "zustand/middleware";

/** The user's theme preference. `system` follows the OS `prefers-color-scheme`. */
export type Theme = "light" | "dark" | "system";

interface UiState {
  /** Whether only favorite bookmarks are shown in the list. */
  showFavoritesOnly: boolean;
  toggleShowFavoritesOnly: () => void;
  /** The selected theme; persisted to localStorage so it survives reloads. */
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

export const useUiStore = create<UiState>()(
  persist(
    set => ({
      showFavoritesOnly: false,
      toggleShowFavoritesOnly: () => set(state => ({
        showFavoritesOnly: !state.showFavoritesOnly,
      })),
      theme: "system",
      setTheme: theme => set({
        theme,
      }),
    }),
    {
      name: "eesimple-ui",
      // Only the theme is worth persisting; the favorites filter is per-session.
      partialize: state => ({
        theme: state.theme,
      }),
    },
  ),
);
