import type { BookmarkFormApi } from "./bookmarkFormSchema";
import type { ImageIntent } from "./bookmarkImageIntent";
import type { useWebsiteLookup } from "../hooks/useWebsites";
import type { UrlCleanupMode } from "../lib/urlCleanup";
import type {
  BookmarkBooleanValue,
  BookmarkDateTimeValue,
  BookmarkNumberValue,
  BookmarkUrlDuplicateResult,
  Category,
  CustomProperty,
  TagNode,
  Website,
  YouTubeChannelHint,
} from "@eesimple/types";

import { Loader2, Sparkles } from "lucide-react";

import { BookmarkAdvancedSection } from "./BookmarkAdvancedSection";
import { BookmarkAutofillOffer } from "./BookmarkAutofillOffer";
import { CategoryCustomFields } from "./BookmarkCustomFields";
import { TitleFetchFeedback } from "./BookmarkTitleFeedback";
import { BookmarkUrlCleanupBanner } from "./BookmarkUrlCleanupBanner";
import { UrlCleanupPanel } from "./BookmarkUrlCleanupPanel";
import { BookmarkUrlDuplicateWarnings } from "./BookmarkUrlDuplicateWarnings";
import { WebsiteLookupBanner } from "./WebsiteLookupBanner";
import { isFetchableUrl } from "../lib/url";

import { Button } from "@/components/ui/button";

type WebsiteLookupResult = ReturnType<typeof useWebsiteLookup>;

interface BookmarkRevealedFieldsProps {
  form: BookmarkFormApi;
  lockedCategoryId?: string;

  // URL cleanup banner + panel.
  urlCleanup: { original: string;
    cleaned: string;
    applied: boolean; } | null;
  urlShortener: { nudge: boolean;
    expandedUrl: string | null; };
  onUndoUrlCleanup: () => void;
  showUrlCleanup: boolean;
  cleanupId: string;
  urlCleanupMode: UrlCleanupMode;
  onUrlCleanupModeChange: (mode: UrlCleanupMode) => void;
  websites: Website[];
  ignoreList: string[];

  // Website / YouTube banner.
  websiteLookup: WebsiteLookupResult;
  youtubeChannel: YouTubeChannelHint | null;
  onChannelSelfIdsChange: (ids: string[]) => void;
  websiteSiteName: string;
  onSiteNameChange: (name: string) => void;
  onSiteNameBlur: () => void;

  // "Set as default" checkboxes for new sites/channels.
  isNewChannel: boolean;
  setWebsiteCategory: boolean;
  setWebsiteTags: boolean;
  setChannelCategory: boolean;
  setChannelTags: boolean;
  onSetWebsiteCategory: (v: boolean) => void;
  onSetWebsiteTags: (v: boolean) => void;
  onSetChannelCategory: (v: boolean) => void;
  onSetChannelTags: (v: boolean) => void;

  // Title field + fetch.
  onTitleBlur: () => void;
  onTitleChange: () => void;
  onFetchTitleClick: (url: string) => void;
  isFetchTitlePending: boolean;
  isFetchMetadataPending: boolean;
  titleFetch: { previous: string } | null;
  onUndoTitleFetch: () => void;

  // Title fetch feedback.
  fetchTitleIsSuccess: boolean;
  fetchTitleIsError: boolean;
  fetchTitleErrorMessage: string | undefined;
  fetchedTitle: string | undefined;
  isReportingTitle: boolean;
  onStartReporting: () => void;
  expectedTitle: string;
  onExpectedTitleChange: (v: string) => void;
  onCancelReporting: () => void;

  // Tags + custom properties.
  tagTree: TagNode[];
  customProperties: CustomProperty[];
  onTagToggle: (id: string) => void;
  numberInputs: Record<string, string>;
  booleanInputs: Record<string, boolean>;
  dateTimeInputs: Record<string, string>;
  onNumberChange: (id: string, value: string) => void;
  onBooleanChange: (id: string, value: boolean) => void;
  onDateTimeChange: (id: string, value: string) => void;

  // Advanced section.
  categories: Category[];
  addCategoryOpen: boolean;
  onAddCategoryOpenChange: (open: boolean) => void;
  imageFieldKey: number;
  existingImageUrl: string | null;
  defaultAuto: boolean;
  autoGrabError: string | null;
  onImageIntentChange: (intent: ImageIntent) => void;
  onApplyCategoryDefaults: (
    numberValues: BookmarkNumberValue[],
    booleanValues: BookmarkBooleanValue[],
    dateTimeValues: BookmarkDateTimeValue[],
  ) => void;

