import type { Bookmark } from "@eesimple/types";

import { useTranslation } from "react-i18next";

import { BookmarkAutofillOffer } from "./BookmarkAutofillOffer";
import { BookmarkBlacklistSection } from "./BookmarkBlacklistSection";
import { BookmarkCategoryField } from "./BookmarkCategoryField";
import { BookmarkDescriptionField } from "./BookmarkDescriptionField";
import { BookmarkGeneralRelationsSection } from "./BookmarkGeneralRelationsSection";
import { BookmarkGeneralUrlSection } from "./BookmarkGeneralUrlSection";
import { BookmarkMediaField } from "./BookmarkMediaField";
import { BookmarkMediaIdentitySection } from "./BookmarkMediaIdentitySection";
import { BookmarkNameField } from "./BookmarkNameField";
import { CollapsibleFormSection } from "./CollapsibleFormSection";
import { EntityNamesTabEditor } from "./entityNames/EntityNamesTab";
import { PrimaryLanguageField } from "./entityNames/PrimaryLanguageField";
import { GenreMoodAssignmentSection } from "./GenreMoodAssignmentSection";
import { PersonSocialAccountOffer } from "./PersonSocialAccountOffer";
import { useBookmarkGeneralForm } from "./useBookmarkGeneralForm";
import { mediaSelectionFromBookmark } from "./useBookmarkMediaField";
import { WebsiteLookupBanner } from "./WebsiteLookupBanner";
import { useBookmarkSyncRegistration } from "../hooks/useBookmarkSyncRegistration";
import { usePrimaryLanguageField } from "../hooks/usePrimaryLanguageField";

import { Label } from "@/components/ui/label";

interface BookmarkGeneralFormProps {
  bookmark: Bookmark;
}

