import type { BookmarkUrlDuplicateResult, SocialAccountRef, YouTubeChannelHint } from "@eesimple/types";

import { useRef, useState } from "react";

/**
 * The bookmark General (edit) form's local UI state — title-fetch feedback, website/channel hints,
 * duplicate-URL warning, autofill/social-account offers, and the rescan/touched-field trackers.
 * Grouped into one hook so `useBookmarkGeneralForm` spends a single hook slot on them (mirrors
 * `useSourceDefaultFlags` / `useAutofilledFields` in `useBookmarkFormState.ts`).
 */
export function useBookmarkGeneralUiState() {
  const [isReportingTitle, setIsReportingTitle] = useState(false);
  const [expectedTitle, setExpectedTitle] = useState("");
  const [websiteSiteName, setWebsiteSiteName] = useState("");
  const channelHintRef = useRef<YouTubeChannelHint | null>(null);
  const [youtubeChannel, setYoutubeChannel] = useState<YouTubeChannelHint | null>(null);
  const [titleFetch, setTitleFetch] = useState<{ previous: string } | null>(null);
  const [urlDuplicate, setUrlDuplicate] = useState<BookmarkUrlDuplicateResult | null>(null);
  const [autofillOfferDismissed, setAutofillOfferDismissed] = useState(false);
  const [socialAccountOffer, setSocialAccountOffer] = useState<SocialAccountRef | null>(null);
  const [isRescanning, setIsRescanning] = useState(false);
  const touchedRef = useRef<Set<string>>(new Set());

  return {
    isReportingTitle,
    setIsReportingTitle,
    expectedTitle,
    setExpectedTitle,
    websiteSiteName,
    setWebsiteSiteName,
    channelHintRef,
    youtubeChannel,
    setYoutubeChannel,
    titleFetch,
    setTitleFetch,
    urlDuplicate,
    setUrlDuplicate,
    autofillOfferDismissed,
    setAutofillOfferDismissed,
    socialAccountOffer,
    setSocialAccountOffer,
    isRescanning,
    setIsRescanning,
    touchedRef,
  };
}
