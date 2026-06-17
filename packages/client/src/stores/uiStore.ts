import { create } from "zustand";
import { persist } from "zustand/middleware";

/** The user's theme preference. `system` follows the OS `prefers-color-scheme`. */
export type Theme = "light" | "dark" | "system";

interface UiState {
  /** The selected theme; persisted to localStorage so it survives reloads. */
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

export const useUiStore = create<UiState>()(
  persist(
    set => ({
      theme: "system",
      setTheme: theme => set({
        theme,
      }),
    }),
    {
      name: "eesimple-ui",
      partialize: state => ({
        theme: state.theme,
      }),
    },
  ),
);
