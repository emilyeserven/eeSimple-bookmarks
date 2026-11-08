import { create } from "zustand";
import { persist } from "zustand/middleware";

/** The color theme: an explicit mode, or follow the OS preference. */
export type Theme = "light" | "dark" | "system";

/**
 * Device-local UI preferences, persisted to localStorage. Only ephemeral, per-device view state
 * belongs here (theme, collapsed panels, sizes). A setting that must sync across devices belongs in
 * a server-persisted settings table instead (a table + endpoint pair, like any other entity).
 */
interface UiState {
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
      name: "app-ui",
      version: 1,
    },
  ),
);
