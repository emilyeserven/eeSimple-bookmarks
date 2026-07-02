import type { BookmarkFormApi } from "./bookmarkFormSchema";
import type { ImageIntent } from "./bookmarkImageIntent";
import type { CustomFieldControls } from "./customFieldControls";
import type {
  Author,
  BookmarkBooleanValue,
  BookmarkDateTimeValue,
  BookmarkImage,
  BookmarkNumberValue,
  Category,
  CustomProperty,
  ImageCandidate,
  MediaTypeNode,
  Publisher,
  TagNode,
} from "@eesimple/types";

import { ChevronDown } from "lucide-react";

import { BookmarkAdvancedCategoryField } from "./BookmarkAdvancedCategoryField";
import { BookmarkAdvancedDescriptionTagsField } from "./BookmarkAdvancedDescriptionTagsField";
import { BookmarkAdvancedMediaTypeField } from "./BookmarkAdvancedMediaTypeField";
import { BookmarkAdvancedPublisherField } from "./BookmarkAdvancedPublisherField";
import { CategoryCustomFields, CategoryDefaultsApplier } from "./BookmarkCustomFields";
import { BookmarkImagePicker } from "./BookmarkImagePicker";
import { MultiCombobox } from "./MultiCombobox";
import { useEntityCreateOption } from "./useEntityCreateOption";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Label } from "@/components/ui/label";

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
export interface BookmarkCustomFieldControls extends CustomFieldControls {
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
  publishers?: Publisher[];
  /** Remount key for the image field so a form reset clears it. */
  imageFieldKey: number;
  existingImages: BookmarkImage[];
  imageCandidates: ImageCandidate[];
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
export function BookmarkAdvancedSection(props: BookmarkAdvancedSectionProps) {
  const {
    form, customProperties, customFields, authors, onIsbnFetch, isIsbnFetchPending,
  } = props;
  const authorCreate = useEntityCreateOption("author", (author) => {
    const current = form.getFieldValue("authorIds");
    if (!current.includes(author.id)) form.setFieldValue("authorIds", [...current, author.id]);
  });
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
          lockedCategoryId={props.lockedCategoryId}
          categories={props.categories}
          sourceDefaults={props.sourceDefaults}
        />

        <BookmarkAdvancedMediaTypeField
          form={form}
          mediaTypes={props.mediaTypes}
          sourceDefaults={props.sourceDefaults}
        />

        <BookmarkAdvancedPublisherField
          form={form}
          publishers={props.publishers ?? []}
        />

        <BookmarkAdvancedDescriptionTagsField
          form={form}
          tagTree={props.tagTree}
          onTagToggle={props.onTagToggle}
          sourceDefaults={props.sourceDefaults}
          onFetchDescription={props.onFetchDescription}
          isFetchDescriptionPending={props.isFetchDescriptionPending}
        />

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
                  createOption={authorCreate.createOption}
                />
              </div>
            )}
          </form.Field>
        )}
        {authorCreate.modal}

        <form.Subscribe selector={state => state.values.url}>
          {url => (
            <BookmarkImagePicker
              key={props.imageFieldKey}
              existingImages={props.existingImages}
              candidates={props.imageCandidates}
              pageUrl={url}
              defaultAuto={props.defaultAuto}
              autoGrabError={props.autoGrabError}
              onChange={props.onImageIntentChange}
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
                {...customFields}
                placement="advanced"
                categoryId={categoryId}
                mediaTypeId={mediaTypeId || null}
                properties={customProperties}
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
