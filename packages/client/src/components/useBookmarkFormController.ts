import type {
  Bookmark,
  CreateBookmarkInput,
  ScanResult,
} from "@eesimple/types";
import type { KeyboardEvent } from "react";

import { useStore } from "@tanstack/react-form";
import { useNavigate } from "@tanstack/react-router";

import {
  bookmarkSchema,
  buildAllPropertyValues,
  buildBookmarkDefaultValues,
  detectBookmarkInputType,
  looksLikeYouTube,
} from "./bookmarkFormSchema";
import { applyImageIntent, promoteSourceDefaults } from "./bookmarkSubmit";
import { useBookmarkFormChannel } from "./useBookmarkFormChannel";
import { useBookmarkFormData } from "./useBookmarkFormData";
import { useBookmarkFormImageState } from "./useBookmarkFormImageState";
import { useBookmarkFormUiState, useSourceDefaultFlags } from "./useBookmarkFormState";
import { useBookmarkIsbn } from "./useBookmarkIsbn";
import { useBookmarkPropertyPrefill } from "./useBookmarkPropertyPrefill";
import { useBookmarkScanHandlers } from "./useBookmarkScanHandlers";
import { useBookmarkUrlProcessing } from "./useBookmarkUrlProcessing";
import { metadataApi } from "../lib/api/metadata";
import { useAppForm } from "../lib/form";
import { notifySuccess } from "../lib/notifications";

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

export interface BookmarkFormProps {
  /** When provided, the form edits this bookmark instead of creating a new one. */
  bookmark?: Bookmark;
  /** Called after a successful edit (or on cancel) so the parent can close the form. */
  onDone?: () => void;
  /**
   * When set, the new bookmark is locked to this category and the Category picker is hidden —
   * used on category pages, where the category is implied by the route.
   */
  lockedCategoryId?: string;
  /** Create-mode seed for the URL field (e.g. from the quick-add popup). Ignored on edit. */
  initialUrl?: string;
  /** Create-mode seed for the Title field (e.g. from the quick-add popup). Ignored on edit. */
  initialTitle?: string;
  /** Called with the freshly created bookmark after a successful create (e.g. to close the popup). */
  onCreated?: (bookmark: Bookmark) => void;
}

/**
 * The full controller for `BookmarkForm`: owns the form instance, every piece of UI state, the
 * composed data/url/prefill/scan hooks, and all the create/edit/scan/reset handlers. `BookmarkForm`
 * itself is then just the JSX wiring. The transient UI state and the "set as default" flags live in
 * cohesive sub-hooks (`useBookmarkFormUiState` / `useSourceDefaultFlags`), and the two heaviest,
 * self-contained save pieces live in `bookmarkSubmit.ts`, so each function stays within the
 * complexity cap.
 */
