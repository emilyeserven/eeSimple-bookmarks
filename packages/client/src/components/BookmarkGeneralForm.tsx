import type { Bookmark } from "@eesimple/types";

import { useTranslation } from "react-i18next";

import { BookmarkAutofillOffer } from "./BookmarkAutofillOffer";
import { BookmarkLocationBlacklistField, BookmarkTagBlacklistField } from "./BookmarkBlacklistSection";
import { BookmarkCategoryField } from "./BookmarkCategoryField";
import { BookmarkDescriptionField } from "./BookmarkDescriptionField";
import { BookmarkGeneralFormProvider, useBookmarkGeneralFormContext } from "./BookmarkGeneralFormContext";
import { BookmarkMediaTypeField, BookmarkTagsSelectField } from "./BookmarkGeneralRelationsSection";
import { BookmarkGeneralUrlSection } from "./BookmarkGeneralUrlSection";
import { BookmarkNameField } from "./BookmarkNameField";
import {
  BookmarkChannelSelectField,
  BookmarkGroupsSelectField,
  BookmarkLocationsSelectField,
  BookmarkPeopleSelectField,
} from "./BookmarkRelatedEntitiesSection";
import { CollapsibleFormSection } from "./CollapsibleFormSection";
import { EntityNamesTabEditor } from "./entityNames/EntityNamesTab";
import { PrimaryLanguageField } from "./entityNames/PrimaryLanguageField";
import { PersonSocialAccountOffer } from "./PersonSocialAccountOffer";
import { WebsiteLookupBanner } from "./WebsiteLookupBanner";

import { Label } from "@/components/ui/label";

/**
 * The bookmark General-tab **edit** fields, extracted from the old monolithic `BookmarkGeneralForm`
 * (#1163). Each is a placeable layout field that reads the **shared** controller from
 * {@link useBookmarkGeneralFormContext} (mounted by `BookmarkEditView` / the recomposed
 * `BookmarkGeneralForm`), so the single `useAppForm` + its cross-field coordination is preserved even
 * though the fields now render independently through the layout seam. The registry
 * (`workbench/bookmark.tsx`) points each `edit` renderer at one of these; the view side lives in
 * `workbench/bookmarkViewFields.tsx`.
 */

/** Name/Title field: title textarea, fetch-from-URL controls; blur runs autofill + saves + syncs language. */
export function BookmarkNameEditField() {
  const {
    ctrl,
    primaryLanguage,
  } = useBookmarkGeneralFormContext();
  const {
    form,
    fetchTitle,
    fetchMetadata,
    titleFetch,
    setTitleFetch,
    undoTitleFetch,
    runFetchTitle,
    runYouTubeEnrichment,
    isReportingTitle,
    setIsReportingTitle,
    expectedTitle,
    setExpectedTitle,
    runAutofill,
    saveTitle,
  } = ctrl;
  return (
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
  );
}

/** Primary display language — the react-query-backed `usePrimaryLanguageField`, shared via context. */
export function BookmarkPrimaryLanguageEditField() {
  const {
    ctrl,
    primaryLanguage,
  } = useBookmarkGeneralFormContext();
  return (
    <PrimaryLanguageField
      value={primaryLanguage.primaryLanguageId}
      onValueChange={v => primaryLanguage.setPrimaryLanguage(v, ctrl.form.getFieldValue("title"))}
    />
  );
}

/** The multilingual "Names" editor (self-contained; needs only the bookmark id). */
export function BookmarkNamesEditField({
  bookmark,
}: { bookmark: Bookmark }) {
  const {
    t,
  } = useTranslation();
  return (
    <div className="space-y-1">
      <Label>{t("Names")}</Label>
      <EntityNamesTabEditor
        ownerType="bookmark"
        ownerId={bookmark.id}
      />
    </div>
  );
}

/** URL field + cleanup/duplicate warnings, plus the website-lookup banner and autofill offer. */
export function BookmarkUrlEditField({
  bookmark,
}: { bookmark: Bookmark }) {
  const {
    ctrl,
  } = useBookmarkGeneralFormContext();
  const {
    form,
    categories,
    websiteLookup,
    channelHintRef,
    youtubeChannel,
    setYoutubeChannel,
    websiteSiteName,
    setWebsiteSiteName,
    autofillOfferDismissed,
    setAutofillOfferDismissed,
    runFetchTitle,
  } = ctrl;
  return (
    <>
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
    </>
  );
}

/** Description textarea; saves on blur. */
export function BookmarkDescriptionEditField() {
  const {
    ctrl,
  } = useBookmarkGeneralFormContext();
  const {
    form,
    fetchMetadata,
    runFetchDescription,
    saveDescription,
  } = ctrl;
  return (
    <BookmarkDescriptionField
      form={form}
      fetchMetadata={fetchMetadata}
      runFetchDescription={runFetchDescription}
      onBlur={saveDescription}
    />
  );
}

