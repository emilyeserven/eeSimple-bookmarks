import { useEffect, useMemo, useRef, useState } from "react";

import { Copy, Download } from "lucide-react";
import { useTranslation } from "react-i18next";

import { notifySuccess } from "../lib/notifications";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

/**
 * The packaged extension, built from `packages/extension` (WXT) and copied into the client build by
 * the `extensionZip` plugin in `vite.config.ts`.
 */
const EXTENSION_ZIP_PATH = "/extension/eesimple-extension.zip";

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
  const {
    t,
  } = useTranslation();
  const origin = typeof window === "undefined" ? "" : window.location.origin;
  const bookmarklet = useMemo(() => buildBookmarklet(origin), [origin]);
  const linkRef = useRef<HTMLAnchorElement>(null);
  const [showBookmarklet, setShowBookmarklet] = useState(false);

  useEffect(() => {
    if (linkRef.current) linkRef.current.setAttribute("href", bookmarklet);
  }, [bookmarklet]);

  async function copy(): Promise<void> {
    setShowBookmarklet(true);
    try {
      await navigator.clipboard.writeText(bookmarklet);
      notifySuccess(t("Bookmarklet copied to clipboard"));
    }
    catch {
      // Clipboard API unavailable (HTTP context) — the textarea below lets the user copy manually.
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Browser Extension (Chrome · Edge)</CardTitle>
          <CardDescription>
            A one-click extension for saving the current page. Click the toolbar icon and choose
            {" "}
            <strong>Add to Inbox</strong>
            {" "}
            (queue it for review) or
            {" "}
            <strong>Add as Bookmark</strong>
            {" "}
            (skip the Inbox and save it directly, applying your autofill rules). You can also
            right-click any link and pick either option. No bookmarks bar needed. When the current
            page is already saved as a bookmark, the extension switches to
            {" "}
            <strong>fill mode</strong>
            : it scrapes the live page using the
            per-Website extraction rules, shows you the proposed field values with per-change
            checkboxes, and updates the bookmark only when you click
            {" "}
            <strong>Apply</strong>
            . On any saved bookmark,
            {" "}
            <strong>Capture screenshot</strong>
            {" "}
            grabs the visible area or the full page (it scrolls the tab and stitches the frames) and
            saves it as the bookmark&apos;s screenshot or adds it to the bookmark&apos;s images.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <p className="text-sm font-medium">Your server URL</p>
            <p className="text-sm text-muted-foreground">
              You’ll paste this into the extension on first use.
            </p>
            <code className="block rounded-md bg-muted px-3 py-2 text-sm">{origin}</code>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">{t("Extension package")}</p>
            <Button
              asChild
              variant="outline"
            >
              <a
                href={EXTENSION_ZIP_PATH}
                download
              >
                <Download className="size-4" />
                {t("Download extension (.zip)")}
              </a>
            </Button>
          </div>

          <ol
            className="
              space-y-1 text-sm text-muted-foreground [counter-reset:steps]
              [&>li]:flex [&>li]:gap-2 [&>li]:[counter-increment:steps]
              [&>li]:before:[content:counter(steps)’.’]
            "
          >
            <li>
              {t("Download the .zip above and unzip it into its own folder (e.g. eesimple-extension/).")}
            </li>
            <li>
              <span>
                Open
                {" "}
                <code className="rounded-sm bg-muted px-1 text-xs">chrome://extensions</code>
                {" "}
                (or
                {" "}
                <code className="rounded-sm bg-muted px-1 text-xs">edge://extensions</code>
                ).
              </span>
            </li>
            <li>
              <span>
                Enable
                {" "}
                <strong>Developer mode</strong>
                {" "}
                (toggle, top-right).
              </span>
            </li>
            <li>
              <span>
                Click
                {" "}
                <strong>Load unpacked</strong>
                {" "}
                and select the folder you created.
              </span>
            </li>
            <li>
              Pin the eeSimple extension via the puzzle-piece icon, then click it.
            </li>
            <li>
              <span>
                On first click: paste the server URL shown above and click
                {" "}
                <strong>Save</strong>
                {" "}
                {t("— the browser then asks to let the extension access that one site; allow it. After that, clicking the icon lets you add the current page to your Inbox or directly as a bookmark.")}
              </span>
            </li>
          </ol>
          <p className="text-sm text-muted-foreground">
            <strong>Updating an already-installed extension?</strong>
            {" "}
            Unzip the new download over your folder, then open
            {" "}
            <code className="rounded-sm bg-muted px-1 text-xs">chrome://extensions</code>
            {" "}
            and click the reload (↻) icon on the eeSimple card — new files and permissions only take
            effect after a reload. If the extension asks for your server URL again, click
            {" "}
            <strong>Save</strong>
            {" "}
            {t("to grant it access to your server (it no longer has blanket access to every site).")}
          </p>
        </CardContent>
      </Card>

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
          {showBookmarklet && (
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Select all and copy:</p>
              <Textarea
                readOnly
                value={bookmarklet}
                className="font-mono text-xs break-all"
              />
            </div>
          )}
          <p className="text-sm text-muted-foreground">
            If your browser hides the bookmarks bar, enable it first (usually
            {" "}
            <kbd className="rounded-sm border px-1">Ctrl/Cmd</kbd>
            {" + "}
            <kbd className="rounded-sm border px-1">Shift</kbd>
            {" + "}
            <kbd className="rounded-sm border px-1">B</kbd>
            ), then drag the button onto it. You can also copy the bookmarklet and paste it as the
            URL of a new bookmark created by hand.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
