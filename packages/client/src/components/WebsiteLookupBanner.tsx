import type { YouTubeChannelHint } from "@eesimple/types";

import { useState } from "react";

import { useTranslation } from "react-i18next";

import { SelfIdsField } from "./SelfIdsField";

import { Badge } from "@/components/ui/badge";
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
  const {
    t,
  } = useTranslation();
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
                <Badge variant="secondary">{t("Existing site")}</Badge>
                <span>{data.siteName}</span>
              </>
            )
            : (
              <>
                <Badge variant="outline">{t("New site")}</Badge>
                <span>
                  {t("{{domain}} will be added", {
                    domain: data.domain,
                  })}
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
                  <Badge variant="secondary">{t("YouTube channel")}</Badge>
                  <span>{youtubeChannel.name}</span>
                </p>
                <SelfIdsField
                  label={t("Channel self-identifiers")}
                  description={t("Short names this channel appends to video titles (e.g. “SNL”). They are stripped from the bookmark title automatically.")}
                  selfIds={youtubeChannel.selfIds ?? []}
                  newSelfId={newSelfId}
                  onNewSelfIdChange={setNewSelfId}
                  onAdd={addSelfId}
                  onRemove={removeSelfId}
                />
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
                  {t("Site name")}
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
