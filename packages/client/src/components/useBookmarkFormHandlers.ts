import type { BookmarkFormApi, BookmarkInputType } from "./bookmarkFormSchema";
import type { DraftEntityName } from "./entityNames/draftEntityName";
import type { useBookmarkFormChannel } from "./useBookmarkFormChannel";
import type { useBookmarkFormData } from "./useBookmarkFormData";
import type { useBookmarkFormImageState } from "./useBookmarkFormImageState";
import type { useAutofilledFields, useBookmarkFormUiState, useSourceDefaultFlags } from "./useBookmarkFormState";
import type { useBookmarkPrimaryLanguage } from "./useBookmarkPrimaryLanguage";
import type { useBookmarkPropertyPrefill } from "./useBookmarkPropertyPrefill";
import type { useBookmarkUrlProcessing } from "./useBookmarkUrlProcessing";
import type { Bookmark, BookmarkContentKind, CreateBookmarkInput, ScanResult } from "@eesimple/types";
import type { KeyboardEvent } from "react";

import { contentKindToMediaTypeName } from "@eesimple/types";
import { useStore } from "@tanstack/react-form";
import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import {
  buildAllPropertyValues,
  detectBookmarkInputType,
  looksLikeYouTube,
} from "./bookmarkFormSchema";
import { applyImageIntent, promoteSourceDefaults } from "./bookmarkSubmit";
import { entriesFromDrafts } from "./entityNames/draftEntityName";
import { useBookmarkScanHandlers } from "./useBookmarkScanHandlers";
import { useUpdateBookmarkRelationships } from "../hooks/useBookmarks";
import { metadataApi } from "../lib/api/metadata";
import { notifySuccess } from "../lib/notifications";

type FormApi = BookmarkFormApi;
type Channel = ReturnType<typeof useBookmarkFormChannel>;
type Data = ReturnType<typeof useBookmarkFormData>;
type ImageState = ReturnType<typeof useBookmarkFormImageState>;
type Ui = ReturnType<typeof useBookmarkFormUiState>;
type Flags = ReturnType<typeof useSourceDefaultFlags>;
type Prefill = ReturnType<typeof useBookmarkPropertyPrefill>;
type UrlProcessing = ReturnType<typeof useBookmarkUrlProcessing>;
type Autofilled = ReturnType<typeof useAutofilledFields>;

/** True when `url`'s hostname (minus leading www.) matches any entry in `ignoreList`. */
function isRedirectIgnored(url: string, ignoreList: string[]): boolean {
  if (ignoreList.length === 0) return false;
  try {
    const hostname = new URL(url).hostname.replace(/^www\./i, "").toLowerCase();
    return ignoreList.some(d => hostname === d || hostname.endsWith(`.${d}`));
  }
  catch {
    return false;
  }
}

interface UseBookmarkFormHandlersParams {
  bookmark?: Bookmark;
  onDone?: () => void;
  onCreated?: (bookmark: Bookmark) => void;
  form: FormApi;
  data: Data;
  ui: Ui;
  flags: Flags;
  channel: Channel;
  urlProcessing: UrlProcessing;
  imageState: ImageState;
  prefill: Prefill;
  primaryLanguage: ReturnType<typeof useBookmarkPrimaryLanguage>;
  /** Amazon-scan ISBN detection (see `useBookmarkIsbn`) — invoked from `performUrlScan`. */
  handleAmazonIsbnDetected: (isbn13: string) => Promise<void>;
  /** Records which fields/properties a URL/title automation filled (create-only); cleared on reset. */
  autofilled: Autofilled;
}

/**
 * The bookmark form's action handlers plus the scan-handler composition and the URL input-type
 * derivation. Extracted from `useBookmarkFormController` so the controller stays the thin coordinator
 * of the form spine + state/data sub-hooks; this hook owns the heavier create/edit/scan/reset logic
 * (and its `metadataApi` / `bookmarkSubmit` / navigation / notification dependencies). The owning
 * controller still creates the `useAppForm` instance and wires its `onSubmit` to this hook's
 * `submitForm`, so the form remains the spine consumed by the prefill/isbn sub-hooks.
 */
