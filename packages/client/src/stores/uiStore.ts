import { create } from "zustand";
import { persist } from "zustand/middleware";

/** The user's theme preference. `system` follows the OS `prefers-color-scheme`. */
export type Theme = "light" | "dark" | "system";

interface UiState {
  /** The selected theme; persisted to localStorage so it survives reloads. */
  theme: Theme;
  setTheme: (theme: Theme) => void;
  /** When on, blurring the bookmark URL field auto-fetches the page title. */
  autoFetchTitle: boolean;
  setAutoFetchTitle: (value: boolean) => void;
}

export const useUiStore = create<UiState>()(
  persist(
    set => ({
      theme: "system",
      setTheme: theme => set({
        theme,
      }),
      autoFetchTitle: true,
      setAutoFetchTitle: value => set({
        autoFetchTitle: value,
      }),
    }),
    {
      name: "eesimple-ui",
      partialize: state => ({
        theme: state.theme,
        autoFetchTitle: state.autoFetchTitle,
      }),
    },
  ),
);
