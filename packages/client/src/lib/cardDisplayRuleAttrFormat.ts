import type { RuleAttrInspection } from "./cardDisplayRules";
import type { CardFieldZones, CardZoneLayouts } from "@eesimple/types";

import { normalizeCardZoneLayout } from "@eesimple/types";

import i18n from "../i18n";

const IMAGE_VISIBILITY_LABELS: Record<string, string> = {
  "shown": i18n.t("Show"),
  "image-only": i18n.t("Only"),
  "off": i18n.t("Off"),
};

const IMAGE_LAYOUT_LABELS: Record<string, string> = {
  above: i18n.t("Above"),
  side: i18n.t("Side"),
};

const ZONE_LABELS: Record<string, string> = {
  "card-single-top": i18n.t("Top"),
  "card-labels": i18n.t("Labels"),
  "card-table": i18n.t("Table"),
  "card-single-bottom": i18n.t("Bottom"),
};

/** Display-name lookups the inspector resolves once and threads into each attribute's formatter. */
export interface RuleAttrLabels {
  /** Aspect-ratio value → label (e.g. `"16:9" → "16 : 9"`). */
  aspectLabel: Map<string, string>;
  /** Field key (standard key or custom-property id) → human label. */
  fieldLabel: Map<string, string>;
}

/** Summarize the placed fields of a `fieldZones` value as "Card: …; Corners: …". */
function summarizeFieldZones(zones: CardFieldZones, fieldLabel: Map<string, string>): string {
  const summarize = (keys: { key: string }[]): string =>
    keys.map(p => fieldLabel.get(p.key) ?? p.key).join(", ");

  const parts: string[] = [];
  const body = [
    ...(zones["card-single-top"] ?? []),
    ...(zones["card-labels"] ?? []),
    ...(zones["card-table"] ?? []),
    ...(zones["card-single-bottom"] ?? []),
  ];
  if (body.length > 0) {
    parts.push(i18n.t("Card: {{fields}}", {
      fields: summarize(body),
    }));
  }

  const corners = [
    ...(zones["image-top-left"] ?? []),
    ...(zones["image-top-right"] ?? []),
    ...(zones["image-bottom-left"] ?? []),
    ...(zones["image-bottom-right"] ?? []),
  ];
  if (corners.length > 0) {
    parts.push(i18n.t("Corners: {{fields}}", {
      fields: summarize(corners),
    }));
  }

  return parts.length > 0 ? parts.join("; ") : i18n.t("All fields hidden");
}

/**
 * Summarize a `cardZoneLayouts` value as "Top: flex, Labels: grid, …", reading each zone's
 * {@link CardZoneLayout.mode} (via the shared backward-compat parse, which also tolerates the legacy
 * bare-string form). The previous `${layout}` interpolation rendered `[object Object]` once layouts
 * became objects.
 */
function summarizeZoneLayouts(layouts: CardZoneLayouts): string {
  return Object.entries(layouts)
    .map(([zone, layout]) => `${ZONE_LABELS[zone] ?? zone}: ${normalizeCardZoneLayout(layout, "flex").mode}`)
    .join(", ");
}

/** Whether a raw attr value is a plain object (the form `fieldZones`/`cardZoneLayouts` carry). */
function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Format one inspected rule attribute for display in the Card Display Rule inspector. Mirrors what the
 * rule editor shows for each attribute, resolving image enums / aspect / field labels via {@link
 * RuleAttrLabels}. A pure function so it can be unit-tested away from the inspector's data hooks.
 */
export function formatRuleAttrValue(attr: RuleAttrInspection, labels: RuleAttrLabels): string {
  switch (attr.key) {
    case "imageVisibility":
      return IMAGE_VISIBILITY_LABELS[String(attr.value)] ?? String(attr.value);
    case "imageLayout":
      return IMAGE_LAYOUT_LABELS[String(attr.value)] ?? String(attr.value);
    case "imageMode":
      return labels.aspectLabel.get(String(attr.value)) ?? String(attr.value);
    case "hideWebsiteForYouTube":
      return attr.value ? i18n.t("On") : i18n.t("Off");
    case "fieldZones":
      return isPlainObject(attr.value)
        ? summarizeFieldZones(attr.value as CardFieldZones, labels.fieldLabel)
        : String(attr.value);
    case "cardZoneLayouts":
      return isPlainObject(attr.value)
        ? summarizeZoneLayouts(attr.value as CardZoneLayouts)
        : String(attr.value);
    default:
      return String(attr.value);
  }
}
