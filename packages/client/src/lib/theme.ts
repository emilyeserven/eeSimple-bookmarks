import type { Theme } from "../stores/uiStore";

const DARK_QUERY = "(prefers-color-scheme: dark)";

/** Whether the OS currently prefers a dark color scheme. */
function systemPrefersDark(): boolean {
  return typeof window !== "undefined" && window.matchMedia(DARK_QUERY).matches;
}

/** Resolve a (possibly `system`) theme to the concrete mode to render. */
function resolveTheme(theme: Theme): "light" | "dark" {
  if (theme === "system") return systemPrefersDark() ? "dark" : "light";
  return theme;
}

/** Apply a theme by toggling the `.dark` class on the document root. */
export function applyTheme(theme: Theme): void {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("dark", resolveTheme(theme) === "dark");
}

/**
 * Apply `theme` now and, when it is `system`, keep it in sync with OS changes.
 * Returns a cleanup function that removes the media-query listener.
 */
export function watchTheme(theme: Theme): () => void {
  applyTheme(theme);
  if (theme !== "system" || typeof window === "undefined") {
    return () => {
      // No media-query listener was attached, so there is nothing to remove.
    };
  }

  const media = window.matchMedia(DARK_QUERY);
  const onChange = () => applyTheme("system");
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}
