import type { PropertyGroup } from "@eesimple/types";

import { Link } from "@tanstack/react-router";
import { Info, Layers, Pencil } from "lucide-react";
import { useTranslation } from "react-i18next";

import { useEditPanelClick, useViewPanelClick } from "./panel/useEditPanelClick";
import { HoverIconButton, StandardListingCard } from "./StandardListingCard";
import { useSidebarOpenModifier } from "../hooks/useAppSettings";

import { SIDEBAR_MODIFIER_LABELS, entityLinkTitle } from "@/lib/sidebarModifier";

/**
 * A single row in the property-group listing. Exception to the standard: a property group has no
 * "filtered bookmarks" page, so the card body links to the group's detail page and the badge counts
 * member properties rather than bookmarks. The standard hover Edit + Info buttons still apply.
 */
export function PropertyGroupListItem({
  group,
  selectable,
  selected,
  onSelectToggle,
  inSelectionMode,
}: {
  group: PropertyGroup;
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
      icon={<Layers className="size-5 shrink-0 text-muted-foreground" />}
      title={group.name}
      subtitle={group.description || t("Priority {{priority}}", {
        priority: group.priority,
      })}
      count={group.propertyCount}
      renderPrimaryLink={(className, children) => (
        <Link
          to="/taxonomies/property-groups/$propertyGroupSlug/general"
          params={{
            propertyGroupSlug: group.slug,
          }}
          title={entityLinkTitle(modifier)}
          onClick={event => viewClick(event, "property-group", group.id, group.slug)}
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
            title={t("Edit (hold {{modifier}} to open in the sidebar)", {
              modifier: SIDEBAR_MODIFIER_LABELS[modifier],
            })}
            onClick={event => editClick(event, "property-group", group.id)}
          >
            <Pencil className="size-4" />
            <span className="sr-only">
              {t("Edit {{name}}", {
                name: group.name,
              })}
            </span>
          </Link>
        </HoverIconButton>
      )}
      renderInfo={() => (
        <HoverIconButton>
          <Link
            to="/taxonomies/property-groups/$propertyGroupSlug/general"
            params={{
              propertyGroupSlug: group.slug,
            }}
            title={entityLinkTitle(modifier)}
            onClick={event => viewClick(event, "property-group", group.id, group.slug)}
          >
            <Info className="size-4" />
            <span className="sr-only">
              {t("View {{name}}", {
                name: group.name,
              })}
            </span>
          </Link>
        </HoverIconButton>
      )}
    />
  );
}
