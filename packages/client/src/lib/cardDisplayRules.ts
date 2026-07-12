import type {
  BookmarkImageVisibility,
  HomepageSectionImageLayout,
} from "../lib/bookmarkColumns";
import type {
  Bookmark,
  CardDisplayConfig,
  CardDisplaySection,
  CardImageCorners,
  ConditionInput,
  EvaluateOptions,
} from "@eesimple/types";

import { useCallback } from "react";

import { cardDisplayConfigFromFieldZones, defaultCardZoneLayouts, emptyCardFieldZones, evaluateConditions } from "@eesimple/types";

import { STANDARD_CARD_FIELDS } from "./bookmarkCardFieldDefs";
import { defaultBodyZone } from "./bookmarkCardValues";
import { useCardDisplayConfig } from "../hooks/useCardDisplayConfig";
import { useConditionEvaluateOptions } from "../hooks/useConditionEvaluateOptions";

/**
 * A bookmark's fully-resolved per-card display: the dynamic body `sections` **already filtered** by
 * each section's `visibleIf` for this bookmark, the four image corners, and the concrete image
 * presentation attributes. Fed straight to `<BookmarkCard sections=… imageCorners=… />`.
 */
export interface ResolvedCardDisplay {
  sections: CardDisplaySection[];
  imageCorners: CardImageCorners;
  imageMode: string;
  imageVisibility: BookmarkImageVisibility;
  imageLayout: HomepageSectionImageLayout;
  hideWebsiteForYouTube: boolean;
}

/**
 * The hardcoded baseline config used only before the stored config loads (cold React Query cache):
 * every standard field placed in its {@link defaultBodyZone}, all corners empty, natural/shown/above.
 */
function baselineConfig(): CardDisplayConfig {
  const zones = emptyCardFieldZones();
  for (const field of STANDARD_CARD_FIELDS) {
    zones[defaultBodyZone(field.key)].push({
      key: field.key,
    });
  }
  return cardDisplayConfigFromFieldZones(zones, defaultCardZoneLayouts(), {
    imageMode: "natural",
    imageVisibility: "shown",
    imageLayout: "above",
    hideWebsiteForYouTube: false,
  });
}

export const BASELINE: CardDisplayConfig = baselineConfig();

/**
 * Build the full {@link ConditionInput} projection of an EXISTING bookmark. Unlike `lib/autofill.ts`'s
 * add-time projection (which leaves category/tags/properties empty because only the URL/title are
 * known yet), every field is populated here so any condition leaf can fire against a saved bookmark.
 */
export function bookmarkToConditionInput(bookmark: Bookmark): ConditionInput {
  return {
    url: bookmark.url ?? "",
    title: bookmark.title,
    categoryId: bookmark.categoryId,
    tagIds: new Set(bookmark.tags.map(tag => tag.id)),
    // Union of all taxonomy-term ids (G&M ids live here too — it was folded into the taxonomy engine).
    taxonomyTermIds: new Set([
      ...bookmark.taxonomyTerms.map(term => term.id),
      ...bookmark.genreMoods.map(entry => entry.id),
    ]),
    locationIds: new Set(bookmark.locations.map(location => location.id)),
    youtubeChannelId: bookmark.youtubeChannel?.id ?? null,
    mediaTypeId: bookmark.mediaType?.id ?? null,
    numberValues: new Map([
      ...bookmark.numberValues.map(v => [v.propertyId, v.value] as const),
      ...bookmark.progressValues.map(v => [v.propertyId, v.current] as const),
    ]),
    numberValueEnds: new Map(
      bookmark.numberValues
        .filter((v): v is typeof v & { valueEnd: number } => v.valueEnd != null)
        .map(v => [v.propertyId, v.valueEnd] as const),
    ),
    booleanValues: new Map(bookmark.booleanValues.map(v => [v.propertyId, v.value])),
    dateTimeValues: new Map(bookmark.dateTimeValues.map(v => [v.propertyId, v.value])),
    fileValues: new Set(bookmark.fileValues.map(v => v.propertyId)),
    relationshipTypeIds: new Set(bookmark.relationships.map(r => r.relationshipTypeId)),
    languageUsages: bookmark.languageUsages.map(u => ({
      languageId: u.language.id,
      usageLevelId: u.level.id,
    })),
    choicesValues: new Map(bookmark.choicesValues.map(v => [v.propertyId, v.values])),
    sectionsValues: new Map(bookmark.sectionsValues.map(v => [v.propertyId, v])),
    textValues: new Map(bookmark.textValues.map(v => [v.propertyId, v.value])),
  };
}

/**
 * Whether a card-body section is visible for a bookmark. An absent or empty `visibleIf` group always
 * shows (an empty condition group otherwise evaluates to `false`, so it must be short-circuited —
 * mirrors `useBookmarkSectionVisibility`'s `sectionMatchesConditionInput`).
 */
export function cardSectionVisible(
  section: CardDisplaySection,
  input: ConditionInput,
  options: EvaluateOptions,
): boolean {
  const tree = section.visibleIf;
  if (!tree || tree.children.length === 0) return true;
  return evaluateConditions(tree, input, options);
}

/** Resolve a bookmark's per-card display from the single config, filtering sections by `visibleIf`. */
export function resolveCardDisplay(
  bookmark: Bookmark,
  config: CardDisplayConfig,
  options: EvaluateOptions,
): ResolvedCardDisplay {
  const input = bookmarkToConditionInput(bookmark);
  return {
    sections: config.sections.filter(section => cardSectionVisible(section, input, options)),
    imageCorners: config.imageCorners,
    imageMode: config.imageMode,
    imageVisibility: config.imageVisibility,
    imageLayout: config.imageLayout,
    hideWebsiteForYouTube: config.hideWebsiteForYouTube,
  };
}

/**
 * Returns a stable resolver `(bookmark) => ResolvedCardDisplay` for the single card-display config.
 * Loads the config + tags once (already cached by React Query) and builds the tag-cascade resolver a
 * single time.
 *
 * `isPending` is true only when the config hasn't been fetched yet (cold React Query cache). Callers
 * that render images should suppress them while pending to prevent an aspect-ratio flash: without the
 * config the resolver falls back to BASELINE.imageMode ("natural"), so an image would render at the
 * wrong aspect ratio and then jump when the config arrives.
 */
export function useResolveCardDisplay(): {
  resolve: (bookmark: Bookmark) => ResolvedCardDisplay;
  isPending: boolean;
} {
  const {
    data: config = BASELINE,
    isPending,
  } = useCardDisplayConfig();
  const options = useConditionEvaluateOptions();

  const resolve = useCallback(
    (bookmark: Bookmark) => resolveCardDisplay(bookmark, config, options),
    [config, options],
  );

  return {
    resolve,
    isPending,
  };
}
