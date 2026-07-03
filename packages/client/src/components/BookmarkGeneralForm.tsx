import type { Bookmark } from "@eesimple/types";

import { BookmarkAdvancedGroupField } from "./BookmarkAdvancedGroupField";
import { BookmarkAdvancedLanguageField } from "./BookmarkAdvancedLanguageField";
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
    languages,
    updateBookmark,
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
  } = ctrl;

  // Register the header "Sync from source" button for this bookmark (re-scan its URL).
  useBookmarkSyncRegistration({
    bookmark,
    form,
  });

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        event.stopPropagation();
        void form.handleSubmit();
      }}
    >
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
        onNameBlur={runAutofill}
      />

      <form.AppField name="romanizedTitle">
        {field => (
          <field.TextField
            label="Romanized name"
            placeholder="Optional romanized form"
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
      />

      <BookmarkCategoryField
        form={form}
        categories={categories ?? []}
      />

      <PersonSocialAccountOffer
        account={socialAccountOffer}
        onCreate={() => {
          if (socialAccountOffer) return createPersonFromSocialAccount(socialAccountOffer);
        }}
        onDismiss={() => setSocialAccountOffer(null)}
      />

      <BookmarkGeneralRelationsSection ctrl={ctrl} />

      <BookmarkAdvancedLanguageField
        form={form}
        languages={languages ?? []}
      />

      <BookmarkAdvancedGroupField
        form={form}
        groups={groups ?? []}
      />

      <BookmarkMediaField
        bookmark={bookmark}
        onSelect={ctrl.saveMedia}
      />

      <GenreMoodAssignmentSection
        ownerType="bookmark"
        ownerId={bookmark.id}
      />

      <form.AppForm>
        <form.SubmitButton
          label="Save changes"
          pendingLabel="Saving…"
          size="sm"
        />
      </form.AppForm>

      {updateBookmark.isError
        ? <p className="text-sm text-destructive">{updateBookmark.error?.message}</p>
        : null}
    </form>
  );
}
