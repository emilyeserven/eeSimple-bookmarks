import type { PropertyGroup } from "@eesimple/types";

import { Link } from "@tanstack/react-router";
import { Info, Layers, Pencil } from "lucide-react";

import { useEditPanelClick, useViewPanelClick } from "./panel/useEditPanelClick";
import { HoverIconButton, StandardListingCard } from "./StandardListingCard";
import { useSidebarOpenModifier } from "../hooks/useAppSettings";

import { SIDEBAR_MODIFIER_LABELS } from "@/lib/sidebarModifier";

/**
 * A single row in the property-group listing. Exception to the standard: a property group has no
 * "filtered bookmarks" page, so the card body links to the group's detail page and the badge counts
 * member properties rather than bookmarks. The standard hover Edit + Info buttons still apply.
 */
export function PropertyGroupListItem({
  group,
}: { group: PropertyGroup }) {
  const editClick = useEditPanelClick();
  const viewClick = useViewPanelClick();
  const modifier = useSidebarOpenModifier();

  return (
    <StandardListingCard
      icon={<Layers className="size-5 shrink-0 text-muted-foreground" />}
      title={group.name}
      subtitle={group.description || `Priority ${group.priority}`}
      count={group.propertyCount}
      renderPrimaryLink={(className, children) => (
        <Link
          to="/taxonomies/property-groups/$propertyGroupSlug"
          params={{
            propertyGroupSlug: group.slug,
          }}
          title={`Open (hold ${SIDEBAR_MODIFIER_LABELS[modifier]} to open in the sidebar)`}
          onClick={event => viewClick(event, "property-group", group.id)}
          className={className}
        >
          {children}
        </Link>
      )}
      renderEdit={() => (
        <HoverIconButton>
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
        </HoverIconButton>
      )}
      renderInfo={() => (
        <HoverIconButton>
          <Link
            to="/taxonomies/property-groups/$propertyGroupSlug"
            params={{
              propertyGroupSlug: group.slug,
            }}
            title={`Info (hold ${SIDEBAR_MODIFIER_LABELS[modifier]} to open in the sidebar)`}
            onClick={event => viewClick(event, "property-group", group.id)}
          >
            <Info className="size-4" />
            <span className="sr-only">View {group.name}</span>
          </Link>
        </HoverIconButton>
      )}
    />
  );
}
