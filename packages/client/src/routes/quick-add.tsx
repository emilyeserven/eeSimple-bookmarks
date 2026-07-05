import { useEffect, useRef, useState } from "react";

import { useMutation } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";

import { bookmarksApi } from "../lib/api/bookmarks";
import { describeError } from "../lib/apiError";
import { parseSharedInput } from "../lib/shareTarget";

import { Button } from "@/components/ui/button";
import i18n from "@/i18n";

/**
 * Search params for the quick-add popup: the page URL/title the bookmarklet hands in via a GET
 * `?url=…&title=…`. (Android's share sheet now POSTs here instead and is intercepted by
 * `public/share-target-sw.js`, which saves + notifies without opening this page — see
 * vite.config.ts.) Each route parses the full query independently, so these survive the root's
 * drawer-only `validateSearch`. `parseSharedInput` still collapses any share shapes into
 * `{ url, title }`.
 */
interface QuickAddSearch {
  url?: string;
  title?: string;
}

function validateQuickAddSearch(search: Record<string, unknown>): QuickAddSearch {
  return parseSharedInput({
    url: typeof search.url === "string" ? search.url : undefined,
    title: typeof search.title === "string" ? search.title : undefined,
    text: typeof search.text === "string" ? search.text : undefined,
  });
}

export const Route = createFileRoute("/quick-add")({
  validateSearch: validateQuickAddSearch,
  component: QuickAddPage,
});

/** Milliseconds the popup waits after success before closing itself. */
const AUTO_CLOSE_MS = 3000;

/**
 * A chrome-less page (the root layout omits its sidebar/header/panel) that queues the shared URL
 * directly into the Inbox review queue. Opened by the bookmarklet (GET). Auto-closes/navigates on
 * success. (Android shares are handled in the service worker now, not here.)
 */
function QuickAddPage() {
  const {
    url, title,
  } = Route.useSearch();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"saving" | "saved" | "duplicate" | "error" | "no-url">(
    url ? "saving" : "no-url",
  );
  const [errorMsg, setErrorMsg] = useState("");

  const save = useMutation({
    mutationFn: ({
      u, t,
    }: { u: string;
      t: string; }) => bookmarksApi.queueToInbox(u, t),
    onSuccess: () => {
      setStatus("saved");
      if (window.opener) {
        setTimeout(() => window.close(), AUTO_CLOSE_MS);
      }
      else {
        void navigate({
          to: "/inbox",
        });
      }
    },
    onError: (err) => {
      const msg = describeError(err);
      if (msg.includes("already")) {
        setStatus("duplicate");
      }
      else {
        setStatus("error");
        setErrorMsg(msg);
      }
    },
  });

  const firedRef = useRef(false);
  useEffect(() => {
    if (!url || firedRef.current) return;
    firedRef.current = true;
    save.mutate({
      u: url,
      t: title || url,
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  usePopupAutoClose(status === "saving");

  return (
    <main className="mx-auto max-w-md space-y-3 p-4">
      <h1 className="text-xl font-bold">{i18n.t("Add to Inbox")}</h1>
      {status === "saving" && (
        <p className="text-sm text-muted-foreground">{i18n.t("Adding to Inbox…")}</p>
      )}
      {status === "saved" && (
        <>
          <p className="font-semibold">{i18n.t("Queued in Inbox.")}</p>
          {!window.opener && (
            <Button
              asChild
              size="sm"
            >
              <Link to="/inbox">{i18n.t("View Inbox")}</Link>
            </Button>
          )}
          {window.opener && (
            <p className="text-sm text-muted-foreground">
              {i18n.t("Closing in {{seconds}}s…", {
                seconds: AUTO_CLOSE_MS / 1000,
              })}
            </p>
          )}
        </>
      )}
      {status === "duplicate" && (
        <>
          <p className="font-semibold">{i18n.t("Already saved.")}</p>
          <Button
            asChild
            size="sm"
            variant="outline"
          >
            <Link to="/inbox">{i18n.t("View Inbox")}</Link>
          </Button>
        </>
      )}
      {status === "error" && (
        <>
          <p className="text-sm text-destructive">{errorMsg || i18n.t("Something went wrong.")}</p>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              if (url) {
                setStatus("saving");
                save.mutate({
                  u: url,
                  t: title || url,
                });
              }
            }}
          >
            {i18n.t("Retry")}
          </Button>
        </>
      )}
      {status === "no-url" && (
        <p className="text-sm text-muted-foreground">{i18n.t("No URL provided.")}</p>
      )}
    </main>
  );
}

/**
 * Auto-close the popup after `AUTO_CLOSE_MS` of no interaction while saving. Any focus / pointer /
 * key / tab-back cancels the timer permanently. No-op when the page wasn't opened as a popup.
 */
function usePopupAutoClose(active: boolean): void {
  const cancelledRef = useRef(false);
  useEffect(() => {
    if (!window.opener || !active) return;

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
  }, [active]);
}
