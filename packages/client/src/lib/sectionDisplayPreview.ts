import type { SectionDisplayValue } from "../components/SectionDisplaySettings";

import { bookmarkImageModeLabel } from "./bookmarkColumns";

/**
 * One-line summary of a homepage section's display settings, shown as the collapsed preview of the
 * Display section in the editor and read-only view. Mirrors the order of the controls themselves.
 */
export function sectionDisplayPreview(
  value: Pick<SectionDisplayValue, "viewMode" | "columns" | "imageMode" | "imageVisibility" | "imageLayout">,
  hideIfEmpty?: boolean,
): string {
  const parts: string[] = [];

  if (value.viewMode === "table") {
    parts.push("Table");
  }
  else {
    parts.push(`${value.columns} ${value.columns === 1 ? "column" : "columns"}`);
    if (value.imageVisibility === "off") {
      parts.push("No image");
    }
    else {
      parts.push(value.imageVisibility === "image-only" ? "Image only" : bookmarkImageModeLabel(value.imageMode));
      if (value.imageVisibility === "shown" && (value.columns === 1 || value.columns === 2)) {
        parts.push(value.imageLayout === "side" ? "Side" : "Above");
      }
    }
  }

  if (hideIfEmpty) parts.push("Hidden when empty");
  return parts.join(" · ");
}
