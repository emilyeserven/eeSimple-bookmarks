import type { ImageIntent } from "./bookmarkImageIntent";
import type {
  Bookmark,
  CreateBookmarkInput,
  YouTubeChannelHint,
} from "@eesimple/types";
import type { KeyboardEvent } from "react";

import { useRef, useState } from "react";

import { useNavigate } from "@tanstack/react-router";

import {
  bookmarkSchema,
  buildBookmarkDefaultValues,
  buildCategoryPropertyValues,
  initialImageIntent,
  looksLikeYouTube,
} from "./bookmarkFormSchema";
import { applyImageIntent, promoteSourceDefaults } from "./bookmarkSubmit";
import { useBookmarkFormData } from "./useBookmarkFormData";
import { useBookmarkFormUiState, useSourceDefaultFlags } from "./useBookmarkFormState";
import { useBookmarkPropertyPrefill } from "./useBookmarkPropertyPrefill";
import { useBookmarkScanHandlers } from "./useBookmarkScanHandlers";
import { useBookmarkUrlProcessing } from "./useBookmarkUrlProcessing";
import { useAppForm } from "../lib/form";
import { notifySuccess } from "../lib/notifications";

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
    },
    websites,
    shortenerIgnoreList,
    tagTree,
    customProperties,
    categories,
    mediaTypes,
    autofillRules,
    youtubeChannels,
    authors,
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
  } = ui;

  // The channel resolved from a fetched YouTube video, passed on save so the server links/creates it.
  // The ref is read by the submit handler (stale-closure-safe); the state drives the banner display.
  const channelHintRef = useRef<YouTubeChannelHint | null>(null);
  const [youtubeChannel, setYoutubeChannel] = useState<YouTubeChannelHint | null>(null);
  // True when the detected channel isn't in the existing channels list yet — shows "set defaults" checkboxes.
  const isNewChannel = youtubeChannel !== null
    && youtubeChannels !== undefined
    && !youtubeChannels.some(ch => ch.channelKey === youtubeChannel.key);

  // The bookmark's "source" whose defaults the form can promote: the detected YouTube channel for a
  // youtube.com URL, otherwise the looked-up website. The "set as default category/tags" checkboxes
  // (now rendered under their fields) show for a *new* source; the "set as default media type" one
  // shows whenever the source has *no* default media type yet (whether the source is new or not).
  const lookupData = websiteLookup.data;
  const isYouTube = lookupData?.domain === "youtube.com";
  const existingChannel = youtubeChannel
    ? youtubeChannels?.find(ch => ch.channelKey === youtubeChannel.key)
    : undefined;
  const sourceDefaults = isYouTube
    ? {
      label: youtubeChannel?.name ?? null,
      showSourceDefault: isNewChannel,
      showMediaTypeDefault: youtubeChannel !== null && !existingChannel?.mediaTypeId,
      setCategory: flags.setChannelCategory,
      setTags: flags.setChannelTags,
      setMediaType: flags.setChannelMediaType,
      onSetCategory: flags.setSetChannelCategory,
      onSetTags: flags.setSetChannelTags,
      onSetMediaType: flags.setSetChannelMediaType,
    }
    : {
      label: lookupData?.domain ?? null,
      showSourceDefault: Boolean(lookupData?.domain) && !lookupData?.exists,
      showMediaTypeDefault: Boolean(lookupData?.domain) && !lookupData?.mediaTypeId,
      setCategory: flags.setWebsiteCategory,
      setTags: flags.setWebsiteTags,
      setMediaType: flags.setWebsiteMediaType,
      onSetCategory: flags.setSetWebsiteCategory,
      onSetTags: flags.setSetWebsiteTags,
      onSetMediaType: flags.setSetWebsiteMediaType,
    };

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
  });

  // The image control reports its intent here; the form applies it after the bookmark is saved (so
  // it works for both create and edit). `imageFieldKey` remounts the field to clear it on reset.
  const imageIntentRef = useRef<ImageIntent>(
    initialImageIntent(!isEdit && autoFetchImage),
  );
  const [imageFieldKey, setImageFieldKey] = useState(0);

  // Set by the "Add Now" quick path so the submit handler saves the URL exactly as typed (no
  // shortened-link expansion). Read by the (stale) submit closure.
  const quickAddRef = useRef(false);

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

  // Persist the form: build the property values + input, then create or update. On create, also
  // promote category/tags to website/channel defaults (when opted in) and offer the category-edit
  // shortcut. Declared as a hoisted function so the `onSubmit` config above can reference it while
  // it still closes over `prefill`/`handleReset` defined below.
  async function submitForm(value: {
    url: string;
    title: string;
    categoryId: string;
    mediaTypeId: string;
    description: string;
    tagIds: string[];
    authorIds: string[];
  }): Promise<void> {
    const {
      numberValues, booleanValues, dateTimeValues,
    } = buildCategoryPropertyValues(
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
      authorIds: value.authorIds,
      numberValues,
      booleanValues,
      dateTimeValues,
      ...(channelHintRef.current && {
        youtubeChannel: channelHintRef.current,
      }),
    };

    if (bookmark) {
      await updateBookmark.mutateAsync({
        id: bookmark.id,
        input,
      });
      await applyImageIntent(bookmark.id, finalUrl, imageIntentRef.current, {
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
    await applyImageIntent(created.id, finalUrl, imageIntentRef.current, {
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
    channelHintRef.current = null;
    setYoutubeChannel(null);
    setUrlShortener({
      nudge: false,
      expandedUrl: null,
    });
    setUrlCleanup(null);
    imageIntentRef.current = initialImageIntent(autoFetchImage);
    setImageFieldKey(key => key + 1);
    setShowUrlCleanup(false);
    setUrlCleanupMode("none");
    flags.resetFlags();
    quickAddRef.current = false;
    ui.resetUiState();
  }

  const {
    runFetchTitle,
    runFetchDescription,
    runFetchAuthors,
    runYouTubeEnrichment,
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

  // The full URL scan: clean the URL, apply autofill rules, look up the website, and fetch the
  // title/metadata. `revealing` is the explicit "Check URL" action — it always attempts the title
  // fetch and reveals the rest of the form; on later blurs the title fetch honours the autoFetchTitle
  // setting.
  async function performUrlScan({
    revealing,
  }: { revealing: boolean }): Promise<void> {
    setIsScanning(true);
    try {
      runUrlCleanup(form.getFieldValue("url"));
      const url = form.getFieldValue("url");
      prefill.runAutofill();
      runWebsiteLookup(url);
      urlDuplicateCheck.mutate(url, {
        onSuccess: setUrlDuplicate,
      });
      const yt = looksLikeYouTube(url);
      const fillTitle = revealing || autoFetchTitle;
      // YouTube gets its title from enrichment; non-YouTube uses the strict fetch-title.
      // Author detection runs in parallel with the title fetch for non-YouTube URLs.
      if (fillTitle && !yt) {
        await Promise.all([
          runFetchTitle(url, {
            force: false,
          }),
          runFetchAuthors(url),
        ]);
      }
      await runYouTubeEnrichment(url, {
        fillTitle,
        force: false,
      });
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

  // Pre-scan, the only field is the URL input: Enter runs "Check URL" rather than submitting (the
  // empty title would otherwise fail validation and the submit would no-op).
  function handleUrlKeyDown(event: KeyboardEvent<HTMLFormElement>): void {
    if (event.key === "Enter" && !scanned && !ui.isScanning) {
      event.preventDefault();
      void performUrlScan({
        revealing: true,
      });
    }
  }

  // Re-scan on edit (or after the form is revealed) when the URL changes; a fresh create form waits
  // for the explicit "Check URL" action instead.
  function handleUrlBlur(): void {
    if (scanned) void performUrlScan({
      revealing: false,
    });
  }

  // Merge the user-entered self-ids into the resolved channel hint (mirroring ref + state).
  function handleChannelSelfIdsChange(ids: string[]): void {
    const updated = {
      ...(youtubeChannel ?? {
        key: "",
        name: "",
      }),
      selfIds: ids,
    };
    channelHintRef.current = updated;
    setYoutubeChannel(updated);
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
    isNewChannel,
    scanned,
    isScanning: ui.isScanning,
    lockedCategoryId,
    bookmark,
    // Data (still possibly undefined — the JSX defaults to []).
    websites,
    shortenerIgnoreList,
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
    // Image.
    imageFieldKey,
    imageIntentRef,
    // Banners.
    urlDuplicate: ui.urlDuplicate,
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
    // Save mutation (footer state).
    saveBookmark,
    onDone,
    // Handlers.
    submitForm,
    performUrlScan,
    handleAddNow,
    handleReset,
    handleUrlKeyDown,
    handleUrlBlur,
    handleChannelSelfIdsChange,
    handleFetchTitleClick,
    handleCancelReporting: ui.handleCancelReporting,
  };
}
