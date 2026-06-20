import type { BookmarkImageVisibility, HomepageSectionImageLayout } from "../stores/uiStore";
import type { DisplayPresetSettings } from "@eesimple/types";

/** The store setters needed to apply a preset's settings to a listing page. */
interface ApplyDisplayPresetSetters {
  setBookmarkColumns: (pageKey: string, columns: number) => void;
  setBookmarkImageVisibility: (pageKey: string, value: BookmarkImageVisibility) => void;
  setBookmarkImageMode: (pageKey: string, value: string) => void;
  setBookmarkImageLayout: (pageKey: string, value: HomepageSectionImageLayout) => void;
  setHiddenCardFields: (pageKey: string, fieldKeys: string[]) => void;
}

/**
 * Apply a saved display preset's settings to a listing page: the four layout settings plus, when the
 * preset records them, the hidden card fields. A preset whose `hiddenFields` is undefined (a legacy
 * preset saved before column options were captured) leaves the page's current column visibility
 * untouched. Tracking which preset was applied (for the backfill offer) is the caller's job, done
 * where the preset id is known — see `DisplayPresetSelect`.
 */
export function applyDisplayPreset(
  pageKey: string,
  settings: DisplayPresetSettings,
  setters: ApplyDisplayPresetSetters,
): void {
  setters.setBookmarkColumns(pageKey, settings.columns);
  setters.setBookmarkImageVisibility(pageKey, settings.imageVisibility);
  const rawMode = settings.imageMode;
  setters.setBookmarkImageMode(
    pageKey,
    typeof rawMode === "boolean" ? (rawMode ? "natural" : "cropped") : rawMode,
  );
  setters.setBookmarkImageLayout(pageKey, settings.imageLayout);
  if (settings.hiddenFields !== undefined) {
    setters.setHiddenCardFields(pageKey, settings.hiddenFields);
  }
}

/**
 * Whether two presets' layout settings match. Compares only the layout fields (columns, image
 * visibility/mode/layout) and ignores `hiddenFields` — used to detect when the only difference
 * between the current state and an applied preset is the missing column information.
 */
export function displayPresetSettingsEqual(
  a: DisplayPresetSettings,
  b: DisplayPresetSettings,
): boolean {
  return (
    a.columns === b.columns
    && a.imageVisibility === b.imageVisibility
    && a.imageMode === b.imageMode
    && a.imageLayout === b.imageLayout
  );
}

const MODE_LABELS: Record<string, string> = {
  natural: "Natural",
  square: "Square",
  opengraph: "OpenGraph",
  cropped: "Cropped",
};

/** Human-readable summary of a display preset's settings, e.g. "2 col · Images: shown · Natural · Above". */
export function summarizeDisplayPreset(settings: DisplayPresetSettings): string {
  const parts: string[] = [`${settings.columns} col`];
  if (settings.imageVisibility === "shown") {
    parts.push("Images: shown");
    const raw = settings.imageMode;
    const mode = typeof raw === "boolean" ? (raw ? "natural" : "cropped") : raw;
    parts.push(MODE_LABELS[mode] ?? "Custom");
    parts.push(settings.imageLayout === "above" ? "Above" : "Side");
  }
  else if (settings.imageVisibility === "image-only") {
    parts.push("Image only");
  }
  else {
    parts.push("Images: off");
  }
  return parts.join(" · ");
}
