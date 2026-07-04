import type { MediaSelection } from "./useBookmarkMediaField";
import type { Bookmark, BookmarkUrlDuplicateResult, ScanResult, SocialAccountRef, YouTubeChannelHint } from "@eesimple/types";

import { useRef, useState } from "react";

import {
  bookmarkSchema,
  computeAutofill,
  looksLikeYouTube,
} from "./bookmarkFormSchema";
import { useBookmarkFormData } from "./useBookmarkFormData";
import { useBookmarkInlineCreateModals } from "./useBookmarkInlineCreateModals";
import { useBookmarkPrimaryLanguage } from "./useBookmarkPrimaryLanguage";
import { useBookmarkScanHandlers } from "./useBookmarkScanHandlers";
import { useBookmarkUrlProcessing } from "./useBookmarkUrlProcessing";
import { metadataApi } from "../lib/api/metadata";
import { describeError } from "../lib/apiError";
import { mergeAutofillIds } from "../lib/autofillPrefill";
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
      createPerson,
      updatePerson,
      autoPersonImage,
      createLanguage,
    },
    websites,
    shortenerIgnoreList,
    customStripParams,
    tagTree,
    locationTree,
    categories,
    mediaTypes,
    languages,
    availabilityLanguageLevels,
    autofillRules,
    autoFetchTitle,
    people,
    groups,
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

  const {
    primaryLanguageLevelId, hasPrimaryLanguageUsage, attachPrimaryLanguageUsage,
  } = useBookmarkPrimaryLanguage(bookmark, availabilityLanguageLevels);

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
      romanizedName: bookmark.romanizedName ?? "",
      categoryId: bookmark.categoryId ?? "",
      mediaTypeId: bookmark.mediaType?.id ?? "",
      description: bookmark.description ?? "",
      tagIds: (bookmark.tags.map(tag => tag.id)) as string[],
      genreMoodIds: (bookmark.genreMoods.map(entry => entry.id)) as string[],
      locationIds: (bookmark.locations.map(location => location.id)) as string[],
      blacklistedTagIds: bookmark.blacklistedTagIds as string[],
      blacklistedLocationIds: bookmark.blacklistedLocationIds as string[],
      personIds: (bookmark.people.map(a => a.id)) as string[],
      groupIds: (bookmark.groups.map(g => g.id)) as string[],
      groupId: bookmark.group?.id ?? "",
      bookId: bookmark.bookId ?? "",
      movieId: bookmark.movieId ?? "",
      tvShowId: bookmark.tvShowId ?? "",
      episodeId: bookmark.episodeId ?? "",
      albumId: bookmark.albumId ?? "",
      trackId: bookmark.trackId ?? "",
      podcastId: bookmark.podcastId ?? "",
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
          romanizedName: value.romanizedName.trim() || null,
          categoryId: value.categoryId,
          mediaTypeId: value.mediaTypeId || null,
          description: value.description || null,
          tagIds: value.tagIds,
          locationIds: value.locationIds,
          personIds: value.personIds,
          groupIds: value.groupIds,
          groupId: value.groupId || null,
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

  function savePeople(personIds: string[]): void {
    updateBookmark.mutate(
      {
        id: bookmark.id,
        input: {
          personIds,
        },
      },
      {
        onSuccess: () => notifyFieldSaved("People"),
        onError: e => notifyFieldSaveError("People", describeError(e)),
      },
    );
  }

  function saveGroups(groupIds: string[]): void {
    updateBookmark.mutate(
      {
        id: bookmark.id,
        input: {
          groupIds,
        },
      },
      {
        onSuccess: () => notifyFieldSaved("Groups"),
        onError: e => notifyFieldSaveError("Groups", describeError(e)),
      },
    );
  }

  // The Media link lives outside the zod form state (immediate-save, like tags/people), so the
  // tab's Save-changes submit never touches it. Selection flows through one of the six Media
  // Properties taxonomy FKs (Book/Movie/TV Show/Episode/Album/Track) rather than a raw
  // Kavita/Plex item; exactly one is ever set — selecting one clears the rest (the selection carries
  // all-null baselines). Cover/ToC/deep-link features resolve through the linked taxonomy row.
  function saveMedia(selection: MediaSelection): void {
    updateBookmark.mutate(
      {
        id: bookmark.id,
        input: {
          ...selection,
        },
      },
      {
        onSuccess: () => notifyFieldSaved("Media"),
        onError: e => notifyFieldSaveError("Media", describeError(e)),
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

    const mergedTagIds = mergeAutofillIds(
      result.tagIds,
      form.getFieldValue("tagIds"),
      touchedRef.current.has("tags"),
    );
    if (mergedTagIds) form.setFieldValue("tagIds", mergedTagIds);

    const mergedLocationIds = mergeAutofillIds(
      result.locationIds,
      form.getFieldValue("locationIds"),
      touchedRef.current.has("locations"),
    );
    if (mergedLocationIds) form.setFieldValue("locationIds", mergedLocationIds);
  }

  const {
    runFetchTitle,
    runFetchDescription,
    runYouTubeEnrichment,
    applyScanMetadata,
    createPersonFromSocialAccount,
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
    people,
    getPersonIds: () => form.getFieldValue("personIds") as string[],
    setPersonIds: (ids: string[]) => form.setFieldValue("personIds", ids),
    createPerson,
    updatePerson,
    autoPersonImage,
    setSocialAccountOffer,
    languages,
    primaryLanguageLevelId,
    hasPrimaryLanguageUsage,
    attachPrimaryLanguageUsage,
    createLanguage,
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
  // current URL to backfill missing data (title/description fill only when blank; people are
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
      const personIdsBefore = form.getFieldValue("personIds") as string[];
      await applyScanMetadata(url, scan, {
        fillTitle: true,
        force: false,
      });
      await reconcileSocialAccountOnEdit(scan.socialAccount, form.getFieldValue("personIds") as string[]);
      const peopleChanged = (form.getFieldValue("personIds") as string[]).length !== personIdsBefore.length;
      notifySuccess(peopleChanged ? "Rescanned — person linked" : "Rescanned");
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
    languages,
    people,
    groups,
    updateBookmark,
    ...modals,
    saveTags,
    saveLocations,
    saveBlacklistedTagIds,
    saveBlacklistedLocationIds,
    savePeople,
    saveGroups,
    saveMedia,
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
    createPersonFromSocialAccount,
  };
}
