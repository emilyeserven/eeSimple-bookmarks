import { useEffect, useMemo, useRef, useState } from "react";

import { ChevronDown, ChevronRight, Copy } from "lucide-react";

// Extension file contents inlined at build time so they can be shown/copied even when the
// browser blocks or fails the native file download.
import backgroundJsRaw from "../../public/extension/background.js?raw";
import manifestJsonRaw from "../../public/extension/manifest.json?raw";
import popupHtmlRaw from "../../public/extension/popup.html?raw";
import popupJsRaw from "../../public/extension/popup.js?raw";
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

const EXTENSION_FILES = [
  {
    file: "manifest.json",
    content: manifestJsonRaw,
  },
  {
    file: "popup.html",
    content: popupHtmlRaw,
  },
  {
    file: "popup.js",
    content: popupJsRaw,
  },
  {
    file: "background.js",
    content: backgroundJsRaw,
  },
] as const;

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
  const [showBookmarklet, setShowBookmarklet] = useState(false);
  const [expandedFiles, setExpandedFiles] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (linkRef.current) linkRef.current.setAttribute("href", bookmarklet);
  }, [bookmarklet]);

  async function copy(): Promise<void> {
    setShowBookmarklet(true);
    try {
      await navigator.clipboard.writeText(bookmarklet);
      notifySuccess("Bookmarklet copied to clipboard");
    }
    catch {
      // Clipboard API unavailable (HTTP context) — the textarea below lets the user copy manually.
    }
  }

  function toggleFile(file: string): void {
    setExpandedFiles((prev) => {
      const next = new Set(prev);
      if (next.has(file)) next.delete(file);
      else next.add(file);
      return next;
    });
  }

  async function copyFileContent(file: string, content: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(content);
      notifySuccess(`${file} copied to clipboard`);
    }
    catch {
      // Clipboard API unavailable.
    }
  }

  return (
    <div className="space-y-6">
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

      <Card>
        <CardHeader>
          <CardTitle>Browser Extension (Chrome · Edge)</CardTitle>
          <CardDescription>
            A one-click extension that opens the quick-add popup for any page — no bookmarks bar
            needed.
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
            <p className="text-sm font-medium">Extension files</p>
            <p className="text-sm text-muted-foreground">
              Save all four files into a new folder (e.g.
              {" "}
              <code className="rounded-sm bg-muted px-1 text-xs">eesimple-extension/</code>
              ). Use
              {" "}
              <strong>Download</strong>
              {" "}
              or click a filename to view the contents and copy them manually.
            </p>
            <div className="space-y-1.5">
              {EXTENSION_FILES.map(({
                file, content,
              }) => {
                const isExpanded = expandedFiles.has(file);
                return (
                  <div
                    key={file}
                    className="rounded-md border"
                  >
                    <div className="flex items-center gap-1 px-2 py-1.5">
                      <button
                        type="button"
                        onClick={() => toggleFile(file)}
                        className="
                          flex flex-1 items-center gap-1.5 rounded-sm px-1
                          py-0.5 text-left font-mono text-sm
                          hover:bg-accent hover:text-accent-foreground
                        "
                      >
                        {isExpanded
                          ? (
                            <ChevronDown
                              className="
                                size-3.5 shrink-0 text-muted-foreground
                              "
                            />
                          )
                          : (
                            <ChevronRight
                              className="
                                size-3.5 shrink-0 text-muted-foreground
                              "
                            />
                          )}
                        {file}
                      </button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 gap-1 px-2 text-xs"
                        onClick={() => void copyFileContent(file, content)}
                      >
                        <Copy className="size-3.5" />
                        Copy
                      </Button>
                      <a
                        href={`/extension/${file}`}
                        download={file}
                        className="
                          inline-flex h-7 items-center rounded-md border bg-card
                          px-2 text-xs
                          hover:bg-accent hover:text-accent-foreground
                        "
                      >
                        Download
                      </a>
                    </div>
                    {isExpanded && (
                      <pre
                        className="
                          max-h-64 overflow-auto border-t bg-muted/50 px-4 py-3
                          font-mono text-xs/relaxed break-all
                          whitespace-pre-wrap
                        "
                      >
                        {content}
                      </pre>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <ol
            className="
              space-y-1 text-sm text-muted-foreground [counter-reset:steps]
              [&>li]:flex [&>li]:gap-2 [&>li]:[counter-increment:steps]
              [&>li]:before:[content:counter(steps)’.’]
            "
          >
            <li>
              Save the four files above into a single folder (download or copy each).
            </li>
            <li>
              Open
              {" "}
              <code className="rounded-sm bg-muted px-1 text-xs">chrome://extensions</code>
              {" "}
              (or
              {" "}
              <code className="rounded-sm bg-muted px-1 text-xs">edge://extensions</code>
              ).
            </li>
            <li>
              Enable
              {" "}
              <strong>Developer mode</strong>
              {" "}
              (toggle, top-right).
            </li>
            <li>
              Click
              {" "}
              <strong>Load unpacked</strong>
              {" "}
              and select the folder you created.
            </li>
            <li>
              Pin the eeSimple extension via the puzzle-piece icon, then click it.
            </li>
            <li>
              On first click: paste the server URL shown above and click
              {" "}
              <strong>Save &amp; Open</strong>
              .
            </li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
