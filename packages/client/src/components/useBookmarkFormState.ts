import type { BookmarkUrlDuplicateResult, SocialAccountRef } from "@eesimple/types";

import { useEffect, useState } from "react";

/**
 * The four "set as default" checkboxes shown for a new bookmark's website / YouTube channel
 * (create-only). Grouped into one hook so the form controller spends a single hook slot on them
 * (and one tidy `resetFlags`) instead of four loose `useState`s.
 */
export function useSourceDefaultFlags() {
  const [setWebsiteCategory, setSetWebsiteCategory] = useState(false);
  const [setWebsiteTags, setSetWebsiteTags] = useState(false);
  const [setWebsiteMediaType, setSetWebsiteMediaType] = useState(false);
  const [setChannelCategory, setSetChannelCategory] = useState(false);
  const [setChannelTags, setSetChannelTags] = useState(false);
  const [setChannelMediaType, setSetChannelMediaType] = useState(false);

  function resetFlags(): void {
    setSetWebsiteCategory(false);
    setSetWebsiteTags(false);
    setSetWebsiteMediaType(false);
    setSetChannelCategory(false);
    setSetChannelTags(false);
    setSetChannelMediaType(false);
  }

  return {
    setWebsiteCategory,
    setWebsiteTags,
    setWebsiteMediaType,
    setChannelCategory,
    setChannelTags,
    setChannelMediaType,
    setSetWebsiteCategory,
    setSetWebsiteTags,
    setSetWebsiteMediaType,
    setSetChannelCategory,
    setSetChannelTags,
    setSetChannelMediaType,
    resetFlags,
  };
}

interface UseBookmarkFormUiStateParams {
  /** A fresh create form starts collapsed (URL-only); editing starts revealed. */
  initialScanned: boolean;
  /** While a title fetch is in flight the "report wrong title" UI is dismissed. */
  fetchTitlePending: boolean;
}

/**
 * The bookmark form's transient UI state: progressive-disclosure / scan flags, the URL-duplicate and
 * autofill-offer banners, the title-fetch undo + "report wrong title" inputs, and the new-site name.
 * Grouped into one hook so the controller spends a single hook slot on what would otherwise be
 * several loose `useState`s plus an effect.
 */
export function useBookmarkFormUiState({
  initialScanned, fetchTitlePending,
}: UseBookmarkFormUiStateParams) {
  const [isReportingTitle, setIsReportingTitle] = useState(false);
  const [expectedTitle, setExpectedTitle] = useState("");
  const [websiteSiteName, setWebsiteSiteName] = useState("");
  // The social account a scanned social-network URL points at, with no existing author — drives the
  // "Create author from this account" offer banner. Null when matched or not a social URL.
  const [socialAccountOffer, setSocialAccountOffer] = useState<SocialAccountRef | null>(null);
  // When the fetch-title button overwrites a non-empty title, record the previous value so the
  // banner can offer an undo. Cleared when the user manually edits the title field.
  const [titleFetch, setTitleFetch] = useState<{ previous: string } | null>(null);
  // Progressive disclosure: a fresh form shows only the URL field until checked, then reveals the
  // rest. `isScanning` drives the Check URL button's spinner.
  const [scanned, setScanned] = useState(initialScanned);
  const [isScanning, setIsScanning] = useState(false);
  const [urlDuplicate, setUrlDuplicate] = useState<BookmarkUrlDuplicateResult | null>(null);
  const [autofillOfferDismissed, setAutofillOfferDismissed] = useState(false);
  const [urlResolveError, setUrlResolveError] = useState<string | null>(null);
  // Set when the form is revealed from a plain-text entry: the typed text became the bookmark's name,
  // so the separate Name field is hidden. Stays false for URL/ISBN entries.
  const [hideNameField, setHideNameField] = useState(false);

  function handleCancelReporting(): void {
    setIsReportingTitle(false);
    setExpectedTitle("");
  }

  // Mirrors the original form reset: clears the new-site name, scan reveal, banners, and title undo.
  // Intentionally leaves `isScanning`, the reporting inputs, and the modal toggle untouched.
  function resetUiState(): void {
    setWebsiteSiteName("");
    setSocialAccountOffer(null);
    setScanned(false);
    setUrlDuplicate(null);
    setAutofillOfferDismissed(false);
    setTitleFetch(null);
    setUrlResolveError(null);
    setHideNameField(false);
  }

  useEffect(() => {
    if (fetchTitlePending) {
      setIsReportingTitle(false);
      setExpectedTitle("");
    }
  }, [fetchTitlePending]);

  return {
    isReportingTitle,
    setIsReportingTitle,
    expectedTitle,
    setExpectedTitle,
    websiteSiteName,
    setWebsiteSiteName,
    socialAccountOffer,
    setSocialAccountOffer,
    titleFetch,
    setTitleFetch,
    scanned,
    setScanned,
    isScanning,
    setIsScanning,
    urlDuplicate,
    setUrlDuplicate,
    autofillOfferDismissed,
    setAutofillOfferDismissed,
    urlResolveError,
    setUrlResolveError,
    hideNameField,
    setHideNameField,
    handleCancelReporting,
    resetUiState,
  };
}
