import type { PlaceType } from "@eesimple/types";

import { placeTypeKey } from "@eesimple/types";
import { Link } from "@tanstack/react-router";
import { Info, Map, Pencil, Shapes } from "lucide-react";
import { useTranslation } from "react-i18next";

import { useEditPanelClick, useViewPanelClick } from "./panel/useEditPanelClick";
import { HoverIconButton, StandardListingCard } from "./StandardListingCard";
import { useSidebarOpenModifier } from "../hooks/useAppSettings";
import { useLocationLevels } from "../hooks/useLocationLevels";

import { Button } from "@/components/ui/button";
import { CategoryIcon } from "@/lib/icons";
import { SIDEBAR_MODIFIER_LABELS, entityLinkTitle } from "@/lib/sidebarModifier";
import { cn } from "@/lib/utils";

/**
 * A single row in the place-type listing. Exception to the standard: a place type has no "filtered
 * bookmarks" page, so the card body links to the place type's detail page and the badge counts the
 * locations that use it rather than bookmarks. The standard hover Edit + Info buttons still apply.
 * `filtered`/`onToggleFilter` add a "Filter map" toggle (an extra hover action, per
 * `StandardListingCard`'s `renderExtra` slot) that focuses the listing's map on this place type.
 */
export function PlaceTypeListItem({
  placeType,
  selectable,
  selected,
  onSelectToggle,
  inSelectionMode,
  filtered,
  onToggleFilter,
}: {
  placeType: PlaceType;
  selectable?: boolean;
  selected?: boolean;
  onSelectToggle?: () => void;
  inSelectionMode?: boolean;
  /** Whether this place type is currently focused on the listing's map. */
  filtered?: boolean;
  /** Toggle this place type in/out of the map filter. Omit to hide the "Filter map" button. */
  onToggleFilter?: () => void;
}) {
  const {
    t,
  } = useTranslation();
  const editClick = useEditPanelClick();
  const viewClick = useViewPanelClick();
  const modifier = useSidebarOpenModifier();
  const {
    groups, placeTypeIcons,
  } = useLocationLevels({
    notify: false,
  });

  // Match the Pin/Area split in the Pin Style settings (`PlaceTypeIconsCard`): a place type assigned
  // to a pin-mode level shows its configured (or default) pin icon; everything else — area-mode or
  // unassigned — shows a generic area icon.
  const key = placeTypeKey(placeType.slug);
  const isPinType = groups.some(group => group.displayMode === "pin" && group.placeTypes.includes(key));
  const icon = isPinType
    ? (
      <CategoryIcon
        name={placeTypeIcons[key] ?? "MapPin"}
        className="size-5 shrink-0 text-muted-foreground"
      />
    )
    : <Shapes className="size-5 shrink-0 text-muted-foreground" />;

  return (
    <StandardListingCard
      selectable={selectable}
      selected={selected}
      onSelectToggle={onSelectToggle}
      inSelectionMode={inSelectionMode}
      icon={icon}
      title={placeType.name}
      count={placeType.locationCount}
      renderExtra={onToggleFilter
        ? () => (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={filtered
              ? t("Remove {{name}} from map filter", {
                name: placeType.name,
              })
              : t("Filter map to {{name}}", {
                name: placeType.name,
              })}
            aria-pressed={filtered}
            title={filtered ? t("Filtering map (click to clear)") : t("Filter map to this place type")}
            onClick={onToggleFilter}
            className={cn(
              "shrink-0 transition-opacity",
              filtered
                ? "text-primary opacity-100"
                : `
                  opacity-0
                  group-hover:opacity-100
                  focus-visible:opacity-100
                `,
            )}
          >
            <Map className="size-4" />
          </Button>
        )
        : undefined}
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
            title={t("Edit (hold {{modifier}} to open in the sidebar)", {
              modifier: SIDEBAR_MODIFIER_LABELS[modifier],
            })}
            onClick={event => editClick(event, "place-type", placeType.id)}
          >
            <Pencil className="size-4" />
            <span className="sr-only">
              {t("Edit {{name}}", {
                name: placeType.name,
              })}
            </span>
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
            <span className="sr-only">
              {t("View {{name}}", {
                name: placeType.name,
              })}
            </span>
          </Link>
        </HoverIconButton>
      )}
    />
  );
}
