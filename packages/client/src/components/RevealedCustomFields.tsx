import type { BookmarkFormApi } from "./bookmarkFormSchema";
import type { CustomFieldControls } from "./customFieldControls";
import type { CustomProperty } from "@eesimple/types";

import { CategoryCustomFields } from "./BookmarkCustomFields";
import {
  CONTENT_STATUS_SLUG,
  DATE_POSTED_SLUG,
  PAGE_PROGRESS_SLUG,
  PAGE_RANGE_SLUG,
  PAGE_SECTIONS_SLUG,
  RUNTIME_SLUG,
} from "./bookmarkFormSchema";

export interface RevealedCustomFieldsProps extends CustomFieldControls {
  form: BookmarkFormApi;
  customProperties: CustomProperty[];
  onIsbnFetch?: (isbn: string) => void;
  isIsbnFetchPending?: boolean;
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
  onIsbnFetch,
  isIsbnFetchPending,
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
          hiddenSlugs={[
            RUNTIME_SLUG,
            DATE_POSTED_SLUG,
            CONTENT_STATUS_SLUG,
            PAGE_PROGRESS_SLUG,
            PAGE_RANGE_SLUG,
            PAGE_SECTIONS_SLUG,
          ]}
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
          onIsbnFetch={onIsbnFetch}
          isIsbnFetchPending={isIsbnFetchPending}
        />
      )}
    </form.Subscribe>
  );
}
