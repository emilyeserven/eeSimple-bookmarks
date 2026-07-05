import type { LocationNode } from "@eesimple/types";

import { Link } from "@tanstack/react-router";
import { Info, Pencil } from "lucide-react";
import { useTranslation } from "react-i18next";

import { LocalizedNameLabel } from "./LocalizedNameLabel";
import { useEditPanelClick, useViewPanelClick } from "./panel/useEditPanelClick";
import { TaxonomyTreeList } from "./TaxonomyTreeRow";
import { useSidebarOpenModifier } from "../hooks/useAppSettings";
import { expandableIds } from "../lib/tagTree";

import { SIDEBAR_MODIFIER_LABELS, entityLinkTitle } from "@/lib/sidebarModifier";

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
  /** Toggle a location into/out of the map filter from a per-row button. Opt-in. */
  onToggleFilter?: (id: string) => void;
}

/** Read-only, collapsible location tree. Each root node is its own card; cards flow in a responsive grid. */
export function LocationTreeList({
  tree, expanded, onToggle, columns, onExpandMany, filterIds = [], onToggleFilter,
}: LocationTreeListProps) {
  const {
    t,
  } = useTranslation();
  const editClick = useEditPanelClick();
  const viewClick = useViewPanelClick();
  const modifier = useSidebarOpenModifier();
  const filterSet = new Set(filterIds);

  return (
    <TaxonomyTreeList
      tree={tree}
      expanded={expanded}
      onToggle={onToggle}
      columns={columns}
      onExpandSubtree={onExpandMany ? node => onExpandMany(expandableIds([node])) : undefined}
      onToggleFilter={onToggleFilter ? node => onToggleFilter(node.id) : undefined}
      isFiltered={onToggleFilter ? node => filterSet.has(node.id) : undefined}
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
          title={t("Edit (hold {{modifier}} to open in the sidebar)", {
            modifier: SIDEBAR_MODIFIER_LABELS[modifier],
          })}
          onClick={event => editClick(event, "location", node.id)}
        >
          <Pencil className="size-4" />
        </Link>
      )}
      renderInfoLink={node => (
        <Link
          to="/taxonomies/locations/$locationSlug/general"
          params={{
            locationSlug: node.slug,
          }}
          aria-label={t("View {{name}}", {
            name: node.name,
          })}
          title={entityLinkTitle(modifier)}
          onClick={event => viewClick(event, "location", node.id, node.slug)}
        >
          <Info className="size-4" />
        </Link>
      )}
    />
  );
}