export function useBookmarkFormHandlers({
  bookmark,
  onDone,
  onCreated,
  form,
  data,
  ui,
  flags,
  channel,
  urlProcessing,
  imageState,
  prefill,
  primaryLanguage,
  handleAmazonIsbnDetected,
  autofilled,
}: UseBookmarkFormHandlersParams) {
  const navigate = useNavigate();
  const {
    t,
  } = useTranslation();
  const updateRelationships = useUpdateBookmarkRelationships();

  const {
    actions: {
      createBookmark,
      updateBookmark,
      autoImage,
      addImage,
      imagesFromCandidates,
      setMainImage,
      deleteImageById,
      fetchTitle,
      fetchMetadata,
      websiteLookup,
      updateWebsite,
      updateYouTubeChannel,
      createPerson,
      updatePerson,
      autoPersonImage,
      createLanguage,
    },
    customProperties,
    categories,
    mediaTypes,
    languages,
    people,
    redirectIgnoreList,
    autoFetchTitle,
  } = data;

  const {
    websiteSiteName,
    setTitleFetch,
    titleFetch,
    scanned,
    setScanned,
    setIsScanning,
    setUrlDuplicate,
    setUrlResolveError,
    setHideNameField,
  } = ui;

  const {
    channelHintRef,
    setYoutubeChannel,
  } = channel;

  const {
    urlDuplicateCheck,
  } = data.actions;

  const {
    setUrlShortener,
    setUrlCleanup,
    setShowUrlCleanup,
    setUrlCleanupMode,
    isUrlFetchable,
    runUrlCleanup: cleanUrl,
    undoUrlCleanup: undoCleanup,
    classifyUrlShortener,
    resolveSubmitUrl,
  } = urlProcessing;

  const {
    imageIntentRef, quickAddRef, setImageCandidates,
  } = imageState;

  const rawUrl = useStore(form.store, s => s.values.url);
  // What the primary input holds: a URL (the normal flow), an ISBN, or plain text (offline). Drives
  // the live hint + the pre-scan action button. `isOfflineMode` keeps its meaning (plain text only).
  const inputType: BookmarkInputType = detectBookmarkInputType(rawUrl);
  const isOfflineMode = inputType === "text";

  const {
    primaryLanguageLevelId, hasPrimaryLanguageUsage, attachPrimaryLanguageUsage, pendingLanguageUsagesRef,
    siteLanguageCodeRef, stageDetectedSiteLanguageCode,
  } = primaryLanguage;

  const {
    runFetchTitle,
    runFetchDescription,
    runYouTubeEnrichment,
    applyScanMetadata,
    createPersonFromSocialAccount,
    runUrlCleanup,
    undoUrlCleanup,
    undoTitleFetch,
    runWebsiteLookup,
  } = useBookmarkScanHandlers({
    form,
    channelHintRef,
    setYoutubeChannel,
    websiteSiteName,
    setWebsiteSiteName: ui.setWebsiteSiteName,
    titleFetch,
    setTitleFetch,
    fetchTitle,
    fetchMetadata,
    websiteLookup,
    isUrlFetchable,
    classifyUrlShortener,
    cleanUrl,
    undoCleanup,
    people,
    getPersonIds: () => form.getFieldValue("personIds") as string[],
    setPersonIds: (ids: string[]) => form.setFieldValue("personIds", ids),
    createPerson,
    updatePerson,
    autoPersonImage,
    setSocialAccountOffer: ui.setSocialAccountOffer,
    languages,
    primaryLanguageLevelId,
    hasPrimaryLanguageUsage,
    attachPrimaryLanguageUsage,
    createLanguage,
    stageDetectedSiteLanguageCode,
    markAutofilledField: autofilled.markAutofilledField,
  });

  // Persist the form: build the property values + input, then create or update. On create, also
  // promote category/tags to website/channel defaults (when opted in) and offer the category-edit
  // shortcut.
  async function submitForm(value: {
    url: string;
    title: string;
    names: DraftEntityName[];
    categoryId: string;
    mediaTypeId: string;
    description: string;
    tagIds: string[];
    genreMoodIds: string[];
    locationIds: string[];
    personIds: string[];
  }): Promise<void> {
    const locationRelationByLocationId = form.getFieldValue("locationRelationByLocationId");
    const {
      numberValues, booleanValues, dateTimeValues, progressValues,
      choicesValues, sectionsValues, textValues,
    } = buildAllPropertyValues(
      customProperties ?? [],
      value.categoryId,
      prefill.customRef.current,
      value.mediaTypeId || null,
    );

    // Resolve the URL to save plus the original it was cleaned from (see resolveSubmitUrl).
    const {
      finalUrl, originalUrl,
    } = resolveSubmitUrl(value.url, quickAddRef.current);

    // Video length and priority are intentionally omitted — the server fills video length from the
    // URL's metadata and defaults priority. Media type is sent when the user picked one; otherwise
    // the server derives it (channel/website default → "Video"). On edit, omitting a field
    // preserves the existing value (the update patch skips `undefined` fields).
    const input: CreateBookmarkInput = {
      url: finalUrl,
      originalUrl,
      title: value.title,
      categoryId: value.categoryId,
      mediaTypeId: value.mediaTypeId || null,
      description: value.description || null,
      tagIds: value.tagIds,
      genreMoodIds: value.genreMoodIds,
      locationIds: value.locationIds,
      locationRelationByLocationId,
      blacklistedTagIds: form.getFieldValue("blacklistedTagIds"),
      blacklistedLocationIds: form.getFieldValue("blacklistedLocationIds"),
      personIds: value.personIds,
      groupIds: form.getFieldValue("groupIds"),
      numberValues,
      booleanValues,
      dateTimeValues,
      choicesValues,
      progressValues,
      sectionsValues,
      textValues,
      ...(channelHintRef.current && {
        youtubeChannel: channelHintRef.current,
      }),
    };

    if (bookmark) {
      await updateBookmark.mutateAsync({
        id: bookmark.id,
        input,
      });
      await applyImageIntent(bookmark.id, finalUrl ?? "", imageIntentRef.current, {
        autoImage,
        addImage,
        imagesFromCandidates,
        setMainImage,
        deleteImageById,
      });
      onDone?.();
      return;
    }

    const trimmedSiteName = websiteSiteName.trim();
    const nameEntries = entriesFromDrafts(value.names);
    const created = await createBookmark.mutateAsync({
      ...input,
      ...(trimmedSiteName && {
        websiteSiteName: trimmedSiteName,
      }),
      ...(pendingLanguageUsagesRef.current.length > 0 && {
        languageUsages: pendingLanguageUsagesRef.current,
      }),
      ...(nameEntries.length > 0 && {
        names: nameEntries,
      }),
      ...(siteLanguageCodeRef.current && {
        siteLanguageCode: siteLanguageCodeRef.current,
      }),
    });
    await applyImageIntent(created.id, finalUrl ?? "", imageIntentRef.current, {
      autoImage,
      addImage,
      imagesFromCandidates,
      setMainImage,
      deleteImageById,
    });

    // Stage the media-link relationship (if any) now that the bookmark exists. This is a
    // non-atomic follow-up call, not folded into the create transaction — safe as a full-replace
    // `updateBookmarkRelationships` here specifically because a just-created bookmark has zero
    // pre-existing edges to wipe.
    const mediaLinkTarget = form.getFieldValue("mediaLinkTarget");
    if (mediaLinkTarget) {
      await updateRelationships.mutateAsync({
        id: created.id,
        input: {
          relationships: [{
            bookmarkId: mediaLinkTarget.bookmarkId,
            relationshipTypeId: mediaLinkTarget.relationshipTypeId,
            direction: mediaLinkTarget.direction,
          }],
        },
      });
    }

    promoteSourceDefaults(created, value.categoryId, value.mediaTypeId, value.tagIds, {
      setWebsiteCategory: flags.setWebsiteCategory,
      setWebsiteTags: flags.setWebsiteTags,
      setWebsiteMediaType: flags.setWebsiteMediaType,
      setChannelCategory: flags.setChannelCategory,
      setChannelTags: flags.setChannelTags,
    }, {
      updateWebsite,
      updateYouTubeChannel,
    });

    // Offer a shortcut to refine the chosen category right after saving.
    const categorySlug = (categories ?? []).find(category => category.id === value.categoryId)?.slug;
    notifySuccess(t("Bookmark added"), categorySlug
      ? {
        action: {
          label: "Edit category",
          onClick: () => void navigate({
            to: "/categories/$categorySlug/edit",
            params: {
              categorySlug,
            },
          }),
        },
      }
      : undefined);
    handleReset();
    onCreated?.(created);
  }

  function handleReset(): void {
    form.reset();
    prefill.resetPrefill();
    autofilled.resetAutofilled();
    channel.resetChannel();
    setUrlShortener({
      nudge: false,
      expandedUrl: null,
    });
    setUrlCleanup(null);
    imageState.resetImageState();
    setShowUrlCleanup(false);
    setUrlCleanupMode("none");
    flags.resetFlags();
    ui.resetUiState();
    // Clear the staged auto-detected language between adds so a prior bookmark's site language
    // can't leak into the next create when its scan reports no language (#985).
    siteLanguageCodeRef.current = null;
    pendingLanguageUsagesRef.current = [];
  }

  // The full URL scan: clean the URL, then make a single consolidated `/api/scan` round-trip that
  // resolves redirects and fetches the page metadata once (title/description/people, plus
  // YouTube/oEmbed enrichment). Autofill, the website lookup, and the duplicate check run alongside.
  // `revealing` is the explicit "Check URL" action — it always fills the title and reveals the rest
  // of the form; on later blurs the title fill honours the autoFetchTitle setting.
  // Pre-select the built-in Media Type a detected content kind maps to, but only when the field is
  // still empty (never clobbers a manual pick or a website default). Marks it auto-filled so the
  // "reveal auto-filled in main" setting can lift it. Create-form only, like the rest of the scan flow.
  function applyDetectedMediaType(kind: BookmarkContentKind): void {
    if ((form.getFieldValue("mediaTypeId") as string).trim() !== "") return;
    const name = contentKindToMediaTypeName(kind);
    if (!name) return;
    const match = mediaTypes?.find(mt => mt.name === name);
    if (!match) return;
    form.setFieldValue("mediaTypeId", match.id);
    autofilled.markAutofilledField("mediaTypeId");
  }

  async function performUrlScan({
    revealing,
  }: { revealing: boolean }): Promise<void> {
    setIsScanning(true);
    setUrlResolveError(null);
    try {
      const urlBeforeCleanup = form.getFieldValue("url");
      runUrlCleanup(urlBeforeCleanup);
      const url = form.getFieldValue("url");
      const fillTitle = revealing || autoFetchTitle;

      // One round-trip for redirect resolution + page metadata. Best-effort: a failure leaves the
      // form working with the typed URL. The server skips redirect resolution for ignore-listed hosts.
      let scan: ScanResult | null = null;
      if (isUrlFetchable(url)) {
        try {
          scan = await metadataApi.scan({
            url,
            siteName: websiteSiteName.trim() || undefined,
            resolveRedirect: !isRedirectIgnored(url, redirectIgnoreList ?? []),
          });
        }
        catch {
          scan = null;
        }
      }

      let finalUrl = url;
      if (scan) {
        if (scan.resolveError) setUrlResolveError(scan.resolveError);
        if (scan.redirected) {
          form.setFieldValue("url", scan.finalUrl);
          setUrlCleanup({
            original: urlBeforeCleanup,
            cleaned: scan.finalUrl,
            applied: true,
          });
          finalUrl = scan.finalUrl;
        }
      }

      prefill.runAutofill();
      runWebsiteLookup(finalUrl);
      urlDuplicateCheck.mutate({
        url: finalUrl,
      }, {
        onSuccess: setUrlDuplicate,
      });
      ui.setDetectedContentKind(scan?.detectedContentKind ?? null);
      if (scan) {
        setImageCandidates(scan.imageCandidates);
        if (scan.imageCandidates.length > 0) autofilled.markAutofilledField("image");
        if (scan.isbn) {
          await handleAmazonIsbnDetected(scan.isbn);
        }
        // Pre-select the matching built-in Media Type when the field is still empty (mirrors the
        // ISBN→Book default), so the detected content kind is actionable, not just informational.
        // Skipped when the website carries its own default media type — that default should win, as it
        // does server-side (user-provided > website default > detection), and pre-filling would clobber it.
        if (scan.detectedContentKind && !scan.website.mediaTypeId) {
          applyDetectedMediaType(scan.detectedContentKind);
        }
        await applyScanMetadata(finalUrl, scan, {
          fillTitle,
          force: false,
        });
      }
      if (revealing) setScanned(true);
    }
    finally {
      setIsScanning(false);
    }
  }

  // "Add Now" quick path: apply autofill rules and save immediately. Ensures a title (falling back to
  // the URL's host) and saves the URL exactly as typed — no metadata fetch, no shortened-link
  // expansion (the submit handler honours `quickAddRef`).
  async function handleAddNow(): Promise<void> {
    prefill.runAutofill();
    if (form.getFieldValue("title").trim() === "") {
      const url = form.getFieldValue("url");
      let fallback = url;
      try {
        fallback = new URL(url).hostname;
      }
      catch {
        // Not a parseable URL — leave the raw value as the fallback title.
      }
      form.setFieldValue("title", fallback);
    }
    quickAddRef.current = true;
    try {
      await form.handleSubmit();
    }
    finally {
      quickAddRef.current = false;
    }
  }

  async function handleAddOfflineBookmark(): Promise<void> {
    const title = form.getFieldValue("url").trim();
    form.setFieldValue("url", "");
    form.setFieldValue("title", title);
    const bookMediaType = mediaTypes?.find(mt => mt.name === "Book");
    if (bookMediaType) {
      form.setFieldValue("mediaTypeId", bookMediaType.id);
    }
    // The typed text became the name, so hide the separate Name field for this entry.
    setHideNameField(true);
    setScanned(true);
  }

  // Pre-scan, the only field is the URL input: Enter runs the appropriate action rather than
  // submitting (the empty title would otherwise fail validation and the submit would no-op).
  // ISBNs route to the ISBN lookup path; everything else runs the URL scan.
  function makeHandleUrlKeyDown(handleLookupIsbn: () => void) {
    return function handleUrlKeyDown(event: KeyboardEvent<HTMLFormElement>): void {
      if (event.key === "Enter" && !scanned && !ui.isScanning) {
        event.preventDefault();
        if (inputType === "isbn") {
          handleLookupIsbn();
        }
        else {
          void performUrlScan({
            revealing: true,
          });
        }
      }
    };
  }

  // Re-scan on edit (or after the form is revealed) when the URL changes; a fresh create form waits
  // for the explicit "Check URL" action instead.
  function handleUrlBlur(): void {
    if (scanned) void performUrlScan({
      revealing: false,
    });
  }

  // Manual fetch-title button: YouTube gets its title from enrichment, so skip the strict fetch for it.
  function handleFetchTitleClick(url: string): void {
    const yt = looksLikeYouTube(url);
    if (!yt) {
      void runFetchTitle(url, {
        force: true,
      });
    }
    void runYouTubeEnrichment(url, {
      fillTitle: true,
      force: true,
    });
  }

  return {
    rawUrl,
    inputType,
    isOfflineMode,
    // Scan handlers (re-exposed for the form JSX).
    runFetchTitle,
    runFetchDescription,
    runYouTubeEnrichment,
    undoUrlCleanup,
    undoTitleFetch,
    createPersonFromSocialAccount,
    // Action handlers.
    submitForm,
    performUrlScan,
    handleAddNow,
    handleAddOfflineBookmark,
    handleReset,
    makeHandleUrlKeyDown,
    handleUrlBlur,
    handleFetchTitleClick,
  };
}
