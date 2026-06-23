import { useEffect, useRef } from "react";

import { createFileRoute } from "@tanstack/react-router";

import { BookmarkForm } from "../components/BookmarkForm";

/**
 * Search params for the quick-add popup: the page URL/title the bookmarklet hands in. Each route
 * parses the full query independently, so these survive the root's drawer-only `validateSearch`.
 */
interface QuickAddSearch {
  url?: string;
  title?: string;
}

function validateQuickAddSearch(search: Record<string, unknown>): QuickAddSearch {
  return {
    url: typeof search.url === "string" && search.url.length > 0 ? search.url : undefined,
    title: typeof search.title === "string" && search.title.length > 0 ? search.title : undefined,
  };
}

export const Route = createFileRoute("/quick-add")({
  validateSearch: validateQuickAddSearch,
  component: QuickAddPage,
});

/** Milliseconds the popup waits, untouched, before closing itself. */
const AUTO_CLOSE_MS = 5000;

/**
 * A chrome-less page (the root layout omits its sidebar/header/panel) rendering the standard
 * `BookmarkForm` pre-filled + auto-scanned from the bookmarklet's URL/title. When opened as a popup
 * (`window.opener` set) it closes after a successful create and auto-closes after 5s of no
 * interaction; once the user focuses/interacts it stays open.
 */
function QuickAddPage() {
  const {
    url, title,
  } = Route.useSearch();

  usePopupAutoClose();

  return (
    <main className="mx-auto max-w-md p-4">
      <h1 className="mb-4 text-xl font-bold">Add Bookmark</h1>
      <BookmarkForm
        initialUrl={url}
        initialTitle={title}
        autoScan
        onCreated={() => {
          if (window.opener) window.close();
        }}
      />
    </main>
  );
}

/**
 * Auto-close the popup after `AUTO_CLOSE_MS` of no interaction. Any focus / pointer / key / tab-back
 * cancels the timer permanently. No-op when the page wasn't opened as a popup.
 */
function usePopupAutoClose(): void {
  const cancelledRef = useRef(false);
  useEffect(() => {
    if (!window.opener) return;

    const timer = window.setTimeout(() => {
      if (!cancelledRef.current) window.close();
    }, AUTO_CLOSE_MS);

    const cancel = (): void => {
      cancelledRef.current = true;
      window.clearTimeout(timer);
    };
    const onVisible = (): void => {
      if (document.visibilityState === "visible") cancel();
    };

    window.addEventListener("focus", cancel);
    window.addEventListener("pointerdown", cancel);
    window.addEventListener("keydown", cancel);
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("focus", cancel);
      window.removeEventListener("pointerdown", cancel);
      window.removeEventListener("keydown", cancel);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);
}
