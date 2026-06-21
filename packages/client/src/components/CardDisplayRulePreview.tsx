import type { RuleDisplayValue } from "./CardDisplayRuleDisplaySettings";
import type { Bookmark, ConditionTree } from "@eesimple/types";

import { useMemo, useState } from "react";

import { buildTagDescendants, evaluateConditions } from "@eesimple/types";
import { ChevronLeft, ChevronRight, TriangleAlert } from "lucide-react";

import { BookmarkCard } from "./BookmarkCard";
import { useBookmarks } from "../hooks/useBookmarks";
import { useCardDisplayRules } from "../hooks/useCardDisplayRules";
import { useCustomProperties } from "../hooks/useCustomProperties";
import { useTags } from "../hooks/useTags";
import { BASELINE, bookmarkToConditionInput } from "../lib/cardDisplayRules";

import { Button } from "@/components/ui/button";
import { RowCard } from "@/components/ui/card";

/**
 * A stand-in bookmark used when no saved bookmark matches the rule, so the display toggles still have
 * something to render. The image is an inline SVG `data:` URI so aspect/layout/corner overlays show
 * without a network fetch (`BookmarkCard` only renders an image when `bookmark.image` is non-null).
 */
const SAMPLE_IMAGE_SVG
  = "data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20width='1200'%20height='675'%3E"
    + "%3Cdefs%3E%3ClinearGradient%20id='g'%20x1='0'%20y1='0'%20x2='1'%20y2='1'%3E"
    + "%3Cstop%20offset='0'%20stop-color='%236366f1'/%3E%3Cstop%20offset='1'%20stop-color='%23a855f7'/%3E"
    + "%3C/linearGradient%3E%3C/defs%3E%3Crect%20width='1200'%20height='675'%20fill='url(%23g)'/%3E"
    + "%3Ctext%20x='600'%20y='350'%20font-family='sans-serif'%20font-size='64'%20fill='white'"
    + "%20text-anchor='middle'%3ESample%3C/text%3E%3C/svg%3E";

const SAMPLE_BOOKMARK: Bookmark = {
  id: "__card-display-rule-preview-sample__",
  url: "https://example.com/sample-bookmark",
  originalUrl: null,
  title: "Sample bookmark",
  description: "A placeholder bookmark shown because no saved bookmark matches this rule yet.",
  image: {
    url: SAMPLE_IMAGE_SVG,
    width: 1200,
    height: 675,
    source: "upload",
  },
  imageAutoGrabError: null,
  categoryId: "__sample-category__",
  website: {
    id: "__sample-website__",
    domain: "example.com",
    siteName: "Example",
    slug: "example-com",
    imageUrl: null,
  },
  mediaType: null,
  youtubeChannel: null,
  tags: [
    {
      id: "__sample-tag__",
      name: "Sample tag",
      slug: "sample-tag",
      parentId: null,
    },
  ],
  numberValues: [],
  booleanValues: [],
  dateTimeValues: [],
  fileValues: [],
  relatedBookmarks: [],
  priority: 0,
  createdAt: new Date().toISOString(),
};

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

/**
 * A live preview of how a matching bookmark card looks with this rule's display settings applied. The
 * user can cycle through the bookmarks the rule matches; when none match a synthetic sample card is
 * shown. The display is resolved as **this rule over the baseline** (inherited attributes fall back to
 * baseline defaults, not the full layered rule set) — so when other rules also match the previewed
 * bookmark, an alert warns that the real listing may differ.
 */
export function CardDisplayRulePreview({
  display, conditions, isDefault, currentRuleId,
}: CardDisplayRulePreviewProps) {
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

  const [index, setIndex] = useState(0);

  const tagDescendants = useMemo(
    () => buildTagDescendants(tags.map(tag => ({
      id: tag.id,
      parentId: tag.parentId,
    }))),
    [tags],
  );

  // Bookmarks this rule matches: every bookmark for the Default rule, otherwise the condition tree.
  const matches = useMemo(() => {
    if (isDefault) return bookmarks;
    return bookmarks.filter(bookmark =>
      evaluateConditions(conditions, bookmarkToConditionInput(bookmark), {
        tagDescendants,
      }));
  }, [bookmarks, conditions, isDefault, tagDescendants]);

  const safeIndex = matches.length > 0 ? Math.min(index, matches.length - 1) : 0;
  const matchedBookmark = matches[safeIndex] ?? null;
  const subject = matchedBookmark ?? SAMPLE_BOOKMARK;

  // "This rule over the baseline": inherited (null) attributes fall back to the hardcoded baseline.
  const resolved = {
    hiddenCardFields: display.hiddenCardFields ?? BASELINE.hiddenCardFields,
    imageMode: display.imageMode ?? BASELINE.imageMode,
    imageVisibility: display.imageVisibility ?? BASELINE.imageVisibility,
    imageLayout: display.imageLayout ?? BASELINE.imageLayout,
    cornerOverlays: display.cornerOverlays ?? BASELINE.cornerOverlays,
    hideWebsiteForYouTube: display.hideWebsiteForYouTube ?? BASELINE.hideWebsiteForYouTube,
  };

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

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="min-w-0 truncate text-xs text-muted-foreground">
          {matchedBookmark
            ? `${safeIndex + 1} of ${matches.length}: ${matchedBookmark.title}`
            : "No bookmarks match — showing a sample card."}
        </p>
        {matches.length > 1 && (
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

      <div className="max-w-sm">
        <RowCard className="p-4">
          <BookmarkCard
            bookmark={subject}
            properties={properties}
            hiddenFields={new Set(resolved.hiddenCardFields)}
            imageLeft={resolved.imageLayout === "side"}
            imageMode={resolved.imageMode}
            imageVisibility={resolved.imageVisibility}
            cornerOverlays={resolved.cornerOverlays}
            hideWebsiteForYouTube={resolved.hideWebsiteForYouTube}
          />
        </RowCard>
      </div>

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
