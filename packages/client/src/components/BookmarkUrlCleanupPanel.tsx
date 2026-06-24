import type { UrlCleanupMode } from "../lib/urlCleanup";
import type { Website } from "@eesimple/types";

import { ExternalLink } from "lucide-react";

import { isFetchableUrl } from "../lib/url";
import { canonicalize } from "../lib/urlCleanup";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface UrlCleanupPanelProps {
  url: string;
  cleanupId: string;
  mode: UrlCleanupMode;
  onModeChange: (mode: UrlCleanupMode) => void;
  websites: Website[];
  ignoreList: string[];
  customStripParams?: string[];
}

/** Radio-group + live URL preview for the URL cleanup options. */
export function UrlCleanupPanel({
  url, cleanupId, mode, onModeChange, websites, ignoreList, customStripParams = [],
}: UrlCleanupPanelProps) {
  const preview = canonicalize(url, {
    mode,
    websites,
    ignoreList,
    customStripParams,
  }).url;
  return (
    <div
      className="
        space-y-4 rounded-lg border bg-muted/50 p-4
        sm:col-span-2
      "
    >
      <p className="text-sm font-medium">URL Cleanup</p>

      <div className="space-y-2">
        {(
          [
            {
              value: "none" as UrlCleanupMode,
              label: "No modification",
            },
            {
              value: "trackers" as UrlCleanupMode,
              label: "Just trackers",
            },
            {
              value: "all" as UrlCleanupMode,
              label: "All params",
            },
          ]
        ).map(option => (
          <div
            key={option.value}
            className="flex items-center gap-2"
          >
            <input
              type="radio"
              id={`${cleanupId}-${option.value}`}
              name={`${cleanupId}-mode`}
              value={option.value}
              checked={mode === option.value}
              onChange={() => onModeChange(option.value)}
              className="accent-primary"
            />
            <Label htmlFor={`${cleanupId}-${option.value}`}>{option.label}</Label>
          </div>
        ))}
      </div>

      <div className="space-y-1">
        <p className="text-xs text-muted-foreground">Preview</p>
        <div className="flex items-center gap-2">
          <Input
            value={preview}
            readOnly
            className="font-mono text-sm"
            aria-label="Cleaned URL preview"
          />
          {isFetchableUrl(preview)
            ? (
              <Button
                type="button"
                variant="outline"
                size="icon"
                asChild
              >
                <a
                  href={preview}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Open cleaned URL in new tab"
                >
                  <ExternalLink className="size-4" />
                </a>
              </Button>
            )
            : (
              <Button
                type="button"
                variant="outline"
                size="icon"
                disabled
                aria-label="Open cleaned URL in new tab"
              >
                <ExternalLink className="size-4" />
              </Button>
            )}
        </div>
      </div>
    </div>
  );
}
