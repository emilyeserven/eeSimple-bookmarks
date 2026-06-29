import type { InboxItem, InboxPreFillDefaults, YouTubeChannel } from "@eesimple/types";

import { useEffect, useMemo, useRef, useState } from "react";

import { normalizeDomain } from "@eesimple/types";

import { computeInboxPrefillSeed } from "./inboxPrefillSeed";
import { useAutofillRules } from "../hooks/useAutofill";
import { useWebsites } from "../hooks/useWebsites";
import { useYouTubeChannels } from "../hooks/useYouTubeChannels";
import { metadataApi } from "../lib/api/metadata";

/** Whether a URL points at YouTube (so a channel-default scan is worth running). */
function isYouTubeUrl(url: string): boolean {
  try {
    const host = normalizeDomain(new URL(url).hostname);
    return host === "youtube.com" || host === "youtu.be";
  }
  catch {
    return false;
  }
}

/** Fill a prefill's still-empty category/media-type slots and union the tags from a channel's defaults. */
function mergeChannelDefaults(
  prev: InboxPreFillDefaults,
  channel: YouTubeChannel,
): InboxPreFillDefaults {
  return {
    ...prev,
    categoryId: prev.categoryId ?? channel.category?.id ?? undefined,
    mediaTypeId: prev.mediaTypeId ?? channel.mediaTypeId ?? undefined,
    tagIds: [...new Set([...(prev.tagIds ?? []), ...(channel.tagIds ?? [])])],
  };
}

/**
 * Owns the per-row "Advanced" prefill state for an inbox item, seeded from the matching system
 * (autofill rules + website defaults via {@link computeInboxPrefillSeed}, plus YouTube-channel
 * defaults resolved lazily on first expand). Split out of {@link useReviewRowController} so neither
 * function is hook-dense (see CLAUDE.md → Large-form decomposition).
 *
 * @param advancedOpen whether the row's Advanced section is expanded (gates the channel scan).
 */
export function useInboxPrefillSeed(item: InboxItem, advancedOpen: boolean) {
  const {
    data: autofillRules = [],
  } = useAutofillRules();
  const {
    data: websites = [],
  } = useWebsites();
  const {
    data: channels = [],
  } = useYouTubeChannels();

  const [itemPreFill, setItemPreFill] = useState<InboxPreFillDefaults>(() =>
    computeInboxPrefillSeed(item, {
      autofillRules,
      websites,
    }));

  // Once the user touches a field, never re-seed over their choices.
  const touchedRef = useRef(false);
  // Whether the matching data was already loaded at mount (so the initializer used real data).
  const seededRef = useRef(autofillRules.length > 0 || websites.length > 0);
  const scannedRef = useRef(false);

  const url = item.url ?? "";
  const isYouTube = useMemo(() => isYouTubeUrl(url), [url]);

  // Re-seed once the rule/website lists finish loading after mount (unless the user already edited).
  useEffect(() => {
    if (touchedRef.current || seededRef.current) return;
    if (autofillRules.length === 0 && websites.length === 0) return;
    seededRef.current = true;
    setItemPreFill(computeInboxPrefillSeed(item, {
      autofillRules,
      websites,
    }));
  }, [item, autofillRules, websites]);

  // Lazily resolve a YouTube item's channel defaults the first time Advanced is expanded — the
  // channel isn't known without an oEmbed scan, so it's deferred off the list render.
  useEffect(() => {
    if (!advancedOpen || !isYouTube || scannedRef.current || url === "") return;
    scannedRef.current = true;
    void metadataApi.scan({
      url,
    }).then((result) => {
      const key = result.channel?.key;
      if (!key) return;
      const channel = channels.find(c => c.channelKey === key);
      if (channel) setItemPreFill(prev => mergeChannelDefaults(prev, channel));
    }).catch(() => {
      // Best-effort: a failed scan just leaves the prefill as-is.
    });
  }, [advancedOpen, isYouTube, url, channels]);

  /** Patch one field of the per-item advanced-edit prefill, marking it user-edited. */
  function patchItemPreFill(patch: Partial<InboxPreFillDefaults>) {
    touchedRef.current = true;
    setItemPreFill(prev => ({
      ...prev,
      ...patch,
    }));
  }

  return {
    itemPreFill,
    patchItemPreFill,
  };
}
