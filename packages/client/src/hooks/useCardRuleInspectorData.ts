import type { ComboboxOption } from "../components/Combobox";
import type { RuleAttrLabels } from "../lib/cardDisplayRuleAttrFormat";

import { useMemo } from "react";

import { buildTagDescendants } from "@eesimple/types";

import { useCroppedHeight, useCroppedWidth } from "./useAppSettings";
import { useBookmarks } from "./useBookmarks";
import { useCardDisplayRules } from "./useCardDisplayRules";
import { useCustomAspectRatios } from "./useCustomAspectRatios";
import { useCustomProperties } from "./useCustomProperties";
import { useTags } from "./useTags";
import { useTranslatedLabel } from "./useTranslatedLabel";
import { buildAspectOptions } from "../lib/aspectOptions";
import { STANDARD_CARD_FIELDS } from "../lib/bookmarkCardFields";

/** Sort rules into priority order: non-default first (lowest sortOrder first), the Default rule last. */
function byPriority(
  a: { isDefault: boolean;
    sortOrder: number; },
  b: { isDefault: boolean;
    sortOrder: number; },
): number {
  if (a.isDefault !== b.isDefault) return a.isDefault ? 1 : -1;
  return a.sortOrder - b.sortOrder;
}

/** The bookmark host, for disambiguating same-titled bookmarks in the picker. */
function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  }
  catch {
    return url;
  }
}

/** All the loaded data + derived lookups the inspector needs, gathered into one hook to keep the view thin. */
export function useCardRuleInspectorData() {
  const tLabel = useTranslatedLabel();
  const {
    data: bookmarks = [],
  } = useBookmarks();
  const {
    data: rules = [],
  } = useCardDisplayRules();
  const {
    data: tags = [],
  } = useTags();
  const {
    data: properties = [],
  } = useCustomProperties();
  const {
    data: customRatios = [],
  } = useCustomAspectRatios();
  const croppedWidth = useCroppedWidth();
  const croppedHeight = useCroppedHeight();

  const options = useMemo<ComboboxOption[]>(
    () => bookmarks.map(bookmark => ({
      value: bookmark.id,
      label: `${bookmark.title || bookmark.url || ""} — ${hostOf(bookmark.url ?? "")}`,
    })),
    [bookmarks],
  );

  const sortedRules = useMemo(() => [...rules].sort(byPriority), [rules]);
  const tagDescendants = useMemo(
    () => buildTagDescendants(tags.map(tag => ({
      id: tag.id,
      parentId: tag.parentId,
    }))),
    [tags],
  );

  const ruleNameById = useMemo(
    () => new Map(rules.map(rule => [rule.id, rule.name])),
    [rules],
  );

  const labels = useMemo<RuleAttrLabels>(() => {
    const aspectOptions = buildAspectOptions(croppedWidth, croppedHeight, customRatios);
    const fieldLabel = new Map<string, string>(
      STANDARD_CARD_FIELDS.map(f => [f.key, tLabel(f.label)]),
    );
    for (const property of properties) fieldLabel.set(property.id, property.name);
    return {
      aspectLabel: new Map(aspectOptions.map(opt => [opt.value, opt.label])),
      fieldLabel,
    };
  }, [croppedWidth, croppedHeight, customRatios, properties, tLabel]);

  return {
    bookmarks,
    options,
    sortedRules,
    tagDescendants,
    ruleNameById,
    labels,
  };
}
