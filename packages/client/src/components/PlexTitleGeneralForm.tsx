import type { createTaxonomyImageApi } from "../lib/api/taxonomyImages";
import type { PlexTitleSyncField } from "../lib/syncSources/plexTitleDiff";
import type { PlexKind } from "@/lib/plexParent";
import type { PlexItemResult } from "@eesimple/types";
import type { UseMutationResult } from "@tanstack/react-query";
import type { ReactNode } from "react";

import { Clapperboard, X } from "lucide-react";
import { z } from "zod";

import { PlexItemLookup } from "./PlexItemLookup";
import { TaxonomyGeneralFields } from "./TaxonomyGeneralFields";
import { useFieldAutoSave } from "../hooks/useFieldAutoSave";
import { usePlexTitleSyncRegistration } from "../hooks/usePlexTitleSyncRegistration";

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
  wikidataId?: string | null;
  wikipediaLinkEn?: string | null;
  wikipediaLinkLocal?: string | null;
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
  wikidataId?: string | null;
  wikipediaLinkEn?: string | null;
  wikipediaLinkLocal?: string | null;
}

const plexTitleSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  romanizedName: z.string(),
  sortOrder: z.number().int(),
  year: z.number().int(),
  mediaPropertyId: z.string(),
  wikipediaLinkEn: z.string(),
  wikipediaLinkLocal: z.string(),
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
  wikidataId: "Wikidata",
  wikipediaLinkEn: "Wikipedia (English)",
  wikipediaLinkLocal: "Wikipedia (local)",
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
  /** Extra auto-saving sections rendered after the fields (parent picker / credit M2M). */
  renderExtra?: ReactNode;
  /** Invoked when a Plex search result is picked, for parent/credit autofill in the wrapper. */
  onPlexSelected?: (item: PlexItemResult) => void;
  /** REST base path segment for this taxonomy (e.g. `"movies"` / `"tv-shows"`) — the sync preview endpoint. */
  base: string;
  /** This taxonomy's image gallery api + cache-key prefix, for the sync flow's poster row. */
  imagesApi: ReturnType<typeof createTaxonomyImageApi>;
  queryKeyPrefix: string;
}

/**
 * Shared auto-save edit form for any Plex-backed taxonomy row. All entities have the same core field
 * shape, so the wrappers just supply their entity, `kind`, update mutation, and slug-follow navigation.
 * Entities with a parent (Episode → TV Show, Track → Album) or a credit M2M (Album ↔ People/Publishers)
 * pass an extra auto-saving section via `renderExtra` and hook the Plex lookup via `onPlexSelected`.
 * Each field auto-saves; the Plex lookup persists rating key + type + year in one save + one toast.
 */
export function PlexTitleGeneralForm<E extends PlexTitle>({
  entity,
  kind,
  update,
  onRenamed,
  renderExtra,
  onPlexSelected,
  base,
  imagesApi,
  queryKeyPrefix,
}: PlexTitleGeneralFormProps<E>) {
  const autoSave = useFieldAutoSave<PlexTitleUpdateInput, E>({
    id: entity.id,
    update,
    labels: LABELS,
    initial: {
      name: entity.name,
      romanizedName: entity.romanizedName ?? "",
      sortOrder: entity.sortOrder,
      year: entity.year,
      wikipediaLinkEn: entity.wikipediaLinkEn ?? "",
      wikipediaLinkLocal: entity.wikipediaLinkLocal ?? "",
    },
  });

  const form = useAppForm({
    defaultValues: {
      name: entity.name,
      romanizedName: entity.romanizedName ?? "",
      sortOrder: entity.sortOrder,
      year: entity.year ?? 0,
      mediaPropertyId: entity.mediaPropertyId ?? "",
      wikipediaLinkEn: entity.wikipediaLinkEn ?? "",
      wikipediaLinkLocal: entity.wikipediaLinkLocal ?? "",
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

  /** Stage a synced text field into the form + persist it (per-field auto-save); a name change follows the slug. */
  function applyText(field: PlexTitleSyncField, value: string): void {
    form.setFieldValue(field, value);
    if (field === "name") {
      autoSave.saveField("name", value.trim(), {
        valid: value.trim() !== "",
        onSuccess: (updated) => {
          if (updated.slug !== entity.slug) onRenamed(updated.slug);
        },
      });
    }
    else {
      autoSave.saveField(field, value.trim());
    }
  }

  // Publish the Plex "Sync from source" provider (header button + review modal) while this edit form
  // is mounted — reviews native/romanized names + Wikipedia links (staged) and the poster (immediate).
  usePlexTitleSyncRegistration({
    entity,
    base,
    imagesApi,
    queryKeyPrefix,
    applyText,
  });

  return (
    <div className="space-y-4">
      <TaxonomyGeneralFields
        form={form}
        fields={{
          name: "name",
          romanizedName: "romanizedName",
          sortOrder: "sortOrder",
          mediaPropertyId: "mediaPropertyId",
        }}
        saveField={autoSave.saveField}
        currentSlug={entity.slug}
        onRenamed={onRenamed}
      />

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

      <form.AppField name="wikipediaLinkEn">
        {field => (
          <field.TextField
            label="Wikipedia (English)"
            placeholder="https://en.wikipedia.org/wiki/…"
            onBlur={() => autoSave.saveField("wikipediaLinkEn", field.state.value.trim())}
          />
        )}
      </form.AppField>

      <form.AppField name="wikipediaLinkLocal">
        {field => (
          <field.TextField
            label="Wikipedia (local)"
            placeholder="https://<lang>.wikipedia.org/wiki/…"
            onBlur={() => autoSave.saveField("wikipediaLinkLocal", field.state.value.trim())}
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
