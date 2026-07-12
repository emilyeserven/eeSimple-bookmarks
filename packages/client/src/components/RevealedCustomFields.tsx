import type { BookmarkFormApi } from "./bookmarkFormSchema";
import type { CustomFieldControls } from "./customFieldControls";
import type { BookmarkAddFormPlacement, CustomProperty } from "@eesimple/types";

import { CategoryCustomFields } from "./BookmarkCustomFields";
import {
  CONTENT_STATUS_SLUG,
  DATE_POSTED_SLUG,
  PAGE_RANGE_SLUG,
  PROGRESS_SLUG,
  RUNTIME_SLUG,
  SECTIONS_SLUG,
} from "./bookmarkFormSchema";

/**
 * The built-in detail slugs hidden from the main (non-Advanced) form by default — used when no
 * explicit `hiddenSlugs`/`placementOverrides` are provided (e.g. stories and the edit surface's
 * fallback), matching the historical hardcoded behavior.
 */
const DEFAULT_MAIN_HIDDEN_SLUGS = [
  RUNTIME_SLUG,
  DATE_POSTED_SLUG,
  CONTENT_STATUS_SLUG,
  PROGRESS_SLUG,
  PAGE_RANGE_SLUG,
  SECTIONS_SLUG,
];

export interface RevealedCustomFieldsProps extends CustomFieldControls {
  form: BookmarkFormApi;
  customProperties: CustomProperty[];
  onIsbnFetch?: (isbn: string) => void;
  isIsbnFetchPending?: boolean;
  /** Slugs to hide from the main property list. Defaults to the built-in detail slugs. */
  hiddenSlugs?: string[];
  /** Per-slug placement overrides from the Add Bookmark Form settings (create mode only). */
  placementOverrides?: Record<string, BookmarkAddFormPlacement>;
  /** Ids of custom properties an automation filled this session (create mode only). */
  autofilledPropertyIds?: ReadonlySet<string>;
  /** Whether the "reveal auto-filled fields in main" setting is on (create mode only). */
  revealAutofilledInMain?: boolean;
}

/**
 * The main (non-Advanced) custom-property fields, scoped to the live category AND media-type
 * selection (union) so they update as the user changes either picker.
 */
export function RevealedCustomFields({
  form,
  customProperties,
  numberInputs,
  booleanInputs,
  dateTimeInputs,
  choicesInputs,
  progressInputs,
  sectionsInputs,
  textInputs,
  onNumberChange,
  onBooleanChange,
  onDateTimeChange,
  onChoicesChange,
  onProgressChange,
  onSectionsChange,
  onTextChange,
  onAddPeople,
  onIsbnFetch,
  isIsbnFetchPending,
  hiddenSlugs = DEFAULT_MAIN_HIDDEN_SLUGS,
  placementOverrides,
  autofilledPropertyIds,
  revealAutofilledInMain,
}: RevealedCustomFieldsProps) {
  return (
    <form.Subscribe
      selector={state => ({
        categoryId: state.values.categoryId,
        mediaTypeId: state.values.mediaTypeId,
      })}
    >
      {({
        categoryId, mediaTypeId,
      }) => (
        <CategoryCustomFields
          placement="default"
          categoryId={categoryId}
          mediaTypeId={mediaTypeId || null}
          properties={customProperties}
          hiddenSlugs={hiddenSlugs}
          placementOverrides={placementOverrides}
          autofilledPropertyIds={autofilledPropertyIds}
          revealAutofilledInMain={revealAutofilledInMain}
          numberInputs={numberInputs}
          booleanInputs={booleanInputs}
          dateTimeInputs={dateTimeInputs}
          choicesInputs={choicesInputs}
          progressInputs={progressInputs}
          sectionsInputs={sectionsInputs}
          textInputs={textInputs}
          onNumberChange={onNumberChange}
          onBooleanChange={onBooleanChange}
          onDateTimeChange={onDateTimeChange}
          onChoicesChange={onChoicesChange}
          onProgressChange={onProgressChange}
          onSectionsChange={onSectionsChange}
          onTextChange={onTextChange}
          onAddPeople={onAddPeople}
          onIsbnFetch={onIsbnFetch}
          isIsbnFetchPending={isIsbnFetchPending}
        />
      )}
    </form.Subscribe>
  );
}
