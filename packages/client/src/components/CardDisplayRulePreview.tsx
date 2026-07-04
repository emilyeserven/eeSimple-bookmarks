import type { CardDisplayRulePreviewProps } from "../hooks/useCardDisplayRulePreview";

import { ChevronLeft, ChevronRight, TriangleAlert } from "lucide-react";
import { useTranslation } from "react-i18next";

import { BookmarkCard } from "./BookmarkCard";
import { useCardDisplayRulePreview } from "../hooks/useCardDisplayRulePreview";

import { Button } from "@/components/ui/button";
import { RowCard } from "@/components/ui/card";

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
    t,
  } = useTranslation();
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
            {t("Sample")}
          </Button>
          <Button
            type="button"
            variant={mode === "existing" ? "default" : "outline"}
            size="sm"
            onClick={() => setMode("existing")}
          >
            {t("Existing")}
          </Button>
        </div>
        {mode === "existing" && matches.length > 1 && (
          <div className="flex shrink-0 items-center gap-1">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="size-7"
              aria-label={t("Previous matching bookmark")}
              onClick={() => setIndex(() => (safeIndex - 1 + matches.length) % matches.length)}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="size-7"
              aria-label={t("Next matching bookmark")}
              onClick={() => setIndex(() => (safeIndex + 1) % matches.length)}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        )}
      </div>

      <p className="min-w-0 truncate text-xs text-muted-foreground">
        {mode === "sample"
          ? t("Generic sample showing every field with placeholder values.")
          : matchedBookmark
            ? t("{{index}} of {{total}}: {{title}}", {
              index: safeIndex + 1,
              total: matches.length,
              title: matchedBookmark.title,
            })
            : t("No bookmarks match this rule.")}
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
            {t("On listing pages,")}
            {" "}
            {otherMatching.length === 1
              ? t("another rule also applies")
              : t("{{count}} other rules also apply", {
                count: otherMatching.length,
              })}
            {" "}
            {t("to this bookmark and may override these settings:")}
            {" "}
            <span className="font-medium">{otherMatching.map(rule => rule.name).join(", ")}</span>
            .
          </p>
        </div>
      )}
    </div>
  );
}
