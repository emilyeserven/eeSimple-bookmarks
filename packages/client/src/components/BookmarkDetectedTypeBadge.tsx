import type { BookmarkContentKind } from "@eesimple/types";
import type { LucideIcon } from "lucide-react";

import { BookOpen, Link2, Share2, Video } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";

/** The lucide icon shown for each detected content kind. */
const KIND_ICONS: Record<BookmarkContentKind, LucideIcon> = {
  "youtube-video": Video,
  "book": BookOpen,
  "social-account": Share2,
  "web-link": Link2,
};

/**
 * A small "Detected content type" badge shown on the revealed Add Bookmark form, communicating what
 * kind of content the scan recognized (a YouTube video, a book, a social post) now that there is no
 * dedicated media-property entity. Purely presentational — the media-type pre-select happens in the
 * scan flow. Renders nothing when no specific kind was detected (a generic web link).
 */
export function BookmarkDetectedTypeBadge({
  kind,
}: { kind: BookmarkContentKind | null }) {
  const {
    t,
  } = useTranslation();
  if (!kind) return null;

  // Kept inside the component so the labels are picked up by the i18n string extractor.
  const labels: Record<BookmarkContentKind, string> = {
    "youtube-video": t("YouTube video"),
    "book": t("Book"),
    "social-account": t("Social post"),
    "web-link": t("Web link"),
  };
  const Icon = KIND_ICONS[kind];

  return (
    <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
      {t("Detected:")}
      <Badge variant="secondary">
        <Icon className="size-3" />
        {labels[kind]}
      </Badge>
    </p>
  );
}
