import type { PlexKind } from "@/lib/plexParent";
import type { PlexItemResult } from "@eesimple/types";
import type { UseMutationResult } from "@tanstack/react-query";
import type { ReactNode } from "react";

import { Clapperboard, X } from "lucide-react";
import { z } from "zod";

import { PlexItemLookup } from "./PlexItemLookup";
import { useEntityCreateOption } from "./useEntityCreateOption";
import { useFieldAutoSave } from "../hooks/useFieldAutoSave";

import { useMediaProperties } from "@/hooks/useMediaProperties";
import { notifyFieldSaved, notifyFieldSaveError } from "@/lib/autoSave";
import { useAppForm } from "@/lib/form";

/** The subset of any Plex-backed taxonomy row the shared edit form reads (all entities satisfy it). */
export interface PlexTitle {
  id: string;
  name: string;
  /** Optional romanized form of the name, matched by search and shown de-emphasized when present. */
  romanizedName?: string | null;
  slug: string;
  sortOrder: number;
  mediaPropertyId: string | null;
  plexRatingKey: string | null;
  plexItemType: string | null;
  /** Display title of the linked Plex item, denormalized at link time. */
  plexItemTitle?: string | null;
  year: number | null;
}

/** The partial-update payload the shared edit form writes (Movie / TV Show update inputs match this). */
export interface PlexTitleUpdateInput {
  name?: string;
  romanizedName?: string | null;
  sortOrder?: number;
  mediaPropertyId?: string | null;
  plexRatingKey?: string | null;
  plexItemType?: string | null;
  plexItemTitle?: string | null;
  year?: number | null;
}

const plexTitleSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  romanizedName: z.string(),
  sortOrder: z.number().int(),
  year: z.number().int(),
  mediaPropertyId: z.string(),
});

const LABELS: Record<keyof PlexTitleUpdateInput, string> = {
  name: "Name",
  romanizedName: "Romanized name",
  sortOrder: "Sort order",
  mediaPropertyId: "Media property",
  year: "Year",
  plexRatingKey: "Plex item",
  plexItemType: "Plex item",
  plexItemTitle: "Plex item",
};

interface PlexTitleGeneralFormProps<E extends PlexTitle> {
  entity: E;
  /** Which taxonomy — narrows the Plex lookup. */
  kind: PlexKind;
  /** The entity's update mutation (`useUpdateMovie` / `useUpdateEpisode` / …). */
  update: UseMutationResult<E, Error, { id: string;
    input: PlexTitleUpdateInput; }>;
  /** Navigate to the new edit-tab slug after a rename (route-typed by the wrapper). */
  onRenamed: (slug: string) => void;
  /** Extra auto-saving sections rendered after the fields (parent picker / artists M2M). */
  renderExtra?: ReactNode;
  /** Invoked when a Plex search result is picked, for parent/artist autofill in the wrapper. */
  onPlexSelected?: (item: PlexItemResult) => void;
}

/**
 * Shared auto-save edit form for any Plex-backed taxonomy row. All entities have the same core field
 * shape, so the wrappers just supply their entity, `kind`, update mutation, and slug-follow navigation.
 * Entities with a parent (Episode → TV Show, Track → Album) or an M2M (Album ↔ Artist) pass an extra
 * auto-saving section via `renderExtra` and hook the Plex lookup via `onPlexSelected` for autofill.
 * Each field auto-saves; the Plex lookup persists rating key + type + year in one save + one toast.
 */
export function PlexTitleGeneralForm<E extends PlexTitle>({
  entity,
  kind,
  update,
  onRenamed,
  renderExtra,
  onPlexSelected,
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
      romanizedName: entity.romanizedName ?? "",
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
      romanizedName: entity.romanizedName ?? "",
      sortOrder: entity.sortOrder,
      year: entity.year ?? 0,
      mediaPropertyId: entity.mediaPropertyId ?? "",
    },
    validators: {
      onChange: plexTitleSchema,
    },
  });

  /** Re-link Plex from a search pick: persist rating key + type + title + year in one save + one toast. */
  function applyPlex(item: PlexItemResult): void {
    form.setFieldValue("year", item.year ?? 0);
    update.mutate(
      {
        id: entity.id,
        input: {
          plexRatingKey: item.ratingKey,
          plexItemType: item.type,
          plexItemTitle: item.title,
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
    onPlexSelected?.(item);
  }

  function clearPlex(): void {
    update.mutate(
      {
        id: entity.id,
        input: {
          plexRatingKey: null,
          plexItemType: null,
          plexItemTitle: null,
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

      <form.AppField name="romanizedName">
        {field => (
          <field.TextField
            label="Romanized name"
            placeholder="Optional romanized form"
            onBlur={() => autoSave.saveField("romanizedName", field.state.value.trim())}
          />
        )}
      </form.AppField>

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

      {renderExtra}

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
                Linked to Plex: {entity.plexItemTitle ?? "Untitled"} (#{entity.plexRatingKey})
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
