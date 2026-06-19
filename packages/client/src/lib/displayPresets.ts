import type { DisplayPresetSettings } from "@eesimple/types";

/** Human-readable summary of a display preset's settings, e.g. "2 col · Images: shown · Natural · Above". */
export function summarizeDisplayPreset(settings: DisplayPresetSettings): string {
  const parts: string[] = [`${settings.columns} col`];
  if (settings.imageVisibility === "shown") {
    parts.push("Images: shown");
    parts.push(settings.imageMode ? "Natural" : "Cropped");
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
