import type { Bookmark, BookmarkUrlDuplicateResult, PlexItemResult, ScanResult, SocialAccountRef, YouTubeChannelHint } from "@eesimple/types";

import { useRef, useState } from "react";

import {
  bookmarkSchema,
  computeAutofill,
  looksLikeYouTube,
} from "./bookmarkFormSchema";
import { useBookmarkFormData } from "./useBookmarkFormData";
import { useBookmarkInlineCreateModals } from "./useBookmarkInlineCreateModals";
import { useBookmarkScanHandlers } from "./useBookmarkScanHandlers";
import { useBookmarkUrlProcessing } from "./useBookmarkUrlProcessing";
import { metadataApi } from "../lib/api/metadata";
import { describeError } from "../lib/apiError";
import { notifyFieldSaved, notifyFieldSaveError } from "../lib/autoSave";
import { useAppForm } from "../lib/form";
import { notifySuccess } from "../lib/notifications";

/**
 * Owns every stateful piece of the bookmark General (edit) form: the read-only data, the
 * url-processing and scan-handler bundles, the local UI state (title-fetch feedback, website
 * lookup, channel hint, duplicate warning, inline-create modal), the form instance, and the
 * autofill / url-scan orchestration the URL field's blur triggers. Returns one bag so
 * `BookmarkGeneralForm` stays a presentational shell, mirroring `useBookmarkPropertyPrefill`.
 */
