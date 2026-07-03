import type { PlexItemResult } from "@eesimple/types";
import type { UseMutationResult } from "@tanstack/react-query";

import { Clapperboard, X } from "lucide-react";
import { z } from "zod";

import { PlexItemLookup } from "./PlexItemLookup";
import { useEntityCreateOption } from "./useEntityCreateOption";
import { useFieldAutoSave } from "../hooks/useFieldAutoSave";

import { useMediaProperties } from "@/hooks/useMediaProperties";
import { notifyFieldSaved, notifyFieldSaveError } from "@/lib/autoSave";
import { useAppForm } from "@/lib/form";

/** The subset of a Movie / TV Show the shared edit form reads (both entities satisfy it). */
export interface PlexTitle {
  id: string;
  name: string;
  slug: string;
  sortOrder: number;
  mediaPropertyId: string | null;
  plexRatingKey: string | null;
  plexItemType: string | null;
  year: number | null;
}

/** The partial-update payload the shared edit form writes (Movie / TV Show update inputs match this). */
export interface PlexTitleUpdateInput {
  name?: string;
  sortOrder?: number;
  mediaPropertyId?: string | null;
  plexRatingKey?: string | null;
  plexItemType?: string | null;
  year?: number | null;
}

const plexTitleSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  sortOrder: z.number().int(),
  year: z.number().int(),
  mediaPropertyId: z.string(),
});

const LABELS: Record<keyof PlexTitleUpdateInput, string> = {
  name: "Name",
  sortOrder: "Sort order",
  mediaPropertyId: "Media property",
  year: "Year",
  plexRatingKey: "Plex item",
  plexItemType: "Plex item",
};

interface PlexTitleGeneralFormProps<E extends PlexTitle> {
  entity: E;
  /** Which taxonomy — narrows the Plex lookup. */
  kind: "movie" | "show";
  /** The entity's update mutation (`useUpdateMovie` / `useUpdateTvShow`). */
  update: UseMutationResult<E, Error, { id: string;
    input: PlexTitleUpdateInput; }>;
  /** Navigate to the new edit-tab slug after a rename (route-typed by the wrapper). */
  onRenamed: (slug: string) => void;
}

/**
 * Shared auto-save edit form for a Movie or TV Show. Both entities have the same field shape, so the
 * Movie/TV-Show wrappers just supply their entity, `kind`, update mutation, and slug-follow navigation.
 * Each field auto-saves; the Plex lookup persists rating key + type + year in one save + one toast.
 */
export function PlexTitleGeneralForm<E extends PlexTitle>({
  entity,
  kind,
  update,
  onRenamed,
}: PlexTitleGeneralFormProps<E>) {
  const {
    data: mediaProperties,
  } = useMediaProperties();
  const autoSave = useFieldAutoSave<PlexTitleUpdateInput, E>({
    id: entity.id,
    update,
    labels: LABELS,
    initial: {
      name: entity.name,
      sortOrder: entity.sortOrder,
      year: entity.year,
    },
  });

  const mediaPropertyCreate = useEntityCreateOption("media-property", (mediaProperty) => {
    update.mutate(
      {
        id: entity.id,
        input: {
          mediaPropertyId: mediaProperty.id,
        },
      },
      {
        onSuccess: () => notifyFieldSaved("Media property"),
        onError: error => notifyFieldSaveError(
          "Media property",
          error instanceof Error ? error.message : undefined,
        ),
      },
    );
  });

  const form = useAppForm({
    defaultValues: {
      name: entity.name,
      sortOrder: entity.sortOrder,
      year: entity.year ?? 0,
      mediaPropertyId: entity.mediaPropertyId ?? "",
    },
    validators: {
      onChange: plexTitleSchema,
    },
  });

  /** Re-link Plex from a search pick: persist rating key + type + year in one save + one toast. */
  function applyPlex(item: PlexItemResult): void {
    form.setFieldValue("year", item.year ?? 0);
    update.mutate(
      {
        id: entity.id,
        input: {
          plexRatingKey: item.ratingKey,
          plexItemType: item.type,
          year: item.year,
        },
      },
      {
        onSuccess: () => notifyFieldSaved("Plex item"),
        onError: error => notifyFieldSaveError(
          "Plex item",
          error instanceof Error ? error.message : undefined,
        ),
      },
    );
  }

  function clearPlex(): void {
    update.mutate(
      {
        id: entity.id,
        input: {
          plexRatingKey: null,
          plexItemType: null,
        },
      },
      {
        onSuccess: () => notifyFieldSaved("Plex item"),
        onError: error => notifyFieldSaveError(
          "Plex item",
          error instanceof Error ? error.message : undefined,
        ),
      },
    );
  }

  return (
    <div className="space-y-4">
      <div
        className="
          grid gap-3
          sm:grid-cols-[1fr_8rem]
        "
      >
        <form.AppField name="name">
          {field => (
            <field.TextField
              label="Name"
              onBlur={() => autoSave.saveField(
                "name",
                field.state.value.trim(),
                {
                  valid: field.state.meta.errors.length === 0,
                  onSuccess: (updated) => {
                    if (updated.slug !== entity.slug) onRenamed(updated.slug);
                  },
                },
              )}
            />
          )}
        </form.AppField>
        <form.AppField name="sortOrder">
          {field => (
            <field.NumberField
              label="Sort order"
              hint="Lower sorts first."
              onBlur={() => autoSave.saveField(
                "sortOrder",
                field.state.value,
                {
                  valid: field.state.meta.errors.length === 0,
                },
              )}
            />
          )}
        </form.AppField>
      </div>

      <form.AppField name="mediaPropertyId">
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
            onValueChange={value => autoSave.saveField(
              "mediaPropertyId",
              value || null,
              {
                valid: true,
              },
            )}
          />
        )}
      </form.AppField>
      {mediaPropertyCreate.modal}

      <form.AppField name="year">
        {field => (
          <field.NumberField
            label="Year"
            onBlur={() => autoSave.saveField(
              "year",
              field.state.value || null,
              {
                valid: field.state.meta.errors.length === 0,
              },
            )}
          />
        )}
      </form.AppField>

      <div className="space-y-1.5">
        {entity.plexRatingKey !== null
          ? (
            <div
              className="
                flex items-center gap-2 rounded-md border px-3 py-2 text-sm
              "
            >
              <Clapperboard className="size-4 shrink-0 text-muted-foreground" />
              <span className="min-w-0 flex-1 truncate">
                Linked to Plex
              </span>
              <button
                type="button"
                aria-label="Unlink Plex item"
                className="
                  text-muted-foreground
                  hover:text-foreground
                "
                onClick={clearPlex}
              >
                <X className="size-4" />
              </button>
            </div>
          )
          : null}
        <PlexItemLookup
          kind={kind}
          onSelect={applyPlex}
        />
      </div>
    </div>
  );
}
