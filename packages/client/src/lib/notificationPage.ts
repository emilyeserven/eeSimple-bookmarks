import type { NotificationPage } from "@/stores/notificationStore";

import i18n from "@/i18n";

/**
 * The page the user is currently on, kept as an imperative module-level holder so the
 * `notifySuccess`/`notifyError` helpers — which run outside React (inside mutation callbacks) — can
 * stamp it onto a recorded notification. It is fed by an effect in `AppHeader` from the already-resolved
 * breadcrumb trail, so the label includes entity/bookmark names for free.
 */
let currentPage: NotificationPage = {
  pathname: "/",
  label: "",
};

/** Update the current page (called by `AppHeader` whenever the route or its resolved label changes). */
export function setCurrentNotificationPage(page: NotificationPage): void {
  currentPage = page;
}

/** Read the current page, with a pathname-derived label when the rich breadcrumb label isn't set. */
export function getCurrentNotificationPage(): NotificationPage {
  if (currentPage.label) return currentPage;
  return {
    pathname: currentPage.pathname,
    label: pageLabelFromPathname(currentPage.pathname),
  };
}

/** Labels for path segments whose human form differs from a plain title-cased slug (mirrors the
 * breadcrumb overrides in `routes/-appHeaderCrumbs.tsx`). */
function labelOverrides(): Record<string, string> {
  return {
    "youtube-channels": i18n.t("YouTube Channels"),
    "genres-moods": i18n.t("Genres & Moods"),
    "autofill": i18n.t("Autofill Rules"),
    "import-rules": i18n.t("Import Rules"),
    "saved-filters": i18n.t("Saved Filters"),
    "ai-summarization": i18n.t("AI Summarization"),
    "bookmark-add": i18n.t("Bookmark Add Form"),
  };
}

/** Title-case a slug segment: `shortened-links` → `Shortened Links`. */
function titleCaseSegment(segment: string): string {
  return segment
    .split("-")
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * A pure, hook-free page label derived from a pathname alone — the fallback used when the rich
 * breadcrumb label (which carries resolved entity names) isn't available. Title-cases each segment and
 * joins them, e.g. `/settings/display/general` → `Settings › Display › General`.
 */
export function pageLabelFromPathname(pathname: string): string {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 0) return i18n.t("Home");
  const overrides = labelOverrides();
  return segments.map(segment => overrides[segment] ?? titleCaseSegment(segment)).join(" › ");
}
