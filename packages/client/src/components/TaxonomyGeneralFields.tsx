import type { EntityNameOwnerType } from "@eesimple/types";
import type { ReactNode } from "react";

import { useTranslation } from "react-i18next";

import { EntityNamesTabEditor } from "./entityNames/EntityNamesTab";
import { PrimaryLanguageField } from "./entityNames/PrimaryLanguageField";
import { Label } from "./ui/label";
import { useEntityCreateOption } from "./useEntityCreateOption";

import { useMediaProperties } from "@/hooks/useMediaProperties";
import { usePrimaryLanguageField } from "@/hooks/usePrimaryLanguageField";
import { withFieldGroup } from "@/lib/form";

/** The form fields this shared block reads (matched 1:1 in every taxonomy general form). */
interface TaxonomyGeneralFieldGroup {
  name: string;
  sortOrder: number;
  mediaPropertyId: string;
}

/** The update-input subset this block persists via the parent form's `saveField`. */
interface TaxonomyGeneralUpdateInput {
  name: string;
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
 * The shared name / sort-order / media-property edit block (plus the multilingual Names editor) that
 * the Book, Podcast, and Plex-backed (Movie / TV Show / Episode / Album / Track) taxonomy general
 * forms all render. Each
 * wrapper owns its own `useAppForm` instance and auto-save engine and passes them in: the block is a
 * `withFieldGroup` lens over the four shared fields, so it binds to the parent form without the parent
 * re-listing the fields. It also owns the media-property options query and the inline "Create media
 * property" modal (persisted through the same `saveField`, so the toast wording matches every other
 * field). Text fields auto-save on blur; the media-property combobox on change — the edit-tab standard.
 */
export const TaxonomyGeneralFields = withFieldGroup({
  defaultValues: {
    name: "",
    sortOrder: 0,
    mediaPropertyId: "",
  } satisfies TaxonomyGeneralFieldGroup,
  props: {
    saveField: (() => undefined) as SaveTaxonomyGeneralField,
    currentSlug: "",
    onRenamed: (() => undefined) as (slug: string) => void,
    ownerType: "book" as EntityNameOwnerType,
    ownerId: "",
  } as {
    saveField: SaveTaxonomyGeneralField;
    currentSlug: string;
    onRenamed: (slug: string) => void;
    /** Optional control rendered at the inline-end of the Name input (e.g. a source-sync hint). */
    nameAction?: ReactNode;
    /** Which `entity_names` owner type this entity is, for the multilingual names editor. */
    ownerType: EntityNameOwnerType;
    /** The entity's id, for the multilingual names editor. */
    ownerId: string;
  },
  render: function TaxonomyGeneralFieldsRender({
    group,
    saveField,
    currentSlug,
    onRenamed,
    nameAction,
    ownerType,
    ownerId,
  }) {
    const {
      t,
    } = useTranslation();
    const {
      data: mediaProperties,
    } = useMediaProperties();
    const primaryLanguage = usePrimaryLanguageField(ownerType, ownerId);

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
                label={t("Name")}
                action={nameAction}
                onBlur={() => {
                  const trimmed = field.state.value.trim();
                  saveField(
                    "name",
                    trimmed,
                    {
                      valid: field.state.meta.errors.length === 0,
                      onSuccess: (updated) => {
                        if (updated.slug !== currentSlug) onRenamed(updated.slug);
                      },
                    },
                  );
                  primaryLanguage.syncPrimaryValue(trimmed);
                }}
              />
            )}
          </group.AppField>
          <group.AppField name="sortOrder">
            {field => (
              <field.NumberField
                label={t("Sort order")}
                hint={t("Lower sorts first.")}
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

        <PrimaryLanguageField
          value={primaryLanguage.primaryLanguageId}
          onValueChange={v => primaryLanguage.setPrimaryLanguage(v, group.state.values.name)}
        />

        <div className="space-y-1">
          <Label>{t("Names")}</Label>
          <EntityNamesTabEditor
            ownerType={ownerType}
            ownerId={ownerId}
          />
        </div>

        <group.AppField name="mediaPropertyId">
          {field => (
            <field.ComboboxField
              label={t("Media property")}
              placeholder={t("No media property")}
              searchPlaceholder={t("Search media properties…")}
              emptyText={t("No media properties found.")}
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
