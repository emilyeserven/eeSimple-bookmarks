import type { LocationNode } from "@eesimple/types";

import { Link } from "@tanstack/react-router";
import { Info, Pencil } from "lucide-react";

import { useEditPanelClick, useViewPanelClick } from "./panel/useEditPanelClick";
import { RomanizedLabel } from "./RomanizedLabel";
import { TaxonomyTreeList } from "./TaxonomyTreeRow";
import { useSidebarOpenModifier } from "../hooks/useAppSettings";

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
}

/** Read-only, collapsible location tree. Each root node is its own card; cards flow in a responsive grid. */
export function LocationTreeList({
  tree, expanded, onToggle, columns,
}: LocationTreeListProps) {
  const editClick = useEditPanelClick();
  const viewClick = useViewPanelClick();
  const modifier = useSidebarOpenModifier();

  return (
    <TaxonomyTreeList
      tree={tree}
      expanded={expanded}
      onToggle={onToggle}
      columns={columns}
      // The location taxonomy already conveys "this is a place" via its breadcrumb/context, so the
      // generic tag glyph is redundant here — render no icon.
      renderIcon={() => null}
      renderNameLink={node => (
        <Link
          to="/taxonomies/locations/$locationSlug"
          params={{
            locationSlug: node.slug,
          }}
          title={`Show ${node.name} bookmarks`}
          className="
            min-w-0 flex-1
            hover:underline
          "
        >
          <RomanizedLabel
            name={node.name}
            romanized={(node as unknown as LocationNode).romanizedName}
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
          aria-label={`Edit ${node.name}`}
          title={`Edit (hold ${SIDEBAR_MODIFIER_LABELS[modifier]} to open in the sidebar)`}
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
          aria-label={`View ${node.name}`}
          title={entityLinkTitle(modifier)}
          onClick={event => viewClick(event, "location", node.id, node.slug)}
        >
          <Info className="size-4" />
        </Link>
      )}
    />
  );
}
