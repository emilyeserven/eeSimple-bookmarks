import type { CardDisplayConfig } from "@eesimple/types";

import { useState } from "react";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";

import { BookmarkCard } from "./BookmarkCard";
import { useBookmarks } from "../hooks/useBookmarks";
import { useConditionEvaluateOptions } from "../hooks/useConditionEvaluateOptions";
import { useCustomProperties } from "../hooks/useCustomProperties";
import { resolveCardDisplay } from "../lib/cardDisplayRules";

import { Button } from "@/components/ui/button";
import { RowCard } from "@/components/ui/card";

interface CardDisplayPreviewProps {
  /** The live (unsaved) config being edited, so the preview updates as controls change. */
  config: CardDisplayConfig;
}

/**
 * A live preview of a bookmark card rendered with the current card-display config, against a real
 * bookmark (cycle through with the arrows). Sections are visibility-filtered for the shown bookmark,
 * so `visibleIf` conditions preview correctly.
 */
export function CardDisplayPreview({
  config,
}: CardDisplayPreviewProps) {
  const {
    t,
  } = useTranslation();
  const {
    data: bookmarks = [],
  } = useBookmarks();
  const {
    data: properties = [],
  } = useCustomProperties();
  const options = useConditionEvaluateOptions();
  const [index, setIndex] = useState(0);

  if (bookmarks.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        {t("Add a bookmark to preview how cards look.")}
      </p>
    );
  }

  const bookmark = bookmarks[Math.min(index, bookmarks.length - 1)];
  const display = resolveCardDisplay(bookmark, config, options);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {t("Preview {{n}} of {{total}}", {
            n: Math.min(index, bookmarks.length - 1) + 1,
            total: bookmarks.length,
          })}
        </span>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-7"
            aria-label={t("Previous bookmark")}
            onClick={() => setIndex(i => (i - 1 + bookmarks.length) % bookmarks.length)}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-7"
            aria-label={t("Next bookmark")}
            onClick={() => setIndex(i => (i + 1) % bookmarks.length)}
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>
      <RowCard className="max-w-sm p-4">
        <BookmarkCard
          bookmark={bookmark}
          properties={properties}
          sections={display.sections}
          imageCorners={display.imageCorners}
          imageMode={display.imageMode}
          imageVisibility={display.imageVisibility}
          hideWebsiteForYouTube={display.hideWebsiteForYouTube}
        />
      </RowCard>
    </div>
  );
}
