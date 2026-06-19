import type { PropertyGroup } from "@eesimple/types";

import { Link } from "@tanstack/react-router";
import { Pencil } from "lucide-react";

import { useEditPanelClick, useViewPanelClick } from "./panel/useEditPanelClick";

import { Badge } from "@/components/ui/badge";
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
    <li className="group rounded-lg border bg-card">
      <div
        className="
          flex items-center gap-3 rounded-lg p-4 transition-colors
          hover:bg-accent
        "
      >
        <Link
          to="/taxonomies/property-groups/$propertyGroupSlug"
          params={{
            propertyGroupSlug: group.slug,
          }}
          title={`Open (hold ${SIDEBAR_MODIFIER_LABELS[modifier]} to open in the sidebar)`}
          onClick={event => viewClick(event, "property-group", group.id)}
          className="min-w-0 flex-1"
        >
          <p className="font-medium">{group.name}</p>
          <p className="truncate text-sm text-muted-foreground">
            {group.description || `Priority ${group.priority}`}
          </p>
        </Link>
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
        {group.propertyCount !== undefined
          ? <Badge variant="secondary">{group.propertyCount}</Badge>
          : null}
      </div>
    </li>
  );
}
