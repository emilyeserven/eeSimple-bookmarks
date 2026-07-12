import i18n from "@/i18n";

/**
 * Labels for path segments whose human form differs from a plain title-cased slug. Shared by the
 * breadcrumb trail (`routes/-appHeaderCrumbs.tsx`) and the notification page-label fallback
 * (`lib/notificationPage.ts`) so the two never drift. Returned as a fresh object so the translations
 * re-resolve on a locale change.
 */
export function labelOverrides(): Record<string, string> {
  return {
    "youtube-channels": i18n.t("YouTube Channels"),
    "genres-moods": i18n.t("Genres & Moods"),
    "autofill": i18n.t("Autofill Rules"),
    "import-rules": i18n.t("Import Rules"),
    "saved-filters": i18n.t("Saved Filters"),
    "ai-summarization": i18n.t("AI Summarization"),
    "ai-autotag": i18n.t("AI Autotag"),
    "bookmark-add": i18n.t("Bookmark Add Form"),
  };
}

/** Title-case a slug segment: `shortened-links` → `Shortened Links`. */
export function titleCaseSegment(segment: string): string {
  return segment
    .split("-")
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/** Human label for a single path segment — a settings sub-page, an edit tab, etc. */
export function crumbLabel(segment: string): string {
  return labelOverrides()[segment] ?? titleCaseSegment(segment);
}
