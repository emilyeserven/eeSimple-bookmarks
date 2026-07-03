import type { StandardFieldRenderProps } from "./bookmarkAddFormFields";
import type { CustomFieldControls } from "./customFieldControls";
import type {
  BookmarkAddFormPlacement,
  BookmarkAddFormStandardField,
  BookmarkBooleanValue,
  BookmarkDateTimeValue,
  BookmarkNumberValue,
  CustomProperty,
} from "@eesimple/types";

import {
  BOOKMARK_ADD_FORM_STANDARD_FIELDS,
  DEFAULT_BOOKMARK_ADD_FORM_SETTINGS,
} from "@eesimple/types";
import { ChevronDown } from "lucide-react";

import { BookmarkStandardFieldZone } from "./bookmarkAddFormFields";
import { CategoryCustomFields, CategoryDefaultsApplier } from "./BookmarkCustomFields";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

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

/** The default set of standard fields shown in the Advanced section (today's fixed list). */
const DEFAULT_ADVANCED_STANDARD_FIELDS: BookmarkAddFormStandardField[]
  = BOOKMARK_ADD_FORM_STANDARD_FIELDS.filter(field =>
    (DEFAULT_BOOKMARK_ADD_FORM_SETTINGS.advancedFields as readonly string[]).includes(field));

interface BookmarkAdvancedSectionProps extends StandardFieldRenderProps {
  customProperties: CustomProperty[];
  /** The standard fields to render in the Advanced section. Defaults to today's fixed list. */
  standardFields?: BookmarkAddFormStandardField[];
  /** Slugs to hide from the Advanced property list. Defaults to the `CategoryCustomFields` default. */
  hiddenSlugs?: string[];
  /** Per-slug placement overrides from the Add Bookmark Form settings (create mode only). */
  placementOverrides?: Record<string, BookmarkAddFormPlacement>;
  /** Custom-property inputs + change handlers (grouped). */
  customFields: BookmarkCustomFieldControls;
  /** Called when the user clicks "Fetch metadata" on the ISBN field. */
  onIsbnFetch?: (isbn: string) => void;
  isIsbnFetchPending?: boolean;
}

/**
 * The bookmark form's "Advanced" collapsible. The standard fields it holds are placement-driven (the
 * category / media-type / language / group / description+tags / people / image controls by default),
 * followed by the category/media-type custom properties. The Collapsible + trigger always render.
 */
export function BookmarkAdvancedSection({
  customProperties,
  standardFields = DEFAULT_ADVANCED_STANDARD_FIELDS,
  hiddenSlugs,
  placementOverrides,
  customFields,
  onIsbnFetch,
  isIsbnFetchPending,
  ...renderProps
}: BookmarkAdvancedSectionProps) {
  const {
    form,
  } = renderProps;
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
        <BookmarkStandardFieldZone
          fields={standardFields}
          {...renderProps}
        />

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
                hiddenSlugs={hiddenSlugs}
                placementOverrides={placementOverrides}
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
