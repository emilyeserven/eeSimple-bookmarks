import type { RelationshipType } from "@eesimple/types";

import { Link } from "@tanstack/react-router";
import { Info, Link2, Pencil } from "lucide-react";

import { useEditPanelClick, useViewPanelClick } from "./panel/useEditPanelClick";
import { HoverIconButton, StandardListingCard } from "./StandardListingCard";
import { useSidebarOpenModifier } from "../hooks/useAppSettings";

import { Badge } from "@/components/ui/badge";
import { SIDEBAR_MODIFIER_LABELS, entityLinkTitle } from "@/lib/sidebarModifier";

/** A single relationship-type listing card: body → its detail page, with hover Edit / Info. */
export function RelationshipTypeCard({
  relationshipType,
  selectable,
  selected,
  onSelectToggle,
  inSelectionMode,
}: {
  relationshipType: RelationshipType;
  selectable?: boolean;
  selected?: boolean;
  onSelectToggle?: () => void;
  inSelectionMode?: boolean;
}) {
  const editClick = useEditPanelClick();
  const viewClick = useViewPanelClick();
  const modifier = useSidebarOpenModifier();

  return (
    <StandardListingCard
      selectable={selectable}
      selected={selected}
      onSelectToggle={onSelectToggle}
      inSelectionMode={inSelectionMode}
      icon={<Link2 className="size-5 shrink-0 text-muted-foreground" />}
      title={relationshipType.name}
      titleAdornment={relationshipType.builtIn
        ? <Badge variant="secondary">Built-in</Badge>
        : undefined}
      subtitle={relationshipType.directional ? "Directional" : "Symmetric"}
      count={relationshipType.bookmarkCount}
      renderPrimaryLink={(className, children) => (
        <Link
          to="/taxonomies/relationship-types/$relationshipTypeSlug/general"
          params={{
            relationshipTypeSlug: relationshipType.slug,
          }}
          title={entityLinkTitle(modifier)}
          onClick={event => viewClick(event, "relationship-type", relationshipType.id, relationshipType.slug)}
          className={className}
        >
          {children}
        </Link>
      )}
      renderEdit={() => (
        <HoverIconButton>
          <Link
            to="/taxonomies/relationship-types/$relationshipTypeSlug/edit"
            params={{
              relationshipTypeSlug: relationshipType.slug,
            }}
            title={`Edit (hold ${SIDEBAR_MODIFIER_LABELS[modifier]} to open in the sidebar)`}
            onClick={event => editClick(event, "relationship-type", relationshipType.id)}
          >
            <Pencil className="size-4" />
            <span className="sr-only">Edit {relationshipType.name}</span>
          </Link>
        </HoverIconButton>
      )}
      renderInfo={() => (
        <HoverIconButton>
          <Link
            to="/taxonomies/relationship-types/$relationshipTypeSlug/general"
            params={{
              relationshipTypeSlug: relationshipType.slug,
            }}
            title={entityLinkTitle(modifier)}
            onClick={event => viewClick(event, "relationship-type", relationshipType.id, relationshipType.slug)}
          >
            <Info className="size-4" />
            <span className="sr-only">View {relationshipType.name}</span>
          </Link>
        </HoverIconButton>
      )}
    />
  );
}
