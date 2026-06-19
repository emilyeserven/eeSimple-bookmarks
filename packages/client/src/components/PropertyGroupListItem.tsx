import type { PropertyGroup } from "@eesimple/types";

import { Link } from "@tanstack/react-router";
import { Pencil } from "lucide-react";

import { RowListItem } from "./RowListItem";
import { useEditPanelClick, useViewPanelClick } from "./panel/useEditPanelClick";

import { Button } from "@/components/ui/button";
import { SIDEBAR_MODIFIER_LABELS } from "@/lib/sidebarModifier";
import { useUiStore } from "@/stores/uiStore";

/** A single row in the property-group listing: a link to the view page plus a hover edit button. */
export function PropertyGroupListItem({
  group,
}: { group: PropertyGroup }) {
  const editClick = useEditPanelClick();
  const viewClick = useViewPanelClick();
  const modifier = useUiStore(state => state.sidebarOpenModifier);

  return (
    <RowListItem
      title={group.name}
      subtitle={group.description || `Priority ${group.priority}`}
      badge={group.propertyCount}
      linkProps={{
        to: "/taxonomies/property-groups/$propertyGroupSlug",
        params: {
          propertyGroupSlug: group.slug,
        },
        title: `Open (hold ${SIDEBAR_MODIFIER_LABELS[modifier]} to open in the sidebar)`,
        onClick: event => viewClick(event, "property-group", group.id),
      }}
      menu={(
        <Button
          asChild
          variant="ghost"
          size="icon"
          className="
            shrink-0 opacity-0 transition-opacity
            group-hover:opacity-100
            focus-visible:opacity-100
          "
        >
          <Link
            to="/taxonomies/property-groups/$propertyGroupSlug/edit"
            params={{
              propertyGroupSlug: group.slug,
            }}
            title={`Edit (hold ${SIDEBAR_MODIFIER_LABELS[modifier]} to open in the sidebar)`}
            onClick={event => editClick(event, "property-group", group.id)}
          >
            <Pencil className="size-4" />
            <span className="sr-only">Edit {group.name}</span>
          </Link>
        </Button>
      )}
    />
  );
}