/** Category combobox (+ the person social-account offer it can surface). */
export function BookmarkCategoryEditField() {
  const {
    ctrl,
  } = useBookmarkGeneralFormContext();
  const {
    form,
    categories,
    saveField,
    socialAccountOffer,
    setSocialAccountOffer,
    createPersonFromSocialAccount,
  } = ctrl;
  return (
    <>
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
    </>
  );
}

/** Media type combobox (with inline-create). */
export function BookmarkMediaTypeEditField() {
  const {
    ctrl,
  } = useBookmarkGeneralFormContext();
  return <BookmarkMediaTypeField ctrl={ctrl} />;
}

/** Tags multi-select (with inline-create). */
export function BookmarkTagsEditField() {
  const {
    ctrl,
  } = useBookmarkGeneralFormContext();
  return <BookmarkTagsSelectField ctrl={ctrl} />;
}

/** Advanced → Tag blacklist. */
export function BookmarkTagBlacklistEditField() {
  const {
    ctrl,
  } = useBookmarkGeneralFormContext();
  return <BookmarkTagBlacklistField ctrl={ctrl} />;
}

/** Advanced → Location blacklist. */
export function BookmarkLocationBlacklistEditField() {
  const {
    ctrl,
  } = useBookmarkGeneralFormContext();
  return <BookmarkLocationBlacklistField ctrl={ctrl} />;
}

/** YouTube channel combobox (with inline-create). Reads the shared controller from context. */
export function BookmarkChannelEditField() {
  const {
    ctrl,
  } = useBookmarkGeneralFormContext();
  return <BookmarkChannelSelectField ctrl={ctrl} />;
}

/** Locations picker + per-location relations (with inline-create). Reads the shared controller. */
export function BookmarkLocationsEditField() {
  const {
    ctrl,
  } = useBookmarkGeneralFormContext();
  return <BookmarkLocationsSelectField ctrl={ctrl} />;
}

/** People multi-select (with inline-create). Reads the shared controller from context. */
export function BookmarkPeopleEditField() {
  const {
    ctrl,
  } = useBookmarkGeneralFormContext();
  return <BookmarkPeopleSelectField ctrl={ctrl} />;
}

/** Groups multi-select (with inline-create). Reads the shared controller from context. */
export function BookmarkGroupsEditField() {
  const {
    ctrl,
  } = useBookmarkGeneralFormContext();
  return <BookmarkGroupsSelectField ctrl={ctrl} />;
}

interface BookmarkGeneralFormProps {
  bookmark: Bookmark;
}

/**
 * Edit a bookmark's core fields: name, primary language, names, URL, description, category, media type,
 * tags, and the Advanced tag/location blacklists. Recomposed from the extracted per-field components
 * (each reads the shared controller from context) so its existing story/test render unchanged even
 * though the layout-driven registry now drives these same fields individually on the edit page.
 */
export function BookmarkGeneralForm({
  bookmark,
}: BookmarkGeneralFormProps) {
  const {
    t,
  } = useTranslation();

  return (
    <BookmarkGeneralFormProvider bookmark={bookmark}>
      <div className="space-y-4">
        <BookmarkNameEditField />
        <BookmarkPrimaryLanguageEditField />
        <BookmarkNamesEditField bookmark={bookmark} />
        <BookmarkUrlEditField bookmark={bookmark} />
        <BookmarkDescriptionEditField />
        <BookmarkCategoryEditField />
        <BookmarkMediaTypeEditField />
        <BookmarkTagsEditField />

        <CollapsibleFormSection
          title={t("Advanced")}
          description={t("Tags and locations excluded here will never be auto-applied by autofill rules.")}
          defaultOpen={
            bookmark.blacklistedTagIds.length > 0
            || bookmark.blacklistedLocationIds.length > 0
          }
          preview={
            bookmark.blacklistedTagIds.length === 0 && bookmark.blacklistedLocationIds.length === 0
              ? t("No exclusions")
              : t("{{tagCount}} tags, {{locationCount}} locations excluded", {
                tagCount: bookmark.blacklistedTagIds.length,
                locationCount: bookmark.blacklistedLocationIds.length,
              })
          }
        >
          <div
            className="
              grid gap-4
              md:grid-cols-2
            "
          >
            <BookmarkTagBlacklistEditField />
            <BookmarkLocationBlacklistEditField />
          </div>
        </CollapsibleFormSection>
      </div>
    </BookmarkGeneralFormProvider>
  );
}
