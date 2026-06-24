import type { BookmarkFormApi } from "./bookmarkFormSchema";
import type { CustomProperty } from "@eesimple/types";

import { CategoryCustomFields } from "./BookmarkCustomFields";
import { CONTENT_STATUS_SLUG, DATE_POSTED_SLUG, RUNTIME_SLUG } from "./bookmarkFormSchema";

export interface RevealedCustomFieldsProps {
  form: BookmarkFormApi;
  customProperties: CustomProperty[];
  numberInputs: Record<string, string>;
  booleanInputs: Record<string, boolean>;
  dateTimeInputs: Record<string, string>;
  choicesInputs: Record<string, string[]>;
  progressInputs: Record<string, { current: string;
    total: string; }>;
  sectionsInputs: Record<string, { exhaustive: boolean;
    sections: import("@eesimple/types").SectionEntry[]; }>;
  onNumberChange: (id: string, value: string) => void;
  onBooleanChange: (id: string, value: boolean) => void;
  onDateTimeChange: (id: string, value: string) => void;
  onChoicesChange: (id: string, values: string[]) => void;
  onProgressChange: (id: string, field: "current" | "total", value: string) => void;
  onSectionsChange: (id: string, value: { exhaustive: boolean;
    sections: import("@eesimple/types").SectionEntry[]; }) => void;
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
  onNumberChange,
  onBooleanChange,
  onDateTimeChange,
  onChoicesChange,
  onProgressChange,
  onSectionsChange,
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
          hiddenSlugs={[RUNTIME_SLUG, DATE_POSTED_SLUG, CONTENT_STATUS_SLUG]}
          numberInputs={numberInputs}
          booleanInputs={booleanInputs}
          dateTimeInputs={dateTimeInputs}
          choicesInputs={choicesInputs}
          progressInputs={progressInputs}
          sectionsInputs={sectionsInputs}
          onNumberChange={onNumberChange}
          onBooleanChange={onBooleanChange}
          onDateTimeChange={onDateTimeChange}
          onChoicesChange={onChoicesChange}
          onProgressChange={onProgressChange}
          onSectionsChange={onSectionsChange}
        />
      )}
    </form.Subscribe>
  );
}
