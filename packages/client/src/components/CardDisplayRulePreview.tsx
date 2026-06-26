import type { RuleDisplayValue } from "./CardDisplayRuleDisplaySettings";
import type {
  Bookmark,
  BookmarkBooleanValue,
  BookmarkChoicesValue,
  BookmarkDateTimeValue,
  BookmarkFileValue,
  BookmarkNumberValue,
  BookmarkProgressValue,
  BookmarkSectionsValue,
  BookmarkTextValue,
  ConditionTree,
  CustomProperty,
} from "@eesimple/types";
import type { Dispatch, SetStateAction } from "react";

import { useMemo, useState } from "react";

import { buildTagDescendants, evaluateConditions } from "@eesimple/types";
import { ChevronLeft, ChevronRight, TriangleAlert } from "lucide-react";

import { BookmarkCard } from "./BookmarkCard";
import { useBookmarks } from "../hooks/useBookmarks";
import { useCardDisplayRules } from "../hooks/useCardDisplayRules";
import { useCategories } from "../hooks/useCategories";
import { useCustomProperties } from "../hooks/useCustomProperties";
import { useTags } from "../hooks/useTags";
import { BASELINE, bookmarkToConditionInput } from "../lib/cardDisplayRules";

import { Button } from "@/components/ui/button";
import { RowCard } from "@/components/ui/card";

/**
 * A stand-in image used by the generic sample, an inline SVG `data:` URI so aspect/layout/corner
 * overlays show without a network fetch (`BookmarkCard` only renders an image when `bookmark.image`
 * is non-null).
 */
const SAMPLE_IMAGE_SVG
  = "data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20width='1200'%20height='675'%3E"
    + "%3Cdefs%3E%3ClinearGradient%20id='g'%20x1='0'%20y1='0'%20x2='1'%20y2='1'%3E"
    + "%3Cstop%20offset='0'%20stop-color='%236366f1'/%3E%3Cstop%20offset='1'%20stop-color='%23a855f7'/%3E"
    + "%3C/linearGradient%3E%3C/defs%3E%3Crect%20width='1200'%20height='675'%20fill='url(%23g)'/%3E"
    + "%3Ctext%20x='600'%20y='350'%20font-family='sans-serif'%20font-size='64'%20fill='white'"
    + "%20text-anchor='middle'%3ESample%3C/text%3E%3C/svg%3E";

const SAMPLE_NOW = "2026-06-01T12:00:00.000Z";

/**
 * A placeholder value for each custom property type, so the generic sample renders every possible
 * label. Eligible (shown-in-listings, non-calculate) properties get a representative value; the rule's
 * field zones still decide which actually render.
 */
function samplePropertyValues(properties: CustomProperty[]): {
  numberValues: BookmarkNumberValue[];
  booleanValues: BookmarkBooleanValue[];
  dateTimeValues: BookmarkDateTimeValue[];
  fileValues: BookmarkFileValue[];
  choicesValues: BookmarkChoicesValue[];
  progressValues: BookmarkProgressValue[];
  sectionsValues: BookmarkSectionsValue[];
  textValues: BookmarkTextValue[];
} {
  const numberValues: BookmarkNumberValue[] = [];
  const booleanValues: BookmarkBooleanValue[] = [];
  const dateTimeValues: BookmarkDateTimeValue[] = [];
  const fileValues: BookmarkFileValue[] = [];
  const choicesValues: BookmarkChoicesValue[] = [];
  const progressValues: BookmarkProgressValue[] = [];
  const sectionsValues: BookmarkSectionsValue[] = [];
  const textValues: BookmarkTextValue[] = [];

  for (const property of properties) {
    if (!property.showInListings) continue;
    switch (property.type) {
      case "number":
        numberValues.push({
          propertyId: property.id,
          value: 42,
        });
        break;
      case "ratingScale":
        numberValues.push({
          propertyId: property.id,
          value: Math.min(4, property.ratingMax ?? 5),
        });
        break;
      case "boolean":
        booleanValues.push({
          propertyId: property.id,
          value: true,
        });
        break;
      case "datetime":
        dateTimeValues.push({
          propertyId: property.id,
          value: SAMPLE_NOW,
        });
        break;
      case "image":
        fileValues.push({
          propertyId: property.id,
          url: SAMPLE_IMAGE_SVG,
          contentType: "image/webp",
          byteSize: 0,
          originalFilename: null,
          width: 1200,
          height: 675,
        });
        break;
      case "file":
        fileValues.push({
          propertyId: property.id,
          url: "#",
          contentType: "application/octet-stream",
          byteSize: 0,
          originalFilename: "sample.pdf",
          width: null,
          height: null,
        });
        break;
      case "choices":
        if (property.choicesItems.length > 0) {
          choicesValues.push({
            propertyId: property.id,
            values: [property.choicesItems[0].value],
          });
        }
        break;
      case "itemInItems":
        progressValues.push({
          propertyId: property.id,
          current: 10,
          total: 100,
        });
        break;
      case "sections":
        sectionsValues.push({
          propertyId: property.id,
          exhaustive: false,
          sections: [],
        });
        break;
      case "text":
        textValues.push({
          propertyId: property.id,
          value: "B08N5WRWNW",
        });
        break;
      default:
        break;
    }
  }

  return {
    numberValues,
    booleanValues,
    dateTimeValues,
    fileValues,
    choicesValues,
    progressValues,
    sectionsValues,
    textValues,
  };
}

