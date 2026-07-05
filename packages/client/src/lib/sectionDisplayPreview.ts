import type { SectionDisplayValue } from "../components/SectionDisplaySettings";

import i18n from "../i18n";
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
    parts.push(i18n.t("Table"));
  }
  else {
    parts.push(i18n.t("{{count}} {{noun}}", {
      count: value.columns,
      noun: value.columns === 1 ? i18n.t("column") : i18n.t("columns"),
    }));
    if (value.imageVisibility === "off") {
      parts.push(i18n.t("No image"));
    }
    else {
      parts.push(value.imageVisibility === "image-only" ? i18n.t("Image only") : bookmarkImageModeLabel(value.imageMode));
      if (value.imageVisibility === "shown" && (value.columns === 1 || value.columns === 2)) {
        parts.push(value.imageLayout === "side" ? i18n.t("Side") : i18n.t("Above"));
      }
    }
  }

  if (hideIfEmpty) parts.push(i18n.t("Hidden when empty"));
  return parts.join(" · ");
}
