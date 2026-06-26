import type { Bookmark, BookmarkUrlDuplicateResult, YouTubeChannelHint } from "@eesimple/types";

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
    },
    websites,
    shortenerIgnoreList,
    customStripParams,
    tagTree,
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
  const touchedRef = useRef<Set<string>>(new Set());

  const form = useAppForm({
    defaultValues: {
      url: bookmark.originalUrl ?? bookmark.url ?? "",
      title: bookmark.title,
      categoryId: bookmark.categoryId ?? "",
      mediaTypeId: bookmark.mediaType?.id ?? "",
      description: bookmark.description ?? "",
      tagIds: (bookmark.tags.map(tag => tag.id)) as string[],
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
          categoryId: value.categoryId,
          mediaTypeId: value.mediaTypeId || null,
          description: value.description || null,
          tagIds: value.tagIds,
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
  }

  const {
    runFetchTitle,
    runFetchDescription,
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

  return {
    form,
    bookmark,
    // data
    websites,
    shortenerIgnoreList,
    customStripParams,
    tagTree,
    categories,
    mediaTypes,
    authors,
    publishers,
    updateBookmark,
    ...modals,
    saveTags,
    saveAuthors,
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
    touchedRef,
    // handlers
    runAutofill,
    performUrlScan,
    runFetchTitle,
    runFetchDescription,
    runYouTubeEnrichment,
    undoUrlCleanup,
    undoTitleFetch,
  };
}
