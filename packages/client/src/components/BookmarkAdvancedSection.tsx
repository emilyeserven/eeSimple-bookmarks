import type { BookmarkFormApi } from "./bookmarkFormSchema";
import type { ImageIntent } from "./bookmarkImageIntent";
import type {
  BookmarkBooleanValue,
  BookmarkDateTimeValue,
  BookmarkNumberValue,
  Category,
  CustomProperty,
  TagNode,
} from "@eesimple/types";

import { ChevronDown } from "lucide-react";

import { AddCategoryModal } from "./AddCategoryModal";
import { CategoryCustomFields, CategoryDefaultsApplier } from "./BookmarkCustomFields";
import { BookmarkImageField } from "./BookmarkImageField";
import { GatedTagPicker } from "./BookmarkTagsField";

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
  tagTree: TagNode[];
  onTagToggle: (id: string) => void;
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
 * The bookmark form's "Advanced" collapsible: the Category combobox (+ inline create), the
 * Description + Tags fields, the image field, and the category's non-main custom properties.
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
  tagTree,
  onTagToggle,
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
          ? (
            <p
              className="
                rounded-md border bg-muted px-3 py-2 text-xs
                text-muted-foreground
              "
            >
              Category is pre-filled (
              <span className="font-medium">
                {categories.find(c => c.id === lockedCategoryId)?.name ?? "a specific category"}
              </span>
              ) — open from any other view to change it.
            </p>
          )
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

        {/* Description and Tags side by side, stretched to a matching height. */}
        <div
          className="
            grid items-stretch gap-4
            sm:grid-cols-2
          "
        >
          <form.AppField name="description">
            {field => (
              <field.TextareaField
                label="Description"
                fill
                inputClassName="min-h-24"
              />
            )}
          </form.AppField>

          <form.Subscribe selector={state => state.values.categoryId}>
            {categoryId => (
              <form.Field name="tagIds">
                {field => (
                  <div className="flex h-full flex-col gap-1">
                    <Label>Tags</Label>
                    <GatedTagPicker
                      className="flex-1 overflow-auto"
                      categoryId={categoryId}
                      tree={tagTree}
                      selectedIds={field.state.value}
                      onToggle={(id) => {
                        onTagToggle(id);
                        const current = field.state.value;
                        field.handleChange(
                          current.includes(id)
                            ? current.filter(tagId => tagId !== id)
                            : [...current, id],
                        );
                      }}
                    />
                  </div>
                )}
              </form.Field>
            )}
          </form.Subscribe>
        </div>

        <form.Subscribe selector={state => state.values.url}>
          {url => (
            <BookmarkImageField
              key={imageFieldKey}
              existingImageUrl={existingImageUrl}
              pageUrl={url}
              defaultAuto={defaultAuto}
              autoGrabError={autoGrabError}
              onChange={onImageIntentChange}
            />
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