/** Edit a bookmark's core fields: URL, name, description, category, and tags. */
export function BookmarkGeneralForm({
  bookmark,
}: BookmarkGeneralFormProps) {
  const {
    t,
  } = useTranslation();
  const ctrl = useBookmarkGeneralForm(bookmark);
  const primaryLanguage = usePrimaryLanguageField("bookmark", bookmark.id);
  const {
    form,
    categories,
    fetchTitle,
    fetchMetadata,
    websiteLookup,
    channelHintRef,
    youtubeChannel,
    setYoutubeChannel,
    websiteSiteName,
    setWebsiteSiteName,
    isReportingTitle,
    setIsReportingTitle,
    expectedTitle,
    setExpectedTitle,
    titleFetch,
    setTitleFetch,
    autofillOfferDismissed,
    setAutofillOfferDismissed,
    socialAccountOffer,
    setSocialAccountOffer,
    createPersonFromSocialAccount,
    runAutofill,
    runFetchTitle,
    runFetchDescription,
    runYouTubeEnrichment,
    undoTitleFetch,
    saveField,
    saveTitle,
    saveDescription,
  } = ctrl;

  // Register the header "Sync from source" button for this bookmark (re-scan its URL). Staged
  // Title/Description values persist through the same per-field auto-save the form's fields use.
  useBookmarkSyncRegistration({
    bookmark,
    form,
    onFieldStaged: () => {
      saveTitle();
      saveDescription();
    },
  });

  return (
    <div className="space-y-4">
      <BookmarkNameField
        form={form}
        fetchTitle={fetchTitle}
        fetchMetadata={fetchMetadata}
        titleFetch={titleFetch}
        onTitleEdited={() => setTitleFetch(null)}
        undoTitleFetch={undoTitleFetch}
        runFetchTitle={runFetchTitle}
        runYouTubeEnrichment={runYouTubeEnrichment}
        isReportingTitle={isReportingTitle}
        setIsReportingTitle={setIsReportingTitle}
        expectedTitle={expectedTitle}
        setExpectedTitle={setExpectedTitle}
        onNameBlur={() => {
          runAutofill();
          saveTitle();
          primaryLanguage.syncPrimaryValue(form.getFieldValue("title").trim());
        }}
      />

      <PrimaryLanguageField
        value={primaryLanguage.primaryLanguageId}
        onValueChange={v => primaryLanguage.setPrimaryLanguage(v, form.getFieldValue("title"))}
      />

      <div className="space-y-1">
        <Label>{t("Names")}</Label>
        <EntityNamesTabEditor
          ownerType="bookmark"
          ownerId={bookmark.id}
        />
      </div>

      <BookmarkGeneralUrlSection
        ctrl={ctrl}
        bookmark={bookmark}
      />

      <WebsiteLookupBanner
        data={websiteLookup.data}
        isYouTube={websiteLookup.data?.domain === "youtube.com"}
        youtubeChannel={youtubeChannel}
        onChannelSelfIdsChange={(ids) => {
          const updated = {
            ...(youtubeChannel ?? {
              key: "",
              name: "",
            }),
            selfIds: ids,
          };
          channelHintRef.current = updated;
          setYoutubeChannel(updated);
        }}
        websiteSiteName={websiteSiteName}
        onSiteNameChange={setWebsiteSiteName}
        onSiteNameBlur={() => void runFetchTitle(form.getFieldValue("url"), {
          force: true,
        })}
      />

      {websiteLookup.data?.exists === false && websiteLookup.data.domain && (
        <form.Subscribe selector={state => state.values.categoryId}>
          {categoryId => (
            <BookmarkAutofillOffer
              domain={websiteLookup.data?.domain ?? ""}
              categoryId={categoryId}
              categories={categories ?? []}
              dismissed={autofillOfferDismissed}
              onDismiss={() => setAutofillOfferDismissed(true)}
            />
          )}
        </form.Subscribe>
      )}

      <BookmarkDescriptionField
        form={form}
        fetchMetadata={fetchMetadata}
        runFetchDescription={runFetchDescription}
        onBlur={saveDescription}
      />

      <div
        className="
          grid gap-4
          md:grid-cols-2
        "
      >
        <BookmarkCategoryField
          form={form}
          categories={categories ?? []}
          onValueChange={id => saveField("categoryId", id)}
        />
      </div>

      <PersonSocialAccountOffer
        account={socialAccountOffer}
        onCreate={() => {
          if (socialAccountOffer) return createPersonFromSocialAccount(socialAccountOffer);
        }}
        onDismiss={() => setSocialAccountOffer(null)}
      />

      <div
        className="
          grid gap-4
          md:grid-cols-2
        "
      >
        <BookmarkGeneralRelationsSection ctrl={ctrl} />

        <BookmarkMediaField
          value={mediaSelectionFromBookmark(bookmark)}
          bookmark={bookmark}
          onSelect={ctrl.saveMedia}
        />

        <GenreMoodAssignmentSection
          ownerType="bookmark"
          ownerId={bookmark.id}
          stacked
        />
      </div>

      <CollapsibleFormSection
        title={t("Media identity")}
        description={t("Link this bookmark to a Kavita series or Plex item, and record media identity like ISBN, year, Wikidata/Wikipedia, and podcast feed details.")}
        defaultOpen={
          bookmark.plexRatingKey !== null
          || bookmark.kavitaSeriesId !== null
          || bookmark.isbn !== null
        }
        preview={t("ISBN, year, Kavita / Plex link, podcast feed…")}
      >
        <BookmarkMediaIdentitySection bookmark={bookmark} />
      </CollapsibleFormSection>

      <CollapsibleFormSection
        title={t("Advanced")}
        description={t("Tags and locations excluded here will never be auto-applied by autofill rules.")}
        defaultOpen={
          form.state.values.blacklistedTagIds.length > 0
          || form.state.values.blacklistedLocationIds.length > 0
        }
        preview={(
          <form.Subscribe
            selector={state => [
              state.values.blacklistedTagIds.length,
              state.values.blacklistedLocationIds.length,
            ] as const}
          >
            {([tagCount, locationCount]) => (tagCount === 0 && locationCount === 0
              ? t("No exclusions")
              : t("{{tagCount}} tags, {{locationCount}} locations excluded", {
                tagCount,
                locationCount,
              }))}
          </form.Subscribe>
        )}
      >
        <BookmarkBlacklistSection ctrl={ctrl} />
      </CollapsibleFormSection>
    </div>
  );
}