export function useBookmarkGeneralForm(bookmark: Bookmark) {
  const {
    actions: {
      updateBookmark,
      fetchTitle,
      fetchMetadata,
      websiteLookup,
      urlDuplicateCheck,
      createAuthor,
      updateAuthor,
      autoAuthorImage,
    },
    websites,
    shortenerIgnoreList,
    customStripParams,
    tagTree,
    locationTree,
    categories,
    mediaTypes,
    autofillRules,
    autoFetchTitle,
    authors,
    publishers,
  } = useBookmarkFormData();

  const {
    urlShortener,
    urlCleanup,
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

  const modals = useBookmarkInlineCreateModals();
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

  const form = useAppForm({
    defaultValues: {
      url: bookmark.originalUrl ?? bookmark.url ?? "",
      title: bookmark.title,
      romanizedTitle: bookmark.romanizedTitle ?? "",
      categoryId: bookmark.categoryId ?? "",
      mediaTypeId: bookmark.mediaType?.id ?? "",
      description: bookmark.description ?? "",
      tagIds: (bookmark.tags.map(tag => tag.id)) as string[],
      locationIds: (bookmark.locations.map(location => location.id)) as string[],
      blacklistedTagIds: bookmark.blacklistedTagIds as string[],
      blacklistedLocationIds: bookmark.blacklistedLocationIds as string[],
      authorIds: (bookmark.authors.map(a => a.id)) as string[],
      publisherId: bookmark.publisher?.id ?? "",
    },
    validators: {
      onChange: bookmarkSchema,
    },
    onSubmit: async ({
      value,
    }) => {
      const {
        finalUrl, originalUrl,
      } = resolveSubmitUrl(value.url, false);

      await updateBookmark.mutateAsync({
        id: bookmark.id,
        input: {
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
          publisherId: value.publisherId || null,
          ...(channelHintRef.current && {
            youtubeChannel: channelHintRef.current,
          }),
        },
      });
      notifySuccess("Changes saved");
    },
  });

  function saveTags(tagIds: string[]): void {
    updateBookmark.mutate(
      {
        id: bookmark.id,
        input: {
          tagIds,
        },
      },
      {
        onSuccess: () => notifyFieldSaved("Tags"),
        onError: e => notifyFieldSaveError("Tags", describeError(e)),
      },
    );
  }

  function saveLocations(locationIds: string[]): void {
    updateBookmark.mutate(
      {
        id: bookmark.id,
        input: {
          locationIds,
        },
      },
      {
        onSuccess: () => notifyFieldSaved("Locations"),
        onError: e => notifyFieldSaveError("Locations", describeError(e)),
      },
    );
  }

  function saveBlacklistedTagIds(blacklistedTagIds: string[]): void {
    updateBookmark.mutate(
      {
        id: bookmark.id,
        input: {
          blacklistedTagIds,
        },
      },
      {
        onSuccess: () => notifyFieldSaved("Tag blacklist"),
        onError: e => notifyFieldSaveError("Tag blacklist", describeError(e)),
      },
    );
  }

  function saveBlacklistedLocationIds(blacklistedLocationIds: string[]): void {
    updateBookmark.mutate(
      {
        id: bookmark.id,
        input: {
          blacklistedLocationIds,
        },
      },
      {
        onSuccess: () => notifyFieldSaved("Location blacklist"),
        onError: e => notifyFieldSaveError("Location blacklist", describeError(e)),
      },
    );
  }

  function saveAuthors(authorIds: string[]): void {
    updateBookmark.mutate(
      {
        id: bookmark.id,
        input: {
          authorIds,
        },
      },
      {
        onSuccess: () => notifyFieldSaved("Authors"),
        onError: e => notifyFieldSaveError("Authors", describeError(e)),
      },
    );
  }

  // The Book link lives outside the zod form state (immediate-save, like tags/authors), so the
  // tab's Save-changes submit never touches it. Book selection now flows through the Books taxonomy
  // (bookId) instead of a direct Kavita series link; cover/ToC resolve the series id from the Book.
  function saveBook(bookId: string | null): void {
    updateBookmark.mutate(
      {
        id: bookmark.id,
        input: {
          bookId,
        },
      },
      {
        onSuccess: () => notifyFieldSaved("Book"),
        onError: e => notifyFieldSaveError("Book", describeError(e)),
      },
    );
  }

  // The Plex link also lives outside the zod form state (immediate-save, like the Kavita link).
  function savePlexItem(selection: PlexItemResult | null): void {
    updateBookmark.mutate(
      {
        id: bookmark.id,
        input: {
          plexRatingKey: selection?.ratingKey ?? null,
          plexItemType: selection?.type ?? null,
          plexItemTitle: selection?.title ?? null,
        },
      },
      {
        onSuccess: () => notifyFieldSaved("Plex item"),
        onError: e => notifyFieldSaveError("Plex item", describeError(e)),
      },
    );
  }

  function runAutofill(): void {
    const url = form.getFieldValue("url");
    const title = form.getFieldValue("title");
    if (!url && !title) return;

    const result = computeAutofill({
      url,
      title,
    }, autofillRules ?? []);

    if (result.categoryId) {
      if (!touchedRef.current.has("categoryId")) {
        form.setFieldValue("categoryId", result.categoryId);
      }
    }

    if (result.tagIds.length > 0 && !touchedRef.current.has("tags")) {
      const current = form.getFieldValue("tagIds");
      form.setFieldValue("tagIds", [...new Set([...current, ...result.tagIds])]);
    }

    if (result.locationIds.length > 0 && !touchedRef.current.has("locations")) {
      const current = form.getFieldValue("locationIds");
      form.setFieldValue("locationIds", [...new Set([...current, ...result.locationIds])]);
    }
  }

  const {
    runFetchTitle,
    runFetchDescription,
    runYouTubeEnrichment,
    applyScanMetadata,
    createAuthorFromSocialAccount,
    reconcileSocialAccountOnEdit,
    runUrlCleanup,
    undoUrlCleanup,
    undoTitleFetch,
    runWebsiteLookup,
  } = useBookmarkScanHandlers({
    form,
    channelHintRef,
    setYoutubeChannel,
    websiteSiteName,
    setWebsiteSiteName,
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
    updateAuthor,
    autoAuthorImage,
    setSocialAccountOffer,
  });

  async function performUrlScan(): Promise<void> {
    runUrlCleanup(form.getFieldValue("url"));
    const url = form.getFieldValue("url");
    runAutofill();
    runWebsiteLookup(url);
    urlDuplicateCheck.mutate(url, {
      onSuccess: setUrlDuplicate,
    });
    const yt = looksLikeYouTube(url);
    if (autoFetchTitle && !yt) {
      await runFetchTitle(url, {
        force: false,
      });
    }
    await runYouTubeEnrichment(url, {
      fillTitle: autoFetchTitle,
      force: false,
    });
  }

  // Manual "Rescan" action: re-runs the consolidated `/api/scan` pipeline against the bookmark's
  // current URL to backfill missing data (title/description fill only when blank; authors are
  // matched/linked by name and by detected social-media profile, never displacing what's already
  // set). Unlike `performUrlScan` (which runs automatically on URL blur for lightweight enrichment),
  // this is explicit and reports its outcome via toast since it's outside the per-field auto-save flow.
  async function runRescan(): Promise<void> {
    const url = form.getFieldValue("url");
    if (!isUrlFetchable(url)) return;
    setIsRescanning(true);
    try {
      let scan: ScanResult | null = null;
      try {
        scan = await metadataApi.scan({
          url,
          siteName: websiteSiteName.trim() || undefined,
        });
      }
      catch (error) {
        notifyFieldSaveError("Rescan", describeError(error));
        return;
      }
      const authorIdsBefore = form.getFieldValue("authorIds") as string[];
      await applyScanMetadata(url, scan, {
        fillTitle: true,
        force: false,
      });
      await reconcileSocialAccountOnEdit(scan.socialAccount, form.getFieldValue("authorIds") as string[]);
      const authorsChanged = (form.getFieldValue("authorIds") as string[]).length !== authorIdsBefore.length;
      notifySuccess(authorsChanged ? "Rescanned — author linked" : "Rescanned");
    }
    finally {
      setIsRescanning(false);
    }
  }

  return {
    form,
    bookmark,
    // data
    websites,
    shortenerIgnoreList,
    customStripParams,
    tagTree,
    locationTree,
    categories,
    mediaTypes,
    authors,
    publishers,
    updateBookmark,
    ...modals,
    saveTags,
    saveLocations,
    saveBlacklistedTagIds,
    saveBlacklistedLocationIds,
    saveAuthors,
    saveBook,
    savePlexItem,
    fetchTitle,
    fetchMetadata,
    websiteLookup,
    // url cleanup
    urlShortener,
    urlCleanup,
    showUrlCleanup,
    setShowUrlCleanup,
    urlCleanupMode,
    setUrlCleanupMode,
    cleanupId,
    // website lookup / channel
    channelHintRef,
    youtubeChannel,
    setYoutubeChannel,
    websiteSiteName,
    setWebsiteSiteName,
    // title fetch feedback
    isReportingTitle,
    setIsReportingTitle,
    expectedTitle,
    setExpectedTitle,
    titleFetch,
    setTitleFetch,
    // misc UI state
    urlDuplicate,
    autofillOfferDismissed,
    setAutofillOfferDismissed,
    socialAccountOffer,
    setSocialAccountOffer,
    touchedRef,
    // handlers
    runAutofill,
    performUrlScan,
    runFetchTitle,
    runFetchDescription,
    runYouTubeEnrichment,
    undoUrlCleanup,
    undoTitleFetch,
    runRescan,
    isRescanning,
    createAuthorFromSocialAccount,
  };
}