interface CardDisplayRulePreviewProps {
  /** In-progress display values from the form. */
  display: RuleDisplayValue;
  /** In-progress conditions (empty/match-all for the Default rule). */
  conditions: ConditionTree;
  /** The Default rule matches every bookmark; other rules evaluate their conditions. */
  isDefault: boolean;
  /** Exclude the rule being edited from the "other rules apply" check. */
  currentRuleId?: string;
}

type PreviewMode = "sample" | "existing";

interface ResolvedDisplay {
  fieldZones: typeof BASELINE.fieldZones;
  cardZoneLayouts: typeof BASELINE.cardZoneLayouts;
  imageMode: typeof BASELINE.imageMode;
  imageVisibility: typeof BASELINE.imageVisibility;
  imageLayout: typeof BASELINE.imageLayout;
  hideWebsiteForYouTube: typeof BASELINE.hideWebsiteForYouTube;
}

/**
 * "This rule over the baseline": each inherited (null) attribute falls back to the hardcoded baseline
 * default, rather than the full layered rule set. Pure, so the preview hook stays under the cap.
 */
function resolveDisplayOverBaseline(display: RuleDisplayValue): ResolvedDisplay {
  return {
    fieldZones: display.fieldZones ?? BASELINE.fieldZones,
    cardZoneLayouts: display.cardZoneLayouts ?? BASELINE.cardZoneLayouts,
    imageMode: display.imageMode ?? BASELINE.imageMode,
    imageVisibility: display.imageVisibility ?? BASELINE.imageVisibility,
    imageLayout: display.imageLayout ?? BASELINE.imageLayout,
    hideWebsiteForYouTube: display.hideWebsiteForYouTube ?? BASELINE.hideWebsiteForYouTube,
  };
}

interface CardDisplayRulePreviewModel {
  mode: PreviewMode;
  setMode: (mode: PreviewMode) => void;
  setIndex: Dispatch<SetStateAction<number>>;
  matches: Bookmark[];
  safeIndex: number;
  matchedBookmark: Bookmark | null;
  subject: Bookmark | null;
  properties: CustomProperty[];
  resolved: ResolvedDisplay;
  otherMatching: { name: string }[];
}

/**
 * Owns the preview's data-fetching and derivation: the entity caches, the matched-bookmark set, the
 * selected subject (sample vs. existing), the baseline-resolved display, and the "other rules also
 * apply" warning. Bundling the ~11 hooks here keeps the component under the complexity cap.
 */
function useCardDisplayRulePreview({
  display, conditions, isDefault, currentRuleId,
}: CardDisplayRulePreviewProps): CardDisplayRulePreviewModel {
  const {
    data: bookmarks = [],
  } = useBookmarks();
  const {
    data: properties = [],
  } = useCustomProperties();
  const {
    data: rules = [],
  } = useCardDisplayRules();
  const {
    data: tags = [],
  } = useTags();
  const {
    data: categories = [],
  } = useCategories();

  const [mode, setMode] = useState<PreviewMode>("sample");
  const [index, setIndex] = useState(0);

  const tagDescendants = useMemo(
    () => buildTagDescendants(tags.map(tag => ({
      id: tag.id,
      parentId: tag.parentId,
    }))),
    [tags],
  );

  // The generic sample: every standard field + a placeholder value per custom property. Uses a real
  // category (so the category pill resolves against the categories cache) when one exists.
  const sampleBookmark = useMemo<Bookmark>(() => {
    const realCategory = categories.find(category => !category.builtIn);
    return {
      id: "__card-display-rule-preview-sample__",
      url: "https://example.com/sample-bookmark",
      originalUrl: null,
      title: "Sample bookmark",
      description: "A placeholder bookmark showing every field with sample values.",
      image: {
        url: SAMPLE_IMAGE_SVG,
        width: 1200,
        height: 675,
        source: "upload",
      },
      screenshot: null,
      imageAutoGrabError: null,
      categoryId: realCategory?.id ?? "__sample-category__",
      website: {
        id: "__sample-website__",
        domain: "example.com",
        siteName: "Example",
        slug: "example-com",
        imageUrl: null,
      },
      mediaType: {
        id: "__sample-media-type__",
        name: "Article",
        slug: "article",
        icon: null,
        parentId: null,
      },
      youtubeChannel: {
        id: "__sample-channel__",
        name: "Sample Channel",
        slug: "sample-channel",
        imageUrl: null,
      },
      newsletter: null,
      import: null,
      tags: [
        {
          id: "__sample-tag__",
          name: "Sample tag",
          slug: "sample-tag",
          parentId: null,
          editableOnCard: false,
        },
      ],
      blacklistedTagIds: [],
      ...samplePropertyValues(properties),
      authors: [],
      relationships: [],
      publisher: null,
      priority: 0,
      createdAt: SAMPLE_NOW,
    };
  }, [categories, properties]);

  // Bookmarks this rule matches: every bookmark for the Default rule, otherwise the condition tree.
  const matches = useMemo(() => {
    if (isDefault) return bookmarks;
    return bookmarks.filter(bookmark =>
      evaluateConditions(conditions, bookmarkToConditionInput(bookmark), {
        tagDescendants,
      }));
  }, [bookmarks, conditions, isDefault, tagDescendants]);

  const safeIndex = matches.length > 0 ? Math.min(index, matches.length - 1) : 0;
  const matchedBookmark = mode === "existing" ? (matches[safeIndex] ?? null) : null;
  const subject = mode === "existing" ? matchedBookmark : sampleBookmark;

  const resolved = resolveDisplayOverBaseline(display);

  // Other rules that also apply to the previewed (real) bookmark — they may override these settings on
  // the real listing, where the full layered resolution runs instead of this baseline-only preview.
  const otherMatching = useMemo(() => {
    if (!matchedBookmark) return [];
    const input = bookmarkToConditionInput(matchedBookmark);
    return rules.filter(rule =>
      !rule.isDefault
      && rule.id !== currentRuleId
      && evaluateConditions(rule.conditions, input, {
        tagDescendants,
      }));
  }, [matchedBookmark, rules, currentRuleId, tagDescendants]);

  return {
    mode,
    setMode,
    setIndex,
    matches,
    safeIndex,
    matchedBookmark,
    subject,
    properties,
    resolved,
    otherMatching,
  };
}

