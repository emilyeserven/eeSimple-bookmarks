import type { GroupType } from "@eesimple/types";

import { Link } from "@tanstack/react-router";
import { Info, Library, Pencil } from "lucide-react";
import { useTranslation } from "react-i18next";

import { useEditPanelClick, useViewPanelClick } from "./panel/useEditPanelClick";
import { HoverIconButton, StandardListingCard } from "./StandardListingCard";
import { useSidebarOpenModifier } from "../hooks/useAppSettings";

import { SIDEBAR_MODIFIER_LABELS, entityLinkTitle } from "@/lib/sidebarModifier";

/**
 * A single row in the group-type listing. A group type has no "filtered bookmarks" page, so
 * the card body links to its detail page and the badge counts member groups. The standard hover Edit +
 * Info buttons still apply.
 */
export function GroupTypeListItem({
  groupType,
  selectable,
  selected,
  onSelectToggle,
  inSelectionMode,
}: {
  groupType: GroupType;
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
      icon={<Library className="size-5 shrink-0 text-muted-foreground" />}
      title={groupType.name}
      count={groupType.groupCount}
      renderPrimaryLink={(className, children) => (
        <Link
          to="/taxonomies/group-types/$groupTypeSlug/general"
          params={{
            groupTypeSlug: groupType.slug,
          }}
          title={entityLinkTitle(modifier)}
          onClick={event => viewClick(event, "group-type", groupType.id, groupType.slug)}
          className={className}
        >
          {children}
        </Link>
      )}
      renderEdit={() => (
        <HoverIconButton>
          <Link
            to="/taxonomies/group-types/$groupTypeSlug/edit"
            params={{
              groupTypeSlug: groupType.slug,
            }}
            title={t("Edit (hold {{modifier}} to open in the sidebar)", {
              modifier: SIDEBAR_MODIFIER_LABELS[modifier],
            })}
            onClick={event => editClick(event, "group-type", groupType.id)}
          >
            <Pencil className="size-4" />
            <span className="sr-only">
              {t("Edit {{name}}", {
                name: groupType.name,
              })}
            </span>
          </Link>
        </HoverIconButton>
      )}
      renderInfo={() => (
        <HoverIconButton>
          <Link
            to="/taxonomies/group-types/$groupTypeSlug/general"
            params={{
              groupTypeSlug: groupType.slug,
            }}
            title={entityLinkTitle(modifier)}
            onClick={event => viewClick(event, "group-type", groupType.id, groupType.slug)}
          >
            <Info className="size-4" />
            <span className="sr-only">
              {t("View {{name}}", {
                name: groupType.name,
              })}
            </span>
          </Link>
        </HoverIconButton>
      )}
    />
  );
}
