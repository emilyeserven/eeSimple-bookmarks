import type { DisplayPresetSettings } from "@eesimple/types";

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
