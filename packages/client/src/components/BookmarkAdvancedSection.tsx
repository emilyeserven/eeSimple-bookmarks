import type { BookmarkFormApi } from "./bookmarkFormSchema";
import type { ImageIntent } from "./bookmarkImageIntent";
import type {
  Author,
  BookmarkBooleanValue,
  BookmarkDateTimeValue,
  BookmarkNumberValue,
  Category,
  CustomProperty,
  MediaTypeNode,
  Publisher,
  TagNode,
} from "@eesimple/types";

import { useState } from "react";

import { ChevronDown, Loader2, Sparkles } from "lucide-react";

import { AddTagModal } from "./AddTagModal";
import { BookmarkAdvancedCategoryField } from "./BookmarkAdvancedCategoryField";
import { BookmarkAdvancedMediaTypeField } from "./BookmarkAdvancedMediaTypeField";
import { BookmarkAdvancedPublisherField } from "./BookmarkAdvancedPublisherField";
import { CategoryCustomFields, CategoryDefaultsApplier } from "./BookmarkCustomFields";
import { BookmarkImageField } from "./BookmarkImageField";
import { SourceDefaultCheckbox } from "./BookmarkSourceDefaultCheckbox";
import { GatedTagPicker } from "./BookmarkTagsField";
import { MultiCombobox } from "./MultiCombobox";

import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Label } from "@/components/ui/label";
import { isFetchableUrl } from "@/lib/url";

/**
 * The bookmark's "source" (website or YouTube channel) whose defaults the form can promote, plus the
 * flag state for the "set as default" checkboxes now rendered under their respective fields. The
 * controller resolves which entity (and which underlying flags) this maps to.
 */
export interface SourceDefaults {
  /** Display name of the source (domain or channel name), or `null` when none resolved. */
  label: string | null;
  /** Whether to offer "set as default" for category/tags (source is new). */
  showSourceDefault: boolean;
  /** Whether to offer "set as default media type" (source has no default media type yet). */
  showMediaTypeDefault: boolean;
  setCategory: boolean;
  setTags: boolean;
  setMediaType: boolean;
  onSetCategory: (v: boolean) => void;
  onSetTags: (v: boolean) => void;
  onSetMediaType: (v: boolean) => void;
}

/** The custom-property field state + handlers, grouped so the section's prop list stays cohesive. */
export interface BookmarkCustomFieldControls {
  numberInputs: Record<string, string>;
  booleanInputs: Record<string, boolean>;
  dateTimeInputs: Record<string, string>;
  choicesInputs: Record<string, string[]>;
  progressInputs: Record<string, { current: string;
    total: string; }>;
  sectionsInputs: Record<string, { exhaustive: boolean;
    sections: import("@eesimple/types").SectionEntry[]; }>;
  textInputs: Record<string, string>;
  onNumberChange: (id: string, value: string) => void;
  onBooleanChange: (id: string, value: boolean) => void;
  onDateTimeChange: (id: string, value: string) => void;
  onChoicesChange: (id: string, values: string[]) => void;
  onProgressChange: (id: string, field: "current" | "total", value: string) => void;
  onSectionsChange: (id: string, value: { exhaustive: boolean;
    sections: import("@eesimple/types").SectionEntry[]; }) => void;
  onTextChange: (id: string, value: string) => void;
  onApplyCategoryDefaults: (
    numberValues: BookmarkNumberValue[],
    booleanValues: BookmarkBooleanValue[],
    dateTimeValues: BookmarkDateTimeValue[],
  ) => void;
}

interface BookmarkAdvancedSectionProps {
  form: BookmarkFormApi;
  lockedCategoryId?: string;
  categories: Category[];
  customProperties: CustomProperty[];
  mediaTypes: MediaTypeNode[];
  sourceDefaults: SourceDefaults;
  addCategoryOpen: boolean;
  onAddCategoryOpenChange: (open: boolean) => void;
  addMediaTypeOpen: boolean;
  onAddMediaTypeOpenChange: (open: boolean) => void;
  publishers?: Publisher[];
  addPublisherOpen: boolean;
  onAddPublisherOpenChange: (open: boolean) => void;
  /** Remount key for the image field so a form reset clears it. */
  imageFieldKey: number;
  existingImageUrl: string | null;
  defaultAuto: boolean;
  autoGrabError: string | null;
  onImageIntentChange: (intent: ImageIntent) => void;
  tagTree: TagNode[];
  onTagToggle: (id: string) => void;
  authors?: Author[];
  /** Custom-property inputs + change handlers (grouped). */
  customFields: BookmarkCustomFieldControls;
  /** Called when the user clicks the description sparkle; receives the current URL. */
  onFetchDescription?: (url: string) => void;
  /** Whether a description fetch is in-flight (drives the spinner on the sparkle button). */
  isFetchDescriptionPending?: boolean;
  /** Called when the user clicks "Fetch metadata" on the ISBN field. */
  onIsbnFetch?: (isbn: string) => void;
  isIsbnFetchPending?: boolean;
}

/**
 * The bookmark form's "Advanced" collapsible: the Category and Media Type comboboxes (each with
 * inline create and a "set as default for <source>" checkbox), the Description + Tags fields (Tags
 * also carrying a "set as default" checkbox), the image field, and the category/media-type custom
 * properties.
 */
