import type { SourceDefaults } from "./BookmarkAdvancedSection";
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
  MediaTypeNode,
  TagNode,
  Website,
  YouTubeChannelHint,
} from "@eesimple/types";

import { BookmarkAdvancedSection } from "./BookmarkAdvancedSection";
import { BookmarkUrlCleanupBanner } from "./BookmarkUrlCleanupBanner";
import { BookmarkUrlDuplicateWarnings } from "./BookmarkUrlDuplicateWarnings";
import { RevealedAutofillOffer } from "./RevealedAutofillOffer";
import { RevealedCustomFields } from "./RevealedCustomFields";
import { RevealedNameField } from "./RevealedNameField";
import { RevealedUrlCleanupSection } from "./RevealedUrlCleanupSection";
import { RevealedWebsiteBanner } from "./RevealedWebsiteBanner";

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

  // "Set as default" context for the source-default checkboxes (rendered under their fields).
  sourceDefaults: SourceDefaults;

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
  mediaTypes: MediaTypeNode[];
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
  addMediaTypeOpen: boolean;
  onAddMediaTypeOpenChange: (open: boolean) => void;
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
 *
 * This component is a thin coordinator: each conditional render region lives in its own co-located
 * `Revealed*` sub-component, keeping this function's cognitive complexity low.
 */
export function BookmarkRevealedFields(props: BookmarkRevealedFieldsProps) {
  // A coordinator: each conditional region is delegated to a `Revealed*` sub-component that picks
  // the slice of props it needs. Passing the whole bag keeps this function flat and low-complexity;
  // only the few props that need renaming for a leaf component are spelled out below.
  return (
    <>
      {/* Shortened-link disclosure: full URL shown inline directly below the URL field. */}
      <BookmarkUrlCleanupBanner
        urlCleanup={props.urlCleanup}
        urlShortener={props.urlShortener}
        onUndo={props.onUndoUrlCleanup}
      />

      <RevealedUrlCleanupSection {...props} />

      {/* Duplicate URL warnings. */}
      <BookmarkUrlDuplicateWarnings {...props} />

      {/* Left: site / shortener info derived from the URL. Right: Name + title feedback. */}
      <div
        className="
          grid gap-4
          sm:grid-cols-2
        "
      >
        <RevealedWebsiteBanner {...props} />
        <RevealedNameField {...props} />
      </div>

      {/* Autofill rule offer for new sites with a non-default category. */}
      <RevealedAutofillOffer {...props} />

      <RevealedCustomFields {...props} />

      <BookmarkAdvancedSection
        {...props}
        customFields={{
          numberInputs: props.numberInputs,
          booleanInputs: props.booleanInputs,
          dateTimeInputs: props.dateTimeInputs,
          onNumberChange: props.onNumberChange,
          onBooleanChange: props.onBooleanChange,
          onDateTimeChange: props.onDateTimeChange,
          onApplyCategoryDefaults: props.onApplyCategoryDefaults,
        }}
        isFetchDescriptionPending={props.isFetchMetadataPending}
      />
    </>
  );
}
