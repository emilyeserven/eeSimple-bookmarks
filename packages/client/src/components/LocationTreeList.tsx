import type { LocationNode } from "@eesimple/types";

import { Link } from "@tanstack/react-router";
import { Info, Pencil } from "lucide-react";
import { useTranslation } from "react-i18next";

import { LocalizedNameLabel } from "./LocalizedNameLabel";
import { TaxonomyTreeList } from "./TaxonomyTreeRow";
import { useFavoriteToggle } from "../hooks/useFavoriteToggle";
import { isLocationHidden } from "../lib/locationMainMap";
import { expandableIds, flattenTree } from "../lib/tagTree";

import { useIsMobile } from "@/hooks/use-mobile";

interface LocationTreeListProps {
  /** The root locations to render. */
  tree: LocationNode[];
  /** Ids of locations whose children are currently expanded. */
  expanded: Set<string>;
  /** Toggle the expanded state of a location. */
  onToggle: (id: string) => void;
  /** Number of grid columns. */
  columns: number;
  /**
   * Union-expand a node's whole subtree (per-row "Expand all"). Opt-in — omit on surfaces (the
   * Hierarchy tab, stories) that don't want per-row expand affordances.
   */
  onExpandMany?: (ids: string[]) => void;
  /** Location ids currently focusing the map (empty = all). Only meaningful with {@link onToggleFilter}. */
  filterIds?: string[];
  /** Toggle a location into/out of the map focus from a per-row button. Opt-in. */
  onToggleFilter?: (id: string) => void;
  /** Session map-visibility overrides per location id (absent = the persisted `hiddenOnMainMap` default). */
  hiddenOverrides?: Record<string, boolean>;
  /** Show/hide a location on the map from its per-row eye button (passes the current hidden state). Opt-in. */
  onToggleVisibility?: (id: string, currentlyHidden: boolean) => void;
}

/** Read-only, collapsible location tree. Each root node is its own card; cards flow in a responsive grid. */
export function LocationTreeList({
  tree, expanded, onToggle, columns, onExpandMany, filterIds = [], onToggleFilter,
  hiddenOverrides = {}, onToggleVisibility,
}: LocationTreeListProps) {
  const {
    t,
  } = useTranslation();
  const isMobile = useIsMobile();
  const favorite = useFavoriteToggle("location");
  const filterSet = new Set(filterIds);
  // The effectively-hidden ids across this tree (session override, else the persisted setting).
  const hiddenSet = new Set(
    flattenTree(tree).filter(f => isLocationHidden(f.node, hiddenOverrides)).map(f => f.node.id),
  );

  return (
    <TaxonomyTreeList
      tree={tree}
      expanded={expanded}
      onToggle={onToggle}
      columns={columns}
      // Touch devices have no hover, so reveal the per-row action buttons unconditionally there.
      alwaysShowActions={isMobile}
      onExpandSubtree={onExpandMany ? node => onExpandMany(expandableIds([node])) : undefined}
      onToggleFilter={onToggleFilter ? node => onToggleFilter(node.id) : undefined}
      isFiltered={onToggleFilter ? node => filterSet.has(node.id) : undefined}
      onToggleVisibility={onToggleVisibility
        ? node => onToggleVisibility(node.id, hiddenSet.has(node.id))
        : undefined}
      isHidden={onToggleVisibility ? node => hiddenSet.has(node.id) : undefined}
      isFavorite={node => Boolean((node as unknown as LocationNode).isFavorite)}
      onToggleFavorite={node => favorite.toggle({
        id: node.id,
        name: node.name,
        isFavorite: Boolean((node as unknown as LocationNode).isFavorite),
      })}
      // The location taxonomy already conveys "this is a place" via its breadcrumb/context, so the
      // generic tag glyph is redundant here — render no icon.
      renderIcon={() => null}
      renderNameLink={node => (
        <Link
          to="/taxonomies/locations/$locationSlug"
          params={{
            locationSlug: node.slug,
          }}
          title={t("Show {{name}} bookmarks", {
            name: node.name,
          })}
          className="
            min-w-0 flex-1
            hover:underline
          "
        >
          <LocalizedNameLabel
            names={(node as unknown as LocationNode).names ?? []}
            base={node.name}
            stacked
          />
        </Link>
      )}
      renderEditLink={node => (
        <Link
          to="/taxonomies/locations/$locationSlug/edit"
          params={{
            locationSlug: node.slug,
          }}
          aria-label={t("Edit {{name}}", {
            name: node.name,
          })}
          title={t("Edit {{name}}", {
            name: node.name,
          })}
        >
          <Pencil className="size-4" />
        </Link>
      )}
      renderInfoLink={node => (
        <Link
          to="/taxonomies/locations/$locationSlug/info"
          params={{
            locationSlug: node.slug,
          }}
          aria-label={t("View {{name}}", {
            name: node.name,
          })}
          title={t("View {{name}}", {
            name: node.name,
          })}
        >
          <Info className="size-4" />
        </Link>
      )}
    />
  );
}
