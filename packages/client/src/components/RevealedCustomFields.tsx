import type { BookmarkFormApi } from "./bookmarkFormSchema";
import type { CustomProperty } from "@eesimple/types";

import { CategoryCustomFields } from "./BookmarkCustomFields";

export interface RevealedCustomFieldsProps {
  form: BookmarkFormApi;
  /** The bookmark's media type (when editing); properties scoped to it also appear (union). */
  mediaTypeId?: string | null;
  customProperties: CustomProperty[];
  numberInputs: Record<string, string>;
  booleanInputs: Record<string, boolean>;
  dateTimeInputs: Record<string, string>;
  onNumberChange: (id: string, value: string) => void;
  onBooleanChange: (id: string, value: boolean) => void;
  onDateTimeChange: (id: string, value: string) => void;
}

/** The main (non-Advanced) category-scoped custom-property fields, subscribed to the category. */
export function RevealedCustomFields({
  form,
  mediaTypeId = null,
  customProperties,
  numberInputs,
  booleanInputs,
  dateTimeInputs,
  onNumberChange,
  onBooleanChange,
  onDateTimeChange,
}: RevealedCustomFieldsProps) {
  return (
    <form.Subscribe selector={state => state.values.categoryId}>
      {categoryId => (
        <CategoryCustomFields
          placement="default"
          categoryId={categoryId}
          mediaTypeId={mediaTypeId}
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
  );
}