/**
 * A live preview of how a card looks with this rule's display settings applied. Defaults to a generic
 * **sample** card populated with every standard field + a placeholder value for every custom property,
 * so all possible labels are visible. Switch to **Existing bookmarks** to cycle through the bookmarks
 * the rule matches. The display is resolved as **this rule over the baseline** (inherited attributes
 * fall back to baseline defaults, not the full layered rule set) — so when other rules also match the
 * previewed (real) bookmark, an alert warns that the real listing may differ.
 */
export function CardDisplayRulePreview(props: CardDisplayRulePreviewProps) {
  const {
    mode, setMode, setIndex, matches, safeIndex, matchedBookmark, subject,
    properties, resolved, otherMatching,
  } = useCardDisplayRulePreview(props);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex shrink-0 items-center gap-1">
          <Button
            type="button"
            variant={mode === "sample" ? "default" : "outline"}
            size="sm"
            onClick={() => setMode("sample")}
          >
            Sample
          </Button>
          <Button
            type="button"
            variant={mode === "existing" ? "default" : "outline"}
            size="sm"
            onClick={() => setMode("existing")}
          >
            Existing
          </Button>
        </div>
        {mode === "existing" && matches.length > 1 && (
          <div className="flex shrink-0 items-center gap-1">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="size-7"
              aria-label="Previous matching bookmark"
              onClick={() => setIndex(() => (safeIndex - 1 + matches.length) % matches.length)}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="size-7"
              aria-label="Next matching bookmark"
              onClick={() => setIndex(() => (safeIndex + 1) % matches.length)}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        )}
      </div>

      <p className="min-w-0 truncate text-xs text-muted-foreground">
        {mode === "sample"
          ? "Generic sample showing every field with placeholder values."
          : matchedBookmark
            ? `${safeIndex + 1} of ${matches.length}: ${matchedBookmark.title}`
            : "No bookmarks match this rule."}
      </p>

      {subject && (
        <div className="max-w-sm">
          <RowCard className="p-4">
            <BookmarkCard
              bookmark={subject}
              properties={properties}
              fieldZones={resolved.fieldZones}
              cardZoneLayouts={resolved.cardZoneLayouts}
              imageLeft={resolved.imageLayout === "side"}
              imageMode={resolved.imageMode}
              imageVisibility={resolved.imageVisibility}
              hideWebsiteForYouTube={resolved.hideWebsiteForYouTube}
            />
          </RowCard>
        </div>
      )}

      {otherMatching.length > 0 && (
        <div
          className="
            flex items-start gap-2 rounded-md border bg-muted p-3 text-xs
            text-muted-foreground
          "
        >
          <TriangleAlert className="mt-0.5 size-4 shrink-0" />
          <p>
            On listing pages,
            {" "}
            {otherMatching.length === 1 ? "another rule also applies" : `${otherMatching.length} other rules also apply`}
            {" "}
            to this bookmark and may override these settings:
            {" "}
            <span className="font-medium">{otherMatching.map(rule => rule.name).join(", ")}</span>
            .
          </p>
        </div>
      )}
    </div>
  );
}
