import type { YouTubeChannelHint } from "@eesimple/types";

import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface WebsiteLookupBannerProps {
  data: { exists: boolean;
    domain: string | null;
    siteName?: string | null; } | undefined;
  /** When the URL is the built-in YouTube site, show the detected channel instead of the site-name input. */
  isYouTube: boolean;
  /** The channel detected from a YouTube video, or `null` (e.g. a playlist URL or before it resolves). */
  youtubeChannel: YouTubeChannelHint | null;
  /** Called when the user adds or removes a self-identifier in the YouTube channel section. */
  onChannelSelfIdsChange: (ids: string[]) => void;
  websiteSiteName: string;
  onSiteNameChange: (value: string) => void;
  onSiteNameBlur: () => void;
}

/**
 * Banner shown below the URL field after a website lookup: existing vs. new site, plus the site-name
 * input for new sites. For the built-in YouTube site the site-name input is replaced by the
 * auto-detected channel and its self-identifier editor. The "set as default category / tags / media
 * type" checkboxes live under their respective fields in `BookmarkAdvancedSection`, not here.
 */
export function WebsiteLookupBanner({
  data, isYouTube, youtubeChannel, onChannelSelfIdsChange,
  websiteSiteName, onSiteNameChange, onSiteNameBlur,
}: WebsiteLookupBannerProps) {
  const [newSelfId, setNewSelfId] = useState("");

  if (!data?.domain) return null;

  function addSelfId(): void {
    const trimmed = newSelfId.trim();
    if (!trimmed || !youtubeChannel) return;
    const current = youtubeChannel.selfIds ?? [];
    if (current.includes(trimmed)) {
      setNewSelfId("");
      return;
    }
    onChannelSelfIdsChange([...current, trimmed]);
    setNewSelfId("");
  }

  function removeSelfId(value: string): void {
    if (!youtubeChannel) return;
    onChannelSelfIdsChange((youtubeChannel.selfIds ?? []).filter(id => id !== value));
  }

  return (
    <div>
      {!isYouTube && (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          {data.exists
            ? (
              <>
                <Badge variant="secondary">Existing site</Badge>
                <span>{data.siteName}</span>
              </>
            )
            : (
              <>
                <Badge variant="outline">New site</Badge>
                <span>
                  {data.domain}
                  {" "}
                  will be added
                </span>
              </>
            )}
        </p>
      )}
      {isYouTube
        ? (
          youtubeChannel
            ? (
              <div className="space-y-2">
                <p
                  className="
                    flex items-center gap-2 text-sm text-muted-foreground
                  "
                >
                  <Badge variant="secondary">YouTube channel</Badge>
                  <span>{youtubeChannel.name}</span>
                </p>
                <div>
                  <Label className="mb-1 block text-sm">
                    Channel self-identifiers
                  </Label>
                  <p className="mb-2 text-xs text-muted-foreground">
                    Short names this channel appends to video titles (e.g. &quot;SNL&quot;). They are stripped from the bookmark title automatically.
                  </p>
                  {(youtubeChannel.selfIds ?? []).length > 0 && (
                    <div className="mb-2 flex flex-wrap gap-1">
                      {(youtubeChannel.selfIds ?? []).map(id => (
                        <Badge
                          key={id}
                          variant="secondary"
                          className="cursor-pointer gap-1"
                          onClick={() => removeSelfId(id)}
                          title={`Remove "${id}"`}
                        >
                          {id}
                          <span aria-hidden>×</span>
                        </Badge>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Input
                      value={newSelfId}
                      onChange={e => setNewSelfId(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addSelfId();
                        }
                      }}
                      placeholder="e.g. SNL"
                      className="h-8 text-sm"
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={addSelfId}
                      disabled={!newSelfId.trim()}
                    >
                      Add
                    </Button>
                  </div>
                </div>
              </div>
            )
            : null
        )
        : !data.exists
          ? (
            <div className="mt-2 space-y-2">
              <div>
                <Label
                  htmlFor="website-site-name"
                  className="mb-1 block text-sm"
                >
                  Site name
                </Label>
                <Input
                  id="website-site-name"
                  value={websiteSiteName}
                  onChange={e => onSiteNameChange(e.target.value)}
                  onBlur={onSiteNameBlur}
                  placeholder={data.domain ?? ""}
                />
              </div>
            </div>
          )
          : null}
    </div>
  );
}
