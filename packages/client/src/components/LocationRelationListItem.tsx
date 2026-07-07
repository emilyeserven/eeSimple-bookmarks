import type { LocationRelation } from "@eesimple/types";

import { Link } from "@tanstack/react-router";
import { Info, Pencil, Waypoints } from "lucide-react";
import { useTranslation } from "react-i18next";

import { useEditPanelClick, useViewPanelClick } from "./panel/useEditPanelClick";
import { HoverIconButton, StandardListingCard } from "./StandardListingCard";
import { useSidebarOpenModifier } from "../hooks/useAppSettings";

import { SIDEBAR_MODIFIER_LABELS, entityLinkTitle } from "@/lib/sidebarModifier";

/**
 * A single row in the location-relation listing. Like place types, a relation has no "filtered
 * bookmarks" page, so the card body links to its detail page and the badge counts the bookmarks whose
 * location edges use it. The standard hover Edit + Info buttons apply.
 */
export function LocationRelationListItem({
  locationRelation,
  selectable,
  selected,
  onSelectToggle,
  inSelectionMode,
}: {
  locationRelation: LocationRelation;
  selectable?: boolean;
  selected?: boolean;
  onSelectToggle?: () => void;
  inSelectionMode?: boolean;
}) {
  const {
    t,
  } = useTranslation();
  const editClick = useEditPanelClick();
  const viewClick = useViewPanelClick();
  const modifier = useSidebarOpenModifier();

  return (
    <StandardListingCard
      selectable={selectable}
      selected={selected}
      onSelectToggle={onSelectToggle}
      inSelectionMode={inSelectionMode}
      icon={<Waypoints className="size-5 shrink-0 text-muted-foreground" />}
      title={locationRelation.name}
      count={locationRelation.bookmarkCount}
      renderPrimaryLink={(className, children) => (
        <Link
          to="/taxonomies/location-relations/$locationRelationSlug/info"
          params={{
            locationRelationSlug: locationRelation.slug,
          }}
          title={entityLinkTitle(modifier)}
          onClick={event => viewClick(event, "location-relation", locationRelation.id, locationRelation.slug)}
          className={className}
        >
          {children}
        </Link>
      )}
      renderEdit={() => (
        <HoverIconButton>
          <Link
            to="/taxonomies/location-relations/$locationRelationSlug/edit"
            params={{
              locationRelationSlug: locationRelation.slug,
            }}
            title={t("Edit (hold {{modifier}} to open in the sidebar)", {
              modifier: SIDEBAR_MODIFIER_LABELS[modifier],
            })}
            onClick={event => editClick(event, "location-relation", locationRelation.id)}
          >
            <Pencil className="size-4" />
            <span className="sr-only">
              {t("Edit {{name}}", {
                name: locationRelation.name,
              })}
            </span>
          </Link>
        </HoverIconButton>
      )}
      renderInfo={() => (
        <HoverIconButton>
          <Link
            to="/taxonomies/location-relations/$locationRelationSlug/info"
            params={{
              locationRelationSlug: locationRelation.slug,
            }}
            title={entityLinkTitle(modifier)}
            onClick={event => viewClick(event, "location-relation", locationRelation.id, locationRelation.slug)}
          >
            <Info className="size-4" />
            <span className="sr-only">
              {t("View {{name}}", {
                name: locationRelation.name,
              })}
            </span>
          </Link>
        </HoverIconButton>
      )}
    />
  );
}
