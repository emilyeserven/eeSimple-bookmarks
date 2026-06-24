import type { Website } from "@eesimple/types";

import { useState } from "react";

import { ExternalLink } from "lucide-react";

import { isFetchableUrl } from "../lib/url";
import { canonicalize } from "../lib/urlCleanup";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface LinkPreviewProps {
  /** Websites whose rules drive matching/expansion (all sites, or a single site for a scoped preview). */
  websites: Website[];
  /** Generic shortener domains that trigger a nudge. */
  ignoreList: string[];
  /** User-defined params to strip in addition to the built-in tracking params. */
  customStripParams?: string[];
  /** Optional label above the input. */
  label?: string;
  /** Placeholder for the URL input. */
  placeholder?: string;
}

/**
 * Paste-a-link tool: shows how a URL would be canonicalized — the matched site, any shortened-link
 * expansion or nudge, and the resulting URL (openable in a new tab to confirm it resolves).
 */
export function LinkPreview({
  websites, ignoreList, customStripParams = [], label = "Check a link", placeholder = "https://…",
}: LinkPreviewProps) {
  const [url, setUrl] = useState("");
  const trimmed = url.trim();
  const result = trimmed
    ? canonicalize(trimmed, {
      mode: "none",
      websites,
      ignoreList,
      customStripParams,
    })
    : null;

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <Label htmlFor="link-preview-input">{label}</Label>
        <Input
          id="link-preview-input"
          value={url}
          onChange={event => setUrl(event.target.value)}
          placeholder={placeholder}
          className="font-mono text-sm"
        />
      </div>

      {result
        ? (
          <div className="space-y-2 rounded-lg border bg-muted/50 p-3">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              {result.matchedWebsite
                ? (
                  <>
                    <Badge variant="secondary">{result.matchedWebsite.siteName}</Badge>
                    {result.expanded ? <Badge variant="outline">Expanded short link</Badge> : null}
                  </>
                )
                : <span className="text-muted-foreground">No matching site</span>}
              {result.shortener === "generic"
                ? <Badge variant="outline">Shortened link</Badge>
                : null}
            </div>

            {result.nudge
              ? (
                <p
                  className="
                    text-sm text-amber-600
                    dark:text-amber-500
                  "
                >
                  This looks like a shortened link — consider using the full URL.
                </p>
              )
              : null}

            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Result</p>
              <div className="flex items-center gap-2">
                <Input
                  value={result.url}
                  readOnly
                  className="font-mono text-sm"
                  aria-label="Canonical URL preview"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  asChild={isFetchableUrl(result.url)}
                  disabled={!isFetchableUrl(result.url)}
                  aria-label="Open result in new tab"
                >
                  {isFetchableUrl(result.url)
                    ? (
                      <a
                        href={result.url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <ExternalLink className="size-4" />
                      </a>
                    )
                    : <ExternalLink className="size-4" />}
                </Button>
              </div>
            </div>
          </div>
        )
        : null}
    </div>
  );
}