  // Duplicate URL check result.
  urlDuplicate?: BookmarkUrlDuplicateResult | null;

  // Autofill offer state.
  autofillOfferDismissed: boolean;
  onAutofillOfferDismiss: () => void;

  // Description fetch sparkle.
  onFetchDescription: (url: string) => void;
}

/**
 * Everything the bookmark form reveals once the URL has been checked (or always, when editing): the
 * shortened-link banner, the URL cleanup panel, the website/YouTube banner, the Name field with its
 * fetch button and feedback, the main custom-property fields, and the Advanced collapsible (which
 * holds Description, Tags, image, and category). The URL field and the form's primary actions stay
 * in `BookmarkForm`.
 */
export function BookmarkRevealedFields({
  form,
  lockedCategoryId,
  urlCleanup,
  urlShortener,
  onUndoUrlCleanup,
  showUrlCleanup,
  cleanupId,
  urlCleanupMode,
  onUrlCleanupModeChange,
  websites,
  ignoreList,
  websiteLookup,
  youtubeChannel,
  onChannelSelfIdsChange,
  websiteSiteName,
  onSiteNameChange,
  onSiteNameBlur,
  isNewChannel,
  setWebsiteCategory,
  setWebsiteTags,
  setChannelCategory,
  setChannelTags,
  onSetWebsiteCategory,
  onSetWebsiteTags,
  onSetChannelCategory,
  onSetChannelTags,
  onTitleBlur,
  onTitleChange,
  onFetchTitleClick,
  isFetchTitlePending,
  isFetchMetadataPending,
  titleFetch,
  onUndoTitleFetch,
  fetchTitleIsSuccess,
  fetchTitleIsError,
  fetchTitleErrorMessage,
  fetchedTitle,
  isReportingTitle,
  onStartReporting,
  expectedTitle,
  onExpectedTitleChange,
  onCancelReporting,
  tagTree,
  customProperties,
  onTagToggle,
  numberInputs,
  booleanInputs,
  dateTimeInputs,
  onNumberChange,
  onBooleanChange,
  onDateTimeChange,
  categories,
  addCategoryOpen,
  onAddCategoryOpenChange,
  imageFieldKey,
  existingImageUrl,
  defaultAuto,
  autoGrabError,
  onImageIntentChange,
  onApplyCategoryDefaults,
  urlDuplicate,
  autofillOfferDismissed,
  onAutofillOfferDismiss,
  onFetchDescription,
}: BookmarkRevealedFieldsProps) {
  return (
    <>
      {/* Shortened-link disclosure: full URL shown inline directly below the URL field. */}
      <BookmarkUrlCleanupBanner
        urlCleanup={urlCleanup}
        urlShortener={urlShortener}
        onUndo={onUndoUrlCleanup}
      />

      {showUrlCleanup && (
        <form.Subscribe selector={state => state.values.url}>
          {url => (
            <UrlCleanupPanel
              url={url}
              cleanupId={cleanupId}
              mode={urlCleanupMode}
              onModeChange={onUrlCleanupModeChange}
              websites={websites}
              ignoreList={ignoreList}
            />
          )}
        </form.Subscribe>
      )}

      {/* Duplicate URL warnings. */}
      <BookmarkUrlDuplicateWarnings urlDuplicate={urlDuplicate} />

      {/* Left: site / shortener info derived from the URL. Right: Name + title feedback. */}
      <div
        className="
          grid gap-4
          sm:grid-cols-2
        "
      >
        <div className="flex flex-col gap-4">
          <form.Subscribe selector={s => ({ categoryId: s.values.categoryId, tagIds: s.values.tagIds })}>
            {({ categoryId, tagIds }) => (
              <WebsiteLookupBanner
                data={websiteLookup.data}
                isYouTube={websiteLookup.data?.domain === "youtube.com"}
                youtubeChannel={youtubeChannel}
                onChannelSelfIdsChange={onChannelSelfIdsChange}
                websiteSiteName={websiteSiteName}
                onSiteNameChange={onSiteNameChange}
                onSiteNameBlur={onSiteNameBlur}
                categoryId={categoryId ?? ""}
                tagIds={tagIds ?? []}
                isNewChannel={isNewChannel}
                setWebsiteCategory={setWebsiteCategory}
                setWebsiteTags={setWebsiteTags}
                setChannelCategory={setChannelCategory}
                setChannelTags={setChannelTags}
                onSetWebsiteCategory={onSetWebsiteCategory}
                onSetWebsiteTags={onSetWebsiteTags}
                onSetChannelCategory={onSetChannelCategory}
                onSetChannelTags={onSetChannelTags}
              />
            )}
          </form.Subscribe>
        </div>

        <div className="flex flex-col gap-4">
          <form.Subscribe selector={state => state.values.url}>
            {url => (
              <form.AppField name="title">
                {field => (
                  <field.TextareaField
                    label="Name"
                    rows={1}
                    inputClassName="min-h-9"
                    onBlur={onTitleBlur}
                    onChange={onTitleChange}
                    action={(
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        title="Fetch title from URL"
                        aria-label="Fetch title from URL"
                        disabled={!isFetchableUrl(url) || isFetchTitlePending || isFetchMetadataPending}
                        onClick={() => onFetchTitleClick(url)}
                      >
                        {isFetchTitlePending || isFetchMetadataPending
                          ? <Loader2 className="size-4 animate-spin" />
                          : <Sparkles className="size-4" />}
                      </Button>
                    )}
                  />
                )}
              </form.AppField>
            )}
          </form.Subscribe>

          {titleFetch && (
            <p className="text-sm text-muted-foreground">
              Changed from
              {" "}
              <span className="font-mono">{titleFetch.previous}</span>
              {" · "}
              <Button
                type="button"
                variant="link"
                size="sm"
                className="h-auto p-0"
                onClick={onUndoTitleFetch}
              >
                Undo
              </Button>
            </p>
          )}

          <TitleFetchFeedback
            isSuccess={fetchTitleIsSuccess}
            isError={fetchTitleIsError}
            errorMessage={fetchTitleErrorMessage}
            fetchedTitle={fetchedTitle}
            isReportingTitle={isReportingTitle}
            onStartReporting={onStartReporting}
            expectedTitle={expectedTitle}
            onExpectedTitleChange={onExpectedTitleChange}
            onCancelReporting={onCancelReporting}
            getFormUrl={() => form.getFieldValue("url")}
            getFormTitle={() => form.getFieldValue("title")}
          />
        </div>
      </div>

      {/* Autofill rule offer for new sites with a non-default category. */}
      {websiteLookup.data?.exists === false && websiteLookup.data.domain && (
        <form.Subscribe selector={state => state.values.categoryId}>
          {categoryId => (
            <BookmarkAutofillOffer
              domain={websiteLookup.data?.domain ?? ""}
              categoryId={categoryId}
              lockedCategoryId={lockedCategoryId}
              categories={categories}
              dismissed={autofillOfferDismissed}
              onDismiss={onAutofillOfferDismiss}
            />
          )}
        </form.Subscribe>
      )}

      <form.Subscribe selector={state => state.values.categoryId}>
        {categoryId => (
          <CategoryCustomFields
            placement="default"
            categoryId={categoryId}
            properties={customProperties}
            numberInputs={numberInputs}
            booleanInputs={booleanInputs}
            dateTimeInputs={dateTimeInputs}
            onNumberChange={onNumberChange}
            onBooleanChange={onBooleanChange}
            onDateTimeChange={onDateTimeChange}
          />
        )}
      </form.Subscribe>

      <BookmarkAdvancedSection
        form={form}
        lockedCategoryId={lockedCategoryId}
        categories={categories}
        customProperties={customProperties}
        addCategoryOpen={addCategoryOpen}
        onAddCategoryOpenChange={onAddCategoryOpenChange}
        imageFieldKey={imageFieldKey}
        existingImageUrl={existingImageUrl}
        defaultAuto={defaultAuto}
        autoGrabError={autoGrabError}
        onImageIntentChange={onImageIntentChange}
        tagTree={tagTree}
        onTagToggle={onTagToggle}
        numberInputs={numberInputs}
        booleanInputs={booleanInputs}
        dateTimeInputs={dateTimeInputs}
        onNumberChange={onNumberChange}
        onBooleanChange={onBooleanChange}
        onDateTimeChange={onDateTimeChange}
        onApplyCategoryDefaults={onApplyCategoryDefaults}
        onFetchDescription={onFetchDescription}
        isFetchDescriptionPending={isFetchMetadataPending}
      />
    </>
  );
}
