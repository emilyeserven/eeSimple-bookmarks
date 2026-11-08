import type { NotificationPage } from "@/stores/notificationStore";

import i18n from "@/i18n";

/**
 * The page the user is currently on, kept as an imperative module-level holder so the
 * `notifySuccess`/`notifyError` helpers — which run outside React (inside mutation callbacks) — can
 * stamp it onto a recorded notification. It is fed by the root layout on every navigation.
 */
let currentPage: NotificationPage = {
  pathname: "/",
  label: "",
};

/** Update the current page (called by the root layout on navigation). */
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

/**
 * A pure, hook-free page label derived from a pathname alone — the fallback used when the rich
 * breadcrumb label (which carries resolved entity names) isn't available. Title-cases each segment and
 * joins them, e.g. `/settings/display/general` → `Settings › Display › General`.
 */
export function pageLabelFromPathname(pathname: string): string {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 0) return i18n.t("Home");
  return segments.map(titleCaseSegment).join(" › ");
}

/** `"my-page"` → `"My Page"`. */
function titleCaseSegment(segment: string): string {
  return decodeURIComponent(segment)
    .split("-")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
