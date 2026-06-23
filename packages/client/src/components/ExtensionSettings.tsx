import { useEffect, useMemo, useRef } from "react";

import { Copy } from "lucide-react";

import { notifyError, notifySuccess } from "../lib/notifications";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/** Build the bookmarklet `javascript:` source that opens the quick-add popup for the current tab. */
function buildBookmarklet(origin: string): string {
  // Opens a small popup pinned to the top-right of the screen, pre-filled with the page URL/title.
  const body
    = "var u=encodeURIComponent(location.href),"
      + "t=encodeURIComponent(document.title||''),"
      + "w=460,h=640,x=Math.max(0,screen.width-w-24),y=24;"
      + `window.open('${origin}/quick-add?url='+u+'&title='+t,`
      + "'eesimpleQuickAdd','popup=1,width='+w+',height='+h+',left='+x+',top='+y);";
  return `javascript:(function(){${body}})();`;
}

/**
 * Extension settings: hands the user a bookmarklet that pops up the pre-filled Add Bookmark form for
 * the page they're on. There's no packaged browser extension — a bookmarklet works in every browser
 * and needs no install. The draggable link's `href` is assigned via a ref because React 19 strips
 * inline `javascript:` URLs.
 */
export function ExtensionSettings() {
  const origin = typeof window === "undefined" ? "" : window.location.origin;
  const bookmarklet = useMemo(() => buildBookmarklet(origin), [origin]);
  const linkRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    if (linkRef.current) linkRef.current.setAttribute("href", bookmarklet);
  }, [bookmarklet]);

  async function copy(): Promise<void> {
    try {
      await navigator.clipboard.writeText(bookmarklet);
      notifySuccess("Bookmarklet copied to clipboard");
    }
    catch {
      notifyError("Couldn’t copy — copy it manually instead");
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add to eeSimple bookmarklet</CardTitle>
        <CardDescription>
          Drag the button below to your browser’s bookmarks bar. On any page, click it to open a
          popup with the Add Bookmark form pre-filled and scanned — pick a category and save. The
          popup closes itself after 5 seconds if you don’t interact with it.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* The href is a `javascript:` bookmarklet, assigned via a ref because React 19 strips
              inline javascript: URLs. The placeholder href is replaced on mount. */}
          <a
            ref={linkRef}
            href="#"
            draggable
            onClick={event => event.preventDefault()}
            className="
              inline-flex cursor-grab items-center gap-2 rounded-md border
              bg-primary px-4 py-2 text-sm font-medium text-primary-foreground
              hover:bg-primary/90
            "
          >
            + Add to eeSimple
          </a>
          <Button
            type="button"
            variant="outline"
            onClick={() => void copy()}
          >
            <Copy className="size-4" />
            Copy bookmarklet
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          If your browser hides the bookmarks bar, enable it first (usually
          {" "}
          <kbd className="rounded-sm border px-1">Ctrl/Cmd</kbd>
          {" + "}
          <kbd className="rounded-sm border px-1">Shift</kbd>
          {" + "}
          <kbd className="rounded-sm border px-1">B</kbd>
          ), then drag the button onto it. You can also copy the bookmarklet and paste it as the URL
          of a new bookmark created by hand.
        </p>
      </CardContent>
    </Card>
  );
}
