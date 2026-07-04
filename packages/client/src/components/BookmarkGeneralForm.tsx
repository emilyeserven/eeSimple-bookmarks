import type { Bookmark } from "@eesimple/types";

import { BookmarkAdvancedGroupField } from "./BookmarkAdvancedGroupField";
import { BookmarkAutofillOffer } from "./BookmarkAutofillOffer";
import { BookmarkCategoryField } from "./BookmarkCategoryField";
import { BookmarkDescriptionField } from "./BookmarkDescriptionField";
import { BookmarkGeneralRelationsSection } from "./BookmarkGeneralRelationsSection";
import { BookmarkGeneralUrlSection } from "./BookmarkGeneralUrlSection";
import { BookmarkMediaField } from "./BookmarkMediaField";
import { BookmarkNameField } from "./BookmarkNameField";
import { GenreMoodAssignmentSection } from "./GenreMoodAssignmentSection";
import { PersonSocialAccountOffer } from "./PersonSocialAccountOffer";
import { useBookmarkGeneralForm } from "./useBookmarkGeneralForm";
import { mediaSelectionFromBookmark } from "./useBookmarkMediaField";
import { WebsiteLookupBanner } from "./WebsiteLookupBanner";
import { useBookmarkSyncRegistration } from "../hooks/useBookmarkSyncRegistration";

interface BookmarkGeneralFormProps {
  bookmark: Bookmark;
}

/** Edit a bookmark's core fields: URL, name, description, category, and tags. */
export function BookmarkGeneralForm({
  bookmark,
}: BookmarkGeneralFormProps) {
  const ctrl = useBookmarkGeneralForm(bookmark);
  const {
    form,
    categories,
    fetchTitle,
    fetchMetadata,
    groups,
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
        }}
      />

      <form.AppField name="romanizedName">
        {field => (
          <field.TextField
            label="Romanized name"
            placeholder="Optional romanized form"
            onBlur={() => saveField("romanizedName", field.state.value.trim() || null)}
          />
        )}
      </form.AppField>

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

      <BookmarkCategoryField
        form={form}
        categories={categories ?? []}
        onValueChange={id => saveField("categoryId", id)}
      />

      <PersonSocialAccountOffer
        account={socialAccountOffer}
        onCreate={() => {
          if (socialAccountOffer) return createPersonFromSocialAccount(socialAccountOffer);
        }}
        onDismiss={() => setSocialAccountOffer(null)}
      />

      <BookmarkGeneralRelationsSection ctrl={ctrl} />

      <BookmarkAdvancedGroupField
        form={form}
        groups={groups ?? []}
        onValueChange={id => saveField("groupId", id || null)}
      />

      <BookmarkMediaField
        value={mediaSelectionFromBookmark(bookmark)}
        bookmark={bookmark}
        onSelect={ctrl.saveMedia}
      />

      <GenreMoodAssignmentSection
        ownerType="bookmark"
        ownerId={bookmark.id}
      />
    </div>
  );
}