export function useBookmarkFormController({
  bookmark, onDone, lockedCategoryId, initialUrl, initialTitle, onCreated,
}: BookmarkFormProps = {}) {
  const isEdit = Boolean(bookmark);
  const navigate = useNavigate();
  const {
    actions: {
      createBookmark,
      updateBookmark,
      uploadImage,
      autoImage,
      deleteImage,
      fetchTitle,
      fetchMetadata,
      websiteLookup,
      urlDuplicateCheck,
      updateWebsite,
      updateYouTubeChannel,
      createAuthor,
      createPublisher,
    },
    websites,
    shortenerIgnoreList,
    customStripParams,
    redirectIgnoreList,
    tagTree,
    customProperties,
    categories,
    mediaTypes,
    autofillRules,
    youtubeChannels,
    authors,
    publishers,
    autoFetchTitle,
    autoFetchImage,
  } = useBookmarkFormData();
  const saveBookmark = isEdit ? updateBookmark : createBookmark;

  const flags = useSourceDefaultFlags();
  const ui = useBookmarkFormUiState({
    initialScanned: isEdit,
    fetchTitlePending: fetchTitle.isPending,
  });
  const {
    websiteSiteName,
    setTitleFetch,
    titleFetch,
    scanned,
    setScanned,
    setIsScanning,
    setUrlDuplicate,
    setUrlResolveError,
    hideNameField,
    setHideNameField,
  } = ui;

  // YouTube channel state, isNewChannel, sourceDefaults, and handleChannelSelfIdsChange.
  const channel = useBookmarkFormChannel({
    youtubeChannels,
    websiteLookup,
    flags,
  });
  const {
    channelHintRef,
    youtubeChannel,
    setYoutubeChannel,
    isNewChannel,
    sourceDefaults,
    handleChannelSelfIdsChange,
  } = channel;

  // All URL-string handling (on-blur cleanup, shortener classification, submit-URL resolution) plus the
  // canonicalize-input refs live in this hook so the form imports one URL module.
  const {
    urlShortener,
    setUrlShortener,
    urlCleanup,
    setUrlCleanup,
    showUrlCleanup,
    setShowUrlCleanup,
    urlCleanupMode,
    setUrlCleanupMode,
    cleanupId,
    isUrlFetchable,
    runUrlCleanup: cleanUrl,
    undoUrlCleanup: undoCleanup,
    classifyUrlShortener,
    resolveSubmitUrl,
  } = useBookmarkUrlProcessing({
    websites: websites ?? [],
    ignoreList: shortenerIgnoreList ?? [],
    customStripParams: customStripParams ?? [],
  });

  // Image intent + quickAdd ref state.
  const imageState = useBookmarkFormImageState({
    isEdit,
    autoFetchImage,
  });
  const {
    imageIntentRef, imageFieldKey, quickAddRef,
  } = imageState;

  const form = useAppForm({
    defaultValues: buildBookmarkDefaultValues(bookmark, lockedCategoryId, {
      url: initialUrl,
      title: initialTitle,
    }),
    validators: {
      onChange: bookmarkSchema,
    },
    onSubmit: ({
      value,
    }) => void submitForm(value),
  });

  const rawUrl = useStore(form.store, s => s.values.url);
  // What the primary input holds: a URL (the normal flow), an ISBN, or plain text (offline). Drives
  // the live hint + the pre-scan action button. `isOfflineMode` keeps its meaning (plain text only).
  const inputType = detectBookmarkInputType(rawUrl);
  const isOfflineMode = inputType === "text";

  // Persist the form: build the property values + input, then create or update. On create, also
  // promote category/tags to website/channel defaults (when opted in) and offer the category-edit
  // shortcut. Declared as a hoisted function so the `onSubmit` config above can reference it while
  // it still closes over `prefill`/`handleReset` defined below.
  async function submitForm(value: {
    url: string;
    title: string;
    romanizedTitle: string;
    categoryId: string;
    mediaTypeId: string;
    description: string;
    tagIds: string[];
    locationIds: string[];
    authorIds: string[];
    publisherId: string;
  }): Promise<void> {
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
      romanizedTitle: value.romanizedTitle.trim() || null,
      categoryId: value.categoryId,
      mediaTypeId: value.mediaTypeId || null,
      description: value.description || null,
      tagIds: value.tagIds,
      locationIds: value.locationIds,
      authorIds: value.authorIds,
      publisherId: form.getFieldValue("publisherId") || null,
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
        uploadImage,
        autoImage,
        deleteImage,
      });
      onDone?.();
      return;
    }

    const trimmedSiteName = websiteSiteName.trim();
    const created = await createBookmark.mutateAsync({
      ...input,
      ...(trimmedSiteName && {
        websiteSiteName: trimmedSiteName,
      }),
    });
    await applyImageIntent(created.id, finalUrl ?? "", imageIntentRef.current, {
      uploadImage,
      autoImage,
      deleteImage,
    });

    promoteSourceDefaults(created, value.categoryId, value.mediaTypeId, value.tagIds, {
      setWebsiteCategory: flags.setWebsiteCategory,
      setWebsiteTags: flags.setWebsiteTags,
      setWebsiteMediaType: flags.setWebsiteMediaType,
      setChannelCategory: flags.setChannelCategory,
      setChannelTags: flags.setChannelTags,
      setChannelMediaType: flags.setChannelMediaType,
    }, {
      updateWebsite,
      updateYouTubeChannel,
    });

    // Offer a shortcut to refine the chosen category right after saving.
    const categorySlug = (categories ?? []).find(category => category.id === value.categoryId)?.slug;
    notifySuccess("Bookmark added", categorySlug
      ? {
        action: {
          label: "Edit category",
          onClick: () => void navigate({
            to: "/categories/$categorySlug/edit/general",
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

  // Custom-property prefill: the dynamic number/boolean/datetime inputs plus the autofill-rule and
  // category-default precedence machinery. Owns its own state/refs; the submit handler reads the
  // mirrored `customRef`.
  const prefill = useBookmarkPropertyPrefill({
    bookmark,
    form,
    autofillRules,
    categories,
  });

  function handleReset(): void {
    form.reset();
    prefill.resetPrefill();
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
  }

  // ISBN lookup: fetch + populate + lookup-isbn path.
  const isbn = useBookmarkIsbn({
    form,
    customProperties,
    mediaTypes,
    authors,
    publishers,
    createAuthor,
    createPublisher,
    handleTextChange: prefill.handleTextChange,
    setHideNameField,
    setScanned,
  });
  const {
    isbnFetch, handleIsbnFetch, handleLookupIsbn,
  } = isbn;

  const {
    runFetchTitle,
    runFetchDescription,
    runYouTubeEnrichment,
    applyScanMetadata,
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
    authors,
    getAuthorIds: () => form.getFieldValue("authorIds") as string[],
    setAuthorIds: (ids: string[]) => form.setFieldValue("authorIds", ids),
    createAuthor,
  });

  // The full URL scan: clean the URL, then make a single consolidated `/api/scan` round-trip that
  // resolves redirects and fetches the page metadata once (title/description/authors, plus
  // YouTube/oEmbed enrichment). Autofill, the website lookup, and the duplicate check run alongside.
  // `revealing` is the explicit "Check URL" action — it always fills the title and reveals the rest
  // of the form; on later blurs the title fill honours the autoFetchTitle setting.
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
      urlDuplicateCheck.mutate(finalUrl, {
        onSuccess: setUrlDuplicate,
      });
      if (scan) {
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
  function handleUrlKeyDown(event: KeyboardEvent<HTMLFormElement>): void {
    if (event.key === "Enter" && !scanned && !ui.isScanning) {
      event.preventDefault();
      if (inputType === "isbn") {
        void handleLookupIsbn();
      }
      else {
        void performUrlScan({
          revealing: true,
        });
      }
    }
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
    form,
    isEdit,
    isOfflineMode,
    inputType,
    hideNameField,
    isNewChannel,
    scanned,
    isScanning: ui.isScanning,
    lockedCategoryId,
    bookmark,
    // Data (still possibly undefined — the JSX defaults to []).
    websites,
    shortenerIgnoreList,
    customStripParams,
    tagTree,
    customProperties,
    categories,
    mediaTypes,
    authors,
    websiteLookup,
    autoFetchImage,
    // URL cleanup.
    urlCleanup,
    urlShortener,
    showUrlCleanup,
    setShowUrlCleanup,
    cleanupId,
    urlCleanupMode,
    setUrlCleanupMode,
    // Channel + site name.
    youtubeChannel,
    websiteSiteName,
    setWebsiteSiteName: ui.setWebsiteSiteName,
    // Title / metadata.
    fetchTitle,
    fetchMetadata,
    titleFetch,
    setTitleFetch,
    isReportingTitle: ui.isReportingTitle,
    setIsReportingTitle: ui.setIsReportingTitle,
    expectedTitle: ui.expectedTitle,
    setExpectedTitle: ui.setExpectedTitle,
    // Category.
    addCategoryOpen: ui.addCategoryOpen,
    setAddCategoryOpen: ui.setAddCategoryOpen,
    // Media type.
    addMediaTypeOpen: ui.addMediaTypeOpen,
    setAddMediaTypeOpen: ui.setAddMediaTypeOpen,
    // Publisher.
    publishers,
    addPublisherOpen: ui.addPublisherOpen,
    setAddPublisherOpen: ui.setAddPublisherOpen,
    // Image.
    imageFieldKey,
    imageIntentRef,
    // Banners.
    urlDuplicate: ui.urlDuplicate,
    urlResolveError: ui.urlResolveError,
    autofillOfferDismissed: ui.autofillOfferDismissed,
    setAutofillOfferDismissed: ui.setAutofillOfferDismissed,
    // "Set as default" context for the source-default checkboxes (rendered under their fields).
    sourceDefaults,
    // Prefill + scan handlers.
    prefill,
    runFetchTitle,
    runFetchDescription,
    runYouTubeEnrichment,
    undoUrlCleanup,
    undoTitleFetch,
    // ISBN metadata fetch.
    isbnFetch,
    handleIsbnFetch,
    handleLookupIsbn,
    // Save mutation (footer state).
    saveBookmark,
    onDone,
    // Handlers.
    submitForm,
    performUrlScan,
    handleAddNow,
    handleAddOfflineBookmark,
    handleReset,
    handleUrlKeyDown,
    handleUrlBlur,
    handleChannelSelfIdsChange,
    handleFetchTitleClick,
    handleCancelReporting: ui.handleCancelReporting,
  };
}
