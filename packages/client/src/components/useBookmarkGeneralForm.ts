import type { Bookmark, ScanResult, UpdateBookmarkInput } from "@eesimple/types";

import { useTranslation } from "react-i18next";

import {
  bookmarkSchema,
  buildBookmarkDefaultValues,
  computeAutofill,
  looksLikeYouTube,
} from "./bookmarkFormSchema";
import { useBookmarkFormData } from "./useBookmarkFormData";
import { useBookmarkGeneralAutoSave } from "./useBookmarkGeneralAutoSave";
import { useBookmarkGeneralUiState } from "./useBookmarkGeneralUiState";
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
    youtubeChannels,
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
  const {
    t,
  } = useTranslation();
  const {
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
  } = useBookmarkGeneralUiState();

  // This edit-tab form never renders BookmarkMediaLinkField (media links are edited via the
  // Relationships page instead), and it manages names via its own EntityNamesTabEditor — both stay
  // at `buildBookmarkDefaultValues`'s defaults. No locked category / initial seed: this is edit-mode
  // only, so the bookmark's own values always win.
  const form = useAppForm({
    defaultValues: buildBookmarkDefaultValues(bookmark, undefined),
    validators: {
      onChange: bookmarkSchema,
    },
  });

  // Per-field auto-save for the scalar fields (edit-tab standard — no Save button). Extracted so this
  // hook's cognitive complexity doesn't rise (mirrors `useBookmarkSyncRegistration`).
  const {
    saveField, saveUrl, saveTitle, saveDescription,
  } = useBookmarkGeneralAutoSave({
    bookmark,
    form,
    updateBookmark,
    resolveSubmitUrl,
    channelHintRef,
  });

  /**
   * The 7 `save<Field>` array-relation setters below all share one shape (mutate, toast on
   * success/error) — collapsed into this one parametrized helper rather than repeating the
   * mutate/notify boilerplate per field.
   */
  function saveBookmarkArrayField(label: string, input: UpdateBookmarkInput): void {
    updateBookmark.mutate(
      {
        id: bookmark.id,
        input,
      },
      {
        onSuccess: () => notifyFieldSaved(label),
        onError: e => notifyFieldSaveError(label, describeError(e)),
      },
    );
  }

  function saveTags(tagIds: string[]): void {
    saveBookmarkArrayField("Tags", {
      tagIds,
    });
  }

  function saveLocations(locationIds: string[]): void {
    saveBookmarkArrayField("Locations", {
      locationIds,
      locationRelationByLocationId: form.getFieldValue("locationRelationByLocationId"),
    });
  }

  function saveLocationRelations(relationByLocationId: Record<string, string | null>): void {
    saveBookmarkArrayField("Location relations", {
      locationIds: form.getFieldValue("locationIds"),
      locationRelationByLocationId: relationByLocationId,
    });
  }

  function saveBlacklistedTagIds(blacklistedTagIds: string[]): void {
    saveBookmarkArrayField("Tag blacklist", {
      blacklistedTagIds,
    });
  }

  function saveBlacklistedLocationIds(blacklistedLocationIds: string[]): void {
    saveBookmarkArrayField("Location blacklist", {
      blacklistedLocationIds,
    });
  }

  function savePeople(personIds: string[]): void {
    saveBookmarkArrayField("People", {
      personIds,
    });
  }

  function saveGroups(groupIds: string[]): void {
    saveBookmarkArrayField("Groups", {
      groupIds,
    });
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
        saveField("categoryId", result.categoryId);
      }
    }

    const mergedTagIds = mergeAutofillIds(
      result.tagIds,
      form.getFieldValue("tagIds"),
      touchedRef.current.has("tags"),
    );
    if (mergedTagIds) {
      form.setFieldValue("tagIds", mergedTagIds);
      saveTags(mergedTagIds);
    }

    const mergedLocationIds = mergeAutofillIds(
      result.locationIds,
      form.getFieldValue("locationIds"),
      touchedRef.current.has("locations"),
    );
    if (mergedLocationIds) {
      form.setFieldValue("locationIds", mergedLocationIds);
      saveLocations(mergedLocationIds);
    }
  }

  const {
    runFetchTitle: rawFetchTitle,
    runFetchDescription: rawFetchDescription,
    runYouTubeEnrichment: rawYouTubeEnrichment,
    applyScanMetadata,
    createPersonFromSocialAccount,
    reconcileSocialAccountOnEdit,
    runUrlCleanup,
    undoUrlCleanup: rawUndoUrlCleanup,
    undoTitleFetch: rawUndoTitleFetch,
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
    // Persist any person change the scan handlers make (author-name / social-account matching),
    // since there's no blur/change event for a programmatic write.
    setPersonIds: (ids: string[]) => {
      form.setFieldValue("personIds", ids);
      savePeople(ids);
    },
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

  // The scan handlers write Title/Description into form state; on the edit form each such write must
  // persist (there's no blur/change event for it). Wrap them so the value is saved after they resolve
  // — the engine's no-op skip means an unchanged field never toasts.
  const runFetchTitle: typeof rawFetchTitle = async (url, opts) => {
    await rawFetchTitle(url, opts);
    saveTitle();
  };
  const runFetchDescription: typeof rawFetchDescription = async (url, opts) => {
    await rawFetchDescription(url, opts);
    saveDescription();
  };
  const runYouTubeEnrichment: typeof rawYouTubeEnrichment = async (url, opts) => {
    await rawYouTubeEnrichment(url, opts);
    saveTitle();
    saveDescription();
  };
  const undoTitleFetch = (): void => {
    rawUndoTitleFetch();
    saveTitle();
  };
  const undoUrlCleanup = (): void => {
    rawUndoUrlCleanup();
    saveUrl();
  };

  async function performUrlScan(): Promise<void> {
    runUrlCleanup(form.getFieldValue("url"));
    const url = form.getFieldValue("url");
    runAutofill();
    runWebsiteLookup(url);
    urlDuplicateCheck.mutate({
      url,
    }, {
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
    // Persist the cleaned URL (+ resolved channel hint from enrichment) last, so a URL edit sticks.
    saveUrl();
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
      // Persist the fields the rescan may have filled (people persist via the wrapped setPersonIds).
      saveTitle();
      saveDescription();
      const peopleChanged = (form.getFieldValue("personIds") as string[]).length !== personIdsBefore.length;
      notifySuccess(peopleChanged ? t("Rescanned — person linked") : t("Rescanned"));
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
    youtubeChannels,
    updateBookmark,
    updatePerson,
    ...modals,
    saveField,
    saveTitle,
    saveDescription,
    saveTags,
    saveLocations,
    saveLocationRelations,
    saveBlacklistedTagIds,
    saveBlacklistedLocationIds,
    savePeople,
    saveGroups,
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
