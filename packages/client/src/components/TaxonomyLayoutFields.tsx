/* eslint-disable react-refresh/only-export-components -- this module pairs the per-taxonomy
   layout field components (view/edit) with the `useTaxonomyDynamicFields` hook that maps each
   user taxonomy to one placeable field; splitting them would obscure the one-taxonomy-one-field map */
import type { DynamicFieldSet, WorkbenchField } from "./workbench/types";
import type { LayoutStorageKind, Taxonomy, TaxonomyOwnerType } from "@eesimple/types";

import { useMemo } from "react";

import { GENRES_MOODS_TAXONOMY_SLUG, isTaxonomyLayoutKind } from "@eesimple/types";
import { Tags } from "lucide-react";

import { LabeledSection } from "./LabeledSection";
import { TaxonomyAssignmentSection } from "./TaxonomyAssignmentSection";
import { useTaxonomies } from "../hooks/useTaxonomies";
import { useOwnerTaxonomyTermsFor } from "../hooks/useTaxonomyAssignments";

/** Prefix for the runtime layout-field key of a taxonomy (kept distinct from custom-property id keys). */
export const TAXONOMY_FIELD_PREFIX = "taxonomy:";

/** Layout tab+section a taxonomy field defaults to on any owner (operator can relocate via Page Layouts). */
export const TAXONOMY_FIELD_HOME = {
  tabKey: "general",
  sectionKey: "general",
} as const;

/**
 * Map a layout kind to the taxonomy owner type whose page taxonomy fields should surface on, or
 * `null` for a kind that isn't a taxonomy owner (config entities, genre-mood during the additive
 * phase). A custom-layout taxonomy term (`taxonomy:<id>`) and the shared `taxonomy-term` kind both
 * map to the `taxonomy` owner (terms can carry other taxonomies' terms).
 */
export function layoutKindToTaxonomyOwnerType(
  kind: LayoutStorageKind | undefined,
): TaxonomyOwnerType | null {
  if (!kind) return null;
  if (kind === "taxonomy-term" || isTaxonomyLayoutKind(kind)) return "taxonomy";
  const map: Partial<Record<string, TaxonomyOwnerType>> = {
    "bookmark": "bookmark",
    "category": "category",
    "tag": "tag",
    "website": "website",
    "person": "person",
    "group": "group",
    "newsletter": "newsletter",
    "location": "location",
    "language": "language",
    "media-type": "mediaType",
    "youtube-channel": "youtubeChannel",
  };
  return map[kind] ?? null;
}

/** Read-only display of the terms of one taxonomy attached to an owner. Self-hides when empty. */
function TaxonomyTermsView({
  taxonomy, ownerType, ownerId,
}: {
  taxonomy: Taxonomy;
  ownerType: TaxonomyOwnerType;
  ownerId: string;
}) {
  const {
    terms,
  } = useOwnerTaxonomyTermsFor(taxonomy.id, ownerType, ownerId);
  if (terms.length === 0) return null;
  return (
    <LabeledSection title={taxonomy.name}>
      <div className="flex flex-wrap gap-1.5">
        {terms.map(term => (
          <span
            key={term.id}
            className="
              rounded-full bg-secondary px-2 py-0.5 text-xs
              text-secondary-foreground
            "
          >
            {term.name}
          </span>
        ))}
      </div>
    </LabeledSection>
  );
}

/**
 * The **dynamic** placeable taxonomy fields — one field per user taxonomy, keyed
 * `taxonomy:<taxonomyId>`. `view` shows the attached terms; `edit` is the auto-saving
 * {@link TaxonomyAssignmentSection}. Merged into an owner's resolved layout via the descriptor's
 * `useDynamicFields`, so every taxonomy is an independently placeable field on that owner's
 * view/edit pages. Hidden taxonomies are skipped. `excludeId` self-excludes the owner term when the
 * owner is itself a taxonomy term (`ownerType === "taxonomy"`).
 */
export function useTaxonomyDynamicFields<E extends { id: string }>(
  ownerType: TaxonomyOwnerType | null,
  defaultHome: { tabKey: string;
    sectionKey: string; },
): DynamicFieldSet<E> {
  const {
    data: taxonomies,
  } = useTaxonomies();
  return useMemo(() => {
    const fields: Record<string, WorkbenchField<E>> = {};
    if (!ownerType) return {
      fields,
      defaultHome,
    };
    for (const taxonomy of taxonomies ?? []) {
      if (taxonomy.hidden) continue;
      // Genres & Moods keeps its own bespoke bookmark/entity picker (backed by the same taxonomy
      // data), so skip it here to avoid a duplicate field.
      if (taxonomy.slug === GENRES_MOODS_TAXONOMY_SLUG) continue;
      const key = `${TAXONOMY_FIELD_PREFIX}${taxonomy.id}`;
      fields[key] = {
        key,
        label: taxonomy.name,
        icon: Tags,
        view: ({
          entity,
        }) => (
          <TaxonomyTermsView
            taxonomy={taxonomy}
            ownerType={ownerType}
            ownerId={entity.id}
          />
        ),
        edit: ({
          entity,
        }) => (
          <TaxonomyAssignmentSection
            taxonomy={taxonomy}
            ownerType={ownerType}
            ownerId={entity.id}
            excludeId={ownerType === "taxonomy" ? entity.id : undefined}
          />
        ),
      };
    }
    return {
      fields,
      defaultHome,
    };
  }, [taxonomies, ownerType, defaultHome]);
}
