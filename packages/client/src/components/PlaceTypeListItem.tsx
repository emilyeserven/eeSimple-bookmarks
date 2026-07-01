import type { PlaceType } from "@eesimple/types";

import { Link } from "@tanstack/react-router";
import { Info, MapPinned, Pencil } from "lucide-react";

import { useEditPanelClick, useViewPanelClick } from "./panel/useEditPanelClick";
import { HoverIconButton, StandardListingCard } from "./StandardListingCard";
import { useSidebarOpenModifier } from "../hooks/useAppSettings";

import { SIDEBAR_MODIFIER_LABELS, entityLinkTitle } from "@/lib/sidebarModifier";

/**
 * A single row in the place-type listing. Exception to the standard: a place type has no "filtered
 * bookmarks" page, so the card body links to the place type's detail page and the badge counts the
 * locations that use it rather than bookmarks. The standard hover Edit + Info buttons still apply.
 */
export function PlaceTypeListItem({
  placeType,
  selectable,
  selected,
  onSelectToggle,
  inSelectionMode,
}: {
  placeType: PlaceType;
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
      icon={<MapPinned className="size-5 shrink-0 text-muted-foreground" />}
      title={placeType.name}
      count={placeType.locationCount}
      renderPrimaryLink={(className, children) => (
        <Link
          to="/taxonomies/place-types/$placeTypeSlug/general"
          params={{
            placeTypeSlug: placeType.slug,
          }}
          title={entityLinkTitle(modifier)}
          onClick={event => viewClick(event, "place-type", placeType.id, placeType.slug)}
          className={className}
        >
          {children}
        </Link>
      )}
      renderEdit={() => (
        <HoverIconButton>
          <Link
            to="/taxonomies/place-types/$placeTypeSlug/edit"
            params={{
              placeTypeSlug: placeType.slug,
            }}
            title={`Edit (hold ${SIDEBAR_MODIFIER_LABELS[modifier]} to open in the sidebar)`}
            onClick={event => editClick(event, "place-type", placeType.id)}
          >
            <Pencil className="size-4" />
            <span className="sr-only">Edit {placeType.name}</span>
          </Link>
        </HoverIconButton>
      )}
      renderInfo={() => (
        <HoverIconButton>
          <Link
            to="/taxonomies/place-types/$placeTypeSlug/general"
            params={{
              placeTypeSlug: placeType.slug,
            }}
            title={entityLinkTitle(modifier)}
            onClick={event => viewClick(event, "place-type", placeType.id, placeType.slug)}
          >
            <Info className="size-4" />
            <span className="sr-only">View {placeType.name}</span>
          </Link>
        </HoverIconButton>
      )}
    />
  );
}
