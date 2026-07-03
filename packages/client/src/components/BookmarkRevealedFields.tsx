import type { StandardFieldRenderProps } from "./bookmarkAddFormFields";
import type { BookmarkCustomFieldControls, SourceDefaults } from "./BookmarkAdvancedSection";
import type { BookmarkFormApi } from "./bookmarkFormSchema";
import type { ImageIntent } from "./bookmarkImageIntent";
import type { useWebsiteLookup } from "../hooks/useWebsites";
import type { UrlCleanupMode } from "../lib/urlCleanup";
import type {
  Person,
  BookmarkImage,
  BookmarkUrlDuplicateResult,
  Category,
  CustomProperty,
  ImageCandidate,
  Language,
  MediaTypeNode,
  Group,
  SocialAccountRef,
  TagNode,
  Website,
  YouTubeChannelHint,
} from "@eesimple/types";

import { BookmarkStandardFieldZone } from "./bookmarkAddFormFields";
import { BookmarkAdvancedSection } from "./BookmarkAdvancedSection";
import { BookmarkUrlCleanupBanner } from "./BookmarkUrlCleanupBanner";
import { BookmarkUrlDuplicateWarnings } from "./BookmarkUrlDuplicateWarnings";
import { PersonSocialAccountOffer } from "./PersonSocialAccountOffer";
import { RevealedAutofillOffer } from "./RevealedAutofillOffer";
import { RevealedCustomFields } from "./RevealedCustomFields";
import { RevealedNameField } from "./RevealedNameField";
import { RevealedUrlCleanupSection } from "./RevealedUrlCleanupSection";
import { RevealedWebsiteBanner } from "./RevealedWebsiteBanner";
import { useBookmarkAddFormVisibility } from "../hooks/useBookmarkAddFormVisibility";

type WebsiteLookupResult = ReturnType<typeof useWebsiteLookup>;

interface BookmarkRevealedFieldsProps extends BookmarkCustomFieldControls {
  form: BookmarkFormApi;
  /** Whether the form is editing an existing bookmark. Drives placement (edit ignores the settings). */
  isEdit?: boolean;
  /** Hide the Name field — set for plain-text entries, where the typed text is already the name. */
  hideNameField?: boolean;
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
  customStripParams?: string[];

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

  // Tags + custom properties (the custom-field inputs/handlers come from BookmarkCustomFieldControls).
  tagTree: TagNode[];
  customProperties: CustomProperty[];
  mediaTypes: MediaTypeNode[];
  people?: Person[];
  onTagToggle: (id: string) => void;

  // Advanced section.
  categories: Category[];
  groups?: Group[];
  languages?: Language[];
  imageFieldKey: number;
  existingImages: BookmarkImage[];
  imageCandidates: ImageCandidate[];
  defaultAuto: boolean;
  autoGrabError: string | null;
  onImageIntentChange: (intent: ImageIntent) => void;

  // Duplicate URL check result.
  urlDuplicate?: BookmarkUrlDuplicateResult | null;

  // Autofill offer state.
  autofillOfferDismissed: boolean;
  onAutofillOfferDismiss: () => void;

  // Social-account → person offer (create form only).
  socialAccountOffer?: SocialAccountRef | null;
  onCreatePersonFromSocialAccount?: () => Promise<void> | void;
  onSocialAccountOfferDismiss?: () => void;

  // Description fetch sparkle.
  onFetchDescription: (url: string) => void;

  // ISBN metadata fetch.
  onIsbnFetch?: (isbn: string) => void;
  isIsbnFetchPending?: boolean;
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
  const {
    mainStandardFields, advancedStandardFields, mainHiddenSlugs, advancedHiddenSlugs, placementOverrides,
  } = useBookmarkAddFormVisibility(props.isEdit ?? false);

  // The whole render-props bag the standard-field components need. Threaded into every zone.
  const renderProps: StandardFieldRenderProps = {
    ...props,
    isFetchDescriptionPending: props.isFetchMetadataPending,
  };

  // Name fields (title/romanized) live in the banner grid; other main-area fields render below it.
  const showTitle = mainStandardFields.includes("title");
  const showRomanized = mainStandardFields.includes("romanizedName");
  const showNameCluster = !props.hideNameField && (showTitle || showRomanized);
  const mainBodyFields = mainStandardFields.filter(
    field => field !== "title" && field !== "romanizedName",
  );

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
        {showNameCluster && (
          <RevealedNameField
            {...props}
            showTitle={showTitle}
            showRomanized={showRomanized}
          />
        )}
      </div>

      {/* Autofill rule offer for new sites with a non-default category. */}
      <RevealedAutofillOffer {...props} />

      {/* Offer to create an person when the URL is a social profile with no matching person. */}
      <PersonSocialAccountOffer
        account={props.socialAccountOffer ?? null}
        onCreate={() => props.onCreatePersonFromSocialAccount?.()}
        onDismiss={() => props.onSocialAccountOfferDismiss?.()}
      />

      {/* Remaining main-area standard fields (empty by default; populated by placement settings). */}
      <BookmarkStandardFieldZone
        fields={mainBodyFields}
        {...renderProps}
      />

      <RevealedCustomFields
        {...props}
        hiddenSlugs={mainHiddenSlugs}
        placementOverrides={placementOverrides}
      />

      <BookmarkAdvancedSection
        {...renderProps}
        customProperties={props.customProperties}
        standardFields={advancedStandardFields}
        hiddenSlugs={advancedHiddenSlugs}
        placementOverrides={placementOverrides}
        onIsbnFetch={props.onIsbnFetch}
        isIsbnFetchPending={props.isIsbnFetchPending}
        customFields={{
          numberInputs: props.numberInputs,
          booleanInputs: props.booleanInputs,
          dateTimeInputs: props.dateTimeInputs,
          choicesInputs: props.choicesInputs,
          progressInputs: props.progressInputs,
          sectionsInputs: props.sectionsInputs,
          textInputs: props.textInputs,
          onNumberChange: props.onNumberChange,
          onBooleanChange: props.onBooleanChange,
          onDateTimeChange: props.onDateTimeChange,
          onChoicesChange: props.onChoicesChange,
          onProgressChange: props.onProgressChange,
          onSectionsChange: props.onSectionsChange,
          onTextChange: props.onTextChange,
          onApplyCategoryDefaults: props.onApplyCategoryDefaults,
        }}
      />
    </>
  );
}
