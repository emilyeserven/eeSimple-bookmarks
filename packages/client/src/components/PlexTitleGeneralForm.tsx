import type { createTaxonomyImageApi } from "../lib/api/taxonomyImages";
import type { PlexTitleSyncField } from "../lib/syncSources/plexTitleDiff";
import type { PlexKind } from "@/lib/plexParent";
import type { EntityNameOwnerType, LabeledWebsite, LocationAssignmentOwnerType, PlexItemResult } from "@eesimple/types";
import type { UseMutationResult } from "@tanstack/react-query";
import type { ReactNode } from "react";

import { Clapperboard, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { z } from "zod";

import { GenreMoodAssignmentSection } from "./GenreMoodAssignmentSection";
import { LabeledWebsitesField } from "./LabeledWebsitesField";
import { LocationAssignmentSection } from "./LocationAssignmentSection";
import { PlexItemLookup } from "./PlexItemLookup";
import { TaxonomyGeneralFields } from "./TaxonomyGeneralFields";
import { useFieldAutoSave } from "../hooks/useFieldAutoSave";
import { usePlexTitleSyncRegistration } from "../hooks/usePlexTitleSyncRegistration";
import i18n from "../i18n";

import { notifyFieldSaved, notifyFieldSaveError } from "@/lib/autoSave";
import { useAppForm } from "@/lib/form";

/** The subset of any Plex-backed taxonomy row the shared edit form reads (all entities satisfy it). */
export interface PlexTitle {
  id: string;
  name: string;
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
  labeledWebsites: LabeledWebsite[];
}

/** The partial-update payload the shared edit form writes (Movie / TV Show update inputs match this). */
export interface PlexTitleUpdateInput {
  name?: string;
  sortOrder?: number;
  mediaPropertyId?: string | null;
  plexRatingKey?: string | null;
  plexItemType?: string | null;
  plexItemTitle?: string | null;
  year?: number | null;
  wikidataId?: string | null;
  wikipediaLinkEn?: string | null;
  wikipediaLinkLocal?: string | null;
  labeledWebsites?: LabeledWebsite[];
}

const plexTitleSchema = z.object({
  name: z.string().trim().min(1, i18n.t("Name is required")),
  sortOrder: z.number().int(),
  year: z.number().int(),
  mediaPropertyId: z.string(),
  wikipediaLinkEn: z.string(),
  wikipediaLinkLocal: z.string(),
});

const LABELS: Record<keyof PlexTitleUpdateInput, string> = {
  name: i18n.t("Name"),
  sortOrder: i18n.t("Sort order"),
  mediaPropertyId: i18n.t("Media property"),
  year: i18n.t("Year"),
  plexRatingKey: i18n.t("Plex item"),
  plexItemType: i18n.t("Plex item"),
  plexItemTitle: i18n.t("Plex item"),
  wikidataId: i18n.t("Wikidata"),
  wikipediaLinkEn: i18n.t("Wikipedia (English)"),
  wikipediaLinkLocal: i18n.t("Wikipedia (local)"),
  labeledWebsites: i18n.t("Websites"),
};

interface PlexTitleGeneralFormProps<E extends PlexTitle> {
  entity: E;
  /** Which taxonomy — narrows the Plex lookup. */
  kind: PlexKind;
  /** Which `entity_names` owner type this entity is (distinct from `kind`, which is the Plex item type — e.g. TV Shows pass `kind="show"` but `ownerType="tvShow"`). */
  ownerType: EntityNameOwnerType;
  /** The media-taxonomy owner type for the Genres & Moods + Locations association sections (same value as `ownerType`, but narrowed to the assignable-owner union). */
  mediaOwnerType: LocationAssignmentOwnerType;
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
  ownerType,
  mediaOwnerType,
  update,
  onRenamed,
  renderExtra,
  onPlexSelected,
  base,
  imagesApi,
  queryKeyPrefix,
}: PlexTitleGeneralFormProps<E>) {
  const {
    t,
  } = useTranslation();
  const autoSave = useFieldAutoSave<PlexTitleUpdateInput, E>({
    id: entity.id,
    update,
    labels: LABELS,
    initial: {
      name: entity.name,
      sortOrder: entity.sortOrder,
      year: entity.year,
      wikipediaLinkEn: entity.wikipediaLinkEn ?? "",
      wikipediaLinkLocal: entity.wikipediaLinkLocal ?? "",
      labeledWebsites: entity.labeledWebsites,
    },
  });

  const form = useAppForm({
    defaultValues: {
      name: entity.name,
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
        onSuccess: () => notifyFieldSaved(t("Plex item")),
        onError: error => notifyFieldSaveError(
          t("Plex item"),
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
        onSuccess: () => notifyFieldSaved(t("Plex item")),
        onError: error => notifyFieldSaveError(
          t("Plex item"),
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
  // is mounted — reviews native/English names + Wikipedia links (staged) and the poster (immediate).
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
          sortOrder: "sortOrder",
          mediaPropertyId: "mediaPropertyId",
        }}
        saveField={autoSave.saveField}
        currentSlug={entity.slug}
        onRenamed={onRenamed}
        ownerType={ownerType}
        ownerId={entity.id}
      />

      <form.AppField name="year">
        {field => (
          <field.NumberField
            label={t("Year")}
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
            label={t("Wikipedia (English)")}
            placeholder="https://en.wikipedia.org/wiki/…"
            onBlur={() => autoSave.saveField("wikipediaLinkEn", field.state.value.trim())}
          />
        )}
      </form.AppField>

      <form.AppField name="wikipediaLinkLocal">
        {field => (
          <field.TextField
            label={t("Wikipedia (local)")}
            placeholder="https://<lang>.wikipedia.org/wiki/…"
            onBlur={() => autoSave.saveField("wikipediaLinkLocal", field.state.value.trim())}
          />
        )}
      </form.AppField>

      <LabeledWebsitesField
        labeledWebsites={entity.labeledWebsites}
        onChange={next => autoSave.saveField("labeledWebsites", next)}
      />

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
                {t("Linked to Plex: {{title}} (#{{ratingKey}})", {
                  title: entity.plexItemTitle ?? t("Untitled"),
                  ratingKey: entity.plexRatingKey,
                })}
              </span>
              <button
                type="button"
                aria-label={t("Unlink Plex item")}
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

      <GenreMoodAssignmentSection
        ownerType={mediaOwnerType}
        ownerId={entity.id}
      />

      <LocationAssignmentSection
        ownerType={mediaOwnerType}
        ownerId={entity.id}
      />
    </div>
  );
}
