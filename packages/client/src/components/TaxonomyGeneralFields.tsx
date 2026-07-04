import type { ReactNode } from "react";

import { useEntityCreateOption } from "./useEntityCreateOption";

import { useMediaProperties } from "@/hooks/useMediaProperties";
import { withFieldGroup } from "@/lib/form";

/** The four form fields this shared block reads (matched 1:1 in every taxonomy general form). */
interface TaxonomyGeneralFieldGroup {
  name: string;
  romanizedName: string;
  sortOrder: number;
  mediaPropertyId: string;
}

/** The update-input subset this block persists via the parent form's `saveField`. */
interface TaxonomyGeneralUpdateInput {
  name: string;
  romanizedName: string;
  sortOrder: number;
  mediaPropertyId: string | null;
}

/** Minimal entity shape the name-rename success needs to follow a slug change. */
interface RenamedEntity {
  slug: string;
}

/**
 * The `useFieldAutoSave().saveField` subset this block calls. Every entity's `saveField` (typed over
 * its full `Update*Input`) is assignable to this because it accepts a superset of keys/values.
 */
export type SaveTaxonomyGeneralField = <K extends keyof TaxonomyGeneralUpdateInput>(
  key: K,
  value: TaxonomyGeneralUpdateInput[K],
  options?: {
    valid?: boolean;
    onSuccess?: (data: RenamedEntity) => void;
  },
) => void;

/**
 * The shared name / sort-order / romanized-name / media-property edit block that the Book, Podcast,
 * and Plex-backed (Movie / TV Show / Episode / Album / Track) taxonomy general forms all render. Each
 * wrapper owns its own `useAppForm` instance and auto-save engine and passes them in: the block is a
 * `withFieldGroup` lens over the four shared fields, so it binds to the parent form without the parent
 * re-listing the fields. It also owns the media-property options query and the inline "Create media
 * property" modal (persisted through the same `saveField`, so the toast wording matches every other
 * field). Text fields auto-save on blur; the media-property combobox on change — the edit-tab standard.
 */
export const TaxonomyGeneralFields = withFieldGroup({
  defaultValues: {
    name: "",
    romanizedName: "",
    sortOrder: 0,
    mediaPropertyId: "",
  } satisfies TaxonomyGeneralFieldGroup,
  props: {
    saveField: (() => undefined) as SaveTaxonomyGeneralField,
    currentSlug: "",
    onRenamed: (() => undefined) as (slug: string) => void,
  } as {
    saveField: SaveTaxonomyGeneralField;
    currentSlug: string;
    onRenamed: (slug: string) => void;
    /** Optional control rendered at the inline-end of the Name input (e.g. a source-sync hint). */
    nameAction?: ReactNode;
  },
  render: function TaxonomyGeneralFieldsRender({
    group,
    saveField,
    currentSlug,
    onRenamed,
    nameAction,
  }) {
    const {
      data: mediaProperties,
    } = useMediaProperties();

    const mediaPropertyCreate = useEntityCreateOption("media-property", (mediaProperty) => {
      saveField("mediaPropertyId", mediaProperty.id, {
        valid: true,
      });
    });

    return (
      <>
        <div
          className="
            grid gap-3
            sm:grid-cols-[1fr_8rem]
          "
        >
          <group.AppField name="name">
            {field => (
              <field.TextField
                label="Name"
                action={nameAction}
                onBlur={() => saveField(
                  "name",
                  field.state.value.trim(),
                  {
                    valid: field.state.meta.errors.length === 0,
                    onSuccess: (updated) => {
                      if (updated.slug !== currentSlug) onRenamed(updated.slug);
                    },
                  },
                )}
              />
            )}
          </group.AppField>
          <group.AppField name="sortOrder">
            {field => (
              <field.NumberField
                label="Sort order"
                hint="Lower sorts first."
                onBlur={() => saveField(
                  "sortOrder",
                  field.state.value,
                  {
                    valid: field.state.meta.errors.length === 0,
                  },
                )}
              />
            )}
          </group.AppField>
        </div>

        <group.AppField name="romanizedName">
          {field => (
            <field.TextField
              label="Romanized name"
              placeholder="Optional romanized form"
              onBlur={() => saveField("romanizedName", field.state.value.trim())}
            />
          )}
        </group.AppField>

        <group.AppField name="mediaPropertyId">
          {field => (
            <field.ComboboxField
              label="Media property"
              placeholder="No media property"
              searchPlaceholder="Search media properties…"
              emptyText="No media properties found."
              createOption={mediaPropertyCreate.createOption}
              options={(mediaProperties ?? []).map(prop => ({
                value: prop.id,
                label: prop.name,
              }))}
              onValueChange={value => saveField(
                "mediaPropertyId",
                value || null,
                {
                  valid: true,
                },
              )}
            />
          )}
        </group.AppField>
        {mediaPropertyCreate.modal}
      </>
    );
  },
});
