import type { BookmarkFormApi } from "./bookmarkFormSchema";
import type { ImageIntent } from "./bookmarkImageIntent";
import type {
  BookmarkBooleanValue,
  BookmarkDateTimeValue,
  BookmarkNumberValue,
  Category,
  CustomProperty,
} from "@eesimple/types";

import { ChevronDown } from "lucide-react";

import { AddCategoryModal } from "./AddCategoryModal";
import { CategoryCustomFields, CategoryDefaultsApplier } from "./BookmarkCustomFields";
import { BookmarkImageField } from "./BookmarkImageField";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Label } from "@/components/ui/label";
import { CategoryIcon } from "@/lib/icons";

interface BookmarkAdvancedSectionProps {
  form: BookmarkFormApi;
  lockedCategoryId?: string;
  categories: Category[];
  customProperties: CustomProperty[];
  addCategoryOpen: boolean;
  onAddCategoryOpenChange: (open: boolean) => void;
  /** Remount key for the image field so a form reset clears it. */
  imageFieldKey: number;
  existingImageUrl: string | null;
  defaultAuto: boolean;
  autoGrabError: string | null;
  onImageIntentChange: (intent: ImageIntent) => void;
  numberInputs: Record<string, string>;
  booleanInputs: Record<string, boolean>;
  dateTimeInputs: Record<string, string>;
  onNumberChange: (id: string, value: string) => void;
  onBooleanChange: (id: string, value: boolean) => void;
  onDateTimeChange: (id: string, value: string) => void;
  onApplyCategoryDefaults: (
    numberValues: BookmarkNumberValue[],
    booleanValues: BookmarkBooleanValue[],
    dateTimeValues: BookmarkDateTimeValue[],
  ) => void;
}

/**
 * The bookmark form's "Advanced" collapsible: the Category combobox (+ inline create), the image
 * field, and the category's non-main custom properties (with their defaults applier).
 */
export function BookmarkAdvancedSection({
  form,
  lockedCategoryId,
  categories,
  customProperties,
  addCategoryOpen,
  onAddCategoryOpenChange,
  imageFieldKey,
  existingImageUrl,
  defaultAuto,
  autoGrabError,
  onImageIntentChange,
  numberInputs,
  booleanInputs,
  dateTimeInputs,
  onNumberChange,
  onBooleanChange,
  onDateTimeChange,
  onApplyCategoryDefaults,
}: BookmarkAdvancedSectionProps) {
  return (
    <Collapsible className="group/advanced space-y-3">
      <CollapsibleTrigger
        className="
          flex items-center gap-1 text-sm font-medium text-muted-foreground
          hover:text-foreground
        "
      >
        <ChevronDown
          className="
            size-4 transition-transform
            group-data-[state=open]/advanced:rotate-180
          "
        />
        Advanced
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-4">
        {lockedCategoryId
          ? null
          : (
            <form.AppField name="categoryId">
              {field => (
                <field.ComboboxField
                  label="Category"
                  placeholder="Select a category"
                  searchPlaceholder="Search categories…"
                  emptyText="No categories found."
                  createOption={{
                    label: "Create category",
                    onSelect: () => onAddCategoryOpenChange(true),
                  }}
                  options={categories.map(category => ({
                    value: category.id,
                    label: category.name,
                    icon: (
                      <CategoryIcon
                        name={category.icon}
                        className="size-4 shrink-0"
                      />
                    ),
                  }))}
                />
              )}
            </form.AppField>
          )}

        <AddCategoryModal
          open={addCategoryOpen}
          onOpenChange={onAddCategoryOpenChange}
          onCreated={category => form.setFieldValue("categoryId", category.id)}
        />

        <form.Subscribe selector={state => state.values.url}>
          {url => (
            <div className="space-y-1">
              <Label>Image</Label>
              <BookmarkImageField
                key={imageFieldKey}
                existingImageUrl={existingImageUrl}
                pageUrl={url}
                defaultAuto={defaultAuto}
                autoGrabError={autoGrabError}
                onChange={onImageIntentChange}
              />
            </div>
          )}
        </form.Subscribe>

        <form.Subscribe selector={state => state.values.categoryId}>
          {categoryId => (
            <>
              <CategoryDefaultsApplier
                categoryId={categoryId}
                onApply={onApplyCategoryDefaults}
              />
              <CategoryCustomFields
                placement="advanced"
                categoryId={categoryId}
                properties={customProperties}
                numberInputs={numberInputs}
                booleanInputs={booleanInputs}
                dateTimeInputs={dateTimeInputs}
                onNumberChange={onNumberChange}
                onBooleanChange={onBooleanChange}
                onDateTimeChange={onDateTimeChange}
              />
            </>
          )}
        </form.Subscribe>
      </CollapsibleContent>
    </Collapsible>
  );
}