export function BookmarkAdvancedSection({
  form,
  lockedCategoryId,
  categories,
  customProperties,
  mediaTypes,
  sourceDefaults,
  addCategoryOpen,
  onAddCategoryOpenChange,
  addMediaTypeOpen,
  onAddMediaTypeOpenChange,
  publishers,
  addPublisherOpen,
  onAddPublisherOpenChange,
  imageFieldKey,
  existingImageUrl,
  defaultAuto,
  autoGrabError,
  onImageIntentChange,
  tagTree,
  onTagToggle,
  authors,
  customFields,
  onFetchDescription,
  isFetchDescriptionPending,
  onIsbnFetch,
  isIsbnFetchPending,
}: BookmarkAdvancedSectionProps) {
  const [addTagOpen, setAddTagOpen] = useState(false);

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
        <BookmarkAdvancedCategoryField
          form={form}
          lockedCategoryId={lockedCategoryId}
          categories={categories}
          sourceDefaults={sourceDefaults}
          addCategoryOpen={addCategoryOpen}
          onAddCategoryOpenChange={onAddCategoryOpenChange}
        />

        <BookmarkAdvancedMediaTypeField
          form={form}
          mediaTypes={mediaTypes}
          sourceDefaults={sourceDefaults}
          addMediaTypeOpen={addMediaTypeOpen}
          onAddMediaTypeOpenChange={onAddMediaTypeOpenChange}
        />

        <BookmarkAdvancedPublisherField
          form={form}
          publishers={publishers ?? []}
          addPublisherOpen={addPublisherOpen}
          onAddPublisherOpenChange={onAddPublisherOpenChange}
        />

        {/* Description and Tags side by side, stretched to a matching height. */}
        <div
          className="
            grid items-stretch gap-4
            sm:grid-cols-2
          "
        >
          <form.Subscribe selector={state => state.values.url}>
            {url => (
              <form.AppField name="description">
                {field => (
                  <field.TextareaField
                    label="Description"
                    fill
                    inputClassName="min-h-24"
                    action={onFetchDescription
                      ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          title="Fetch description from URL"
                          aria-label="Fetch description from URL"
                          disabled={!isFetchableUrl(url) || isFetchDescriptionPending}
                          onClick={() => onFetchDescription(url)}
                        >
                          {isFetchDescriptionPending
                            ? <Loader2 className="size-4 animate-spin" />
                            : <Sparkles className="size-4" />}
                        </Button>
                      )
                      : undefined}
                  />
                )}
              </form.AppField>
            )}
          </form.Subscribe>

          <form.Subscribe selector={state => state.values.categoryId}>
            {categoryId => (
              <form.Field name="tagIds">
                {field => (
                  <>
                    <GatedTagPicker
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
                      createOption={{
                        label: "Create tag",
                        onSelect: () => setAddTagOpen(true),
                      }}
                      below={sourceDefaults.showSourceDefault && field.state.value.length > 0
                        ? (
                          <SourceDefaultCheckbox
                            checked={sourceDefaults.setTags}
                            onCheckedChange={sourceDefaults.onSetTags}
                          >
                            Apply selected tags as defaults for
                            {" "}
                            {sourceDefaults.label}
                          </SourceDefaultCheckbox>
                        )
                        : null}
                    />
                    <AddTagModal
                      open={addTagOpen}
                      onOpenChange={setAddTagOpen}
                      onCreated={(tag) => {
                        const current = field.state.value;
                        if (!current.includes(tag.id)) {
                          onTagToggle(tag.id);
                          field.handleChange([...current, tag.id]);
                        }
                      }}
                    />
                  </>
                )}
              </form.Field>
            )}
          </form.Subscribe>
        </div>

        {(authors?.length ?? 0) > 0 && (
          <form.Field name="authorIds">
            {field => (
              <div className="space-y-1">
                <Label>Authors</Label>
                <MultiCombobox
                  options={(authors ?? []).map(a => ({
                    value: a.id,
                    label: a.name,
                  }))}
                  values={field.state.value}
                  onValuesChange={field.handleChange}
                  placeholder="Select authors…"
                  searchPlaceholder="Search authors…"
                  emptyText="No authors found."
                />
              </div>
            )}
          </form.Field>
        )}

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

        <form.Subscribe
          selector={state => ({
            categoryId: state.values.categoryId,
            mediaTypeId: state.values.mediaTypeId,
          })}
        >
          {({
            categoryId, mediaTypeId,
          }) => (
            <>
              <CategoryDefaultsApplier
                categoryId={categoryId}
                onApply={customFields.onApplyCategoryDefaults}
              />
              <CategoryCustomFields
                placement="advanced"
                categoryId={categoryId}
                mediaTypeId={mediaTypeId || null}
                properties={customProperties}
                numberInputs={customFields.numberInputs}
                booleanInputs={customFields.booleanInputs}
                dateTimeInputs={customFields.dateTimeInputs}
                choicesInputs={customFields.choicesInputs}
                progressInputs={customFields.progressInputs}
                sectionsInputs={customFields.sectionsInputs}
                textInputs={customFields.textInputs}
                onNumberChange={customFields.onNumberChange}
                onBooleanChange={customFields.onBooleanChange}
                onDateTimeChange={customFields.onDateTimeChange}
                onChoicesChange={customFields.onChoicesChange}
                onProgressChange={customFields.onProgressChange}
                onSectionsChange={customFields.onSectionsChange}
                onTextChange={customFields.onTextChange}
                onIsbnFetch={onIsbnFetch}
                isIsbnFetchPending={isIsbnFetchPending}
              />
            </>
          )}
        </form.Subscribe>
      </CollapsibleContent>
    </Collapsible>
  );
}
