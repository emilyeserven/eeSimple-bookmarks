import type { LocationRelation } from "@eesimple/types";

import { Link } from "@tanstack/react-router";
import { Info, Pencil, Waypoints } from "lucide-react";
import { useTranslation } from "react-i18next";

import { HoverIconButton, StandardListingCard } from "./StandardListingCard";

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
          title={t("View {{name}}", {
            name: locationRelation.name,
          })}
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
            title={t("Edit {{name}}", {
              name: locationRelation.name,
            })}
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
            title={t("View {{name}}", {
              name: locationRelation.name,
            })}
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
