import type { Bookmark } from "@eesimple/types";

import {
  bookmarkSchema,
  buildBookmarkDefaultValues,
} from "./bookmarkFormSchema";
import { useBookmarkFormChannel } from "./useBookmarkFormChannel";
import { useBookmarkFormData } from "./useBookmarkFormData";
import { useBookmarkFormHandlers } from "./useBookmarkFormHandlers";
import { useBookmarkFormImageState } from "./useBookmarkFormImageState";
import { useBookmarkFormUiState, useSourceDefaultFlags } from "./useBookmarkFormState";
import { useBookmarkIsbn } from "./useBookmarkIsbn";
import { useBookmarkPropertyPrefill } from "./useBookmarkPropertyPrefill";
import { useBookmarkUrlProcessing } from "./useBookmarkUrlProcessing";
import { useAppForm } from "../lib/form";

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
  const data = useBookmarkFormData();
  const {
    actions: {
      createBookmark,
      updateBookmark,
      fetchTitle,
      fetchMetadata,
      websiteLookup,
      createAuthor,
      createPublisher,
    },
    websites,
    shortenerIgnoreList,
    customStripParams,
    tagTree,
    customProperties,
    categories,
    mediaTypes,
    autofillRules,
    youtubeChannels,
    authors,
    publishers,
    autoFetchImage,
  } = data;
  const saveBookmark = isEdit ? updateBookmark : createBookmark;

  const flags = useSourceDefaultFlags();
  const ui = useBookmarkFormUiState({
    initialScanned: isEdit,
    fetchTitlePending: fetchTitle.isPending,
  });
  const {
    websiteSiteName,
    scanned,
    hideNameField,
    setHideNameField,
    setScanned,
  } = ui;

  // YouTube channel state, isNewChannel, sourceDefaults, and handleChannelSelfIdsChange.
  const channel = useBookmarkFormChannel({
    youtubeChannels,
    websiteLookup,
    flags,
  });
  const {
    youtubeChannel,
    isNewChannel,
    sourceDefaults,
    handleChannelSelfIdsChange,
  } = channel;

  // All URL-string handling (on-blur cleanup, shortener classification, submit-URL resolution) plus the
  // canonicalize-input refs live in this hook so the form imports one URL module.
  const urlProcessing = useBookmarkUrlProcessing({
    websites: websites ?? [],
    ignoreList: shortenerIgnoreList ?? [],
    customStripParams: customStripParams ?? [],
  });
  const {
    urlShortener,
    urlCleanup,
    showUrlCleanup,
    setShowUrlCleanup,
    urlCleanupMode,
    setUrlCleanupMode,
    cleanupId,
  } = urlProcessing;

  // Image intent + quickAdd ref state.
  const imageState = useBookmarkFormImageState({
    isEdit,
    autoFetchImage,
  });
  const {
    imageIntentRef, imageFieldKey, imageCandidates, setImageCandidates,
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
    }) => void handlers.submitForm(value),
  });

  // Persist the form: build the property values + input, then create or update. On create, also
  // promote category/tags to website/channel defaults (when opted in) and offer the category-edit
  // shortcut. Declared as a hoisted function so the `onSubmit` config above can reference it while
  // it still closes over `prefill`/`handleReset` defined below.
  // Custom-property prefill: the dynamic number/boolean/datetime inputs plus the autofill-rule and
  // category-default precedence machinery. Owns its own state/refs; the submit handler reads the
  // mirrored `customRef`.
  const prefill = useBookmarkPropertyPrefill({
    bookmark,
    form,
    autofillRules,
    categories,
  });

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
    setImageCandidates,
  });
  const {
    isbnFetch, handleIsbnFetch, handleLookupIsbn,
  } = isbn;

  // The create/edit/scan/reset handlers plus the scan-handler composition and the URL input-type
  // derivation. Extracted into `useBookmarkFormHandlers` so this controller stays a thin coordinator;
  // the form's `onSubmit` above is wired to `handlers.submitForm` (safe because it only runs after
  // this hook has initialized).
  const handlers = useBookmarkFormHandlers({
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
  });
  const {
    isOfflineMode,
    inputType,
    runFetchTitle,
    runFetchDescription,
    runYouTubeEnrichment,
    undoUrlCleanup,
    undoTitleFetch,
    createAuthorFromSocialAccount,
    submitForm,
    performUrlScan,
    handleAddNow,
    handleAddOfflineBookmark,
    handleReset,
    handleUrlBlur,
    handleFetchTitleClick,
  } = handlers;

  // Pre-scan, the only field is the URL input: Enter runs the appropriate action (ISBN lookup vs URL
  // scan). Assembled here because the keydown handler needs the ISBN hook's `handleLookupIsbn`.
  const handleUrlKeyDown = handlers.makeHandleUrlKeyDown(() => void handleLookupIsbn());

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
    titleFetch: ui.titleFetch,
    setTitleFetch: ui.setTitleFetch,
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
    imageCandidates,
    // Banners.
    urlDuplicate: ui.urlDuplicate,
    urlResolveError: ui.urlResolveError,
    autofillOfferDismissed: ui.autofillOfferDismissed,
    setAutofillOfferDismissed: ui.setAutofillOfferDismissed,
    // Social-account → author offer.
    socialAccountOffer: ui.socialAccountOffer,
    setSocialAccountOffer: ui.setSocialAccountOffer,
    createAuthorFromSocialAccount,
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
